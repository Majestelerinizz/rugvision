"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useEffect, useRef, useState, useMemo } from "react";
import Script from "next/script";
import {
  parseUserAgent,
  shouldBlockNativeAr,
  shouldUseSceneViewerIntent,
  resolveSceneViewerLaunchUrl,
  arModesForProfile,
  buildChromeIntentUrl,
} from "@/lib/device-ar";
import { buildViewerGlbSrc, buildIosSrc } from "@/lib/model-urls";

interface RugARViewerProps {
  productName: string;
  glbUrl: string;
  usdzUrl: string;
  posterUrl: string;
  widthCm: number;
  lengthCm: number;
  thicknessMm: number;
  /** model-viewer scale, e.g. "1 1 1" */
  modelScale?: string;
  onArSupportChange?: (supported: boolean) => void;
}

type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void;
};

export default function RugARViewer({
  productName,
  glbUrl,
  usdzUrl,
  posterUrl,
  widthCm,
  lengthCm,
  thicknessMm,
  modelScale = "1 1 1",
  onArSupportChange,
}: RugARViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Set isMounted to true on client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const profile = useMemo(() => {
    if (typeof navigator === "undefined") return parseUserAgent("");
    return parseUserAgent(navigator.userAgent);
  }, [isMounted]);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobile = profile.platform === "ios" || profile.platform === "android";
  const arModes = arModesForProfile(profile);

  // Fallback viewer sources mapped to proxy API to prevent CORS issues
  const viewerGlbSrc = useMemo(() => buildViewerGlbSrc(glbUrl), [glbUrl]);
  const viewerUsdzSrc = useMemo(() => buildIosSrc(usdzUrl || glbUrl), [usdzUrl, glbUrl]);

  useEffect(() => {
    if (!isMounted || !scriptReady) return;

    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      setIsLoading(false);
      setError(null);
      console.log(`[RugARViewer] Successfully loaded model: ${productName}`);

      if (onArSupportChange) {
        const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const canAr = isIos || (viewer as any).canActivateAR === true;
        onArSupportChange(canAr);
      }
    };

    const handleError = (e: any) => {
      setIsLoading(false);
      setError("3B model yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
      console.error(`[RugARViewer] Error loading model: ${productName}`, e);
    };

    const handleProgress = (e: any) => {
      const p = Math.round((e.detail?.totalProgress || 0) * 100);
      setProgress(p);
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);
    viewer.addEventListener("progress", handleProgress);

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
      viewer.removeEventListener("progress", handleProgress);
    };
  }, [isMounted, scriptReady, productName]);

  const handleActivateAr = async () => {
    const viewer = viewerRef.current;
    const currentUa = typeof navigator !== "undefined" ? navigator.userAgent : "";

    if (!glbUrl && !usdzUrl) {
      setError("AR model dosyaları bulunamadı.");
      return;
    }

    if (profile.primaryExperience === "quick-look" && viewerUsdzSrc) {
      try {
        const absoluteUrl = new URL(viewerUsdzSrc, window.location.href).toString();
        const anchor = document.createElement("a");
        anchor.setAttribute("rel", "ar");
        anchor.setAttribute("href", absoluteUrl);
        const img = document.createElement("img");
        img.setAttribute("alt", "AR");
        anchor.appendChild(img);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } catch (err) {
        setError("USDZ dosyası açılamadı.");
      }
      return;
    }

    if (shouldBlockNativeAr(currentUa)) {
      const intentUrl = buildChromeIntentUrl(window.location.href);
      const anchor = document.createElement("a");
      anchor.href = intentUrl;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }

    if (shouldUseSceneViewerIntent(currentUa)) {
      try {
        const glbAbsolute = new URL(viewerGlbSrc, window.location.href).toString();
        const intentUrl = resolveSceneViewerLaunchUrl(currentUa, glbAbsolute, window.location.href);
        const anchor = document.createElement("a");
        anchor.href = intentUrl;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } catch (err) {
        setError("GLB dosyası Scene Viewer üzerinde başlatılamadı.");
      }
      return;
    }

    if (viewer && typeof viewer.activateAR === "function") {
      try {
        await viewer.activateAR();
        return;
      } catch (err) {
        setError("Tarayıcı WebXR veya ARCore özelliğini başlatamadı.");
      }
    }

    window.open(glbUrl, "_blank", "noopener,noreferrer");
  };

  // SSR or Initial Hydration Placeholder to prevent Hydration Mismatch
  if (!isMounted) {
    return (
      <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800">
        <div className="w-10 h-10 border-4 border-zinc-900 dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-zinc-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-100/80 dark:bg-zinc-950/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-zinc-900 dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              3B model yükleniyor... %{progress} ({widthCm}x{lengthCm} cm)
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-red-50/90 dark:bg-red-950/90 text-center">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
              Hata Oluştu
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 max-w-xs mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setProgress(0);
                if (viewerRef.current) {
                  const prevSrc = viewerRef.current.getAttribute("src") || "";
                  viewerRef.current.setAttribute("src", "");
                  setTimeout(() => {
                    viewerRef.current?.setAttribute("src", prevSrc);
                  }, 50);
                }
              }}
              className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition cursor-pointer"
            >
              Yeniden Dene
            </button>
          </div>
        )}

        {/* Google model-viewer */}
        {scriptReady && (
          <model-viewer
            ref={viewerRef}
            src={viewerGlbSrc}
            {...(viewerUsdzSrc ? { "ios-src": viewerUsdzSrc } : {})}
            poster={posterUrl}
            alt={`${productName} 3D halı modeli`}
            ar
            ar-modes={arModes}
            ar-placement="floor"
            ar-scale="fixed"
            scale={modelScale}
            camera-controls
            xr-environment
            shadow-intensity="1.2"
            shadow-softness="0.8"
            exposure="1"
            touch-action="pan-y"
            loading="lazy"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Desktop Fallback Instruction Hint */}
            {!isMobile && (
              <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-600 dark:text-zinc-400 shadow-sm pointer-events-none">
                🖱️ Yakınlaştırmak için kaydırın, döndürmek için sürükleyin
              </div>
            )}

            {/* Custom AR Action Button (shows at bottom-right inside viewer when native AR is possible) */}
            {isMobile && profile.supportsNativeAr && (
              <button
                slot="ar-button"
                onClick={(e) => {
                  e.preventDefault();
                  handleActivateAr();
                }}
                className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 active:bg-black rounded-xl shadow-lg border border-white/10 transition cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                AR’da Görüntüle
              </button>
            )}
          </model-viewer>
        )}
      </div>

      {/* Info footer for desktop */}
      {!isMobile && (
        <div className="mt-3 flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
          <span>Halı Ölçüsü: <b>{widthCm} x {lengthCm} cm</b> (Kalınlık: {thicknessMm} mm)</span>
          <span className="flex items-center gap-1">
            📱 Telefonunuzdan açarak kameranızla odanızda görüntüleyebilirsiniz.
          </span>
        </div>
      )}
    </>
  );
}
