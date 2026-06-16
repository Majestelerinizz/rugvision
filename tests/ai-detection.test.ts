import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectFloorPlane,
  detectRoomContext,
  sampleBottomRegionStats,
} from "../lib/ai-detection";

describe("ai-detection", () => {
  it("detectFloorPlane boosts mobile platform score", () => {
    const r = detectFloorPlane({ platform: "iPhone", hasGyroscope: true });
    assert.equal(r.detected, true);
    assert.ok(r.confidence >= 0.55);
  });

  it("detectRoomContext uses portrait hint", () => {
    const r = detectRoomContext({ portrait: true, aspectRatio: 0.56, platform: "android" });
    assert.equal(r.detected, true);
  });

  it("sampleBottomRegionStats returns luma and variance", () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 200;
      pixels[i + 1] = 200;
      pixels[i + 2] = 200;
      pixels[i + 3] = 255;
    }
    const s = sampleBottomRegionStats(pixels, 4, 4);
    assert.ok(s.luma > 0);
    assert.ok(s.variance >= 0);
  });
});
