export const AR_CORE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.google.ar.core";

export type ArPlatform = "ios" | "android" | "desktop" | "unknown";

export type ArExperience = "quick-look" | "scene-viewer" | "webxr" | "preview-3d";

export type ArDeviceProfile = {
  platform: ArPlatform;
  vendor: string | null;
  modelHint: string | null;
  /** Google Play Services / Scene Viewer kullanilabilir mi? */
  likelyHasGms: boolean;
  supportsNativeAr: boolean;
  primaryExperience: ArExperience;
  fallbackExperience: ArExperience;
  buttonLabel: string;
  hint: string;
};

function normalizeUa(ua: string) {
  return ua.trim();
}

export function isIosUserAgent(ua: string) {
  const n = normalizeUa(ua);
  return (
    /iPhone|iPad|iPod/i.test(n) ||
    (/\bMacintosh\b/i.test(n) && /Mobile/i.test(n))
  );
}

export function isAndroidUserAgent(ua: string) {
  return /Android/i.test(normalizeUa(ua));
}

export function detectVendor(ua: string): string | null {
  const n = normalizeUa(ua);
  if (/iPhone|iPad|iPod/i.test(n)) return "apple";
  if (/Samsung|SM-|SAMSUNG/i.test(n)) return "samsung";
  if (/Pixel|Google Pixel/i.test(n)) return "google";
  if (/Huawei|Honor|HMOS|HarmonyOS/i.test(n)) return "huawei";
  if (/Xiaomi|XiaoMi|Redmi|POCO|Mi\s/i.test(n)) return "xiaomi";
  if (/OPPO|Realme/i.test(n)) return "oppo";
  if (/vivo/i.test(n)) return "vivo";
  if (/OnePlus/i.test(n)) return "oneplus";
  return null;
}

/** Huawei / bazi Honor cihazlarda GMS yok; Scene Viewer calismaz. */
export function likelyHasGooglePlayServices(ua: string): boolean {
  const vendor = detectVendor(ua);
  if (vendor === "huawei") return false;
  if (!isAndroidUserAgent(ua)) return true;
  // HarmonyOS isaretleri
  if (/HarmonyOS|HMOS/i.test(ua)) return false;
  return true;
}

/** HyperOS / MIUI tarayicilarda Scene Viewer intent sessizce basarisiz olur; WebXR daha guvenilir. */
export function isXiaomiFamilyBrowser(ua: string): boolean {
  return /MiuiBrowser|XiaoMi\/MiuiBrowser|HyperOS|Hyper OS/i.test(ua);
}

export function isAndroidChrome(ua: string): boolean {
  const n = normalizeUa(ua);
  return (
    isAndroidUserAgent(n) &&
    /Chrome\//i.test(n) &&
    !/MiuiBrowser|SamsungBrowser|OPPOBrowser|VivoBrowser/i.test(n)
  );
}

/** HyperOS / MIUI varsayilan tarayici (Chrome degil). */
export function isStockMiuiBrowser(ua: string): boolean {
  const n = normalizeUa(ua);
  if (!isXiaomiFamilyBrowser(n) && detectVendor(n) !== "xiaomi") return false;
  return !isAndroidChrome(n);
}

export function prefersMobileWebAr(ua: string): boolean {
  if (isStockMiuiBrowser(ua)) return true;
  const vendor = detectVendor(ua);
  if (vendor === "oppo" || vendor === "vivo" || vendor === "oneplus") return true;
  return /HeyTapBrowser|VivoBrowser|OPPOBrowser/i.test(ua);
}

