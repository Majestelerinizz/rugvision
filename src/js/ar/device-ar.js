/**
 * Device AR routing — aligned with Majestelerinizz/rugvision
 *
 * Xiaomi / Redmi / POCO / HyperOS:
 *   Scene Viewer intent → Google app (googlequicksearchbox) açılır ve düşer.
 *   Bu yüzden ASLA Scene Viewer / Chrome handoff yok → sadece Universal WebAR.
 */

export function isIosUserAgent(ua) {
  return /iPhone|iPad|iPod/i.test(ua) || (/\bMacintosh\b/i.test(ua) && /Mobile/i.test(ua));
}

export function isAndroidUserAgent(ua) {
  return /Android/i.test(ua);
}

export function detectVendor(ua) {
  if (/iPhone|iPad|iPod/i.test(ua)) return "apple";
  if (/Samsung|SM-|SAMSUNG/i.test(ua)) return "samsung";
  if (/Pixel|Google Pixel/i.test(ua)) return "google";
  if (/Huawei|Honor|HMOS|HarmonyOS/i.test(ua)) return "huawei";
  if (isXiaomiDevice(ua)) return "xiaomi";
  if (/OPPO|Realme/i.test(ua)) return "oppo";
  if (/vivo/i.test(ua)) return "vivo";
  if (/OnePlus/i.test(ua)) return "oneplus";
  return null;
}

/** Xiaomi ailesi — marka, tarayıcı veya model ipuçları */
export function isXiaomiDevice(ua = "") {
  if (/Xiaomi|XiaoMi|Redmi|POCO|MiuiBrowser|XiaoMi\/MiuiBrowser|HyperOS|Hyper OS/i.test(ua)) {
    return true;
  }
  // Chrome UA'da bazen sadece model kodu görünür; Mi Browser / HyperOS ekleri
  if (/;\s*Mi\s+\d/i.test(ua) || /;\s*M\d{4}[A-Z0-9]+\s+Build\//i.test(ua)) {
    // "Mi 11" tarzı; çok agresif olmamak için sadece Mi + sayı
    if (/;\s*Mi\s+\d/i.test(ua)) return true;
  }
  return false;
}

export function likelyHasGooglePlayServices(ua) {
  if (detectVendor(ua) === "huawei") return false;
  if (!isAndroidUserAgent(ua)) return true;
  if (/HarmonyOS|HMOS/i.test(ua)) return false;
  return true;
}

export function isAndroidChrome(ua) {
  return (
    isAndroidUserAgent(ua) &&
    /Chrome\//i.test(ua) &&
    !/MiuiBrowser|SamsungBrowser|OPPOBrowser|VivoBrowser/i.test(ua)
  );
}

export function isXiaomiFamilyBrowser(ua) {
  return /MiuiBrowser|XiaoMi\/MiuiBrowser|HyperOS|Hyper OS/i.test(ua);
}

export function isStockMiuiBrowser(ua) {
  if (!isXiaomiDevice(ua)) return false;
  return !isAndroidChrome(ua);
}

/** Bu cihazlarda Scene Viewer / Google app intent YASAK */
export function mustUseInBrowserWebAr(ua) {
  if (isXiaomiDevice(ua)) return true;
  if (detectVendor(ua) === "huawei") return true;
  if (detectVendor(ua) === "oppo" || detectVendor(ua) === "vivo" || detectVendor(ua) === "oneplus") {
    return true;
  }
  if (/HeyTapBrowser|VivoBrowser|OPPOBrowser/i.test(ua)) return true;
  if (!likelyHasGooglePlayServices(ua) && isAndroidUserAgent(ua)) return true;
  return false;
}

export function prefersMobileWebAr(ua) {
  return mustUseInBrowserWebAr(ua);
}

export function parseUserAgent(ua = "") {
  const vendor = detectVendor(ua);

  if (isIosUserAgent(ua)) {
    return {
      platform: "ios",
      vendor: "apple",
      primaryExperience: "quick-look",
      supportsNativeAr: true,
      buttonLabel: "AR ile Odanda Gör",
      hint: "iPhone / iPad: Quick Look ile zemine yerleştirme.",
    };
  }

  if (isAndroidUserAgent(ua)) {
    if (isXiaomiDevice(ua)) {
      return {
        platform: "android",
        vendor: "xiaomi",
        primaryExperience: "webxr",
        supportsNativeAr: false,
        buttonLabel: "Kamerada Odanda Gör",
        hint: "Xiaomi / HyperOS: AR tarayıcı içinde açılır — Google uygulamasına atlamaz.",
      };
    }

    if (!likelyHasGooglePlayServices(ua) || mustUseInBrowserWebAr(ua)) {
      return {
        platform: "android",
        vendor,
        primaryExperience: "webxr",
        supportsNativeAr: false,
        buttonLabel: "Kamerada Odanda Gör",
        hint: "Bu cihazda Universal WebAR (tarayıcı kamerası) kullanılır.",
      };
    }

    if (vendor === "samsung" || vendor === "google") {
      return {
        platform: "android",
        vendor,
        primaryExperience: "scene-viewer",
        supportsNativeAr: true,
        buttonLabel: "AR ile Odanda Gör",
        hint: "Android Scene Viewer ile zemine yerleştirme.",
      };
    }

    return {
      platform: "android",
      vendor,
      primaryExperience: "webxr",
      supportsNativeAr: true,
      buttonLabel: "Kamerada Odanda Gör",
      hint: "Tarayıcı kamerası ile Universal WebAR.",
    };
  }

  return {
    platform: "desktop",
    vendor,
    primaryExperience: "preview-3d",
    supportsNativeAr: false,
    buttonLabel: "Canlı Kamera AR",
    hint: "Masaüstü: 3D önizleme + fotoğrafta yerleştirme veya webcam AR.",
  };
}

