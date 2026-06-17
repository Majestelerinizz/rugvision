/**
 * Merchant SKU listesinden embed kodlari uretir.
 *
 * Kullanim:
 *   npm run rugs:embed-codes
 *   npm run rugs:embed-codes -- --base https://rugvision-o54d.vercel.app
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_BASE = "https://rugvision-o54d.vercel.app";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    manifest: path.join(ROOT, "data", "rugs-batch.csv"),
    merchantId: process.env.MERCHANT_ID || "cmqgswc5a000004lanqoxc666",
    base: (process.env.RUGVISION_PUBLIC_BASE || DEFAULT_BASE).replace(/\/$/, ""),
    out: path.join(ROOT, "data", "embed-snippets.html"),
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--manifest" && args[i + 1]) opts.manifest = path.resolve(args[++i]);
    else if (a === "--merchant-id" && args[i + 1]) opts.merchantId = args[++i];
    else if (a === "--base" && args[i + 1]) opts.base = args[++i].replace(/\/$/, "");
    else if (a === "--out" && args[i + 1]) opts.out = path.resolve(args[++i]);
  }
  return opts;
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function snippet(base, merchantId, sku) {
  return `<script
  src="${base}/widget.js"
  data-merchant-id="${merchantId}"
  data-sku="${sku}"
  data-target="[data-rugvision]"
  defer
></script>`;
}

function main() {
  const opts = parseArgs();
  const rows = parseCsv(opts.manifest);
  const lines = [
    "<!-- RugVision embed kodlari - halıcı sitesine urun detayina yapistirilir -->",
    `<!-- Merchant: ${opts.merchantId} -->`,
    "",
  ];

  for (const row of rows) {
    const sku = row.sku?.trim();
    const name = row.name?.trim();
    if (!sku) continue;
    lines.push(`<!-- ${name || sku} -->`);
    lines.push(snippet(opts.base, opts.merchantId, sku));
    lines.push("");
  }

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, lines.join("\n"), "utf8");
  console.log(`[ok] ${rows.length} SKU -> ${opts.out}`);
}

main();
