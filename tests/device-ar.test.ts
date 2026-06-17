import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseUserAgent,
  likelyHasGooglePlayServices,
  prefersMobileWebAr,
  buildSceneViewerHttpsUrl,
  buildSceneViewerIntentUrl,
  buildSceneViewerGenericIntentUrl,
  resolveSceneViewerLaunchUrl,
} from "../lib/device-ar";

describe("device-ar", () => {
  it("detects iPhone Quick Look", () => {
    const p = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
    );
    assert.equal(p.platform, "ios");
    assert.equal(p.primaryExperience, "quick-look");
    assert.equal(p.supportsNativeAr, true);
  });

  it("detects iPad Quick Look", () => {
    const p = parseUserAgent(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
    );
    assert.equal(p.platform, "ios");
    assert.equal(p.primaryExperience, "quick-look");
  });

  it("detects Samsung Android Scene Viewer", () => {
    const p = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A) AppleWebKit/537.36 Chrome/124.0"
    );
    assert.equal(p.platform, "android");
    assert.equal(p.vendor, "samsung");
    assert.equal(p.primaryExperience, "scene-viewer");
    assert.equal(p.likelyHasGms, true);
  });

  it("detects Pixel Scene Viewer", () => {
    const p = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 Chrome/124.0"
    );
    assert.equal(p.vendor, "google");
    assert.equal(p.primaryExperience, "scene-viewer");
  });

  it("Huawei without GMS falls back to 3D preview", () => {
    const p = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 12; HarmonyOS; ELE-L29) AppleWebKit/537.36"
    );
    assert.equal(p.vendor, "huawei");
    assert.equal(p.likelyHasGms, false);
    assert.equal(p.supportsNativeAr, false);
    assert.equal(p.primaryExperience, "preview-3d");
  });

  it("builds Scene Viewer URLs", () => {
    const glb = "https://cdn.example.com/models/RV-LUNA-001.glb";
    const fb = "https://app.example.com/odamda-gor/abc";
    assert.match(buildSceneViewerHttpsUrl(glb), /^https:\/\/arvr\.google\.com\//);
    assert.match(buildSceneViewerIntentUrl(glb, fb), /^intent:\/\//);
    assert.match(buildSceneViewerGenericIntentUrl(glb, fb), /^intent:\/\//);
  });

  it("Redmi/Xiaomi prefers mobile WebXR over Scene Viewer intent", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Build/TKQ1) AppleWebKit/537.36 MiuiBrowser/13.0";
    const p = parseUserAgent(ua);
    assert.equal(p.vendor, "xiaomi");
    assert.equal(p.primaryExperience, "webxr");
    assert.equal(prefersMobileWebAr(ua), true);
  });

  it("Samsung uses generic intent (not direct HTTPS 404)", () => {
    const glb = "https://cdn.example.com/models/RV-LUNA-001.glb";
    const fb = "https://app.example.com/odamda-gor/abc";
    const samsungUa =
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 SamsungBrowser/24.0";
    const url = resolveSceneViewerLaunchUrl(samsungUa, glb, fb);
    assert.match(url, /^intent:\/\//);
    assert.doesNotMatch(url, /^https:\/\/arvr\.google\.com\//);
    assert.equal(url, buildSceneViewerGenericIntentUrl(glb, fb));
  });

  it("likelyHasGooglePlayServices false for Huawei brand", () => {
    assert.equal(likelyHasGooglePlayServices("Huawei P40"), false);
    assert.equal(likelyHasGooglePlayServices("Samsung SM-G991B"), true);
  });
});
