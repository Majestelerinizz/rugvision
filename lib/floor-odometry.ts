/**
 * Görsel Odometri ve Zemin Özellik Takip Motoru (Floor Odometry)
 *
 * Canlı kamera akışındaki ardışık kareler arasındaki piksel akışını (optik akış)
 * analiz ederek telefonun yatay ve dikey yer değiştirmesini (dx, dz) hesaplar.
 * Böylece halı sanal olarak odanın zeminine sabitlenir (odometry anchoring).
 */

export interface TrackPoint {
  x: number;
  y: number;
}

export interface DisplacementResult {
  dx: number;
  dy: number;
}

export interface OdometryStepResult {
  dxMeters: number;
  dzMeters: number;
  trackedCount: number;
  confidence: number; // 0.0 - 1.0
}

/**
 * Bir piksel dizisinin medyanını hesaplayarak aykırı değerleri (gürültüyü) eler.
 */
export function calculateMedianDisplacement(
  displacements: Array<DisplacementResult>
): DisplacementResult {
  if (displacements.length === 0) return { dx: 0, dy: 0 };
  if (displacements.length === 1) return displacements[0];

  const dxs = displacements.map((d) => d.dx).sort((a, b) => a - b);
  const dys = displacements.map((d) => d.dy).sort((a, b) => a - b);

  const mid = Math.floor(dxs.length / 2);
  const medianDx = dxs.length % 2 !== 0 ? dxs[mid] : (dxs[mid - 1] + dxs[mid]) / 2;
  const medianDy = dys.length % 2 !== 0 ? dys[mid] : (dys[mid - 1] + dys[mid]) / 2;

  return {
    dx: Number(medianDx.toFixed(2)),
    dy: Number(medianDy.toFixed(2)),
  };
}

/**
 * 2D piksel kaymasını telefonun eğim açısına (pitch) göre 3D zemin metre hareketine dönüştürür.
 */
export function convertPixelMotionToWorldMotion(
  dxPx: number,
  dyPx: number,
  pitchDeg: number,
  analysisWidth = 160
): { dxM: number; dzM: number } {
  // Kamera yere yakın baktıkça (pitch düşük) piksel daha küçük bir alanı temsil eder.
  // Kamera dik tutuldukça (pitch yüksek) 1 piksel daha geniş bir derinliği kapsar.
  const rad = (Math.max(20, Math.min(80, pitchDeg)) * Math.PI) / 180;
  const sinPitch = Math.sin(rad);

  // Ölçekleme faktörü: 160px genişlik yaklaşık ~1.2 metre zemin genişliğine tekabül eder.
  const metersPerPixelX = 1.2 / analysisWidth;
  const metersPerPixelZ = metersPerPixelX / Math.max(0.25, sinPitch);

  return {
    dxM: Number((dxPx * metersPerPixelX).toFixed(3)),
    dzM: Number((-dyPx * metersPerPixelZ).toFixed(3)),
  };
}

/**
 * Gri tonlamalı görüntüden yüksek kontrastlı köşe/zemin özellik noktalarını seçer.
 */
export function extractFeaturePoints(
  gray: Float32Array,
  width: number,
  height: number,
  maxPoints = 32
): TrackPoint[] {
  const points: TrackPoint[] = [];
  const step = Math.max(8, Math.floor(width / 16));
  const minThreshold = 25;

  // Ekranın alt yarısına odaklan (zemin pikselleri genellikle alt kısımdadır)
  const startY = Math.floor(height * 0.35);
  const endY = height - step;

  for (let y = startY; y < endY; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = y * width + x;
      // Basit yerel kontrast / gradyan hesaplama
      const diffX = Math.abs(gray[idx + 1] - gray[idx - 1]);
      const diffY = Math.abs(gray[idx + width] - gray[idx - width]);
      const cornerStrength = diffX + diffY;

      if (cornerStrength > minThreshold) {
        points.push({ x, y });
        if (points.length >= maxPoints) return points;
      }
    }
  }

  return points;
}

