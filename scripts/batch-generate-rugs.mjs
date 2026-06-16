#!/usr/bin/env node
/**
 * CSV manifest'ten toplu halı modeli üretir (Blender headless).
 *
 * Kullanım:
 *   npm run models:batch
 *   npm run models:batch -- --manifest data/rugs-batch.csv --force
 *   npm run models:one -- --sku RV-LUNA-001
 *
 * Env:
 *   BLENDER_PATH  — blender.exe tam yolu (yoksa otomatik aranır)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    manifest: path.join(ROOT, "data", "rugs-batch.csv"),
    outDir: path.join(ROOT, "public", "models"),
    force: false,
    sku: null,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--manifest" && args[i + 1]) opts.manifest = path.resolve(ROOT, args[++i]);
    else if (a === "--out-dir" && args[i + 1]) opts.outDir = path.resolve(ROOT, args[++i]);
    else if (a === "--force") opts.force = true;
    else if (a === "--sku" && args[i + 1]) opts.sku = args[++i];
    else if (a === "--one") opts.sku = opts.sku; // alias with --sku
  }
  return opts;
}

function findBlender() {
  if (process.env.BLENDER_PATH && fs.existsSync(process.env.BLENDER_PATH)) {
    return process.env.BLENDER_PATH;
  }
  const candidates = [
    "C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe",
    "C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe",
    "/usr/bin/blender",
    "/Applications/Blender.app/Contents/MacOS/Blender",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
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
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function runOne(blender, row, outDir, force) {
  const sku = row.sku;
  const image = path.resolve(ROOT, row.image);
  const widthCm = Number(row.width_cm);
  const lengthCm = Number(row.length_cm);
  const glbOut = path.join(outDir, `${sku}.glb`);

  if (!sku) {
    console.warn("[skip] SKU bos satir");
    return { sku: null, ok: false, skipped: true };
  }
  if (!fs.existsSync(image)) {
    console.warn(`[skip] ${sku}: gorsel yok -> ${image}`);
    return { sku, ok: false, skipped: true };
  }
  if (fs.existsSync(glbOut) && !force) {
    console.log(`[skip] ${sku}: zaten var (${glbOut})`);
    return { sku, ok: true, skipped: true };
  }

  const script = path.join(ROOT, "scripts", "generate_rug_model.py");
  const args = [
    "--background",
    "--python",
    script,
    "--",
    "--image",
    image,
    "--width-cm",
    String(widthCm),
    "--length-cm",
    String(lengthCm),
    "--slug",
    sku,
    "--out-dir",
    outDir,
  ];

  console.log(`\n[gen] ${sku} (${widthCm}x${lengthCm} cm)`);
  const res = spawnSync(blender, args, {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true,
  });

  const ok = res.status === 0 && fs.existsSync(glbOut);
  console.log(ok ? `[ok] ${sku}` : `[fail] ${sku} (exit ${res.status})`);
  return { sku, ok, skipped: false };
}

function main() {
  const opts = parseArgs();
  const blender = findBlender();
  if (!blender) {
    console.error(
      "Blender bulunamadi. BLENDER_PATH env ile blender.exe yolunu verin."
    );
    process.exit(1);
  }

  if (!fs.existsSync(opts.manifest)) {
    console.error(`Manifest yok: ${opts.manifest}`);
    process.exit(1);
  }

  fs.mkdirSync(opts.outDir, { recursive: true });
  let rows = parseCsv(opts.manifest);
  if (opts.sku) {
    rows = rows.filter((r) => r.sku === opts.sku);
    if (!rows.length) {
      console.error(`SKU manifest'te yok: ${opts.sku}`);
      process.exit(1);
    }
  }

  console.log(`Blender: ${blender}`);
  console.log(`Manifest: ${opts.manifest} (${rows.length} satir)`);

  let ok = 0;
  let fail = 0;
  let skip = 0;
  for (const row of rows) {
    const result = runOne(blender, row, opts.outDir, opts.force);
    if (result.skipped && result.ok) skip++;
    else if (result.skipped) skip++;
    else if (result.ok) ok++;
    else fail++;
  }

  console.log(`\nBitti: ${ok} uretildi, ${skip} atlandi, ${fail} hata`);
  if (fail > 0) process.exit(1);
}

main();
