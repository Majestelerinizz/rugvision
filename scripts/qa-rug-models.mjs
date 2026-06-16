#!/usr/bin/env node
/**
 * Manifest'teki SKU'lar icin model QA raporu (100+ olcek destekli).
 *
 *   npm run models:qa
 *   npm run models:qa -- --manifest data/rugs-batch-100.csv
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "reports");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    manifest: path.join(ROOT, "data", "rugs-batch.csv"),
    modelsDir: path.join(ROOT, "public", "models"),
    minGlbBytes: 1024,
    minUsdzBytes: 512,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--manifest" && args[i + 1])
      opts.manifest = path.resolve(ROOT, args[++i]);
    else if (args[i] === "--models-dir" && args[i + 1])
      opts.modelsDir = path.resolve(ROOT, args[++i]);
  }
  return opts;
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols[0]?.startsWith("#")) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function sizeOf(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

function main() {
  const opts = parseArgs();
  if (!fs.existsSync(opts.manifest)) {
    console.error(`Manifest yok: ${opts.manifest}`);
    process.exit(1);
  }

  const rows = parseCsv(opts.manifest);
  const results = [];
  let pass = 0;
  let fail = 0;
  let skip = 0;

  for (const row of rows) {
    const sku = row.sku?.trim();
    if (!sku) continue;

    const photo = row.image ? path.join(ROOT, row.image) : null;
    const glb = path.join(opts.modelsDir, `${sku}.glb`);
    const usdz = path.join(opts.modelsDir, `${sku}.usdz`);
    const glbBytes = sizeOf(glb);
    const usdzBytes = sizeOf(usdz);
    const photoOk = photo ? fs.existsSync(photo) : false;

    const issues = [];
    if (!photoOk) issues.push("photo_missing");
    if (glbBytes < opts.minGlbBytes) issues.push("glb_missing_or_small");
    if (usdzBytes < opts.minUsdzBytes) issues.push("usdz_missing_or_small");
    if (!row.width_cm || !row.length_cm) issues.push("dimensions_missing");

    const status = issues.length ? "FAIL" : "PASS";
    if (status === "PASS") pass++;
    else fail++;

    results.push({
      sku,
      name: row.name || "",
      widthCm: row.width_cm || "",
      lengthCm: row.length_cm || "",
      photoOk,
      glbBytes,
      usdzBytes,
      status,
      issues: issues.join("|"),
    });
  }

  if (!results.length) {
    console.error("Manifest'te islenecek SKU yok.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `qa-rugs-${results.length}-sku-${stamp}`;

  const jsonPath = path.join(OUT_DIR, `${base}.json`);
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), summary: { pass, fail, skip, total: results.length }, items: results }, null, 2),
    "utf8"
  );

  const csvHeader = "sku,name,width_cm,length_cm,photo_ok,glb_bytes,usdz_bytes,status,issues";
  const csvRows = results.map((r) =>
    [r.sku, `"${r.name.replace(/"/g, '""')}"`, r.widthCm, r.lengthCm, r.photoOk, r.glbBytes, r.usdzBytes, r.status, r.issues].join(",")
  );
  const csvPath = path.join(OUT_DIR, `${base}.csv`);
  fs.writeFileSync(csvPath, `${csvHeader}\n${csvRows.join("\n")}\n`, "utf8");

  console.log(`Manifest: ${opts.manifest}`);
  console.log(`QA: ${pass} PASS, ${fail} FAIL, ${results.length} toplam`);
  console.log(`[ok] ${jsonPath}`);
  console.log(`[ok] ${csvPath}`);
  if (fail > 0) process.exit(1);
}

main();
