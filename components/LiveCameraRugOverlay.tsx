"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateFloorPitch,
  calculateFloorRoll,
  applyLowPassFilter,
  buildRugCssTransform,
  lerpAngleDeg,
  requestDeviceOrientationPermission,
} from "@/lib/sensor-fusion";
import {
  estimatePhoneVerticalFov,
  initWebGLFloorScene,
  type WebGLFloorSceneController,
} from "@/lib/webgl-floor-scene";
import { FloorOdometryTracker } from "@/lib/floor-odometry";
import { detectFloorPlane, sampleBottomRegionStats } from "@/lib/ai-detection";
import {
  RUG_SIZE_PRESETS,
  formatRugSize,
  isSameRugSize,
  type RugSize,
} from "@/lib/rug-scale";

type Props = {
  open: boolean;
  onClose: () => void;
  rugImageUrl: string;
  rugName: string;
  widthCm: number;
  lengthCm: number;
  buttonColor?: string;
  /**
   * iPhone Quick Look benzeri mod:
   * - Halı zemin algılanana kadar gizli
   * - Bir kez yerleştirilir, telefona yapışmaz / sürüklenmez
   * - Minimal HUD
   */
  quickLookMode?: boolean;
};

/**
 * Three.js WebGL, Sensör Füzyonu, Odometri & 3D Gizmo Zemin AR Motoru (LiveCameraRugOverlay).
 * ARCore veya Scene Viewer gerektirmeden jiroskop, kamera, optik akış ve ölçü yönetimiyle çalışır.
 */
