import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMedianDisplacement,
  convertPixelMotionToWorldMotion,
  extractFeaturePoints,
  trackFeaturesBlockMatching,
} from "../lib/floor-odometry";

test("calculateMedianDisplacement: aykırı değerleri (outliers) başarıyla eler", () => {
  const samples = [
    { dx: 2, dy: 1 },
    { dx: 2, dy: 1 },
    { dx: 3, dy: 2 },
    { dx: 2, dy: 1 },
    { dx: 100, dy: -50 }, // Bariz gürültü/outlier
  ];

  const median = calculateMedianDisplacement(samples);
  assert.equal(median.dx, 2);
  assert.equal(median.dy, 1);
});

test("convertPixelMotionToWorldMotion: piksel kaymasını metreye ölçekler", () => {
  const motion = convertPixelMotionToWorldMotion(10, -5, 55, 160);

  // 10 piksel sağa hareket -> pozitif dxM
  assert.ok(motion.dxM > 0);
  // -5 piksel yukarı hareket -> pozitif dzM (ileriye doğru)
  assert.ok(motion.dzM > 0);
});

test("extractFeaturePoints: kontrastlı zemin noktalarını yakalar", () => {
  const w = 40;
  const h = 40;
  const buffer = new Float32Array(w * h);

  // Zemin bölgesine belirgin kontrast desenleri koy
  for (let y = 15; y < 35; y++) {
    for (let x = 10; x < 30; x++) {
      buffer[y * w + x] = (x % 4 === 0 || y % 4 === 0) ? 200 : 20;
    }
  }

  const points = extractFeaturePoints(buffer, w, h, 10);
  assert.ok(points.length > 0, "En az birkaç özellik noktası bulunmalı");
  assert.ok(points.every((p) => p.y >= Math.floor(h * 0.35)), "Noktalar alt/zemin bölgesinde olmalı");
});

test("trackFeaturesBlockMatching: ötelenmiş desenin kayma miktarını bulur", () => {
  const w = 30;
  const h = 30;
  const prev = new Float32Array(w * h);
  const curr = new Float32Array(w * h);

  // Prev içine bir köşe deseni koy (15, 15)
  prev[15 * w + 15] = 255;
  prev[15 * w + 16] = 255;

  // Curr içine 2 piksel sağa, 1 piksel aşağı ötelenmiş olarak koy (17, 16)
  curr[16 * w + 17] = 255;
  curr[16 * w + 18] = 255;

  const points = [{ x: 15, y: 15 }];
  const displacements = trackFeaturesBlockMatching(prev, curr, points, w, h, 4);

  assert.equal(displacements.length, 1);
  assert.equal(displacements[0].dx, 2);
  assert.equal(displacements[0].dy, 1);
});
