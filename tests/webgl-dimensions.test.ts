import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDimensionScaleRatio,
  createGizmoCornerVertices,
  calculateRugMeshDimensions,
} from "../lib/webgl-floor-scene";

test("calculateDimensionScaleRatio: iki ölçü arasındaki oransal değişimi doğru hesaplar", () => {
  // 160x230 -> 80x150
  const ratio = calculateDimensionScaleRatio(160, 230, 80, 150);
  assert.equal(ratio.scaleX, 0.5); // 80 / 160 = 0.5
  assert.equal(ratio.scaleZ, Number((150 / 230).toFixed(4)));

  // Büyüme: 160x230 -> 200x300
  const grow = calculateDimensionScaleRatio(160, 230, 200, 300);
  assert.ok(grow.scaleX > 1);
  assert.ok(grow.scaleZ > 1);
});

test("calculateDimensionScaleRatio: sıfır ve geçersiz değerlerde varsayılanları kullanır", () => {
  const fallback = calculateDimensionScaleRatio(0, 0, 160, 230);
  assert.equal(fallback.scaleX, 1);
  assert.equal(fallback.scaleZ, 1);
});

test("createGizmoCornerVertices: 4 köşe L-çizgileri için 48 elemanlı vertex tamponu üretir", () => {
  const vertices = createGizmoCornerVertices(1.6, 2.3, 0.15);

  // 4 köşe * 2 çizgi * 2 nokta * 3 koordinat (x,y,z) = 48 eleman
  assert.equal(vertices.length, 48);

  // Zemin üstü Y koordinatı (~0.007m) pozitif olmalı
  for (let i = 1; i < vertices.length; i += 3) {
    assert.ok(Math.abs(vertices[i] - 0.007) < 1e-4);
  }

  // Köşe sınırları 1.6m genişlik (hw=0.8) ve 2.3m uzunluk (hl=1.15) içinde kalmalı
  for (let i = 0; i < vertices.length; i += 3) {
    assert.ok(Math.abs(vertices[i]) <= 0.81, `X sınırı aşıldı: ${vertices[i]}`);
    assert.ok(Math.abs(vertices[i + 2]) <= 1.16, `Z sınırı aşıldı: ${vertices[i + 2]}`);
  }
});

test("calculateRugMeshDimensions: geçerli metre ebatları döner", () => {
  const dim = calculateRugMeshDimensions(200, 300);
  assert.equal(dim.widthM, 2.0);
  assert.equal(dim.lengthM, 3.0);
});
