"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
type Props = {
  modelUrl: string;
  iosSrc?: string;
  name: string;
  merchantId: string;
  merchantName: string;
  rugId: string;
  sku: string;
  slug: string;
  buttonText: string;
  buttonColor: string;
  borderRadius: number;
  embed?: boolean;
};

type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void;
};

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function openAndroidSceneViewer(modelUrl: string) {
  const absoluteUrl = new URL(modelUrl, window.location.href).toString();
  const fallback = window.location.href;

  // Android Scene Viewer deep link (ARCore). Falls back to the current page.
  const intentUrl =
    "intent://arvr.google.com/scene-viewer/1.0?file=" +
    encodeURIComponent(absoluteUrl) +
    "&mode=ar_preferred" +
    "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;" +
    "action=android.intent.action.VIEW;" +
    "S.browser_fallback_url=" +
    encodeURIComponent(fallback) +
    ";end;";

  window.location.href = intentUrl;
}

function openIosQuickLook(iosSrc: string) {
  const absoluteUrl = new URL(iosSrc, window.location.href).toString();

  // iOS Quick Look is most reliable when launched via an anchor with rel="ar".
  const anchor = document.createElement("a");
  anchor.setAttribute("rel", "ar");
  anchor.setAttribute("href", absoluteUrl);

  const img = document.createElement("img");
  img.setAttribute("alt", "AR");
  anchor.appendChild(img);

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function trackAiScan(
  merchantId: string,
  rugId: string,
  scanType: "FLOOR_DETECTION" | "ROOM_DETECTION"
) {
  try {
    const payload = JSON.stringify({
      merchantId,
      rugId,
      scanType,
      context: {
        platform: typeof navigator !== "undefined" ? navigator.userAgent : "",
        hasGyroscope:
          typeof window !== "undefined" && "DeviceOrientationEvent" in window,
        screenWidth: typeof window !== "undefined" ? window.screen?.width : undefined,
        screenHeight: typeof window !== "undefined" ? window.screen?.height : undefined,
        portrait:
          typeof window !== "undefined"
            ? window.matchMedia?.("(orientation: portrait)")?.matches
            : undefined,
        aspectRatio:
          typeof window !== "undefined" && window.screen?.height
            ? Number((window.screen.width / window.screen.height).toFixed(3))
            : undefined,
      },
    });
    fetch("/api/v1/ai/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort
  }
}

function trackEvent(
  eventType: "VIEW_3D" | "AR_STARTED",
  merchantId: string,
  rugId: string
) {
  try {
    const payload = JSON.stringify({ merchantId, rugId, eventType });
    const url = "/api/v1/analytics/events";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics is best-effort; never block the AR experience
  }
}

export default function ArViewerClient({
  modelUrl,
  iosSrc,
  name,
  merchantId,
  merchantName,
  rugId,
  sku,
  slug,
  buttonText,
  buttonColor,
  borderRadius,
  embed = false,
}: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    trackEvent("VIEW_3D", merchantId, rugId);
  }, [merchantId, rugId]);

  useEffect(() => {
    if (!modelUrl) return;
    try {
      const origin = new URL(modelUrl, window.location.href).origin;
      if (origin === window.location.origin) return;
      const preconnect = document.createElement("link");
      preconnect.rel = "preconnect";
      preconnect.href = origin;
      preconnect.crossOrigin = "anonymous";
      document.head.appendChild(preconnect);

      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "fetch";
      preload.href = modelUrl;
      preload.crossOrigin = "anonymous";
      document.head.appendChild(preload);
    } catch {
      // best-effort
    }
  }, [modelUrl]);
  const handleActivateAr = async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    trackEvent("AR_STARTED", merchantId, rugId);
    trackAiScan(merchantId, rugId, "FLOOR_DETECTION");
    trackAiScan(merchantId, rugId, "ROOM_DETECTION");

    if (isIOSDevice() && iosSrc) {
      openIosQuickLook(iosSrc);
      return;
    }

    if (typeof viewer.activateAR === "function") {
      try {
        await viewer.activateAR();
        return;
      } catch {
        // fall through to platform-specific fallback below
      }
    }

    if (isAndroidDevice()) {
      openAndroidSceneViewer(modelUrl);
      return;
    }

    // Fallback for browsers where no AR path is available.
    window.open(modelUrl, "_blank", "noopener,noreferrer");
  };

  if (embed) {
    return (
      <>
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
          strategy="lazyOnload"
        />

        <div className="relative h-[calc(100vh-24px)] w-full">
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            ios-src={iosSrc}
            alt={name}
            ar
            ar-placement="floor"
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="1"
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "14px",
              background: "#f4f4f5",
            }}
          />

          <button
            type="button"
            onClick={handleActivateAr}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 text-sm font-medium text-white shadow-lg"
            style={{ backgroundColor: buttonColor, borderRadius }}
          >
            {buttonText}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="lazyOnload"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            ios-src={iosSrc}
            alt={name}
            ar
            ar-placement="floor"
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="1"
            loading="lazy"
            style={{
              width: "100%",
              height: "65vh",
              borderRadius: "14px",
              background: "#f4f4f5",
            }}
          />
        </section>

        <aside className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Urun Bilgisi</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Magaza: {merchantName}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">SKU: {sku}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Slug: {slug}</p>

          <button
            type="button"
            onClick={handleActivateAr}
            className="mt-5 w-full px-4 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: buttonColor, borderRadius }}
          >
            {buttonText}
          </button>

          <p className="mt-3 text-xs text-zinc-500">
            Mobil cihazlarda buton Scene Viewer veya Quick Look akisini tetikler.
          </p>
        </aside>
      </div>
    </>
  );
}
