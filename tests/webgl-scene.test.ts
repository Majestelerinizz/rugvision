import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCameraRotation,
  calculateRugMeshDimensions,
  raycastFloorIntersection,
} from "../lib/webgl-floor-scene";

test("calculateCameraRotation: pitch ve roll açılarını doğru radyana çevirir", () => {
  const { pitchRad, rollRad } = calculateCameraRotation(60, 10);

  // 60 derece ~ 1.047 radyan (negatif kamera bakışı)
  assert.ok(pitchRad < -1.0 && pitchRad > -1.1);
  // 10 derece ~ 0.174 radyan
  assert.ok(rollRad > 0.15 && rollRad < 0.20);
});

test("calculateCameraRotation: uç açıları güvenli aralıklara sınırlar", () => {
  const extremeLow = calculateCameraRotation(0, -90);
  const extremeHigh = calculateCameraRotation(120, 90);

  // Minimum pitch 10 derece (~ -0.174 rad)
  assert.ok(extremeLow.pitchRad <= -0.17);
  // Maksimum pitch 85 derece (~ -1.48 rad)
  assert.ok(extremeHigh.pitchRad >= -1.49);
  // Roll sınırları [-45, 45] derece (~ [-0.785, 0.785] rad)
  assert.ok(extremeLow.rollRad >= -0.79);
  assert.ok(extremeHigh.rollRad <= 0.79);
});

test("calculateRugMeshDimensions: santimetreyi Three.js metre birimine dönüştürür", () => {
  const dim = calculateRugMeshDimensions(160, 230);
  assert.equal(dim.widthM, 1.6);
  assert.equal(dim.lengthM, 2.3);

  const fallback = calculateRugMeshDimensions(0, -5);
  assert.equal(fallback.widthM, 1.6);
  assert.equal(fallback.lengthM, 2.3);
});

test("raycastFloorIntersection: ekran altından zemin düzlemi kesişimi bulur", () => {
  // Kamera 1.3m yüksekte, 55 derece aşağı eğik
  const pitchRad = -55 * (Math.PI / 180);
  const cameraY = 1.3;

  // Ekranın tam alt-orta noktası (ndcX = 0, ndcY = -0.6)
  const hit = raycastFloorIntersection(0, -0.6, cameraY, pitchRad);

  assert.ok(hit !== null, "Kesişim bulunmalı");
  assert.equal(hit?.x, 0, "X ekseninde merkezde olmalı");
  assert.ok(hit!.z < 0, "Kamera önünde (negatif Z) olmalı");
});
