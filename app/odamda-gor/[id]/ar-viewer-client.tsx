"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import {
  parseUserAgent,
  shouldBlockNativeAr,
  shouldUseSceneViewerIntent,
  shouldShowArCoreInstallHint,
  AR_CORE_PLAY_STORE_URL,
  buildChromeIntentUrl,
  resolveSceneViewerLaunchUrl,
  arModesForProfile,
} from "@/lib/device-ar";
import { runPreArFloorScans } from "@/lib/floor-scan-client";

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

function openInChrome(pageUrl: string) {
  const intentUrl = buildChromeIntentUrl(pageUrl);
  const anchor = document.createElement("a");
  anchor.href = intentUrl;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function openSceneViewerIntent(glbUrl: string, fallbackUrl: string, ua: string) {
  const intentUrl = resolveSceneViewerLaunchUrl(ua, glbUrl, fallbackUrl);
  const anchor = document.createElement("a");
  anchor.href = intentUrl;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const blockNativeAr = shouldBlockNativeAr(ua);

  const displayButtonText =
    blockNativeAr && (mobile || embed)
      ? "Chrome'da Ac"
      : mobile && !profile.supportsNativeAr
        ? profile.buttonLabel
        : buttonText;
  const showArCoreHint = shouldShowArCoreInstallHint(ua);
  const arModes = arModesForProfile(profile);
  const enableModelViewerAr =
    !blockNativeAr &&
    (profile.platform === "ios" || profile.primaryExperience === "webxr");
  const fullScreen = embed || mobile;

  useEffect(() => {
    trackEvent("VIEW_3D", merchantId, rugId);
  }, [merchantId, rugId]);

  const handleActivateAr = async () => {
    const viewer = viewerRef.current;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

    trackEvent("AR_STARTED", merchantId, rugId);
    await runPreArFloorScans({
      merchantId,
      rugId,
      vendor: profile.vendor,
      maxWaitMs: 750,
    });

    if (profile.primaryExperience === "quick-look" && iosSrc) {
      openIosQuickLook(iosSrc);
      return;
    }

    if (shouldBlockNativeAr(ua)) {
      openInChrome(window.location.href);
      return;
    }

    if (shouldUseSceneViewerIntent(ua)) {
      const glbAbsolute = new URL(viewerSrc, window.location.href).toString();
      openSceneViewerIntent(glbAbsolute, window.location.href, ua);
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
      {...(iosSrc ? { "ios-src": iosSrc } : {})}
      alt={name}
      {...(enableModelViewerAr
        ? {
            ar: true,
            "ar-placement": "floor" as const,
            "ar-modes": arModes || "webxr scene-viewer quick-look",
          }
        : {})}
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

          {showArCoreHint && (
            <p className="absolute bottom-20 left-1/2 z-10 w-[min(92%,22rem)] -translate-x-1/2 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 shadow">
              AR icin once{" "}
              <a
                href={AR_CORE_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Google Play Hizmetleri icin AR
              </a>{" "}
              kurun (Play Store, ucretsiz).
            </p>
          )}

          <button
            type="button"
            onClick={handleActivateAr}
            className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 px-6 py-3 text-sm font-medium text-white shadow-lg"
            style={{ backgroundColor: buttonColor, borderRadius }}
          >
            {displayButtonText}
          </button>
        </div>
        {mobile && blockNativeAr && (
          <p className="px-3 pb-3 text-center text-xs text-zinc-500">
            {profile.hint}
          </p>
        )}
        {mobile && !blockNativeAr && (
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

          {showArCoreHint && (
            <p className="mt-3 text-xs text-amber-800">
              AR icin{" "}
              <a
                href={AR_CORE_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Google Play Hizmetleri icin AR
              </a>{" "}
              kurulu olmali (Play Store, ucretsiz).
            </p>
          )}

          {hint}
        </aside>
      </div>
    </>
  );
}
