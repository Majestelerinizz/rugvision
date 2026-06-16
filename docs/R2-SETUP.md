# Cloudflare R2 — Model Depolama (Faz 3 · Adım 2)

> Amaç: Vercel'in ephemeral diski yerine kalıcı GLB/USDZ depolama.  
> Pilot (10 SKU) şu an `public/models/` git deploy ile çalışıyor; 100+ halı ölçeği için R2 zorunlu.

---

## 1. Cloudflare R2 bucket oluştur

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**
2. Bucket adı örn. `rugvision-models`
3. **Settings** → **Public access** (isteğe bağlı):
   - **R2.dev subdomain** ile hızlı test, veya
   - **Custom domain** (örn. `cdn.rugvision.app`) — production için önerilir

---

## 2. API token (S3 uyumlu)

1. R2 → **Manage R2 API Tokens** → **Create API Token**
2. İzin: Object Read & Write, bucket: `rugvision-models`
3. Kaydet:
   - **Access Key ID**
   - **Secret Access Key**
4. **Endpoint** formatı: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 3. Vercel environment variables

Vercel → Project → **Settings** → **Environment Variables** (Production + Preview):

| Değişken | Örnek | Açıklama |
|----------|-------|----------|
| `STORAGE_DRIVER` | `r2` | Upload API R2'ye yazar |
| `R2_BUCKET` | `rugvision-models` | Bucket adı |
| `R2_ACCESS_KEY_ID` | `...` | API key |
| `R2_SECRET_ACCESS_KEY` | `...` | Secret |
| `R2_ENDPOINT` | `https://xxx.r2.cloudflarestorage.com` | S3 endpoint |
| `R2_PUBLIC_URL` | `https://cdn.rugvision.app` | GLB/USDZ public CDN kökü |

> `R2_PUBLIC_URL` sonunda `/` olmamalı. Dosya yolu: `{R2_PUBLIC_URL}/models/{SKU}.glb`

Deploy sonrası health kontrol: `GET /api/v1/health` → `db: up`

---

## 4. Mevcut modelleri R2'ye yükle (lokal)

`.env` dosyana R2 değişkenlerini ekle (bkz. `.env.example`), sonra:

```bash
# Tum pilot modeller (20 dosya: 10 GLB + 10 USDZ)
npm run models:upload-r2

# Tek SKU
npm run models:upload-r2 -- --sku RV-LUNA-001

# Zaten varsa atla (varsayilan); uzerine yaz:
npm run models:upload-r2 -- --force

# Env kontrolu, yukleme yok:
npm run models:upload-r2 -- --dry-run
```

Script: `scripts/upload-models-r2.mjs` — `public/models/*.glb` ve `*.usdz` dosyalarını `models/` prefix'i ile yükler.

---

## 5. Veritabanını R2 URL'lerine bağla

```bash
# PowerShell
$env:R2_PUBLIC_URL="https://cdn.rugvision.app"
npm run models:attach -- --base-url $env:R2_PUBLIC_URL

# veya
$env:MODEL_PUBLIC_BASE="https://cdn.rugvision.app"
npm run models:attach
```

Bu komut Neon'daki `model3dUrl` alanlarını tam CDN URL'ye günceller (örn. `https://cdn.../models/RV-LUNA-001.glb`).

> Kapak görselleri (`coverImage`) R2'de değil; varsayılan olarak `/rug-covers/{SKU}.png` (relative) kalır. Site kökü vermek için: `--covers-base-url https://rugvision-o54d.vercel.app`

---

## 6. Widget / iPhone AR

- **GLB:** `model3dUrl` tam URL ise doğrudan CDN'den yüklenir.
- **USDZ (Quick Look):** Tam URL'de `.glb` → `.usdz` sibling swap yapılır (`widget.js`).
- Relative `/models/` yolları Vercel `public/` veya `/api/v1/ar/usdz/` proxy üzerinden çalışmaya devam eder.

R2'ye geçişten sonra pilot ürünlerde iPhone AR'ı bir SKU ile doğrula.

---

## 7. Yeni model üretim akışı (R2 ile)

```bash
npm run photos:clean          # inset temizle (isteğe bağlı)
npm run models:batch -- --force
npm run models:upload-r2 -- --force
npm run models:attach -- --base-url https://cdn.rugvision.app
```

Vercel'de yeni upload (`POST /api/v1/uploads/model`) `STORAGE_DRIVER=r2` ile doğrudan R2'ye gider.

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| `Eksik env: R2_BUCKET` | `.env` veya shell'de R2_* değişkenlerini set et |
| 403 / Access Denied | API token bucket iznini kontrol et |
| Model yüklenmiyor (CORS) | R2 custom domain veya public bucket CORS ayarı |
| USDZ açılmıyor | Aynı prefix'te `.usdz` dosyasının da yüklendiğini doğrula |
| Vercel hâlâ local | `STORAGE_DRIVER=r2` + redeploy |

---

## Pilot notu (10 SKU)

Git'teki `public/models/` dosyaları yedek/fallback olarak kalabilir. Production'da DB URL'leri R2'ye işaret ettiğinde widget CDN'i kullanır; Vercel git boyutunu küçültmek için ileride `public/models/` git'ten çıkarılabilir (opsiyonel).
