#!/usr/bin/env node
/**
 * public/models/ icindeki GLB + USDZ dosyalarini Cloudflare R2'ye yukler.
 *
 * Gerekli env (.env veya shell):
 *   STORAGE_DRIVER=r2
 *   R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT
 *   R2_PUBLIC_URL (opsiyonel ama onerilir)
 *
 * Kullanim:
 *   npm run models:upload-r2
 *   npm run models:upload-r2 -- --sku RV-LUNA-001
 *   npm run models:upload-r2 -- --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PutObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CONTENT_TYPES = {
  ".glb": "model/gltf-binary",
  ".usdz": "model/vnd.usdz+zip",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    modelsDir: path.join(ROOT, "public", "models"),
    sku: null,
    dryRun: false,
    force: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--models-dir" && args[i + 1]) opts.modelsDir = path.resolve(args[++i]);
    else if (a === "--sku" && args[i + 1]) opts.sku = args[++i];
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
  }
  return opts;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Eksik env: ${name}`);
    console.error("Bkz. docs/R2-SETUP.md");
    process.exit(1);
  }
  return v;
}

function createR2Client() {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    console.error("R2 env eksik: R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    console.error("Bkz. docs/R2-SETUP.md");
    process.exit(1);
  }

  return {
    bucket,
    prefix: (process.env.S3_PREFIX || "models").replace(/\/$/, ""),
    publicBase: (process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL || "").replace(
      /\/$/,
      ""
    ),
    client: new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: endpoint || undefined,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: Boolean(endpoint),
    }),
  };
}

function objectKey(prefix, fileName) {
  return `${prefix}/${path.basename(fileName)}`;
}

function publicUrl(publicBase, prefix, fileName) {
  const safe = path.basename(fileName);
  if (publicBase) return `${publicBase}/${prefix}/${safe}`;
  return `/${prefix}/${safe}`;
}

async function existsOnR2(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(r2, filePath, dryRun, force) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return { skipped: true, reason: "ext" };

  const fileName = path.basename(filePath);
  const key = objectKey(r2.prefix, fileName);

  if (!force && (await existsOnR2(r2.client, r2.bucket, key))) {
    console.log(`[skip] zaten R2'de: ${fileName}`);
    return { skipped: true, reason: "exists", url: publicUrl(r2.publicBase, r2.prefix, fileName) };
  }

  if (dryRun) {
    console.log(`[dry-run] yuklenecek: ${fileName} -> ${key}`);
    return { uploaded: true, dryRun: true, url: publicUrl(r2.publicBase, r2.prefix, fileName) };
  }

  const body = fs.readFileSync(filePath);
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const url = publicUrl(r2.publicBase, r2.prefix, fileName);
  console.log(`[ok] ${fileName} -> ${url || key}`);
  return { uploaded: true, url };
}

function collectFiles(modelsDir, sku) {
  const all = fs
    .readdirSync(modelsDir)
    .filter((f) => /\.(glb|usdz)$/i.test(f))
    .map((f) => path.join(modelsDir, f));

  if (!sku) return all.sort();
  const prefix = sku + ".";
  return all.filter((f) => path.basename(f).startsWith(prefix));
}

async function main() {
  const opts = parseArgs();
  if (!fs.existsSync(opts.modelsDir)) {
    console.error(`Models klasoru yok: ${opts.modelsDir}`);
    process.exit(1);
  }

  const r2 = createR2Client();
  if (!r2.publicBase) {
    console.warn(
      "Uyari: R2_PUBLIC_URL tanimli degil. Yukleme yapilir ama public URL bilinmiyor."
    );
  }

  const files = collectFiles(opts.modelsDir, opts.sku);
  if (!files.length) {
    console.error("Yuklenecek GLB/USDZ bulunamadi.");
    process.exit(1);
  }

  console.log(`R2 bucket: ${r2.bucket}`);
  console.log(`Prefix: ${r2.prefix}`);
  console.log(`Dosya: ${files.length}`);

  let uploaded = 0;
  let skipped = 0;
  for (const file of files) {
    const res = await uploadFile(r2, file, opts.dryRun, opts.force);
    if (res.uploaded) uploaded++;
    else if (res.skipped) skipped++;
  }

  console.log(`\nBitti: ${uploaded} yuklendi, ${skipped} atlandi`);
  if (r2.publicBase) {
    console.log(`\nDB baglama ornegi:`);
    console.log(
      `  $env:MODEL_PUBLIC_BASE="${r2.publicBase}"; npm run models:attach -- --base-url ${r2.publicBase}`
    );
    console.log(`Vercel env: STORAGE_DRIVER=r2 (+ R2_* degiskenleri)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
