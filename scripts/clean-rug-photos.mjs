#!/usr/bin/env node
/**
 * data/rug-photos/ icindeki tum halı fotograflarindan inset kaldirir.
 * Orijinaller data/rug-photos-raw/ altina yedeklenir.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PHOTOS = path.join(ROOT, "data", "rug-photos");
const SCRIPT = path.join(ROOT, "scripts", "clean_rug_photo.py");

function findPython() {
  const candidates = process.platform === "win32" ? ["py", "python", "python3"] : ["python3", "python"];
  for (const cmd of candidates) {
    const res = spawnSync(cmd, ["--version"], { encoding: "utf8", windowsHide: true, timeout: 5000 });
    if (res.status === 0) return cmd;
  }
  return null;
}

function main() {
  if (!fs.existsSync(PHOTOS)) {
    console.error(`Klasor yok: ${PHOTOS}`);
    process.exit(1);
  }

  const py = findPython();
  if (!py) {
    console.error("Python bulunamadi.");
    process.exit(1);
  }

  const pipCheck = spawnSync(py, ["-c", "import PIL"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (pipCheck.status !== 0) {
    console.log("Pillow kuruluyor...");
    const pip = spawnSync(py, ["-m", "pip", "install", "pillow"], {
      stdio: "inherit",
      windowsHide: true,
    });
    if (pip.status !== 0) process.exit(1);
  }

  const res = spawnSync(
    py,
    [SCRIPT, "--batch", PHOTOS, "--in-place", "--backup", path.join(ROOT, "data", "rug-photos-raw")],
    { cwd: ROOT, stdio: "inherit", windowsHide: true }
  );
  if (res.status !== 0) process.exit(res.status ?? 1);

  const coversDir = path.join(ROOT, "public", "rug-covers");
  fs.mkdirSync(coversDir, { recursive: true });
  const photos = fs.readdirSync(PHOTOS).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  for (const f of photos) {
    fs.copyFileSync(path.join(PHOTOS, f), path.join(coversDir, f.replace(/\.(jpg|jpeg|webp)$/i, ".png")));
  }
  console.log(`\n[sync] ${photos.length} kapak -> public/rug-covers/`);
}

main();
