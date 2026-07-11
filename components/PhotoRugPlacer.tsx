"use client";

/**
 * PhotoRugPlacer — Fotoğraf Üzerine Halı Yerleştirici
 *
 * Harici bağımlılık yok. Saf HTML5 Canvas + Pointer Events + CSS perspective.
 * GMS'siz cihazlar (Huawei, Redmi, eski iPhone) için AR alternatifi.
 *
 * Akış:
 *   1) Kullanıcı oda fotoğrafı seçer (kamera veya galeri)
 *   2) Canvas'a fotoğraf çizilir, halı görseli overlay olarak eklenir
 *   3) 4 köşe tutamacı sürüklenerek halı perspektifle zemine yatırılır
 *   4) "İndir" (PNG) veya "Paylaş" (Web Share API)
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { detectFloorPerspective } from "@/lib/ai-floor-detection";

/* ─── Tip tanımları ─────────────────────────────────────────── */

type Point = { x: number; y: number };

/** 4 köşe: sol-üst, sağ-üst, sağ-alt, sol-alt */
type Quad = [Point, Point, Point, Point];

interface PhotoRugPlacerProps {
  /** Halının kapak/ürün görseli URL'i (coverImage veya alternatif) */
  rugImageUrl: string;
  /** Halı adı (aria + dosya adı için) */
  rugName: string;
  /** Halı genişliği (cm) — başlangıç boyutlandırma için */
  widthCm: number;
  /** Halı uzunluğu (cm) — başlangıç boyutlandırma için */
  lengthCm: number;
  /** Merchant rengi (butonlar için) */
  buttonColor?: string;
}

/* ─── Yardımcı: Perspektif Dönüşüm (Homografi) ──────────────── */

/**
 * 4 kaynak → 4 hedef noktasından CSS matrix3d değeri üretir.
 * Kaynak: birim kare (0,0)-(1,0)-(1,1)-(0,1)
 * Hedef: kullanıcının sürüklediği quad
 */
function computeMatrix3d(quad: Quad, imgW: number, imgH: number): string {
  // Normalize quad to canvas coordinates
  const [tl, tr, br, bl] = quad;

  // Build the 4x4 perspective transform matrix
  // Using the standard homography calculation
  const sx = tl.x;
  const sy = tl.y;

  const ax = tr.x - tl.x;
  const ay = tr.y - tl.y;
  const bx = bl.x - tl.x;
  const by = bl.y - tl.y;
  const cx = br.x - tl.x - ax - bx;
  const cy = br.y - tl.y - ay - by;

  const denominator = ax * by - ay * bx;
  if (Math.abs(denominator) < 1e-10) {
    return "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)";
  }

  const g = (cx * by - cy * bx) / denominator;
  const h = (ax * cy - ay * cx) / denominator;

  const a = ax + g * ax;
  const b = bx + h * bx;
  const c = sx;
  const d = ay + g * ay;
  const e = by + h * by;
  const f = sy;
  // Scale from image pixels to unit square
  const scaleX = 1 / imgW;
  const scaleY = 1 / imgH;

  return [
    `matrix3d(`,
    `${a * scaleX}, ${d * scaleX}, 0, ${g * scaleX},`,
    `${b * scaleY}, ${e * scaleY}, 0, ${h * scaleY},`,
    `0, 0, 1, 0,`,
    `${c}, ${f}, 0, 1`,
    `)`,
  ].join(" ");
}

/** İki noktanın mesafesi */
function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Quad'ın merkezi */
function quadCenter(q: Quad): Point {
  return {
    x: (q[0].x + q[1].x + q[2].x + q[3].x) / 4,
    y: (q[0].y + q[1].y + q[2].y + q[3].y) / 4,
  };
}

/* ─── Sabitler ─────────────────────────────────────────────── */

const HANDLE_RADIUS = 28; // px, dokunma hedefi (mobil için büyük)
const HANDLE_VISUAL = 13; // px, görsel yarıçap

