import {
  parseUserAgent,
  isStockMiuiBrowser,
  shouldBlockNativeAr,
  shouldUseSceneViewerIntent,
  type ArExperience,
} from "@/lib/device-ar";

/** Widget `detectProfile().primary` ile eslesen aksiyonlar. */
export type WidgetArAction =
  | "quick-look"
  | "scene-viewer"
  | "webxr"
  | "chrome-handoff"
  | "preview-3d"
  | "modal-3d";

export type DeviceMatrixEntry = {
  id: string;
  label: string;
  brand: string;
  model: string;
  browser: string;
  userAgent: string;
  expectedPrimary: ArExperience | "chrome-handoff";
  expectedSupportsNativeAr: boolean;
  expectedWidgetAction: WidgetArAction;
  /** Pilot veya gercek cihazda dogrulandi mi? */
  pilotVerified?: boolean;
  note?: string;
};

/** Tum marka/model + tarayici kombinasyonlari (UA tabanli kabul matrisi). */
export const DEVICE_MATRIX: DeviceMatrixEntry[] = [
  {
    id: "iphone-12-safari",
    label: "iPhone 12",
    brand: "Apple",
    model: "iPhone 12",
    browser: "Safari",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    expectedPrimary: "quick-look",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "quick-look",
    pilotVerified: true,
    note: "Pilot Quick Look dogrulandi 17.06.2026",
  },
  {
    id: "iphone-15-pro-safari",
    label: "iPhone 15 Pro",
    brand: "Apple",
    model: "iPhone 15 Pro",
    browser: "Safari",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    expectedPrimary: "quick-look",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "quick-look",
  },
  {
    id: "ipad-air-safari",
    label: "iPad Air",
    brand: "Apple",
    model: "iPad Air",
    browser: "Safari",
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    expectedPrimary: "quick-look",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "quick-look",
  },
  {
    id: "galaxy-s23-ultra-chrome",
    label: "Samsung Galaxy S23 Ultra",
    brand: "Samsung",
    model: "SM-S918B",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.179 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
    pilotVerified: true,
    note: "Scene Viewer intent — pilot dogrulandi",
  },
  {
    id: "galaxy-s23-ultra-samsung-internet",
    label: "Samsung Galaxy S23 Ultra",
    brand: "Samsung",
    model: "SM-S918B",
    browser: "Samsung Internet",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A) AppleWebKit/537.36 SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
    note: "Generic intent (HTTPS 404 onlenir)",
  },
  {
    id: "galaxy-a54-chrome",
    label: "Samsung Galaxy A54",
    brand: "Samsung",
    model: "SM-A546B",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
  },
  {
    id: "pixel-8-pro-chrome",
    label: "Google Pixel 8 Pro",
    brand: "Google",
    model: "Pixel 8 Pro",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/AP2A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
  },
  {
    id: "pixel-7-chrome",
    label: "Google Pixel 7",
    brand: "Google",
    model: "Pixel 7",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/AP2A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
  },
  {
    id: "redmi-note-12-chrome",
    label: "Xiaomi Redmi Note 12",
    brand: "Xiaomi",
    model: "Redmi Note 12",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Redmi Note 12 Build/TKQ1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
    note: "ARCore uyumlu modellerde Scene Viewer",
  },
  {
    id: "redmi-note-12-miui",
    label: "Xiaomi Redmi Note 12",
    brand: "Xiaomi",
    model: "Redmi Note 12",
    browser: "HyperOS / MiuiBrowser",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Redmi Note 12 Build/TKQ1) AppleWebKit/537.36 XiaoMi/MiuiBrowser/20.0",
    expectedPrimary: "chrome-handoff",
    expectedSupportsNativeAr: false,
    expectedWidgetAction: "chrome-handoff",
    note: "Once Chrome ile ac",
  },
  {
    id: "poco-x5-chrome",
    label: "POCO X5",
    brand: "Xiaomi",
    model: "POCO X5",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; 22111317PG Build/TKQ1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "scene-viewer",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "scene-viewer",
  },
  {
    id: "oppo-reno-chrome",
    label: "OPPO Reno",
    brand: "OPPO",
    model: "CPH2357",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; OPPO CPH2357 Build/UKQ1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "webxr",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "webxr",
  },
  {
    id: "vivo-v29-chrome",
    label: "vivo V29",
    brand: "vivo",
    model: "V2250",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; vivo V2250 Build/AP1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "webxr",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "webxr",
  },
  {
    id: "oneplus-12-chrome",
    label: "OnePlus 12",
    brand: "OnePlus",
    model: "CPH2581",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; OnePlus CPH2581 Build/UKQ1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "webxr",
    expectedSupportsNativeAr: true,
    expectedWidgetAction: "webxr",
  },
  {
    id: "huawei-p40-harmony",
    label: "Huawei P40",
    brand: "Huawei",
    model: "ELE-L29",
    browser: "HarmonyOS Browser",
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; HarmonyOS; ELE-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 Mobile Safari/537.36",
    expectedPrimary: "preview-3d",
    expectedSupportsNativeAr: false,
    expectedWidgetAction: "preview-3d",
    note: "GMS yok — sadece 3D onizleme",
  },
  {
    id: "honor-90-gms",
    label: "Honor 90",
    brand: "Honor",
    model: "REA-NX9",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; REA-NX9 Build/HONORREA-N29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    expectedPrimary: "preview-3d",
    expectedSupportsNativeAr: false,
    expectedWidgetAction: "preview-3d",
    note: "Honor/Huawei markasi GMS disi",
  },
  {
    id: "desktop-windows-chrome",
    label: "Windows PC",
    brand: "Desktop",
    model: "Windows 11",
    browser: "Chrome",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    expectedPrimary: "preview-3d",
    expectedSupportsNativeAr: false,
    expectedWidgetAction: "modal-3d",
  },
  {
    id: "desktop-mac-safari",
    label: "macOS",
    brand: "Desktop",
    model: "Macintosh",
    browser: "Safari",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    expectedPrimary: "preview-3d",
    expectedSupportsNativeAr: false,
    expectedWidgetAction: "modal-3d",
  },
];