/**
 * İki kare arasında blok eşleme ile özellik noktalarını takip eder.
 */
export function trackFeaturesBlockMatching(
  prevGray: Float32Array,
  currGray: Float32Array,
  points: TrackPoint[],
  width: number,
  height: number,
  searchRadius = 6
): Array<DisplacementResult> {
  const displacements: Array<DisplacementResult> = [];
  const blockSize = 3; // 7x7 pencere

  for (const pt of points) {
    let bestError = Infinity;
    let bestDx = 0;
    let bestDy = 0;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        let error = 0;
        let validPixels = 0;

        for (let by = -blockSize; by <= blockSize; by++) {
          for (let bx = -blockSize; bx <= blockSize; bx++) {
            const prevX = pt.x + bx;
            const prevY = pt.y + by;
            const currX = pt.x + bx + dx;
            const currY = pt.y + by + dy;

            if (
              prevX >= 0 && prevX < width && prevY >= 0 && prevY < height &&
              currX >= 0 && currX < width && currY >= 0 && currY < height
            ) {
              const prevVal = prevGray[prevY * width + prevX];
              const currVal = currGray[currY * width + currX];
              error += Math.abs(prevVal - currVal);
              validPixels++;
            }
          }
        }

        if (validPixels > 0 && error < bestError) {
          bestError = error;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }

    if (bestError < 800) {
      displacements.push({ dx: bestDx, dy: bestDy });
    }
  }

  return displacements;
}

/**
 * Canlı video akışından çalışan zemin takip yöneticisi
 */
export class FloorOdometryTracker {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private width: number;
  private height: number;
  private prevGray: Float32Array | null = null;
  private featurePoints: TrackPoint[] = [];
  private frameCount = 0;

  constructor(width = 160, height = 120) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  /**
   * Video karesini işler ve dünya koordinatındaki yer değiştirmeyi döndürür.
   */
  processFrame(video: HTMLVideoElement, pitchDeg: number): OdometryStepResult {
    if (!this.ctx || video.readyState < 2) {
      return { dxMeters: 0, dzMeters: 0, trackedCount: 0, confidence: 0 };
    }

    this.ctx.drawImage(video, 0, 0, this.width, this.height);
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    // 1. Grayscale tamponu oluştur
    const currGray = new Float32Array(this.width * this.height);
    for (let i = 0; i < data.length; i += 4) {
      currGray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    this.frameCount++;

    // Her 15 karede bir veya takip noktası azaldığında yeni özellik noktaları seç
    if (this.frameCount % 15 === 0 || this.featurePoints.length < 8) {
      this.featurePoints = extractFeaturePoints(currGray, this.width, this.height, 28);
    }

    if (!this.prevGray || this.featurePoints.length === 0) {
      this.prevGray = currGray;
      return { dxMeters: 0, dzMeters: 0, trackedCount: this.featurePoints.length, confidence: 0.5 };
    }

    // 2. Blok eşleme ile optik akış hesapla
    const displacements = trackFeaturesBlockMatching(
      this.prevGray,
      currGray,
      this.featurePoints,
      this.width,
      this.height,
      6
    );

    this.prevGray = currGray;

    if (displacements.length < 4) {
      return { dxMeters: 0, dzMeters: 0, trackedCount: displacements.length, confidence: 0.2 };
    }

    // 3. Medyan filtre ile aykırı değerleri temizle
    const median = calculateMedianDisplacement(displacements);

    // 4. Piksel hareketini dünya metre hareketine dönüştür
    const worldMotion = convertPixelMotionToWorldMotion(median.dx, median.dy, pitchDeg, this.width);

    const confidence = Math.min(1.0, displacements.length / 20);

    return {
      dxMeters: worldMotion.dxM,
      dzMeters: worldMotion.dzM,
      trackedCount: displacements.length,
      confidence,
    };
  }

  reset() {
    this.prevGray = null;
    this.featurePoints = [];
    this.frameCount = 0;
  }
}