/* ─── Ana Komponent ─────────────────────────────────────────── */

export default function PhotoRugPlacer({
  rugImageUrl,
  rugName,
  widthCm,
  lengthCm,
  buttonColor = "#111827",
}: PhotoRugPlacerProps) {
  /* Durum */
  const [roomPhoto, setRoomPhoto] = useState<string | null>(null);
  const [quad, setQuad] = useState<Quad | null>(null);
  const [dragging, setDragging] = useState<number | null>(null); // 0-3 köşe index
  const [isExporting, setIsExporting] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [rugLoaded, setRugLoaded] = useState(false);
  const [photoSize, setPhotoSize] = useState({ w: 0, h: 0 });

  /* Ref'ler */
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const rugImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Kamera için ayrı input (capture=environment) */
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /* Web Share API desteği */
  useEffect(() => {
    setShareSupported(
      typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator
    );
  }, []);

  /* Halı görselini yükle */
  useEffect(() => {
    if (!rugImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      rugImgRef.current = img;
      setRugLoaded(true);
    };
    img.onerror = () => {
      // Fallback: placeholder desen
      rugImgRef.current = null;
      setRugLoaded(true);
    };
    img.src = rugImageUrl;
  }, [rugImageUrl]);

  /* Fotoğraf seçildiğinde başlangıç quad hesapla */
  const initQuad = useCallback(
    (canvasW: number, canvasH: number) => {
      // Halı en/boy oranına göre merkeze yerleştir
      const aspect = widthCm / lengthCm;
      const rugW = Math.round(canvasW * 0.55);
      const rugH = Math.round(rugW / aspect);
      const cx = Math.round(canvasW / 2);
      const cy = Math.round(canvasH * 0.62);
      const hw = Math.round(rugW / 2);
      const hh = Math.round(rugH / 2);

      // Hafif perspektif — alt kenar biraz daha geniş
      const skew = Math.round(rugW * 0.08);
      setQuad([
        { x: cx - hw + skew, y: cy - hh },      // sol-üst
        { x: cx + hw - skew, y: cy - hh },      // sağ-üst
        { x: cx + hw + skew, y: cy + hh },      // sağ-alt
        { x: cx - hw - skew, y: cy + hh },      // sol-alt
      ]);
    },
    [widthCm, lengthCm]
  );

  /* Canvas'ı fotoğraf + halı overlay ile yeniden çiz */
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const photoImg = photoImgRef.current;
    if (!canvas || !photoImg || !quad) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: cw, height: ch } = canvas;
    ctx.clearRect(0, 0, cw, ch);

    // Arka plan: oda fotoğrafı
    ctx.drawImage(photoImg, 0, 0, cw, ch);

    // Halı: perspektif dönüşüm ile canvas'a çiz (offscreen canvas tekniği)
    const rugImg = rugImgRef.current;
    const [tl, tr, br, bl] = quad;

    ctx.save();

    // Perspektif için custom path + drawImage transform
    // HTML Canvas doğrudan homografi desteklemez; setTransform 6-parametre
    // lineer transform. Perspektif için path clip + affine yaklaşımı kullanılır.
    // En doğrusu: 2 üçgen yöntemi (quad → 2 triangle)
    drawPerspectiveImage(ctx, rugImg, widthCm, lengthCm, tl, tr, br, bl, cw, ch);

    ctx.restore();

    // Handle'lar (sadece düzenleme modunda)
    quad.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, HANDLE_VISUAL, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fill();
      ctx.strokeStyle = buttonColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Köşe numarası
      ctx.fillStyle = buttonColor;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), p.x, p.y);
    });

    // Kenar çizgisi
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [quad, buttonColor, widthCm, lengthCm]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  /* Oda fotoğrafını yükle ve canvas'ı ilklendir */
  useEffect(() => {
    if (!roomPhoto) return;

    const img = new Image();
    img.onload = () => {
      photoImgRef.current = img;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const maxW = container.clientWidth || window.innerWidth || 360;
      const maxH = Math.min(window.innerHeight * 0.55, 520);
      const ratio = img.naturalWidth / img.naturalHeight;

      let cw = maxW;
      let ch = Math.round(cw / ratio);
      if (ch > maxH) {
        ch = maxH;
        cw = Math.round(ch * ratio);
      }

      canvas.width = cw;
      canvas.height = ch;
      setPhotoSize({ w: cw, h: ch });

      // AI ile odaya göre otomatik perspektif hesapla
      const autoQuad = detectFloorPerspective(img, cw, ch, widthCm / lengthCm);
      setQuad(autoQuad);
    };
    img.src = roomPhoto;
  }, [roomPhoto, widthCm, lengthCm]);

  /* Fotoğraf seçme */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setRoomPhoto(url);
    },
    []
  );

  /* Pointer koordinatlarını canvas'a dönüştür */
  const canvasPoint = useCallback((e: PointerEvent | React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  /* Hangi handle'a tıklandı? */
  const hitTest = useCallback(
    (p: Point): number | null => {
      if (!quad) return null;
      for (let i = 0; i < 4; i++) {
        if (dist(p, quad[i]) <= HANDLE_RADIUS * 1.5) return i;
      }
      return null;
    },
    [quad]
  );

  /* Pointer down */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!quad) return;
      const p = canvasPoint(e);
      const idx = hitTest(p);
      if (idx !== null) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(idx);
      }
    },
    [quad, canvasPoint, hitTest]
  );

  /* Pointer move */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragging === null || !quad) return;
      const p = canvasPoint(e);
      const canvas = canvasRef.current!;
      // Sınır kontrolü
      const x = Math.max(0, Math.min(canvas.width, p.x));
      const y = Math.max(0, Math.min(canvas.height, p.y));
      const newQuad = [...quad] as Quad;
      newQuad[dragging] = { x, y };
      setQuad(newQuad);
    },
    [dragging, quad, canvasPoint]
  );

  /* Pointer up */
  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  /* Canvas'ı PNG olarak indir */
  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !quad) return;
    setIsExporting(true);

    // Handle'ları gizleyip son kez çiz
    const ctx = canvas.getContext("2d")!;
    const photoImg = photoImgRef.current!;
    const rugImg = rugImgRef.current;
    const [tl, tr, br, bl] = quad;
    const { width: cw, height: ch } = canvas;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(photoImg, 0, 0, cw, ch);
    drawPerspectiveImage(ctx, rugImg, widthCm, lengthCm, tl, tr, br, bl, cw, ch);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rugvision-${rugName.replace(/\s+/g, "-").toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        // Handle'ları geri çiz
        redrawCanvas();
      },
      "image/png"
    );
  }, [quad, rugName, widthCm, lengthCm, redrawCanvas]);

  /* Web Share API */
  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !quad) return;
    setIsExporting(true);

    const ctx = canvas.getContext("2d")!;
    const photoImg = photoImgRef.current!;
    const rugImg = rugImgRef.current;
    const [tl, tr, br, bl] = quad;
    const { width: cw, height: ch } = canvas;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(photoImg, 0, 0, cw, ch);
    drawPerspectiveImage(ctx, rugImg, widthCm, lengthCm, tl, tr, br, bl, cw, ch);

    canvas.toBlob(async (blob) => {
      if (!blob) { setIsExporting(false); return; }
      redrawCanvas();

      const file = new File([blob], `${rugName}.png`, { type: "image/png" });
      try {
        await navigator.share({
          title: `${rugName} — Odamda Nasıl Durdu?`,
          text: `RugVision ile ${rugName} halısını odamda denedim! 🏠`,
          files: [file],
        });
      } catch {
        // Kullanıcı iptal etti veya desteklenmiyor — sessizce geç
      }
      setIsExporting(false);
    }, "image/png");
  }, [quad, rugName, widthCm, lengthCm, redrawCanvas]);

  /* Sıfırla */
  const handleReset = useCallback(() => {
    setRoomPhoto(null);
    setQuad(null);
    photoImgRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ─── Render ──────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-4">
      {/* Fotoğraf yüklenmemişse: yükleme alanı */}
      {!roomPhoto && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer transition hover:border-zinc-400 dark:hover:border-zinc-500"
          style={{ minHeight: 280 }}
          role="button"
          aria-label="Oda fotoğrafı yükle"
        >
          {/* Halı simgesi */}
          <div
            className="w-20 h-14 rounded-lg border-4 flex items-center justify-center"
            style={{ borderColor: buttonColor, opacity: 0.8 }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: buttonColor }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="text-center px-6">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Oda fotoğrafı yükle
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Odanızın fotoğrafını çekin veya galerinizden seçin.
              <br />
              Halı görselini perspektifle zemine yerleştireceksiniz.
            </p>
          </div>

          {/* Kamera */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // iOS/Android: capture ile kamera aç
              fileInputRef.current?.removeAttribute("capture");
              cameraInputRef.current?.click();
            }}
            className="px-5 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-95"
            style={{ backgroundColor: buttonColor }}
          >
            📷 Kamerayla Çek
          </button>

          {/* Galeri */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-5 py-3 rounded-full text-sm font-semibold border-2 transition hover:brightness-105 active:scale-95"
            style={{ borderColor: buttonColor, color: buttonColor, backgroundColor: "transparent" }}
          >
            🖼️ Galeriden Seç
          </button>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            JPG, PNG, WebP desteklenir
          </p>
        </div>
      )}

      {/* Gizli file input */}
      {/* Gizli file input — capture YOK: hem kamera hem galeri seçilebilsin */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Oda fotoğrafı seç"
      />

      {/* Kameraya özel gizli input (capture=environment) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Kamerayla fotoğraf çek"
      />

      {/* Canvas editörü */}
      {roomPhoto && (
        <div ref={containerRef} className="flex flex-col gap-3">
          {/* Yardım metni */}
          <div className="flex items-start gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="text-base leading-none mt-0.5">💡</span>
            <span>
              Numaralı <strong>köşe noktalarını</strong> sürükleyerek halıyı
              odanızın zeminine perspektifle yerleştirin.
            </span>
          </div>

          {/* Canvas */}
          <div
            className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md"
            style={{ width: "100%", aspectRatio: photoSize.w / (photoSize.h || 1) }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                touchAction: "none",
                cursor: dragging !== null ? "grabbing" : "default",
                display: "block",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="Halı yerleştirme alanı — köşeleri sürükleyin"
            />

            {/* Yükleniyor overlay */}
            {!rugLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Aksiyon butonları */}
          <div className="grid grid-cols-2 gap-2">
            {/* İndir */}
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: buttonColor }}
            >
              {isExporting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              PNG İndir
            </button>

            {/* Paylaş — Web Share API varsa göster */}
            {shareSupported ? (
              <button
                onClick={handleShare}
                disabled={isExporting}
                className="flex items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Paylaş
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Yeni Fotoğraf
              </button>
            )}
          </div>

          {/* Alt satır: yeni fotoğraf + ipucu */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 transition"
            >
              ← Yeni fotoğraf seç
            </button>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
              {widthCm} × {lengthCm} cm halı
            </span>
          </div>
        </div>
      )}

      {/* Cihaz bilgilendirmesi */}
      {!roomPhoto && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">📱 Her cihazda çalışır</p>
          <p className="leading-relaxed text-blue-700 dark:text-blue-400">
            Bu özellik AR desteklemese de halıyı odanızda görmenizi sağlar.
            Huawei, Redmi ve eski iPhone modelleri dahil tüm cihazlarda kullanılabilir.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Perspektif render yardımcısı ──────────────────────────── */

/**
 * Canvas 2D'de tam perspektif (homografi) için
 * "2 üçgen" yöntemi kullanır — setTransform ile.
 */
function drawPerspectiveImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  widthCm: number,
  lengthCm: number,
  tl: Point,
  tr: Point,
  br: Point,
  bl: Point,
  canvasW: number,
  canvasH: number
) {
  void canvasW;
  void canvasH;

  if (!img) {
    // Görsel yoksa: renkli dikdörtgen (placeholder)
    drawPlaceholderRug(ctx, widthCm, lengthCm, tl, tr, br, bl);
    return;
  }

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Üst üçgen: tl → tr → br  (image: 0,0 → iw,0 → iw,ih)
  drawTriangle(ctx, img, iw, ih,
    tl, tr, br,
    { x: 0, y: 0 }, { x: iw, y: 0 }, { x: iw, y: ih }
  );

  // Alt üçgen: tl → br → bl  (image: 0,0 → iw,ih → 0,ih)
  drawTriangle(ctx, img, iw, ih,
    tl, br, bl,
    { x: 0, y: 0 }, { x: iw, y: ih }, { x: 0, y: ih }
  );
}

/**
 * Tek bir üçgeni perspektif dönüşümle canvas'a çizer.
 * Affine transform (3-nokta eşleme) kullanır.
 */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  iw: number,
  ih: number,
  d0: Point, d1: Point, d2: Point,  // canvas hedef köşeleri
  s0: Point, s1: Point, s2: Point   // görsel kaynak köşeleri
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();

  // 3-nokta affine dönüşüm matrisi hesapla
  const dx1 = d1.x - d0.x;
  const dy1 = d1.y - d0.y;
  const dx2 = d2.x - d0.x;
  const dy2 = d2.y - d0.y;

  const sx1 = s1.x - s0.x;
  const sy1 = s1.y - s0.y;
  const sx2 = s2.x - s0.x;
  const sy2 = s2.y - s0.y;

  const det = sx1 * sy2 - sx2 * sy1;
  if (Math.abs(det) < 1e-10) {
    ctx.restore();
    return;
  }

  const a = (dx1 * sy2 - dx2 * sy1) / det;
  const b = (dx2 * sx1 - dx1 * sx2) / det;
  const c = d0.x - a * s0.x - b * s0.y;
  const d = (dy1 * sy2 - dy2 * sy1) / det;
  const e = (dy2 * sx1 - dy1 * sx2) / det;
  const f = d0.y - d * s0.x - e * s0.y;

  ctx.transform(a, d, b, e, c, f);

  // Hafif saydamlık (halı + zemin karışımı)
  ctx.globalAlpha = 0.88;
  ctx.drawImage(img, 0, 0, iw, ih);

  ctx.restore();
}

/**
 * Halı görseli yüklenemediğinde renk blok placeholder çizer.
 */
function drawPlaceholderRug(
  ctx: CanvasRenderingContext2D,
  widthCm: number,
  lengthCm: number,
  tl: Point, tr: Point, br: Point, bl: Point
) {
  void widthCm;
  void lengthCm;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();

  // Halı rengi gradient
  const cx = (tl.x + tr.x + br.x + bl.x) / 4;
  const cy = (tl.y + tr.y + br.y + bl.y) / 4;
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
  grad.addColorStop(0, "rgba(180,120,60,0.85)");
  grad.addColorStop(1, "rgba(120,60,20,0.85)");
  ctx.fillStyle = grad;
  ctx.fill();

  // Desen çizgileri
  ctx.strokeStyle = "rgba(255,200,100,0.3)";
  ctx.lineWidth = 2;
  for (let i = 0.2; i < 1; i += 0.2) {
    const px = lerp2d(tl, tr, i);
    const py = lerp2d(bl, br, i);
    ctx.beginPath();
    ctx.moveTo(px.x, px.y);
    ctx.lineTo(py.x, py.y);
    ctx.stroke();
  }
  ctx.restore();
}

function lerp2d(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
