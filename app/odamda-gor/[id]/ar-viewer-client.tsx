"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseUserAgent,
  shouldBlockNativeAr,
  shouldUseSceneViewerIntent,
  buildChromeIntentUrl,
  resolveSceneViewerLaunchUrl,
} from "@/lib/device-ar";
import { runPreArFloorScans } from "@/lib/floor-scan-client";
import RugARViewer from "@/components/RugARViewer";
import ARConfirmationModal from "@/components/ARConfirmationModal";

type Props = {
  glbUrl: string;
  usdzUrl?: string;
  posterUrl?: string;
  name: string;
  merchantId: string;
  merchantName: string;
  rugId: string;
  sku: string;
  slug: string;
  widthCm: number;
  lengthCm: number;
  thicknessMm: number;
  hasARModel: boolean;
  buttonText: string;
  buttonColor: string;
  borderRadius: number;
  embed?: boolean;
  mobile?: boolean;
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

export default function ArViewerClient({
  glbUrl,
  usdzUrl = "",
  posterUrl = "",
  name,
  merchantId,
  merchantName,
  rugId,
  sku,
  slug,
  widthCm,
  lengthCm,
  thicknessMm,
  hasARModel,
  buttonText,
  buttonColor,
  borderRadius,
  embed = false,
  mobile = false,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [arSupported, setArSupported] = useState(true);

  const profile = useMemo(() => {
    if (typeof navigator === "undefined") return parseUserAgent("");
    return parseUserAgent(navigator.userAgent);
  }, [isMounted]);

  useEffect(() => {
    setIsMounted(true);
    trackEvent("VIEW_3D", merchantId, rugId);
  }, [merchantId, rugId]);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] md:h-[500px] rounded-2xl bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800">
        <div className="w-10 h-10 border-4 border-zinc-900 dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-zinc-500">Yükleniyor...</p>
      </div>
    );
  }

  const handleActivateAr = async () => {
    setIsModalOpen(false);
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

    trackEvent("AR_STARTED", merchantId, rugId);
    await runPreArFloorScans({
      merchantId,
      rugId,
      vendor: profile.vendor,
      maxWaitMs: 750,
    });

    if (profile.primaryExperience === "quick-look" && usdzUrl) {
      openIosQuickLook(usdzUrl);
      return;
    }

    if (shouldBlockNativeAr(ua)) {
      openInChrome(window.location.href);
      return;
    }

    if (shouldUseSceneViewerIntent(ua)) {
      const glbAbsolute = new URL(glbUrl, window.location.href).toString();
      openSceneViewerIntent(glbAbsolute, window.location.href, ua);
      return;
    }

    // Default WebXR fallback
    const viewer = document.querySelector("model-viewer") as any;
    if (viewer && typeof viewer.activateAR === "function") {
      try {
        await viewer.activateAR();
        return;
      } catch {
        // platform fallback below
      }
    }

    window.open(glbUrl, "_blank", "noopener,noreferrer");
  };

  const isEmbedMode = embed || mobile;

  if (isEmbedMode) {
    return (
      <div className="relative h-[calc(100vh-24px)] w-full flex flex-col justify-between">
        <div className="flex-1 min-h-[350px]">
          <RugARViewer
            productName={name}
            glbUrl={glbUrl}
            usdzUrl={usdzUrl}
            posterUrl={posterUrl}
            widthCm={widthCm}
            lengthCm={lengthCm}
            thicknessMm={thicknessMm}
            onArSupportChange={setArSupported}
          />
        </div>

        {!arSupported && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-t border-zinc-200 dark:border-zinc-800 text-xs text-amber-800 dark:text-amber-300 leading-normal">
            ⚠️ Bu cihaz artırılmış gerçeklik özelliğini desteklemiyor. Halıyı 3B olarak incelemeye devam edebilirsiniz.
          </div>
        )}

        {hasARModel && arSupported && (
          <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 px-6 text-sm font-semibold text-white shadow-lg flex items-center justify-center transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: buttonColor, borderRadius: `${borderRadius}px` }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {buttonText}
            </button>
            <p className="text-center text-[11px] text-zinc-500">
              Satın almadan önce halının odanızda nasıl durduğunu görün.
            </p>
          </div>
        )}

        <ARConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleActivateAr}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* 3D Model Viewer Area */}
      <section className="md:col-span-2 min-h-[400px] md:min-h-[500px]">
        <RugARViewer
          productName={name}
          glbUrl={glbUrl}
          usdzUrl={usdzUrl}
          posterUrl={posterUrl}
          widthCm={widthCm}
          lengthCm={lengthCm}
          thicknessMm={thicknessMm}
          onArSupportChange={setArSupported}
        />
      </section>

      {/* Info & AR trigger Area */}
      <aside className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between h-fit gap-6 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-zinc-100 dark:border-zinc-800 pb-2">Halı Bilgileri</h2>
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p><span className="font-medium">Mağaza:</span> {merchantName}</p>
            <p><span className="font-medium">SKU:</span> {sku}</p>
            <p><span className="font-medium">Slug:</span> {slug}</p>
            <p><span className="font-medium">Boyut:</span> {widthCm} x {lengthCm} cm</p>
            <p><span className="font-medium">Kalınlık:</span> {thicknessMm} mm</p>
          </div>
        </div>

        {!arSupported && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 leading-normal">
            ⚠️ Bu cihaz artırılmış gerçeklik özelliğini desteklemiyor. Halıyı 3B olarak incelemeye devam edebilirsiniz.
          </div>
        )}

        {hasARModel && arSupported && (
          <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 px-6 text-sm font-semibold text-white shadow-md flex items-center justify-center transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: buttonColor, borderRadius: `${borderRadius}px` }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {buttonText}
            </button>
            <p className="text-[11px] text-zinc-500 leading-tight">
              Satın almadan önce halının odanızda nasıl durduğunu görün.
            </p>
          </div>
        )}

        <ARConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleActivateAr}
        />
      </aside>
    </div>
  );
}