export default function LiveCameraRugOverlay({
  open,
  onClose,
  rugImageUrl,
  rugName,
  widthCm,
  lengthCm,
  buttonColor = "#111827",
  quickLookMode = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sceneControllerRef = useRef<WebGLFloorSceneController | null>(null);
  const odometryTrackerRef = useRef<FloorOdometryTracker | null>(null);
  const frameCounterRef = useRef<number>(0);
  const gizmoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [webglActive, setWebglActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Halı Ölçü ve Boyut Durumu
  const [selectedSize, setSelectedSize] = useState<RugSize>({
    label: formatRugSize(widthCm, lengthCm),
    widthCm,
    lengthCm,
  });
  const [showSizePicker, setShowSizePicker] = useState<boolean>(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);

  // Ölçek sabit 1 = ürün cm ölçüsü (elle büyütme yok)
  const [scale, setScale] = useState<number>(1);
  const [userRotation, setUserRotation] = useState<number>(0);

  // Görsel Odometri Durumu
  const [trackedPoints, setTrackedPoints] = useState<number>(0);
  const [odometryEnabled, setOdometryEnabled] = useState<boolean>(true);

  // Jiroskop ve sensör açıları
  const [pitch, setPitch] = useState<number>(55);
  const [roll, setRoll] = useState<number>(0);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [needsIosPermission, setNeedsIosPermission] = useState<boolean>(false);
  const [manualTiltMode, setManualTiltMode] = useState<boolean>(false);

  // Ref'ler (animasyon ve pointer takibi için)
  const orientationRef = useRef<{
    pitch: number;
    roll: number;
    alpha: number;
    beta: number;
    gamma: number;
    hasOrientation: boolean;
  }>({ pitch: 55, roll: 0, alpha: 0, beta: 55, gamma: 0, hasOrientation: false });
  const floorAnchoredRef = useRef(false);
  const [floorAnchored, setFloorAnchored] = useState(false);
  const alignFramesRef = useRef(0);
  const openStartedAtRef = useRef(0);
  const floorSampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFloorSampleRef = useRef(0);
  const floorConfidenceRef = useRef(0);
  const fovAppliedRef = useRef(false);
  const coachRef = useRef<"ayarla" | "eg" | "algila">("algila");
  const [coach, setCoach] = useState<"ayarla" | "eg" | "algila">("algila");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // 1. Kamera Başlatma
  useEffect(() => {
    if (!open) {
      stopCamera();
      setReady(false);
      setError(null);
      setSensorActive(false);
      setFloorAnchored(false);
      floorAnchoredRef.current = false;
      alignFramesRef.current = 0;
      floorConfidenceRef.current = 0;
      lastFloorSampleRef.current = 0;
      fovAppliedRef.current = false;
      coachRef.current = "algila";
      setCoach("algila");
      orientationRef.current.hasOrientation = false;
      odometryTrackerRef.current = null;
      return;
    }

    openStartedAtRef.current = performance.now();
    let cancelled = false;

    // iOS: sensör iznini kamera ile birlikte iste (otomatik zemin hizası için).
    void requestDeviceOrientationPermission().then((granted) => {
      if (cancelled) return;
      if (granted) {
        setNeedsIosPermission(false);
        setSensorActive(true);
      }
    });

    async function start() {
      if (typeof window !== "undefined" && window.location.protocol === "http:") {
        const host = window.location.hostname;
        if (host !== "localhost" && host !== "127.0.0.1") {
          setError("Kamera için HTTPS gerekir. Bu sayfayı https:// ile açın.");
          return;
        }
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Bu tarayıcı kamerayı açamıyor. Google Chrome veya Safari ile deneyin.");
        return;
      }

      const constraints: MediaStreamConstraints[] = [
        {
          audio: false,
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        {
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        },
        { audio: false, video: true },
      ];

      let lastErr: unknown = null;
      for (const constraint of constraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          const video = videoRef.current;
          if (!video) return;
          video.srcObject = stream;
          video.muted = true;
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          await video.play();

          // Odometri motorunu başlat
          odometryTrackerRef.current = new FloorOdometryTracker(160, 120);

          setReady(true);
          setError(null);
          return;
        } catch (err) {
          lastErr = err;
        }
      }

      if (cancelled) return;
      const name = lastErr instanceof Error ? lastErr.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Kamera izni reddedildi. Tarayıcı ayarlarından kameraya izin verip sayfayı yenileyin.");
      } else {
        setError("Kamera açılamadı. Lütfen kamera iznini kontrol edin.");
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  // 2. Sayfa kaydırmasını kilitle
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 3. Three.js WebGL Zemin AR Sahnesi Başlatma
  useEffect(() => {
    if (!open || !ready || !canvasRef.current) return;

    try {
      const controller = initWebGLFloorScene({
        canvas: canvasRef.current,
        rugImageUrl,
        widthCm: selectedSize.widthCm,
        lengthCm: selectedSize.lengthCm,
        initialPitch: orientationRef.current.pitch,
        initialRoll: orientationRef.current.roll,
      });

      sceneControllerRef.current = controller;
      floorAnchoredRef.current = false;
      alignFramesRef.current = 0;
      floorConfidenceRef.current = 0;
      setFloorAnchored(false);
      coachRef.current = "algila";
      setCoach("algila");
      setWebglActive(true);
      // Quick Look modu: önce zemin, sonra halı — anında yerleştirme yok.
      controller.updateDimensions(selectedSize.widthCm, selectedSize.lengthCm);
      controller.setScale(1);
      controller.setRugVisible(false);
      controller.setGuideVisible(true);

      const handleResize = () => {
        if (canvasRef.current && controller) {
          controller.resize(canvasRef.current.clientWidth || window.innerWidth, canvasRef.current.clientHeight || window.innerHeight);
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        controller.dispose();
        sceneControllerRef.current = null;
        setWebglActive(false);
      };
    } catch {
      setWebglActive(false);
    }
  }, [open, ready, rugImageUrl, selectedSize.widthCm, selectedSize.lengthCm]);

  // 4. Sensör, Görsel Odometri ve 60 FPS Render Döngüsü
  useEffect(() => {
    if (!open) return;

    // iOS 13+ kontrolü
    if (
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === "function"
    ) {
      setNeedsIosPermission(true);
    }

    let animFrameId: number;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null) return;

      const beta = e.beta;
      const gamma = e.gamma ?? 0;
      const alpha = e.alpha ?? orientationRef.current.alpha;
      const current = orientationRef.current;

      if (!current.hasOrientation) {
        current.alpha = alpha;
        current.beta = beta;
        current.gamma = gamma;
        current.hasOrientation = true;
      } else {
        current.alpha = lerpAngleDeg(current.alpha, alpha, 0.22);
        current.beta = applyLowPassFilter(current.beta, beta, 0.22);
        current.gamma = applyLowPassFilter(current.gamma, gamma, 0.22);
      }

      const targetPitch = calculateFloorPitch(current.beta);
      const targetRoll = calculateFloorRoll(current.gamma);
      current.pitch = applyLowPassFilter(current.pitch, targetPitch, 0.16);
      current.roll = applyLowPassFilter(current.roll, targetRoll, 0.16);

      setSensorActive(true);
      setNeedsIosPermission(false);
    };

    // 60 FPS senkron render döngüsü
    const updateLoop = () => {
      const curPitch = Number(orientationRef.current.pitch.toFixed(1));
      const curRoll = Number(orientationRef.current.roll.toFixed(1));

      if (!manualTiltMode) {
        setPitch(curPitch);
        setRoll(curRoll);
      }

      const gyroDriving = !manualTiltMode && orientationRef.current.hasOrientation;

      // Quick Look modunda halı dünyada sabit — odometri ile kaydırılmaz (iPhone hissi).
      frameCounterRef.current++;
      if (
        !quickLookMode &&
        !gyroDriving &&
        odometryEnabled &&
        frameCounterRef.current % 2 === 0 &&
        videoRef.current &&
        ready &&
        odometryTrackerRef.current &&
        sceneControllerRef.current
      ) {
        const odom = odometryTrackerRef.current.processFrame(videoRef.current, curPitch);
        if (odom.trackedCount > 0) {
          setTrackedPoints(odom.trackedCount);
        }
        if (odom.confidence >= 0.45 && (Math.abs(odom.dxMeters) > 0.001 || Math.abs(odom.dzMeters) > 0.001)) {
          sceneControllerRef.current.applyDisplacement(odom.dxMeters, odom.dzMeters);
        }
      }

      if (sceneControllerRef.current) {
        if (gyroDriving) {
          const screenAngle =
            typeof screen !== "undefined" && screen.orientation
              ? screen.orientation.angle
              : Number((window as Window & { orientation?: number }).orientation ?? 0);
          sceneControllerRef.current.updateDeviceOrientation(
            orientationRef.current.alpha,
            orientationRef.current.beta,
            orientationRef.current.gamma,
            screenAngle
          );
        } else {
          sceneControllerRef.current.updateOrientation(curPitch, curRoll);
        }

        const video = videoRef.current;
        if (!fovAppliedRef.current && video && video.videoWidth > 0) {
          sceneControllerRef.current.setVerticalFov(
            estimatePhoneVerticalFov(video.videoWidth, video.videoHeight)
          );
          fovAppliedRef.current = true;
        }

        if (!floorAnchoredRef.current) {
          sceneControllerRef.current.setRugVisible(false);
          sceneControllerRef.current.setScale(1);
          sceneControllerRef.current.updateDimensions(
            selectedSize.widthCm,
            selectedSize.lengthCm
          );
          const onFloor = sceneControllerRef.current.updateFloorGuide();
          const lookDown = orientationRef.current.pitch;
          const elapsed = performance.now() - openStartedAtRef.current;

          // Kameradan zemin bölgesi örnekle (otomatik algılama).
          if (
            video &&
            video.readyState >= 2 &&
            frameCounterRef.current - lastFloorSampleRef.current >= 8
          ) {
            lastFloorSampleRef.current = frameCounterRef.current;
            try {
              const sampleW = 96;
              const sampleH = 72;
              if (!floorSampleCanvasRef.current) {
                floorSampleCanvasRef.current = document.createElement("canvas");
              }
              const sc = floorSampleCanvasRef.current;
              sc.width = sampleW;
              sc.height = sampleH;
              const sctx = sc.getContext("2d", { willReadFrequently: true });
              if (sctx) {
                sctx.drawImage(video, 0, 0, sampleW, sampleH);
                const pixels = sctx.getImageData(0, 0, sampleW, sampleH).data;
                const stats = sampleBottomRegionStats(pixels, sampleW, sampleH);
                const floorHit = detectFloorPlane({
                  platform: typeof navigator !== "undefined" ? navigator.userAgent : "",
                  hasGyroscope: orientationRef.current.hasOrientation,
                  imageBottomLuma: stats.luma,
                  imageBottomVariance: stats.variance,
                });
                floorConfidenceRef.current = floorHit.confidence;
              }
            } catch {
              // örnekleme best-effort
            }
          }

          // iPhone Quick Look gibi: zemin netleşmeden halı gelmez.
          const floorSeen = floorConfidenceRef.current >= 0.52;
          const lookingDown = lookDown >= 38;
          const gyroOk = orientationRef.current.hasOrientation;
          const readyToDrop = quickLookMode
            ? (lookingDown && (onFloor || floorSeen) && (gyroOk || elapsed > 800)) ||
              (floorSeen && lookingDown) ||
              (!gyroOk && elapsed > 1600 && onFloor)
            : (lookingDown && (onFloor || floorSeen)) ||
              floorSeen ||
              (!gyroOk && elapsed > 350) ||
              elapsed > 1200;

          const nextCoach: "ayarla" | "eg" | "algila" =
            !lookingDown && !floorSeen
              ? "ayarla"
              : floorSeen || onFloor
                ? "algila"
                : "eg";
          if (nextCoach !== coachRef.current) {
            coachRef.current = nextCoach;
            setCoach(nextCoach);
          }

          if (readyToDrop) {
            alignFramesRef.current += 1;
          } else {
            alignFramesRef.current = 0;
          }

          const framesNeeded = quickLookMode ? 10 : 4;
          if (alignFramesRef.current >= framesNeeded) {
            const placed = sceneControllerRef.current.autoPlaceOnFloor();
            if (placed) {
              floorAnchoredRef.current = true;
              setFloorAnchored(true);
              setScale(1);
              setOdometryEnabled(false);
              setSnapshotFeedback(
                `Halı yerde · ${selectedSize.widthCm}×${selectedSize.lengthCm} cm`
              );
              setTimeout(() => setSnapshotFeedback(null), 2400);
            }
          }
        } else {
          sceneControllerRef.current.setRugVisible(true);
          sceneControllerRef.current.setGuideVisible(false);
          // Gerçek ürün ölçüsü — elle büyütme/küçültme yok.
          sceneControllerRef.current.setScale(1);
        }
        sceneControllerRef.current.setUserRotation(userRotation);
        sceneControllerRef.current.render();
      }

      animFrameId = requestAnimationFrame(updateLoop);
    };

    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    animFrameId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      cancelAnimationFrame(animFrameId);
    };
  }, [
    open,
    manualTiltMode,
    scale,
    userRotation,
    odometryEnabled,
    ready,
    selectedSize.widthCm,
    selectedSize.lengthCm,
    quickLookMode,
  ]);

  // iOS İzin Talebi
  const handleEnableSensor = async () => {
    const granted = await requestDeviceOrientationPermission();
    if (granted) {
      setNeedsIosPermission(false);
      setSensorActive(true);
    } else {
      setManualTiltMode(true);
    }
  };

  // Ölçü Değiştirme
  const anchorRugToFloor = () => {
    odometryTrackerRef.current?.reset();
    sceneControllerRef.current?.updateDimensions(
      selectedSize.widthCm,
      selectedSize.lengthCm
    );
    sceneControllerRef.current?.setScale(1);
    const placed = sceneControllerRef.current?.autoPlaceOnFloor() ?? false;
    if (placed) {
      floorAnchoredRef.current = true;
      setFloorAnchored(true);
      setScale(1);
      setSnapshotFeedback(
        `Halı yerde · ${selectedSize.widthCm}×${selectedSize.lengthCm} cm`
      );
    } else {
      setSnapshotFeedback("Zemin algılanamadı — tekrar dene");
    }
    setTimeout(() => setSnapshotFeedback(null), 2200);
  };

  const handleSelectSize = (size: RugSize) => {
    setSelectedSize(size);
    setShowSizePicker(false);
    if (sceneControllerRef.current) {
      sceneControllerRef.current.updateDimensions(size.widthCm, size.lengthCm);
      sceneControllerRef.current.setGizmoVisible(true);
      if (gizmoTimeoutRef.current) clearTimeout(gizmoTimeoutRef.current);
      gizmoTimeoutRef.current = setTimeout(() => {
        sceneControllerRef.current?.setGizmoVisible(false);
      }, 1800);
    }
  };

  // 5. Fotoğraf Çekme & Paylaşma (Snapshot & Web Share API)
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setSnapshotFeedback("Hazırlanıyor…");

    try {
      const video = videoRef.current;
      const webgl = canvasRef.current;
      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = video.videoWidth || 1280;
      captureCanvas.height = video.videoHeight || 720;
      const ctx = captureCanvas.getContext("2d");
      if (!ctx) return;

      // 1. Arka plan kamerasını çiz
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

      // 2. 3D WebGL katmanını üstüne çiz
      ctx.drawImage(webgl, 0, 0, captureCanvas.width, captureCanvas.height);

      // 3. Marka Filigranı & Ölçü Bilgisi
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.roundRect(24, captureCanvas.height - 68, 260, 44, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("RugVision • Odamda Gör", 38, captureCanvas.height - 42);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${selectedSize.widthCm}×${selectedSize.lengthCm} cm`, 38, captureCanvas.height - 28);
      ctx.restore();

      // 4. PNG Blob oluştur
      const blob = await new Promise<Blob | null>((resolve) =>
        captureCanvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;

      const filename = `${rugName ? rugName.replace(/\s+/g, "-") : "Hali"}-Odamda.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${rugName} — Odamda Gör`,
          text: `Bu halı odamda nasıl durdu? (${selectedSize.widthCm}×${selectedSize.lengthCm} cm)`,
          files: [file],
        });
        setSnapshotFeedback("Paylaşıldı! ✅");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setSnapshotFeedback("Fotoğraf indirildi! 📥");
      }
    } catch {
      setSnapshotFeedback(null);
    } finally {
      setTimeout(() => setSnapshotFeedback(null), 2500);
    }
  };

  if (!open) return null;

  const aspect = selectedSize.widthCm > 0 && selectedSize.lengthCm > 0
    ? selectedSize.widthCm / selectedSize.lengthCm
    : 160 / 230;

  // Mevcut ebat seçenekleri (Orijinal + standart presetler)
  const availableSizes: RugSize[] = [
    { label: `${widthCm}×${lengthCm}`, widthCm, lengthCm },
    ...RUG_SIZE_PRESETS.filter((p) => p.widthCm !== widthCm || p.lengthCm !== lengthCm),
  ];

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="3D WebGL Zemin AR Sahnesi"
    >
      {/* 1. Arka Plan Kamera Akışı */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        playsInline
        muted
        autoPlay
      />

      {/* 2. Three.js Şeffaf WebGL Zemin Katmanı */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full z-10 pointer-events-none ${
          webglActive ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 3. CSS Fallback Katmanı — sürüklenmez, sabit görünüm */}
      {!webglActive && !error && floorAnchored && (
        <div
          className="absolute left-1/2 bottom-[18%] z-10 pointer-events-none will-change-transform"
          style={{
            width: `min(76vw, 320px)`,
            aspectRatio: `${aspect}`,
            transform: buildRugCssTransform({
              offsetX: 0,
              offsetY: 0,
              scale: 1,
              pitchDeg: pitch,
              rollDeg: roll,
              userRotationDeg: userRotation,
            }),
            transformOrigin: "center bottom",
          }}
        >
          <div className="relative h-full w-full">
            <div className="absolute -inset-2 -bottom-4 bg-black/40 blur-md rounded-lg pointer-events-none" />
            {rugImageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rugImageUrl}
                alt={rugName}
                draggable={false}
                onError={() => setImageFailed(true)}
                className="relative h-full w-full object-fill rounded-sm shadow-2xl ring-1 ring-white/15"
              />
            ) : (
              <div
                className="relative h-full w-full rounded-sm border-2 border-amber-100/70 shadow-2xl"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, #8a5a2b 0 14px, #a8703a 14px 28px)",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Hata Bildirimi */}
      {error && (
        <div className="absolute inset-x-4 top-1/3 z-20 rounded-2xl bg-zinc-900/95 p-6 text-center text-sm text-white shadow-xl border border-white/10">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Yükleniyor Göstergesi */}
      {!ready && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 text-sm text-white gap-3">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Kamera açılıyor — zemin taranacak…</p>
        </div>
      )}

      {!floorAnchored && ready && !error && (
        <div className="pointer-events-none absolute inset-x-6 top-[30%] z-40 text-center">
          <div className="mx-auto max-w-xs rounded-2xl bg-black/75 px-5 py-4 text-white shadow-2xl backdrop-blur-md">
            <p className="text-base font-bold">
              {coach === "algila"
                ? "Zemin bulundu — halı geliyor"
                : coach === "eg"
                  ? "Biraz daha yere bak"
                  : "Yüzeyi tara — telefonu yere doğru tut"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              {quickLookMode
                ? `iPhone AR gibi: zemin algılanınca ${selectedSize.widthCm}×${selectedSize.lengthCm} cm halı otomatik oturur.`
                : `Kamera yere bakınca halı ~2 m önde, ${selectedSize.widthCm}×${selectedSize.lengthCm} cm oturur.`}
            </p>
          </div>
        </div>
      )}

      {/* Fotoğraf Bildirim Rozeti (Toast) */}
      {snapshotFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-emerald-500/95 text-black px-4 py-1.5 text-xs font-bold shadow-2xl animate-bounce">
          {snapshotFeedback}
        </div>
      )}

      {/* Üst Bilgi & HUD Çubuğu */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/75 to-transparent pointer-events-auto">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sensör Rozeti */}
            {sensorActive && !manualTiltMode ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 border border-emerald-500/30 text-[11px] font-medium text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{floorAnchored ? "Yerde, gerçek ölçüde" : "Ayarla"}</span>
              </div>
            ) : needsIosPermission ? (
              <button
                type="button"
                onClick={handleEnableSensor}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 text-black font-semibold px-3 py-1 text-xs shadow-lg active:scale-95 transition-transform"
              >
                🧭 Sensörü Etkinleştir
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[11px] text-zinc-300">
                <span>Eğim: {Math.round(pitch)}°</span>
              </div>
            )}

            {sensorActive && !manualTiltMode ? null : (
            <button
              type="button"
              onClick={() => {
                setOdometryEnabled((prev) => !prev);
                if (!odometryEnabled) {
                  odometryTrackerRef.current?.reset();
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur-md px-2.5 py-1 text-[11px] font-medium border transition-colors active:scale-95 ${
                odometryEnabled && trackedPoints > 0
                  ? "bg-blue-950/60 border-blue-400/40 text-blue-300"
                  : "bg-black/50 border-white/10 text-zinc-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${odometryEnabled && trackedPoints > 0 ? "bg-blue-400 animate-pulse" : "bg-zinc-500"}`} />
              <span>{odometryEnabled ? `Zemin Kilitli (${trackedPoints || "—"} Nokta)` : "Zemin Serbest"}</span>
            </button>
            )}
          </div>

          <p className="text-[11px] text-white/80 drop-shadow">
            {floorAnchored
              ? `Yerde sabit · ${selectedSize.widthCm}×${selectedSize.lengthCm} cm — telefonu gezdirerek bak`
              : coach === "algila"
                ? "Zemin otomatik algılanıyor…"
                : coach === "eg"
                  ? "Zemin bulundu — yerleştiriliyor"
                  : "Telefonu yere doğru tut"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/60 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white border border-white/20 active:bg-white/20 transition-colors"
        >
          Kapat
        </button>
      </div>

      {/* Ölçü Seçici Açılır Çubuğu */}
      {showSizePicker && (
        <div className="absolute inset-x-4 bottom-24 z-40 bg-zinc-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Halı Ölçüsü Seçin:</span>
            <button
              type="button"
              onClick={() => setShowSizePicker(false)}
              className="text-white hover:text-zinc-300 font-bold text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {availableSizes.map((size) => {
              const active = isSameRugSize(size, selectedSize);
              return (
                <button
                  key={`${size.widthCm}x${size.lengthCm}`}
                  type="button"
                  onClick={() => handleSelectSize(size)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-white text-black shadow-lg scale-105"
                      : "bg-black/50 text-white/80 border border-white/15 hover:bg-white/20"
                  }`}
                >
                  {size.widthCm}×{size.lengthCm} cm
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manuel Eğim Sürgüsü */}
      {manualTiltMode && (
        <div className="absolute inset-x-6 bottom-24 z-30 flex items-center gap-3 bg-black/65 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/15 pointer-events-auto">
          <span className="text-xs text-white/80 whitespace-nowrap">Zemin Açısı:</span>
          <input
            type="range"
            min="20"
            max="75"
            value={pitch}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPitch(val);
              orientationRef.current.pitch = val;
            }}
            className="w-full accent-white h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-white font-mono w-8">{Math.round(pitch)}°</span>
        </div>
      )}

      {/* Alt Hızlı Kontrol Düğmeleri */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-1.5 p-3 pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto">
        {/* Ölçü Seçici Düğmesi */}
        <button
          type="button"
          onClick={() => setShowSizePicker((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/25 px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
        >
          <span>📐 {selectedSize.widthCm}×{selectedSize.lengthCm}</span>
        </button>

        {/* 45° Çevir Düğmesi */}
        <button
          type="button"
          onClick={() => setUserRotation((r) => (r + 45) % 360)}
          className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
        >
          🔄 45°
        </button>

        {/* Fotoğraf Çek / Paylaş Butonu */}
        <button
          type="button"
          onClick={handleCaptureSnapshot}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 shadow-lg active:scale-95 transition-transform"
        >
          <span>📸 Paylaş</span>
        </button>

        {/* Yeniden algıla — elle kaydırma yok, sadece otomatik mesafe */}
        <button
          type="button"
          onClick={() => {
            floorAnchoredRef.current = false;
            setFloorAnchored(false);
            alignFramesRef.current = 0;
            setScale(1);
            anchorRugToFloor();
          }}
          className="rounded-full bg-white text-black px-3 py-2 text-xs font-bold active:scale-95 transition-transform"
        >
          Yeniden yerleştir
        </button>
      </div>
    </div>
  );
}