export function parseUserAgent(ua: string): ArDeviceProfile {
  const n = normalizeUa(ua);
  const vendor = detectVendor(n);
  const modelMatch = n.match(/;\s*([^;)]+)\s*Build\//i);
  const modelHint = modelMatch?.[1]?.trim() ?? null;

  if (isIosUserAgent(n)) {
    return {
      platform: "ios",
      vendor: "apple",
      modelHint,
      likelyHasGms: true,
      supportsNativeAr: true,
      primaryExperience: "quick-look",
      fallbackExperience: "preview-3d",
      buttonLabel: "Odamda Gor",
      hint: "iPhone ve iPad: Quick Look ile zemine yerlestirme.",
    };
  }

  if (isAndroidUserAgent(n)) {
    const hasGms = likelyHasGooglePlayServices(n);
    if (!hasGms) {
      return {
        platform: "android",
        vendor,
        modelHint,
        likelyHasGms: false,
        supportsNativeAr: false,
        primaryExperience: "preview-3d",
        fallbackExperience: "preview-3d",
        buttonLabel: "3D Onizleme",
        hint: "Bu cihazda AR desteklenmiyor; 3D onizleme acilir.",
      };
    }

    if (vendor === "xiaomi") {
      if (isStockMiuiBrowser(n)) {
        return {
          platform: "android",
          vendor,
          modelHint,
          likelyHasGms: hasGms,
          supportsNativeAr: false,
          primaryExperience: "preview-3d",
          fallbackExperience: "webxr",
          buttonLabel: "Chrome'da Ac",
          hint: "HyperOS tarayicisi AR acmaz. Once Google Chrome ile acin; AR dugmesi kamerayi kullanir.",
        };
      }
      if (isAndroidChrome(n)) {
        return {
          platform: "android",
          vendor,
          modelHint,
          likelyHasGms: hasGms,
          supportsNativeAr: true,
          primaryExperience: "scene-viewer",
          fallbackExperience: "preview-3d",
          buttonLabel: "Odamda Gor",
          hint:
            "AR icin Play Store'dan ucretsiz 'Google Play Hizmetleri icin AR' kurun, sonra bu dugmeye basin (Samsung gibi).",
        };
      }
    }

    if (vendor === "oppo" || vendor === "vivo" || vendor === "oneplus") {
      return {
        platform: "android",
        vendor,
        modelHint,
        likelyHasGms: hasGms,
        supportsNativeAr: true,
        primaryExperience: "webxr",
        fallbackExperience: "scene-viewer",
        buttonLabel: "Odamda Gor",
        hint: "Bu tarayicida Google Chrome ile AR deneyin.",
      };
    }

    return {
      platform: "android",
      vendor,
      modelHint,
      likelyHasGms: true,
      supportsNativeAr: true,
      primaryExperience: "scene-viewer",
      fallbackExperience: "webxr",
      buttonLabel: "Odamda Gor",
      hint: "Android: Scene Viewer veya tarayici AR (WebXR) denenir.",
    };
  }

  if (/Windows|Macintosh|Linux|CrOS/i.test(n)) {
    return {
      platform: "desktop",
      vendor,
      modelHint,
      likelyHasGms: true,
      supportsNativeAr: false,
      primaryExperience: "preview-3d",
      fallbackExperience: "preview-3d",
      buttonLabel: "3D Onizleme",
      hint: "Masaustu: 3D model onizleme modali acilir.",
    };
  }

  return {
    platform: "unknown",
    vendor,
    modelHint,
    likelyHasGms: true,
    supportsNativeAr: false,
    primaryExperience: "preview-3d",
    fallbackExperience: "preview-3d",
    buttonLabel: "Odamda Gor",
    hint: "Cihaziniza uygun goruntuleme modu acilir.",
  };
}

/** Android Scene Viewer intent (ARCore / Google uygulamasi). */
export function buildSceneViewerIntentUrl(glbUrl: string, fallbackUrl: string) {
  const file = encodeURIComponent(glbUrl);
  const fallback = encodeURIComponent(fallbackUrl);
  return (
    "intent://arvr.google.com/scene-viewer/1.0?file=" +
    file +
    "&mode=ar_preferred&resizable=false&disable_occlusion=true" +
    "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;" +
    "action=android.intent.action.VIEW;" +
    "S.browser_fallback_url=" +
    fallback +
    ";end;"
  );
}

/** Paket kisitlamasi olmadan genel Android intent (Samsung Internet vb.). */
export function buildSceneViewerGenericIntentUrl(glbUrl: string, fallbackUrl: string) {
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

/**
 * Samsung Internet ve diger Android tarayicilarda https://arvr.google.com dogrudan
 * acilirsa 404 verir; intent zorunlu. Chrome Android icin de intent daha guvenilir.
 */
export function resolveSceneViewerLaunchUrl(
  ua: string,
  glbUrl: string,
  fallbackUrl: string
): string {
  const vendor = detectVendor(ua);
  if (
    vendor === "samsung" ||
    /SamsungBrowser|MiuiBrowser|XiaoMi\/MiuiBrowser/i.test(ua)
  ) {
    return buildSceneViewerGenericIntentUrl(glbUrl, fallbackUrl);
  }
  return buildSceneViewerIntentUrl(glbUrl, fallbackUrl);
}

/** Chrome / Samsung Internet icin dogrudan HTTPS Scene Viewer linki. */
export function buildSceneViewerHttpsUrl(glbUrl: string) {
  return (
    "https://arvr.google.com/scene-viewer/1.0?file=" +
    encodeURIComponent(glbUrl) +
    "&mode=ar_preferred&resizable=false&disable_occlusion=true"
  );
}

/** Sadece HyperOS varsayilan tarayicida native AR engelle (Chrome'da izin ver). */
export function shouldBlockNativeAr(ua: string): boolean {
  return isStockMiuiBrowser(ua);
}

/** Android'de model-viewer activateAR yerine Scene Viewer intent (Samsung yolu). */
export function shouldUseSceneViewerIntent(ua: string): boolean {
  if (!isAndroidUserAgent(ua)) return false;
  if (isStockMiuiBrowser(ua)) return false;
  return likelyHasGooglePlayServices(ua);
}

export function shouldShowArCoreInstallHint(ua: string): boolean {
  return isAndroidUserAgent(ua) && likelyHasGooglePlayServices(ua) && !isStockMiuiBrowser(ua);
}

/** Xiaomi/HyperOS: ayni sayfayi Google Chrome ile ac (AR Core APK yuklemesini onler). */
export function buildChromeIntentUrl(pageUrl: string) {
  const absolute = pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`;
  const path = absolute.replace(/^https?:\/\//, "");
  const fallback = encodeURIComponent(absolute);
  return (
    `intent://${path}#Intent;scheme=https;package=com.android.chrome;` +
    `action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`
  );
}

export function arModesForProfile(profile: ArDeviceProfile) {
  if (profile.platform === "ios") {
    return "quick-look webxr scene-viewer";
  }
  if (profile.platform === "android" && profile.primaryExperience === "webxr") {
    return "webxr";
  }
  return "scene-viewer";
}
