import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveArLaunchMode, isNativeArMode } from "../lib/universal-ar";

describe("universal-ar", () => {
  it("iPhone uses Quick Look when USDZ exists", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
    assert.equal(resolveArLaunchMode(ua, true), "quick-look");
    assert.equal(isNativeArMode("quick-look"), true);
  });

  it("Samsung uses Scene Viewer", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A) AppleWebKit/537.36 Chrome/124.0";
    assert.equal(resolveArLaunchMode(ua, true), "scene-viewer");
  });

  it("Xiaomi Chrome uses Universal WebAR (iPhone-like)", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Redmi Note 12 Build/TKQ1) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36";
    assert.equal(resolveArLaunchMode(ua, true), "universal-webar");
  });

  it("Huawei without GMS uses Universal WebAR", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 12; HarmonyOS; ELE-L29) AppleWebKit/537.36";
    assert.equal(resolveArLaunchMode(ua, false), "universal-webar");
  });

  it("HyperOS MiuiBrowser uses Universal WebAR in-place", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; 2312DRAABC Build/UP1A) AppleWebKit/537.36 XiaoMi/MiuiBrowser/20.0";
    assert.equal(resolveArLaunchMode(ua, true), "universal-webar");
  });
});
