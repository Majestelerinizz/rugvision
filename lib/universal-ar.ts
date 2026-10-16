import {
  parseUserAgent,
  shouldBlockNativeAr,
  shouldUseSceneViewerIntent,
} from "@/lib/device-ar";

/** Cihaza göre AR lansman yolu — yapı: önce zemin tara, sonra bu hedef. */
export type ArLaunchMode =
  | "quick-look"
  | "scene-viewer"
  | "universal-webar"
  | "chrome-handoff";

/**
 * iPhone / Samsung → native sistem AR.
 * Diğer tüm telefonlar (Xiaomi, Huawei, OPPO…) → iPhone benzeri Universal WebAR
 * (tarayıcı kamerası + zemin algılama + gerçek ölçüde sabit halı).
 */
export function resolveArLaunchMode(ua: string, hasUsdz: boolean): ArLaunchMode {
  const profile = parseUserAgent(ua);

  if (profile.primaryExperience === "quick-look" && hasUsdz) {
    return "quick-look";
  }

  // HyperOS varsayılan tarayıcı: Chrome'a göndermek yerine aynı tarayıcıda
  // Universal WebAR açılabilir; Chrome handoff opsiyonel kalır.
  if (shouldBlockNativeAr(ua)) {
    return "universal-webar";
  }

  if (shouldUseSceneViewerIntent(ua) || profile.primaryExperience === "scene-viewer") {
    return "scene-viewer";
  }

  return "universal-webar";
}

export function isNativeArMode(mode: ArLaunchMode): boolean {
  return mode === "quick-look" || mode === "scene-viewer";
}
