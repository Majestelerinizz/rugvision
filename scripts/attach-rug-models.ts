/**
 * Uretilen GLB dosyalarini veritabanindaki SKU kayitlarina baglar.
 *
 * Kullanim:
 *   npx tsx scripts/attach-rug-models.ts
 *   npx tsx scripts/attach-rug-models.ts --merchant-id cmqgswc5a000004lanqoxc666
 *   npx tsx scripts/attach-rug-models.ts --manifest data/rugs-batch.csv --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

const ROOT = process.cwd();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    manifest: path.join(ROOT, "data", "rugs-batch.csv"),
    modelsDir: path.join(ROOT, "public", "models"),
    coversDir: path.join(ROOT, "public", "rug-covers"),
    merchantId: process.env.MERCHANT_ID || "cmqgswc5a000004lanqoxc666",
    dryRun: false,
    baseUrl: process.env.MODEL_PUBLIC_BASE || "",
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--manifest" && args[i + 1]) opts.manifest = path.resolve(args[++i]);
    else if (a === "--merchant-id" && args[i + 1]) opts.merchantId = args[++i];
    else if (a === "--models-dir" && args[i + 1]) opts.modelsDir = path.resolve(args[++i]);
    else if (a === "--base-url" && args[i + 1]) opts.baseUrl = args[++i].replace(/\/$/, "");
    else if (a === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

function parseCsv(filePath: string) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [] as Array<Record<string, string>>;

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function modelUrlForSku(sku: string, baseUrl: string) {
  const rel = `/models/${sku}.glb`;
  return baseUrl ? `${baseUrl}${rel}` : rel;
}

function coverUrlForSku(sku: string, baseUrl: string) {
  const rel = `/rug-covers/${sku}.png`;
  return baseUrl ? `${baseUrl}${rel}` : rel;
}

function syncCoverImage(sku: string, photoPath: string, coversDir: string) {
  if (!photoPath || !fs.existsSync(photoPath)) return null;
  fs.mkdirSync(coversDir, { recursive: true });
  const dest = path.join(coversDir, `${sku}.png`);
  fs.copyFileSync(photoPath, dest);
  return dest;
}

async function main() {
  const opts = parseArgs();
  const rows = parseCsv(opts.manifest);

  let updated = 0;
  let missing = 0;

  for (const row of rows) {
    const sku = row.sku;
    if (!sku) continue;

    const glbPath = path.join(opts.modelsDir, `${sku}.glb`);
    if (!fs.existsSync(glbPath)) {
      console.warn(`[missing file] ${sku} -> ${glbPath}`);
      missing++;
      continue;
    }

    const model3dUrl = modelUrlForSku(sku, opts.baseUrl);
    const imageRel = row.image?.trim();
    const photoPath = imageRel ? path.join(ROOT, imageRel.replace(/\//g, path.sep)) : "";
    syncCoverImage(sku, photoPath, opts.coversDir);
    const coverImage = fs.existsSync(path.join(opts.coversDir, `${sku}.png`))
      ? coverUrlForSku(sku, opts.baseUrl)
      : null;

    const rug = await prisma.rug.findUnique({
      where: {
        merchantId_sku: { merchantId: opts.merchantId, sku },
      },
      select: { id: true, name: true, model3dUrl: true, coverImage: true },
    });

    if (!rug) {
      console.warn(`[missing db] ${sku} merchant=${opts.merchantId}`);
      missing++;
      continue;
    }

    const data: { model3dUrl: string; coverImage?: string | null } = { model3dUrl };
    if (coverImage && rug.coverImage !== coverImage) {
      data.coverImage = coverImage;
    }

    const modelChanged = rug.model3dUrl !== model3dUrl;
    const coverChanged = coverImage != null && rug.coverImage !== coverImage;
    if (!modelChanged && !coverChanged) {
      console.log(`[unchanged] ${sku}`);
      continue;
    }

    const parts = [];
    if (modelChanged) parts.push(`model ${rug.model3dUrl ?? "(null)"} -> ${model3dUrl}`);
    if (coverChanged) parts.push(`cover ${rug.coverImage ?? "(null)"} -> ${coverImage}`);
    console.log(`[update] ${sku}: ${parts.join("; ")}`);
    if (!opts.dryRun) {
      await prisma.rug.update({
        where: { id: rug.id },
        data,
      });
    }
    updated++;
  }

  console.log(`\nBitti: ${updated} guncellendi, ${missing} eksik`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
