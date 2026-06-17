"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import {
  parseUserAgent,
  resolveSceneViewerLaunchUrl,
  arModesForProfile,
} from "@/lib/device-ar";

type Props = {
  modelUrl: string;
  viewerSrc: string;
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
  mobile?: boolean;
};

type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void;
};

function openAndroidSceneViewer(modelUrl: string, fallbackUrl: string, ua: string) {
  const absoluteUrl = new URL(modelUrl, window.location.href).toString();
  const absoluteFallback = new URL(fallbackUrl, window.location.href).toString();
  window.location.href = resolveSceneViewerLaunchUrl(ua, absoluteUrl, absoluteFallback);
}

function openIosQuickLook(iosSrc: string) {
  const absoluteUrl = new URL(iosSrc, window.location.href).toString();
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
  scanType: "FLOOR_DETECTION" | "ROOM_DETECTION",
  profileVendor: string | null
) {
  try {
    const payload = JSON.stringify({
      merchantId,
      rugId,
      scanType,
      context: {
        platform: typeof navigator !== "undefined" ? navigator.userAgent : "",
        vendor: profileVendor,
        hasGyroscope:
          typeof window !== "undefined" && "DeviceOrientationEvent" in window,
        screenWidth: typeof window !== "undefined" ? window.screen?.width : undefined,
        screenHeight: typeof window !== "undefined" ? window.screen?.height : undefined,
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
    // analytics is best-effort
  }
}

function ViewerPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex h-full min-h-[320px] w-full items-center justify-center rounded-[14px] bg-zinc-100 text-sm text-zinc-500"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

export default function ArViewerClient({
  modelUrl,
  viewerSrc,
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
  mobile = false,
}: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const profile = useMemo(() => {
    if (typeof navigator === "undefined") return parseUserAgent("");
    return parseUserAgent(navigator.userAgent);
  }, []);

  const displayButtonText =
    mobile && !profile.supportsNativeAr ? profile.buttonLabel : buttonText;
  const arModes = arModesForProfile(profile);
  const fullScreen = embed || mobile;

  useEffect(() => {
    trackEvent("VIEW_3D", merchantId, rugId);
  }, [merchantId, rugId]);

  const handleActivateAr = async () => {
    const viewer = viewerRef.current;

    trackEvent("AR_STARTED", merchantId, rugId);
    trackAiScan(merchantId, rugId, "FLOOR_DETECTION", profile.vendor);
    trackAiScan(merchantId, rugId, "ROOM_DETECTION", profile.vendor);

    if (profile.primaryExperience === "quick-look" && iosSrc) {
      openIosQuickLook(iosSrc);
      return;
    }

    if (viewer && typeof viewer.activateAR === "function") {
      try {
        await viewer.activateAR();
        return;
      } catch {
        // platform fallback below
      }
    }

    if (profile.platform === "android" && profile.likelyHasGms) {
      openAndroidSceneViewer(
        modelUrl,
        window.location.href,
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      );
      return;
    }

    window.open(modelUrl, "_blank", "noopener,noreferrer");
  };

  const scriptStrategy = fullScreen ? "afterInteractive" : "lazyOnload";

  const modelViewerStyle = fullScreen
    ? {
        width: "100%",
        height: "100%",
        borderRadius: "14px",
        background: "#f4f4f5",
      }
    : {
        width: "100%",
        height: "65vh",
        borderRadius: "14px",
        background: "#f4f4f5",
      };

  const modelViewer = scriptReady ? (
    <model-viewer
      ref={viewerRef}
      src={viewerSrc}
      ios-src={iosSrc}
      alt={name}
      ar
      ar-placement="floor"
      ar-modes={arModes}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      style={modelViewerStyle}
    />
  ) : (
    <ViewerPlaceholder label="3D model yukleniyor..." />
  );

  const hint = (
    <p className="mt-3 text-xs text-zinc-500">
      {profile.hint}
      {profile.modelHint ? ` (${profile.modelHint})` : ""}
    </p>
  );

  if (fullScreen) {
    return (
      <>
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
          strategy={scriptStrategy}
          onLoad={() => setScriptReady(true)}
        />

        <div className="relative h-[calc(100vh-24px)] w-full min-h-[360px]">
          {modelViewer}

          <button
            type="button"
            onClick={handleActivateAr}
            className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 px-6 py-3 text-sm font-medium text-white shadow-lg"
            style={{ backgroundColor: buttonColor, borderRadius }}
          >
            {displayButtonText}
          </button>
        </div>
        {mobile && (
          <p className="px-3 pb-3 text-center text-xs text-zinc-500">{profile.hint}</p>
        )}
      </>
    );
  }

  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy={scriptStrategy}
        onLoad={() => setScriptReady(true)}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2 min-h-[65vh]">{modelViewer}</section>

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
            {displayButtonText}
          </button>

          {hint}
        </aside>
      </div>
    </>
  );
}
