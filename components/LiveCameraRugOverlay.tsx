"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  rugImageUrl: string;
  rugName: string;
  widthCm: number;
  lengthCm: number;
  buttonColor?: string;
};

/**
 * ARCore / Scene Viewer olmadan tarayıcı kamerasını açar.
 * Xiaomi HyperOS'ta WebXR sessizce düşer; getUserMedia çalışır.
 */
export default function LiveCameraRugOverlay({
  open,
  onClose,
  rugImageUrl,
  rugName,
  widthCm,
  lengthCm,
  buttonColor = "#111827",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setReady(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function start() {
      if (typeof window !== "undefined" && window.location.protocol === "http:") {
        const host = window.location.hostname;
        if (host !== "localhost" && host !== "127.0.0.1") {
          setError(
            "Kamera için HTTPS gerekir. Bu sayfayı https:// ile Chrome'da açın."
          );
          return;
        }
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Bu tarayıcı kamerayı açamıyor. Google Chrome ile deneyin.");
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
          video: {
            facingMode: { ideal: "environment" },
          },
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
        setError(
          "Kamera izni reddedildi. Chrome ayarlarından bu site için Kameraya izin verin, sayfayı yenileyin."
        );
      } else {
        setError(
          "Kamera açılamadı. Google Chrome kullanın ve site adresinin https olduğundan emin olun."
        );
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset({
      x: drag.origX + (e.clientX - drag.startX),
      y: drag.origY + (e.clientY - drag.startY),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (!open) return null;

  const aspect = widthCm > 0 && lengthCm > 0 ? widthCm / lengthCm : 160 / 230;

  return (
    <div className="fixed inset-0 z-[10000] bg-black" role="dialog" aria-modal="true" aria-label="Kamerada halı">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {!error && (
        <div
          className="absolute left-1/2 bottom-[18%] z-10 touch-none"
          style={{
            width: `min(78vw, ${Math.round(220 * scale)}px)`,
            aspectRatio: `${aspect}`,
            transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px) perspective(600px) rotateX(58deg)`,
            transformOrigin: "center bottom",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {rugImageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rugImageUrl}
              alt={rugName}
              draggable={false}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-fill shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
            />
          ) : (
            // Görsel yoksa/yüklenemezse: dokuma deseni ile temsili halı.
            <div
              className="h-full w-full rounded-sm border-4 border-amber-100/70 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #8a5a2b 0 14px, #a8703a 14px 28px)",
              }}
            />
          )}
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 top-1/3 z-20 rounded-2xl bg-zinc-900/90 p-5 text-center text-sm text-white">
          <p>{error}</p>
        </div>
      )}

      {!ready && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-sm text-white">
          Kamera açılıyor…
        </div>
      )}

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4">
        <p className="max-w-[70%] text-xs text-white/90 drop-shadow">
          Telefonu yere doğru tutun. Halıyı sürükleyin.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white"
        >
          Kapat
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 p-4 pb-8">
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
          className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white"
        >
          Küçült
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(2.4, Number((s + 0.15).toFixed(2))))}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: buttonColor }}
        >
          Büyüt
        </button>
      </div>
    </div>
  );
}
