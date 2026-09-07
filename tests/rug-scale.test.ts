import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatRugSize,
  isSameRugSize,
  modelViewerScale,
  RUG_SIZE_PRESETS,
} from "../lib/rug-scale";

describe("rug-scale", () => {
  it("formats sizes with multiplication sign", () => {
    assert.equal(formatRugSize(160, 230), "160×230");
  });

  it("compares sizes by centimetres", () => {
    assert.equal(
      isSameRugSize({ widthCm: 160, lengthCm: 230 }, { widthCm: 160, lengthCm: 230 }),
      true
    );
    assert.equal(
      isSameRugSize({ widthCm: 160, lengthCm: 230 }, { widthCm: 80, lengthCm: 150 }),
      false
    );
  });

  it("returns identity scale for the original size", () => {
    assert.equal(modelViewerScale(160, 230, 160, 230), "1.0000 1 1.0000");
  });

  it("scales independently on width and length", () => {
    assert.equal(modelViewerScale(160, 230, 80, 150), "0.5000 1 0.6522");
  });

  it("guards against zero or invalid originals", () => {
    assert.equal(modelViewerScale(0, 230, 80, 150), "1.0000 1 0.6522");
    assert.equal(modelViewerScale(160, 0, 80, 150), "0.5000 1 1.0000");
  });

  it("includes common Turkish rug presets", () => {
    const labels = RUG_SIZE_PRESETS.map((p) => p.label);
    assert.ok(labels.includes("160×230"));
    assert.ok(labels.includes("80×150"));
  });
});
