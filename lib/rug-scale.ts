export type RugSize = {
  label: string;
  widthCm: number;
  lengthCm: number;
};

/** Türkiye'de yaygın halı ölçüleri (cm). */
export const RUG_SIZE_PRESETS: RugSize[] = [
  { label: "80×150", widthCm: 80, lengthCm: 150 },
  { label: "80×300", widthCm: 80, lengthCm: 300 },
  { label: "120×180", widthCm: 120, lengthCm: 180 },
  { label: "160×230", widthCm: 160, lengthCm: 230 },
  { label: "200×300", widthCm: 200, lengthCm: 300 },
];

export function formatRugSize(widthCm: number, lengthCm: number): string {
  return `${widthCm}×${lengthCm}`;
}

export function isSameRugSize(
  a: Pick<RugSize, "widthCm" | "lengthCm">,
  b: Pick<RugSize, "widthCm" | "lengthCm">
): boolean {
  return a.widthCm === b.widthCm && a.lengthCm === b.lengthCm;
}

/**
 * model-viewer `scale` niteliği (X Y Z çarpanı).
 * Pipeline: Blender X = uzunluk, Y-up export sonrası Z ≈ genişlik.
 * Kalınlık (Y) değişmez.
 */
export function modelViewerScale(
  originalWidthCm: number,
  originalLengthCm: number,
  selectedWidthCm: number,
  selectedLengthCm: number
): string {
  const sx =
    originalWidthCm > 0 ? selectedWidthCm / originalWidthCm : 1;
  const sz =
    originalLengthCm > 0 ? selectedLengthCm / originalLengthCm : 1;
  const safeX = Number.isFinite(sx) && sx > 0 ? sx : 1;
  const safeZ = Number.isFinite(sz) && sz > 0 ? sz : 1;
  return `${safeX.toFixed(4)} 1 ${safeZ.toFixed(4)}`;
}
