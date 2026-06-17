import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEVICE_MATRIX,
  evaluateDeviceMatrix,
  evaluateDeviceEntry,
  resolveWidgetArAction,
} from "../lib/device-matrix";

describe("device-matrix", () => {
  it("has at least 15 device/browser combinations", () => {
    assert.ok(DEVICE_MATRIX.length >= 15);
  });

  it("all matrix entries pass UA routing expectations", () => {
    const summary = evaluateDeviceMatrix();
    if (!summary.allPass) {
      const details = summary.results
        .filter((r) => !r.pass)
        .map((r) => `${r.entry.id}: ${r.failures.join("; ")}`)
        .join("\n");
      assert.fail(`${summary.failed}/${summary.total} failed:\n${details}`);
    }
    assert.equal(summary.passed, summary.total);
  });

  it("iPhone 12 routes to Quick Look", () => {
    const entry = DEVICE_MATRIX.find((e) => e.id === "iphone-12-safari");
    assert.ok(entry);
    const r = evaluateDeviceEntry(entry!);
    assert.equal(r.pass, true);
    assert.equal(r.actualWidgetAction, "quick-look");
  });

  it("Samsung S23 routes to Scene Viewer", () => {
    const entry = DEVICE_MATRIX.find((e) => e.id === "galaxy-s23-ultra-chrome");
    assert.ok(entry);
    const r = evaluateDeviceEntry(entry!);
    assert.equal(r.pass, true);
    assert.equal(r.usesSceneViewerIntent, true);
  });

  it("Huawei HarmonyOS has no native AR", () => {
    const entry = DEVICE_MATRIX.find((e) => e.id === "huawei-p40-harmony");
    assert.ok(entry);
    const r = evaluateDeviceEntry(entry!);
    assert.equal(r.pass, true);
    assert.equal(r.actualSupportsNativeAr, false);
  });

  it("desktop opens 3D modal not mobile AR", () => {
    const ua = DEVICE_MATRIX.find((e) => e.id === "desktop-windows-chrome")!.userAgent;
    assert.equal(resolveWidgetArAction(ua), "modal-3d");
  });
});
