# RugVision — Otomatik Model Pipeline (Faz 3 · Adım 2)

> Amaç: 100+ halı için **fotoğraf + ölçü → GLB + USDZ** otomatik üretimi.  
> Elle Blender yok; batch script tüm SKU'ları işler.

---

## Gereksinimler

- **Blender 4.x** (PATH veya `BLENDER_PATH` env)
- Ürün **üstten fotoğrafları** (`jpg`/`png`)
- CSV manifest: SKU, görsel yolu, en/boy (cm)

---

## Hızlı başlangıç

### 1) Fotoğrafları koy

`data/rug-photos/` klasörüne SKU adıyla kaydet:

```
data/rug-photos/RV-LUNA-001.jpg
data/rug-photos/RV-ARYA-003.jpg
...
```

Manifest: `data/rugs-batch.csv` (pilot 10 SKU hazır).

### 1b) (Opsiyonel) Katalog inset temizle

Sağ-alt dairesel yakın çekim inset varsa kaldırır; kapakları `public/rug-covers/` ile senkronlar:

```powershell
npm run photos:clean
```

Orijinaller `data/rug-photos-raw/` altına yedeklenir. Gereksinim: Python + Pillow (script otomatik kurar).

### 2) Toplu model üret

```powershell
# Tum manifest
npm run models:batch

# Tek SKU
npm run models:batch -- --sku RV-LUNA-001

# Uzerine yaz
npm run models:batch -- --force
```

Blender yolu bulunamazsa:

```powershell
$env:BLENDER_PATH="C:\Program Files\Blender Foundation\Blender 4.4\blender.exe"
npm run models:batch
```

**Çıktı:** `public/models/{SKU}.glb` + `{SKU}.usdz`

### 3) Veritabanına bağla

```powershell
npm run models:attach
# veya
npm run models:attach -- --merchant-id cmqgswc5a000004lanqoxc666
```

Her SKU için `model3dUrl` → `/models/{SKU}.glb` ve `coverImage` → `/rug-covers/{SKU}.png` güncellenir.

### 4) Halı sitesi ürün görselleri (pilot)

RugVision `rug-covers` ile aynı PNG'leri halı sitesine yükle:

- FTP: `assets/images/products/RV-*.png`
- SQL: `docs/sql/update_product_images.sql` (bkz. `docs/PILOT-ECOMMERCE.md` Adım 4)

### 5) Widget / AR test

- Production: `https://rugvision-o54d.vercel.app/models/RV-ARYA-003.glb`
- Pilot site: `https://savasdogantekstil.com/rugvision/product-detail.php?id=3`

---

## Pilot durumu (17.06.2026)

- [x] 10 SKU batch üretildi (`npm run models:batch -- --force`)
- [x] Neon DB bağlandı (`npm run models:attach`)
- [x] GitHub + Vercel deploy (`7513861`)
- [x] iPhone Quick Look canlı doğrulama (ürün bazlı model)
- [x] Fotoğraf inset temizleme (`npm run photos:clean`)
- [x] R2 upload script + `docs/R2-SETUP.md`
- [ ] R2 production (`STORAGE_DRIVER=r2` + Vercel env)

---

## Bulut depolama (R2 / S3)

Vercel'de kalıcı dosya için `STORAGE_DRIVER=r2` (veya `s3`).  
**Tam kurulum:** `docs/R2-SETUP.md`

| Env | Açıklama |
|-----|----------|
| `STORAGE_DRIVER` | `local` (dev) veya `r2` / `s3` |
| `R2_BUCKET` | Bucket adı |
| `R2_ACCESS_KEY_ID` | API key |
| `R2_SECRET_ACCESS_KEY` | Secret |
| `R2_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | CDN/public URL (örn. `https://cdn.example.com`) |

Mevcut modelleri R2'ye yükle:

```powershell
npm run models:upload-r2
npm run models:upload-r2 -- --force   # uzerine yaz
```

Upload: `POST /api/v1/uploads/model` → driver üzerinden R2'ye yazar.  
USDZ: `GET /api/v1/ar/usdz/:filename` → storage'dan okur.

Production'da `model3dUrl` tam CDN URL:

```powershell
npm run models:attach -- --base-url https://cdn.ornek.com
```

---

## Teknik akış

```
Foto (JPG) + 160x230 cm
        |
        v
generate_rug_model.py (Blender headless)
  - düzlem + dokulu materyal
  - gerçek ölçek (metre)
  - GLB export
  - USDZ export (Quick Look)
        |
        v
public/models/ veya R2
        |
        v
attach-rug-models.ts -> rugs.model3dUrl
```

---

## Süre tahmini

| Adet | Elle Blender | Otomatik batch |
|------|--------------|----------------|
| 10 | ~5-10 saat | ~10-15 dk |
| 100 | ~50-100 saat | ~2-3 saat |

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| Blender bulunamadı | `BLENDER_PATH` set et |
| `[skip] gorsel yok` | `data/rug-photos/{SKU}.jpg` ekle |
| USDZ paketlenmedi | Blender USD eklentisi / `pxr` kontrol |
| AR açılmıyor | `npm run models:attach` çalıştırıldı mı? |
