/**
 * Halıcı CSV verisini Neon DB'ye aktarir (olustur veya guncelle).
 *
 * CSV kolonlari: sku, image, width_cm, length_cm, name [, price]
 *
 * Kullanim:
 *   npm run rugs:import
 *   npm run rugs:import -- --manifest data/rugs-batch.csv --merchant-id xxx
 *   npm run rugs:import -- --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { Prisma, RugStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { slugify } from "../lib/slug";
import { invalidateRugPublicCache } from "../lib/invalidate-rug-cache";

const ROOT = process.cwd();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    manifest: path.join(ROOT, "data", "rugs-batch.csv"),
    merchantId: process.env.MERCHANT_ID || "cmqgswc5a000004lanqoxc666",
    dryRun: false,
    defaultPrice: 0,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--manifest" && args[i + 1]) opts.manifest = path.resolve(args[++i]);
    else if (a === "--merchant-id" && args[i + 1]) opts.merchantId = args[++i];
    else if (a === "--default-price" && args[i + 1])
      opts.defaultPrice = Number(args[++i]) || 0;
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

function buildSlug(name: string, sku: string) {
  const base = slugify(name) || "hali";
  const suffix = slugify(sku) || sku.toLowerCase();
  return `${base}-${suffix}`.slice(0, 120);
}

function parsePrice(raw: string | undefined, fallback: number) {
  if (!raw?.trim()) return fallback;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function ensureMerchant(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { id: true, name: true },
  });
  if (!merchant) {
    throw new Error(`Merchant bulunamadi: ${merchantId}`);
  }
  return merchant;
}

async function main() {
  const opts = parseArgs();
  if (!fs.existsSync(opts.manifest)) {
    throw new Error(`Manifest yok: ${opts.manifest}`);
  }

  const merchant = await ensureMerchant(opts.merchantId);
  const rows = parseCsv(opts.manifest);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`Merchant: ${merchant.name} (${merchant.id})`);
  console.log(`Manifest: ${opts.manifest}`);
  console.log(`Satir: ${rows.length}\n`);

  for (const row of rows) {
    const sku = row.sku?.trim();
    const name = row.name?.trim();
    const widthCm = Number(row.width_cm);
    const lengthCm = Number(row.length_cm);

    if (!sku || !name) {
      console.warn(`[skip] eksik sku/name satiri`);
      skipped++;
      continue;
    }
    if (!Number.isFinite(widthCm) || !Number.isFinite(lengthCm) || widthCm <= 0 || lengthCm <= 0) {
      console.warn(`[skip] ${sku} gecersiz olcu`);
      skipped++;
      continue;
    }

    const slug = buildSlug(name, sku);
    const price = parsePrice(row.price, opts.defaultPrice);
    const existing = await prisma.rug.findUnique({
      where: { merchantId_sku: { merchantId: opts.merchantId, sku } },
      select: { id: true, name: true, slug: true, widthCm: true, lengthCm: true, price: true },
    });

    if (!existing) {
      console.log(`[create] ${sku} | ${name} | ${widthCm}x${lengthCm}cm`);
      if (!opts.dryRun) {
        await prisma.rug.create({
          data: {
            merchantId: opts.merchantId,
            sku,
            slug,
            name,
            widthCm,
            lengthCm,
            price: new Prisma.Decimal(price),
            status: RugStatus.ACTIVE,
          },
        });
      }
      created++;
      continue;
    }

    const needsUpdate =
      existing.name !== name ||
      existing.widthCm !== widthCm ||
      existing.lengthCm !== lengthCm ||
      existing.price.toString() !== new Prisma.Decimal(price).toString();

    if (!needsUpdate) {
      console.log(`[unchanged] ${sku}`);
      skipped++;
      continue;
    }

    console.log(`[update] ${sku} | ${existing.name} -> ${name}`);
    if (!opts.dryRun) {
      await prisma.rug.update({
        where: { id: existing.id },
        data: { name, widthCm, lengthCm, price: new Prisma.Decimal(price) },
      });
    }
    updated++;
  }

  if (!opts.dryRun && (created > 0 || updated > 0)) {
    invalidateRugPublicCache();
  }

  console.log(`\nBitti: ${created} olusturuldu, ${updated} guncellendi, ${skipped} atlandi`);
  if (opts.dryRun) console.log("(dry-run: DB degismedi)");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
