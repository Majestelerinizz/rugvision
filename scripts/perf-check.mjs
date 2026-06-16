#!/usr/bin/env node
/**
 * RugVision performans kontrolu (production veya local).
 *
 * Kullanim:
 *   npm run perf:check
 *   npm run perf:check -- --base https://rugvision-o54d.vercel.app
 *   npm run perf:check -- --merchant-id xxx --sku RV-LUNA-001
 */

const DEFAULT_BASE = "https://rugvision-o54d.vercel.app";
const DEFAULT_MERCHANT = "cmqgswc5a000004lanqoxc666";
const DEFAULT_SKU = "RV-LUNA-001";
const R2_GLB =
  "https://pub-692fed61add14fdca565fa5967c47df1.r2.dev/models/RV-LUNA-001.glb";
const R2_USDZ =
  "https://pub-692fed61add14fdca565fa5967c47df1.r2.dev/models/RV-LUNA-001.usdz";

const THRESHOLDS_MS = {
  widgetJs: 400,
  widgetApiWarm: 350,
  widgetApiCold: 900,
  r2Glb: 250,
  r2Usdz: 250,
  widgetJsMaxBytes: 14_000,
  glbMaxBytes: 2_200_000,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    base: DEFAULT_BASE,
    merchantId: DEFAULT_MERCHANT,
    sku: DEFAULT_SKU,
    runs: 3,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--base" && args[i + 1]) opts.base = args[++i].replace(/\/$/, "");
    else if (a === "--merchant-id" && args[i + 1]) opts.merchantId = args[++i];
    else if (a === "--sku" && args[i + 1]) opts.sku = args[++i];
    else if (a === "--runs" && args[i + 1]) opts.runs = Number(args[++i]) || 3;
  }
  return opts;
}

async function timedFetch(url, init = {}) {
  const start = performance.now();
  const res = await fetch(url, { ...init, redirect: "follow" });
  const ms = Math.round(performance.now() - start);
  const len = res.headers.get("content-length");
  const cache = res.headers.get("cache-control") || "";
  return {
    url,
    ok: res.ok,
    status: res.status,
    ms,
    bytes: len ? Number(len) : null,
    cache,
  };
}

async function medianMs(url, runs, init) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const r = await timedFetch(url, init);
    if (!r.ok) return r;
    samples.push(r.ms);
  }
  samples.sort((a, b) => a - b);
  const mid = samples[Math.floor(samples.length / 2)];
  const last = await timedFetch(url, init);
  return { ...last, ms: mid, samples };
}

function pass(label, ok, detail) {
  const mark = ok ? "[PASS]" : "[FAIL]";
  console.log(`${mark} ${label}: ${detail}`);
  return ok;
}

async function main() {
  const opts = parseArgs();
  console.log(`RugVision perf check -> ${opts.base}`);
  console.log(`Runs (median): ${opts.runs}\n`);

  let allOk = true;

  const widgetJsUrl = `${opts.base}/widget.js`;
  const widgetJs = await timedFetch(widgetJsUrl);
  const widgetJsBody = widgetJs.ok ? await (await fetch(widgetJsUrl)).text() : "";
  const widgetJsBytes = widgetJsBody ? Buffer.byteLength(widgetJsBody, "utf8") : widgetJs.bytes;

  allOk =
    pass(
      "widget.js latency",
      widgetJs.ok && widgetJs.ms <= THRESHOLDS_MS.widgetJs,
      `${widgetJs.ms}ms (hedef <= ${THRESHOLDS_MS.widgetJs}ms), cache=${widgetJs.cache || "-"}`
    ) && allOk;

  allOk =
    pass(
      "widget.js size",
      widgetJsBytes != null && widgetJsBytes <= THRESHOLDS_MS.widgetJsMaxBytes,
      `${widgetJsBytes} B (hedef <= ${THRESHOLDS_MS.widgetJsMaxBytes} B)`
    ) && allOk;

  const widgetApiUrl =
    `${opts.base}/api/v1/widget/rug?merchantId=${encodeURIComponent(opts.merchantId)}&sku=${encodeURIComponent(opts.sku)}`;
  const widgetApiCold = await timedFetch(widgetApiUrl);
  const widgetApiWarm = await medianMs(widgetApiUrl, opts.runs);

  allOk =
    pass(
      "widget API (cold)",
      widgetApiCold.ok && widgetApiCold.ms <= THRESHOLDS_MS.widgetApiCold,
      `${widgetApiCold.ms}ms (hedef <= ${THRESHOLDS_MS.widgetApiCold}ms), cache=${widgetApiCold.cache || "-"}`
    ) && allOk;

  allOk =
    pass(
      "widget API (warm median)",
      widgetApiWarm.ok && widgetApiWarm.ms <= THRESHOLDS_MS.widgetApiWarm,
      `${widgetApiWarm.ms}ms (hedef <= ${THRESHOLDS_MS.widgetApiWarm}ms), cache=${widgetApiWarm.cache || "-"}`
    ) && allOk;

  const glbHead = await timedFetch(R2_GLB, { method: "HEAD" });
  allOk =
    pass(
      "R2 GLB TTFB",
      glbHead.ok && glbHead.ms <= THRESHOLDS_MS.r2Glb,
      `${glbHead.ms}ms (hedef <= ${THRESHOLDS_MS.r2Glb}ms), size=${glbHead.bytes} B`
    ) && allOk;

  allOk =
    pass(
      "R2 GLB size",
      glbHead.bytes != null && glbHead.bytes <= THRESHOLDS_MS.glbMaxBytes,
      `${glbHead.bytes} B (hedef <= ${THRESHOLDS_MS.glbMaxBytes} B)`
    ) && allOk;

  const usdzHead = await timedFetch(R2_USDZ, { method: "HEAD" });
  allOk =
    pass(
      "R2 USDZ TTFB",
      usdzHead.ok && usdzHead.ms <= THRESHOLDS_MS.r2Usdz,
      `${usdzHead.ms}ms (hedef <= ${THRESHOLDS_MS.r2Usdz}ms), size=${usdzHead.bytes} B`
    ) && allOk;

  if (!glbHead.cache && !usdzHead.cache) {
    console.log(
      "\n[NOTE] R2 objelerinde Cache-Control yok. Bir kez calistir:\n" +
        "  npm run models:upload-r2 -- --force\n" +
        "(mevcut dosyalara immutable cache header yazar)"
    );
  }

  console.log(`\nSonuc: ${allOk ? "PERFORMANS OK" : "IYILESTIRME GEREKLI"}`);
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
