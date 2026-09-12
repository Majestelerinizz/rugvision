import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateFloorPitch,
  calculateFloorRoll,
  applyLowPassFilter,
  buildRugCssTransform,
} from "../lib/sensor-fusion";

test("calculateFloorPitch: telefon yere dik tutulduğunda yüksek açı üretir", () => {
  const pitchVertical = calculateFloorPitch(85);
  assert.ok(pitchVertical >= 75 && pitchVertical <= 80, `Beklenen ~78, gelen: ${pitchVertical}`);
});

test("calculateFloorPitch: telefon yere doğru eğildiğinde perspektif azalır", () => {
  const pitchAngled = calculateFloorPitch(50);
  const pitchHorizontal = calculateFloorPitch(15);
  
  assert.ok(pitchAngled < 75);
  assert.ok(pitchHorizontal <= 25);
  assert.ok(pitchAngled > pitchHorizontal);
});

test("calculateFloorRoll: ufuk çizgisi için ters açı üretir ve sınırlar", () => {
  assert.equal(calculateFloorRoll(15), -15);
  assert.equal(calculateFloorRoll(-20), 20);
  // 35 dereceden fazlasını sınırla
  assert.equal(calculateFloorRoll(60), -35);
  assert.equal(calculateFloorRoll(-60), 35);
});

test("applyLowPassFilter: ani sıçramaları yumuşatır", () => {
  const current = 50;
  const target = 100;
  const smoothed = applyLowPassFilter(current, target, 0.2);
  
  // 50 + (100 - 50) * 0.2 = 60
  assert.equal(smoothed, 60);
});

test("buildRugCssTransform: geçerli bir transform dizesi üretir", () => {
  const transform = buildRugCssTransform({
    offsetX: 10,
    offsetY: 20,
    scale: 1.2,
    pitchDeg: 55.4,
    rollDeg: -5.2,
    userRotationDeg: 45,
  });

  assert.ok(transform.includes("translate(calc(-50% + 10px), 20px)"));
  assert.ok(transform.includes("scale(1.20)"));
  assert.ok(transform.includes("rotateX(55.4deg)"));
  assert.ok(transform.includes("rotateZ(39.8deg)")); // -5.2 + 45 = 39.8
});
