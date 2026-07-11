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
import PhotoRugPlacer from "@/components/PhotoRugPlacer";

type Props = {
  glbUrl: string;
  usdzUrl?: string;
  posterUrl?: string;
  /** Halının ürün/kapak görseli — Fotoğrafta Gör için */
  coverImage?: string;
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

type Tab = "ar" | "photo";

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
  coverImage = "",
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
  const [activeTab, setActiveTab] = useState<Tab>("ar");

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

  /* ─── Sekme çubuğu (AR Gör + Fotoğrafta Gör) ──────────────── */
  const tabBar = (
    <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-1 mb-4 gap-1">
      <button
        id="tab-ar-gor"
        onClick={() => setActiveTab("ar")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold transition-all",
          activeTab === "ar"
            ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
        ].join(" ")}
        aria-selected={activeTab === "ar"}
        role="tab"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
        </svg>
        3D / AR Gör
      </button>

      <button
        id="tab-fotografta-gor"
        onClick={() => setActiveTab("photo")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold transition-all",
          activeTab === "photo"
            ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
        ].join(" ")}
        aria-selected={activeTab === "photo"}
        role="tab"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        📷 Fotoğrafta Gör
      </button>
    </div>
  );

  /* GMS/AR yok ise fotoğraf sekmesini öneren banner */
  const noArBanner = !arSupported && activeTab === "ar" && (
    <button
      onClick={() => setActiveTab("photo")}
      className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
    >
      <span className="text-base">📷</span>
      <span>
        <strong>Bu cihaz AR desteklemiyor.</strong> Oda fotoğrafınıza halıyı
        perspektifle yerleştirmek için{" "}
        <span className="underline underline-offset-2 font-semibold">Fotoğrafta Gör</span>'e geçin.
      </span>
      <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  /* ─── EMBED / MOBİL MODU ──────────────────────────────────── */
  if (isEmbedMode) {
    return (
      <div className="relative h-[calc(100vh-24px)] w-full flex flex-col justify-between">
        {/* Sekme çubuğu */}
        <div className="px-3 pt-3">
          {tabBar}
          {noArBanner}
        </div>

        {/* 3D/AR sekmesi */}
        {activeTab === "ar" && (
          <div className="flex-1 min-h-[300px] px-3">
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
        )}

        {/* Fotoğrafta Gör sekmesi */}
        {activeTab === "photo" && (
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <PhotoRugPlacer
              rugImageUrl={coverImage || posterUrl}
              rugName={name}
              widthCm={widthCm}
              lengthCm={lengthCm}
              buttonColor={buttonColor}
            />
          </div>
        )}

        {/* AR butonu — sadece AR sekmesinde, destekleniyorsa */}
        {activeTab === "ar" && !arSupported && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-t border-zinc-200 dark:border-zinc-800 text-xs text-amber-800 dark:text-amber-300 leading-normal">
            ⚠️ Bu cihaz artırılmış gerçeklik özelliğini desteklemiyor. Halıyı 3B olarak incelemeye devam edebilirsiniz.
          </div>
        )}

        {activeTab === "ar" && hasARModel && arSupported && (
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

  /* ─── TAM SAYFA MODU ─────────────────────────────────────── */
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Sol: Viewer alanı */}
      <section className="md:col-span-2 flex flex-col gap-4">
        {/* Sekme çubuğu */}
        <div role="tablist" aria-label="Görüntüleme modu">
          {tabBar}
        </div>

        {/* GMS/AR yok banner */}
        {noArBanner}

        {/* 3D/AR sekmesi */}
        {activeTab === "ar" && (
          <div className="min-h-[400px] md:min-h-[500px]">
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
        )}

        {/* Fotoğrafta Gör sekmesi */}
        {activeTab === "photo" && (
          <PhotoRugPlacer
            rugImageUrl={coverImage || posterUrl}
            rugName={name}
            widthCm={widthCm}
            lengthCm={lengthCm}
            buttonColor={buttonColor}
          />
        )}
      </section>

      {/* Sağ: Bilgi + AR tetikleyici */}
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

        {/* AR desteklenmiyorsa ve AR sekmesindeyse */}
        {activeTab === "ar" && !arSupported && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 leading-normal">
            ⚠️ Bu cihaz AR özelliğini desteklemiyor.
            <button
              onClick={() => setActiveTab("photo")}
              className="mt-2 w-full text-center py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 font-semibold"
            >
              📷 Fotoğrafta Gör'e Geç →
            </button>
          </div>
        )}

        {/* AR butonu — AR sekmesi + destekleniyor + model var */}
        {activeTab === "ar" && hasARModel && arSupported && (
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

        {/* Fotoğraf sekmesindeyse kısa ipucu */}
        {activeTab === "photo" && (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 leading-relaxed">
            💡 Oda fotoğrafınıza halıyı perspektifle yerleştirin, ardından indirin veya paylaşın.
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