/**
 * Lansman yolu:
 * iPhone → quick-look
 * Samsung / Pixel → scene-viewer
 * Xiaomi + diğerleri → universal-webar (asla Google app intent yok)
 */
export function resolveArLaunchMode(ua, hasUsdz) {
  if (isIosUserAgent(ua) && hasUsdz) return "quick-look";
  if (mustUseInBrowserWebAr(ua)) return "universal-webar";
  if (shouldUseSceneViewerIntent(ua)) return "scene-viewer";
  const profile = parseUserAgent(ua);
  if (profile.primaryExperience === "scene-viewer") return "scene-viewer";
  return "universal-webar";
}

export function shouldUseSceneViewerIntent(ua) {
  if (!isAndroidUserAgent(ua)) return false;
  if (mustUseInBrowserWebAr(ua)) return false;
  if (isXiaomiDevice(ua)) return false;
  const vendor = detectVendor(ua);
  if (vendor === "xiaomi" || vendor === null) return false;
  if (vendor !== "samsung" && vendor !== "google") return false;
  return likelyHasGooglePlayServices(ua);
}

/** model-viewer ar-modes — Xiaomi'de scene-viewer ASLA olmamalı */
export function arModesForViewer(ua) {
  if (isIosUserAgent(ua)) return "quick-look webxr";
  if (isXiaomiDevice(ua) || mustUseInBrowserWebAr(ua)) {
    // Scene Viewer yok → Google app'e atlama yok. WebXR de zayıfsa butonumuz Live WebAR açar.
    return "webxr";
  }
  if (shouldUseSceneViewerIntent(ua)) return "scene-viewer webxr";
  return "webxr";
}

/** Xiaomi'de model-viewer yerleşik AR butonunu tamamen kapat (intent tuzağı) */
export function shouldDisableModelViewerAr(ua) {
  return isXiaomiDevice(ua) || mustUseInBrowserWebAr(ua);
}

export function buildSceneViewerIntentUrl(glbUrl, fallbackUrl) {
  const file = encodeURIComponent(glbUrl);
  const fallback = encodeURIComponent(fallbackUrl);
  return (
    "intent://arvr.google.com/scene-viewer/1.0?file=" +
    file +
    "&mode=ar_preferred&resizable=false&disable_occlusion=true" +
    "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;" +
    "action=android.intent.action.VIEW;S.browser_fallback_url=" +
    fallback +
    ";end;"
  );
}

export function buildSceneViewerGenericIntentUrl(glbUrl, fallbackUrl) {
  const file = encodeURIComponent(glbUrl);
  const fallback = encodeURIComponent(fallbackUrl);
  return (
    "intent://arvr.google.com/scene-viewer/1.0?file=" +
    file +
    "&mode=ar_preferred&resizable=false&disable_occlusion=true" +
    "#Intent;scheme=https;action=android.intent.action.VIEW;" +
    "S.browser_fallback_url=" +
    fallback +
    ";end;"
  );
}

export function resolveSceneViewerLaunchUrl(ua, glbUrl, fallbackUrl) {
  // Xiaomi güvenlik ağı — çağrılsa bile intent üretme
  if (isXiaomiDevice(ua) || mustUseInBrowserWebAr(ua)) {
    return fallbackUrl;
  }
  const vendor = detectVendor(ua);
  if (vendor === "samsung" || /SamsungBrowser/i.test(ua)) {
    return buildSceneViewerGenericIntentUrl(glbUrl, fallbackUrl);
  }
  return buildSceneViewerIntentUrl(glbUrl, fallbackUrl);
}

export function openIosQuickLook(usdzUrl) {
  const absoluteUrl = new URL(usdzUrl, window.location.href).toString();
  const anchor = document.createElement("a");
  anchor.setAttribute("rel", "ar");
  anchor.setAttribute("href", absoluteUrl);
  const img = document.createElement("img");
  img.alt = "AR";
  anchor.appendChild(img);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function openSceneViewer(ua, glbUrl) {
  // Xiaomi / HyperOS: Google app intent'e ASLA gitme
  if (isXiaomiDevice(ua) || mustUseInBrowserWebAr(ua)) {
    console.warn("[RugVision AR] Scene Viewer blocked on this device — use Universal WebAR");
    return false;
  }
  const absolute = new URL(glbUrl, window.location.href).toString();
  const intentUrl = resolveSceneViewerLaunchUrl(ua, absolute, window.location.href);
  const a = document.createElement("a");
  a.href = intentUrl;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

export function modelViewerScale(origW, origL, selW, selL) {
  const sx = origW > 0 ? selW / origW : 1;
  const sz = origL > 0 ? selL / origL : 1;
  return `${(Number.isFinite(sx) && sx > 0 ? sx : 1).toFixed(4)} 1 ${(Number.isFinite(sz) && sz > 0 ? sz : 1).toFixed(4)}`;
}

export const RUG_SIZE_PRESETS = [
  { label: "80×150", widthCm: 80, lengthCm: 150 },
  { label: "80×200", widthCm: 80, lengthCm: 200 },
  { label: "120×180", widthCm: 120, lengthCm: 180 },
  { label: "160×230", widthCm: 160, lengthCm: 230 },
  { label: "200×290", widthCm: 200, lengthCm: 290 },
  { label: "200×300", widthCm: 200, lengthCm: 300 },
];
