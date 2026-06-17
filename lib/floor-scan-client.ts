import { sampleBottomRegionStats } from "@/lib/ai-detection";

export type FloorScanContext = {
  platform: string;
  vendor: string | null;
  hasGyroscope: boolean;
  screenWidth?: number;
  screenHeight?: number;
  imageBottomLuma?: number;
  imageBottomVariance?: number;
  portrait?: boolean;
  aspectRatio?: number;
};

function buildScanContext(vendor: string | null): FloorScanContext {
  const sw = typeof window !== "undefined" ? window.screen?.width : undefined;
  const sh = typeof window !== "undefined" ? window.screen?.height : undefined;
  return {
    platform: typeof navigator !== "undefined" ? navigator.userAgent : "",
    vendor,
    hasGyroscope:
      typeof window !== "undefined" && "DeviceOrientationEvent" in window,
    screenWidth: sw,
    screenHeight: sh,
    portrait: sw !== undefined && sh !== undefined ? sh > sw : undefined,
    aspectRatio: sw && sh ? Number((sw / sh).toFixed(3)) : undefined,
  };
}

/** AR oncesi kisa kamera karesi ile alt bolge (zemin) heuristikleri. */
export async function captureFloorFromCamera(
  timeoutMs = 800
): Promise<{ luma: number; variance: number } | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stream: MediaStream | null = null;
  try {
    stream = await Promise.race([
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 320 },
          height: { ideal: 240 },
        },
        audio: false,
      }),
      new Promise<MediaStream>((_, reject) =>
        setTimeout(() => reject(new Error("camera_timeout")), timeoutMs)
      ),
    ]);

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();

    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }
      video.onloadeddata = () => resolve();
      setTimeout(resolve, 200);
    });

    const w = video.videoWidth || 320;
    const h = video.videoHeight || 240;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h).data;
    return sampleBottomRegionStats(pixels, w, h);
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }
}

async function postScan(
  apiBase: string,
  merchantId: string,
  rugId: string,
  scanType: "FLOOR_DETECTION" | "ROOM_DETECTION",
  context: FloorScanContext
) {
  const url = `${apiBase.replace(/\/$/, "")}/api/v1/ai/scans`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId, rugId, scanType, context }),
    keepalive: true,
  }).catch(() => {});
}

/** AR baslatmadan once zemin + oda taramasini kaydet (kamera opsiyonel). */
export async function runPreArFloorScans(options: {
  apiBase?: string;
  merchantId: string;
  rugId: string;
  vendor: string | null;
  maxWaitMs?: number;
}) {
  const { apiBase = "", merchantId, rugId, vendor, maxWaitMs = 750 } = options;
  const context = buildScanContext(vendor);

  const stats = await Promise.race([
    captureFloorFromCamera(maxWaitMs),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), maxWaitMs)),
  ]);

  if (stats) {
    context.imageBottomLuma = Number(stats.luma.toFixed(2));
    context.imageBottomVariance = Number(stats.variance.toFixed(2));
  }

  await Promise.all([
    postScan(apiBase, merchantId, rugId, "FLOOR_DETECTION", context),
    postScan(apiBase, merchantId, rugId, "ROOM_DETECTION", context),
  ]);
}