function prefersMobileWebAr(ua: string): boolean {
  if (isStockMiuiBrowser(ua)) return true;
  const profile = parseUserAgent(ua);
  if (profile.vendor === "oppo" || profile.vendor === "vivo" || profile.vendor === "oneplus") {
    return true;
  }
  return /HeyTapBrowser|VivoBrowser|OPPOBrowser/i.test(ua);
}

/** `public/widget.js` detectProfile().primary ile ayni mantik. */
export function resolveWidgetArAction(ua: string): WidgetArAction {
  const profile = parseUserAgent(ua);

  if (profile.platform === "ios") return "quick-look";
  if (profile.platform === "android") {
    if (!profile.likelyHasGms) return "preview-3d";
    if (isStockMiuiBrowser(ua)) return "chrome-handoff";
    if (profile.vendor === "xiaomi" && /Chrome\//i.test(ua) && !/MiuiBrowser/i.test(ua)) {
      return "scene-viewer";
    }
    if (prefersMobileWebAr(ua)) return "webxr";
    if (profile.primaryExperience === "scene-viewer") return "scene-viewer";
    return "preview-3d";
  }
  if (profile.platform === "desktop") return "modal-3d";
  return "preview-3d";
}

export function resolvePrimaryExperience(ua: string): ArExperience | "chrome-handoff" {
  if (isStockMiuiBrowser(ua)) return "chrome-handoff";
  return parseUserAgent(ua).primaryExperience;
}

export type DeviceMatrixEvaluation = {
  entry: DeviceMatrixEntry;
  actualPrimary: ArExperience | "chrome-handoff";
  actualSupportsNativeAr: boolean;
  actualWidgetAction: WidgetArAction;
  usesSceneViewerIntent: boolean;
  blocksNativeAr: boolean;
  pass: boolean;
  failures: string[];
};

export function evaluateDeviceEntry(entry: DeviceMatrixEntry): DeviceMatrixEvaluation {
  const ua = entry.userAgent;
  const profile = parseUserAgent(ua);
  const actualPrimary = resolvePrimaryExperience(ua);
  const actualSupportsNativeAr = profile.supportsNativeAr && !shouldBlockNativeAr(ua);
  const actualWidgetAction = resolveWidgetArAction(ua);
  const failures: string[] = [];

  if (actualPrimary !== entry.expectedPrimary) {
    failures.push(`primary: expected ${entry.expectedPrimary}, got ${actualPrimary}`);
  }
  if (actualSupportsNativeAr !== entry.expectedSupportsNativeAr) {
    failures.push(
      `supportsNativeAr: expected ${entry.expectedSupportsNativeAr}, got ${actualSupportsNativeAr}`
    );
  }
  if (actualWidgetAction !== entry.expectedWidgetAction) {
    failures.push(
      `widgetAction: expected ${entry.expectedWidgetAction}, got ${actualWidgetAction}`
    );
  }

  return {
    entry,
    actualPrimary,
    actualSupportsNativeAr,
    actualWidgetAction,
    usesSceneViewerIntent: shouldUseSceneViewerIntent(ua),
    blocksNativeAr: shouldBlockNativeAr(ua),
    pass: failures.length === 0,
    failures,
  };
}

export function evaluateDeviceMatrix(entries: DeviceMatrixEntry[] = DEVICE_MATRIX) {
  const results = entries.map(evaluateDeviceEntry);
  const passed = results.filter((r) => r.pass).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    allPass: passed === results.length,
    results,
  };
}
