#!/usr/bin/env python3
"""
Katalog halı fotograflarindaki sag-alt dairesel inset (yakin cekim) alanini kaldirir.

Kullanim:
  python scripts/clean_rug_photo.py data/rug-photos/RV-LUNA-001.png
  python scripts/clean_rug_photo.py --batch data/rug-photos --out data/rug-photos-clean
  python scripts/clean_rug_photo.py --batch data/rug-photos --in-place --backup data/rug-photos-raw

Gereksinim: pip install pillow
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
import sys

try:
    from PIL import Image, ImageDraw, ImageStat
except ImportError:
    print("Pillow gerekli: pip install pillow", file=sys.stderr)
    sys.exit(1)


def luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def ring_white_score(px, w: int, h: int, cx: int, cy: int, r: int) -> float:
    """Dairesel beyaz cerceve (inset kenari) icin skor."""
    inner = max(2, int(r * 0.82))
    outer = int(r * 1.08)
    hits = 0
    samples = 0
    for angle_i in range(36):
        import math

        ang = (angle_i / 36.0) * 2 * math.pi
        for rad in range(inner, outer + 1):
            x = int(cx + math.cos(ang) * rad)
            y = int(cy + math.sin(ang) * rad)
            if 0 <= x < w and 0 <= y < h:
                r0, g0, b0 = px[x, y]
                samples += 1
                if luminance(r0, g0, b0) > 215:
                    hits += 1
    return hits / max(samples, 1)


def detect_inset_circle(img: Image.Image) -> tuple[int, int, int] | None:
    w, h = img.size
    # Tespit icin kucuk kopya (hiz)
    scale = min(1.0, 420 / max(w, h))
    if scale < 1.0:
        small = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.BILINEAR)
        sw, sh = small.size
    else:
        small = img
        sw, sh = w, h

    rgb = small.convert("RGB")
    px = rgb.load()

    best_score = 0.0
    best: tuple[int, int, int] | None = None

    r_min = int(min(sw, sh) * 0.07)
    r_max = int(min(sw, sh) * 0.16)
    step_xy = 10
    step_r = 4

    for cx in range(int(sw * 0.62), sw - 8, step_xy):
        for cy in range(int(sh * 0.52), sh - 8, step_xy):
            for r in range(r_min, r_max, step_r):
                score = ring_white_score(px, sw, sh, cx, cy, r)
                if score > best_score:
                    best_score = score
                    best = (cx, cy, r)

    if best and best_score >= 0.35:
        if scale < 1.0:
            cx, cy, r = best
            return (int(cx / scale), int(cy / scale), int(r / scale))
        return best
    return None


def average_color(img: Image.Image) -> tuple[int, int, int]:
    stat = ImageStat.Stat(img.convert("RGB"))
    return tuple(int(v) for v in stat.mean[:3])


def sample_fill_color(img: Image.Image, cx: int, cy: int, r: int) -> tuple[int, int, int]:
    w, h = img.size
    left = max(0, cx - int(r * 2.8))
    right = max(0, cx - int(r * 0.5))
    top = max(0, cy - int(r * 0.9))
    bottom = min(h, cy + int(r * 0.9))
    if right <= left or bottom <= top:
        return average_color(img)
    return average_color(img.crop((left, top, right, bottom)))


def remove_inset(
    img: Image.Image,
    circle: tuple[int, int, int] | None = None,
    pad: float = 1.12,
) -> tuple[Image.Image, bool]:
    w, h = img.size
    detected = circle or detect_inset_circle(img)
    if not detected:
        return img, False

    cx, cy, r = detected
    fill = sample_fill_color(img, cx, cy, r)
    out = img.convert("RGB")
    draw = ImageDraw.Draw(out)
    rad = int(r * pad)
    draw.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=fill)
    return out, True


def process_file(
    src: str,
    dst: str,
    in_place: bool,
    backup_dir: str | None,
) -> bool:
    img = Image.open(src)
    cleaned, changed = remove_inset(img)
    if not changed:
        print(f"[skip] inset bulunamadi: {src}")
        if not in_place:
            os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
            shutil.copy2(src, dst)
        return False

    if in_place and backup_dir:
        os.makedirs(backup_dir, exist_ok=True)
        base = os.path.basename(src)
        backup_path = os.path.join(backup_dir, base)
        if not os.path.exists(backup_path):
            shutil.copy2(src, backup_path)

    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    cleaned.save(dst, format="PNG", optimize=True)
    print(f"[ok] {src} -> {dst}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Halı fotoğrafından inset kaldır")
    parser.add_argument("input", nargs="?", help="Tek dosya yolu")
    parser.add_argument("--batch", help="Klasör (tüm png/jpg)")
    parser.add_argument("--out", help="Çıktı klasörü (batch)")
    parser.add_argument("--in-place", action="store_true", help="Kaynak dosyanın üzerine yaz")
    parser.add_argument("--backup", default="data/rug-photos-raw", help="In-place yedek klasörü")
    args = parser.parse_args()

    files: list[str] = []
    if args.batch:
        for ext in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
            files.extend(glob.glob(os.path.join(args.batch, ext)))
        files.sort()
    elif args.input:
        files = [args.input]
    else:
        parser.error("input veya --batch gerekli")

    if not files:
        print("Islenecek dosya yok.", file=sys.stderr)
        return 1

    changed = 0
    for src in files:
        if args.in_place:
            dst = src
        elif args.out:
            dst = os.path.join(args.out, os.path.basename(src))
        else:
            root, ext = os.path.splitext(src)
            dst = root + "-clean" + ext

        if process_file(src, dst, args.in_place, args.backup if args.in_place else None):
            changed += 1

    print(f"\nBitti: {changed}/{len(files)} dosyada inset kaldirildi")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
