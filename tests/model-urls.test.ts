import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildIosSrc, buildViewerGlbSrc } from "../lib/model-urls";

describe("model-urls", () => {
  it("proxies R2 GLB through same-origin API", () => {
    const url =
      "https://pub-abc123.r2.dev/models/RV-ARYA-003.glb";
    assert.equal(buildViewerGlbSrc(url), "/api/v1/ar/glb/RV-ARYA-003.glb");
  });

  it("proxies R2 GLB to USDZ API for iOS Quick Look", () => {
    const url =
      "https://pub-abc123.r2.dev/models/RV-ARYA-003.glb";
    assert.equal(buildIosSrc(url), "/api/v1/ar/usdz/RV-ARYA-003.usdz");
  });

  it("proxies local /models/ GLB paths", () => {
    assert.equal(
      buildViewerGlbSrc("/models/RV-LUNA-001.glb"),
      "/api/v1/ar/glb/RV-LUNA-001.glb"
    );
    assert.equal(
      buildIosSrc("/models/RV-LUNA-001.glb"),
      "/api/v1/ar/usdz/RV-LUNA-001.usdz"
    );
  });
});
