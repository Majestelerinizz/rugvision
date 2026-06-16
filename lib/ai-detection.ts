export type FloorDetectionInput = {
  platform?: string;
  hasGyroscope?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  imageBottomLuma?: number;
  imageBottomVariance?: number;
};

export type RoomDetectionInput = {
  platform?: string;
  aspectRatio?: number;
  portrait?: boolean;
};

export type DetectionResult = {
  detected: boolean;
  confidence: number;
  method: string;
  hints: string[];
  metadata: Record<string, unknown>;
};

/** v1: cihaz + goruntu heuristikleri (tam ML degil, AR on-hazirlik sinyali). */
export function detectFloorPlane(input: FloorDetectionInput): DetectionResult {
  const hints: string[] = [];
  let score = 0.35;

  const platform = (input.platform || "").toLowerCase();
  if (/iphone|ipad|android/.test(platform)) {
    score += 0.25;
    hints.push("mobil_ar_platform");
  }
  if (input.hasGyroscope) {
    score += 0.15;
    hints.push("gyroscope");
  }
  if (input.imageBottomVariance !== undefined && input.imageBottomVariance < 1200) {
    score += 0.2;
    hints.push("uniform_floor_region");
  }
  if (input.imageBottomLuma !== undefined && input.imageBottomLuma > 80) {
    score += 0.1;
    hints.push("bright_floor_tone");
  }

  const confidence = Math.min(0.98, Math.max(0.1, score));
  return {
    detected: confidence >= 0.55,
    confidence: Number(confidence.toFixed(3)),
    method: "heuristic_v1",
    hints,
    metadata: { ...input },
  };
}

export function detectRoomContext(input: RoomDetectionInput): DetectionResult {
  const hints: string[] = [];
  let score = 0.3;

  if (input.portrait) {
    score += 0.2;
    hints.push("portrait_capture");
  }
  if (input.aspectRatio && input.aspectRatio >= 0.45 && input.aspectRatio <= 0.85) {
    score += 0.25;
    hints.push("phone_room_aspect");
  }
  const platform = (input.platform || "").toLowerCase();
  if (platform) {
    score += 0.15;
    hints.push("platform_known");
  }

  const confidence = Math.min(0.95, Math.max(0.1, score));
  return {
    detected: confidence >= 0.5,
    confidence: Number(confidence.toFixed(3)),
    method: "heuristic_v1",
    hints,
    metadata: { ...input },
  };
}

/** RGB piksel dizisinden alt bolge istatistigi (opsiyonel kamera onizleme). */
export function sampleBottomRegionStats(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): { luma: number; variance: number } {
  const yStart = Math.floor(height * 0.72);
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = yStart; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luma = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      sum += luma;
      sumSq += luma * luma;
      n++;
    }
  }
  if (!n) return { luma: 0, variance: 0 };
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return { luma: mean, variance: Math.max(0, variance) };
}
