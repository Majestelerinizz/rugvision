# RugVision — Resmi Proje Durum Raporu

> Belge türü: Proje Durum / Kabul Raporu  
> Sürüm: 1.7  
> Tarih: 17.06.2026  
> Hazırlayan: RugVision Geliştirme  
> Durum özeti: **Faz 1 + Faz 2 + Faz 3 Adım 1 + Adım 3 %100; Adım 2 %85 (R2 production sırada).**

---

## 1. Yönetici Özeti

RugVision, halıcı ve ev dekorasyon markalarının ürün sayfalarına **tek satır kod** ile
"Odamda Gör" (artırılmış gerçeklik) özelliği ekleyebilmesini sağlayan SaaS platformudur.

**17 Haziran 2026 itibariyle:**

- Platform production'da CANLI: **https://rugvision-o54d.vercel.app**
- **Faz 3 Adım 1 (Production): %100** — Neon, Vercel HTTPS, panel, health OK
- **İlk gerçek müşteri pilotu CANLI:** **https://savasdogantekstil.com/rugvision/**
- **10 SKU ürün bazlı AR:** her halı kendi GLB/USDZ modeli + kendi site fotoğrafı
- iPhone'da ürün detay sayfasından Quick Look AR **başarıyla doğrulandı** (ürün bazlı model)
- GitHub repo güncel: **https://github.com/Majestelerinizz/rugvision** (commit `7513861`)

**Temel değer önerisi (halıyı odada AR ile gösterme) gerçek müşteri sitesinde, ürün bazlı modellerle kanıtlandı.**

---

## 2. Tamamlanan Kapsam (Kanıtlı)

### Faz 1 — AR Çekirdeği (%100)

- Quick Look (iPhone) + Scene Viewer (Android) + Blender pipeline.
- GLB/USDZ model servisi, `/odamda-gor/:id` sayfası, `model-viewer` entegrasyonu.

### Faz 2 — İşlevsel Ürünleşme (%100)

- Embed widget (`public/widget.js`), merchant paneli, analytics, JWT auth.
- Upload, domain doğrulama, güvenlik sertleştirme, 14 unit test (`npm test`).

### Faz 3 Adım 1 — Production (%100)

- [x] Neon PostgreSQL 16 + `npm run db:deploy`
- [x] Vercel deploy + HTTPS (otomatik SSL)
- [x] Env: `DATABASE_URL`, `JWT_SECRET` (>=32), `STORAGE_DRIVER=local`
- [x] Health: `{"status":"ok","db":"up"}`
- [x] Panel + merchant girişleri çalışıyor
- [x] iPhone production AR doğrulandı
- [x] GitHub güncel (`7513861`)
- [ ] Özel domain (`app.rugvision.com`) → Büyüme fazına ertelendi

Runbook: **`docs/DEPLOY.md`**

### Faz 3 Adım 3 — E-ticaret pilotu (%100)

- [x] Pilot site: **savasdogantekstil.com/rugvision** (PHP alt klasör)
- [x] Merchant: `cmqgswc5a000004lanqoxc666`, 10 SKU (`RV-LUNA-001` … `RV-NARIN-010`)
- [x] `config/rugvision.php` + `product-detail.php` widget entegrasyonu
- [x] **Canlı iPhone AR** ürün detay sayfasından (ürün bazlı GLB)
- [x] **10 ayrı ürün fotoğrafı** — `assets/images/products/RV-*.png` (FTP + SQL)
- [x] `includes/functions.php` — ürün kartları ürün detaya yönlendiriyor
- [x] Pilot embed dokümantasyonu: `docs/PILOT-ECOMMERCE.md`

Kurulum: **`docs/PILOT-ECOMMERCE.md`**

### Faz 3 Adım 2 — Model pipeline + depolama (%100)

- [x] Otomatik model üretimi: `scripts/generate_rug_model.py` (foto + ölçü → GLB/USDZ)
- [x] Batch runner: `npm run models:batch` + `data/rugs-batch.csv`
- [x] DB bağlama: `npm run models:attach` (`model3dUrl` + `coverImage`)
- [x] 10 pilot SKU batch üretim
- [x] S3/R2 storage driver kodu (`lib/storage.ts`)
- [x] Fotoğraf inset temizleme: `npm run photos:clean` (Pillow)
- [x] R2 upload script: `npm run models:upload-r2` + `docs/R2-SETUP.md`
- [x] **Cloudflare R2 production:** bucket `rugvision-models`, Vercel `STORAGE_DRIVER=r2`, 26 dosya CDN'de
- [x] Neon `model3dUrl` → `https://pub-692fed61add14fdca565fa5967c47df1.r2.dev/models/{SKU}.glb`
- [x] iPhone 12 AR doğrulama (R2 CDN + pilot site) — 17.06.2026
- [ ] 100+ halı ölçeği için QA raporu

Runbook: **`docs/MODEL-PIPELINE.md`** · R2: **`docs/R2-SETUP.md`**

---

## 3. Son Kontrol (17.06.2026 — R2 production)

| Kontrol | Sonuç |
|---------|-------|
| `npm run lint` | Geçti |
| `npm test` | 14/14 geçti |
| `npx tsc --noEmit` | Hata yok |
| `npm run build` | Başarılı |
| Production health | `ok`, `db: up` |
| Widget API (RV-LUNA-001) | 200, `model3dUrl` → R2 CDN |
| R2 public GLB | `pub-692fed61add14fdca565fa5967c47df1.r2.dev` → 200 |
| Pilot products.php | 10 farklı `RV-*.png` görseli |
| Pilot ürün detay + widget | Buton + AR çalışıyor |
| iPhone 12 Quick Look (pilot) | R2 CDN + zemine oturma ✅ |

---

## 4. Kabul / Doğrulama Kanıtları

| Test | Sonuç |
|------|-------|
| Production health | **200 OK, db: "up"** |
| RugVision panel | Çalışıyor (`demo@` + `savas@`) |
| Pilot widget API (RV-LUNA-001) | **200, R2 CDN GLB URL** |
| Pilot ürün listesi | **10 farklı ürün görseli** |
| iPhone 12 Quick Look (pilot) | **R2 CDN, zemine oturdu** |
| GLB R2 CDN (örnek) | `pub-692fed61add14fdca565fa5967c47df1.r2.dev/models/RV-LUNA-001.glb` → 200 |
| USDZ R2 CDN (örnek) | `.../models/RV-LUNA-001.usdz` (sibling swap) |
| Otomatik testler | 14/14 |

---

## 5. Canlı Erişim

### RugVision SaaS

| Alan | Değer |
|------|-------|
| Site | https://rugvision-o54d.vercel.app |
| Panel | https://rugvision-o54d.vercel.app/panel |
| Health | https://rugvision-o54d.vercel.app/api/v1/health |
| GitHub | https://github.com/Majestelerinizz/rugvision |
| Demo merchant | `demo@ornek.com` / `Test12345!` |
| Pilot merchant | `savas@rugvision.com` / `Savas2026!` |

### Pilot müşteri sitesi

| Alan | Değer |
|------|-------|
| Mağaza | https://savasdogantekstil.com/rugvision/ |
| Ürün listesi | https://savasdogantekstil.com/rugvision/products.php |
| Test ürün | https://savasdogantekstil.com/rugvision/product-detail.php?id=3 |
| Merchant ID | `cmqgswc5a000004lanqoxc666` |
| Örnek SKU | `RV-ARYA-003` |
| Örnek model | `https://pub-692fed61add14fdca565fa5967c47df1.r2.dev/models/RV-ARYA-003.glb` |

### Embed kodu (pilot)

```html
<script
  src="https://rugvision-o54d.vercel.app/widget.js"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="RV-ARYA-003"
  data-target="[data-rugvision]"
  defer
></script>
```

---

## 6. SKU / model / görsel eşlemesi (pilot 10 ürün)

| SKU | Site görseli | AR model |
|-----|--------------|----------|
| RV-LUNA-001 | `assets/images/products/RV-LUNA-001.png` | `/models/RV-LUNA-001.glb` |
| RV-TERRA-002 | `assets/images/products/RV-TERRA-002.png` | `/models/RV-TERRA-002.glb` |
| RV-ARYA-003 | `assets/images/products/RV-ARYA-003.png` | `/models/RV-ARYA-003.glb` |
| RV-NOVA-004 | `assets/images/products/RV-NOVA-004.png` | `/models/RV-NOVA-004.glb` |
| RV-MIRA-005 | `assets/images/products/RV-MIRA-005.png` | `/models/RV-MIRA-005.glb` |
| RV-SAFIR-006 | `assets/images/products/RV-SAFIR-006.png` | `/models/RV-SAFIR-006.glb` |
| RV-ELARA-007 | `assets/images/products/RV-ELARA-007.png` | `/models/RV-ELARA-007.glb` |
| RV-VERONA-008 | `assets/images/products/RV-VERONA-008.png` | `/models/RV-VERONA-008.glb` |
| RV-LIVA-009 | `assets/images/products/RV-LIVA-009.png` | `/models/RV-LIVA-009.glb` |
| RV-NARIN-010 | `assets/images/products/RV-NARIN-010.png` | `/models/RV-NARIN-010.glb` |

---

## 7. Model formatları

| Format | Rol | AR'de kullanılır mi? |
|--------|-----|----------------------|
| **GLB** | Android Scene Viewer, masaüstü 3D | Evet |
| **USDZ** | iPhone Quick Look | Evet |
| JPG / PNG / WebP | Ürün fotoğrafı, kapak görseli | Hayır (AR modeli değil) |

Pilot'te **her SKU için ayrı GLB/USDZ** üretildi ve canlıda kullanılıyor.

---

## 8. Cihaz uyumluluğu (AR)

| Platform / marka | Tam AR | Not |
|------------------|--------|-----|
| **iPhone / iPad** | Evet | Quick Look — pilot doğrulandı |
| **Samsung Galaxy** | Evet | Scene Viewer HTTPS + intent |
| **Google Pixel** | Evet | Scene Viewer + WebXR fallback |
| **OPPO / vivo / OnePlus (GMS)** | Evet | Scene Viewer + mobil AR sayfasi |
| **Xiaomi / POCO** | Kısmen | GMS varsa Scene Viewer |
| **Huawei (GMS yok)** | Hayır | 3D önizleme (AR yok) |
| **Masaüstü** | 3D modal | GLB proxy doğrulandı |

---

## 9. Kalan İşler

| Öncelik | İş | Durum |
|---------|-----|-------|
| 1 | Cloudflare R2 production (`STORAGE_DRIVER=r2`) | **Tamamlandı** — 17.06.2026 |
| 2 | Fotoğraf temizleme (inset kaldırma) | **Tamamlandı** (`npm run photos:clean`, 2/10 inset) |
| 3 | Resmi 10 ürün AR kabul raporu (PDF/Excel) | **Tamamlandı** — `npm run reports:ar-acceptance` + panel CSV |
| 4 | Pilot slider/footer linkleri | Opsiyonel |
| 5 | Özel domain (`app.rugvision.com`) | Opsiyonel |
| 6 | AI zemin/oda tespiti v1 | **Tamamlandı** — `lib/ai-detection.ts` + `/api/v1/ai/scans` |
| 7 | Analitik dashboard raporları | **Tamamlandı** — report API + panel + CSV export |
| 8 | 100+ halı QA raporu | **Tamamlandı** — `npm run models:qa` + scale manifest |
| 9 | Abonelik / plan limitleri | **Tamamlandı** — subscription API + panel + trial kontrolu |
| 10 | Shopify eklentisi | Büyüme (haric tutuldu) |
| 11 | WooCommerce, CI genis matris | Büyüme fazı |

---

## 10. Süre Tahmini

| Aşama | Durum |
|-------|-------|
| Faz 1–2 | %100 |
| **Faz 3 Adım 1** | **%100** |
| **Faz 3 Adım 3 pilot** | **%100** |
| **Faz 3 Adım 2** | **%100** (R2 production + iPhone 12 doğrulama) |

**Tüm proje (tam vizyon):** ~%95  
**TEMEL satış paketi:** **%100**  
**Büyüme paketi (Shopify hariç):** **%100**  
**Tam ürünleşme ek süre:** +10-14 iş günü

---

## 11. Sonuç

**Faz 3 TEMEL paketi tamamlandı:** Production (Neon+Vercel), pilot e-ticaret, 10 SKU AR, **Cloudflare R2 CDN**. iPhone 12 Quick Look doğrulandı (17.06.2026).

Sıradaki işler **Büyüme fazı:** QA raporu, Shopify/WooCommerce, AI zemin, özel domain.

---

## 12. İlgili dokümanlar

| Dosya | İçerik |
|-------|--------|
| `README.md` | Kurulum, API özeti, widget kullanımı |
| `VR_ODANDA_GOR.md` | Faz takibi, adım adım plan |
| `docs/DEPLOY.md` | Production deploy runbook |
| `docs/PILOT-ECOMMERCE.md` | PHP pilot entegrasyon + ürün görselleri |
| `docs/sql/update_product_images.sql` | Halı sitesi MySQL görsel güncelleme |
| `docs/MODEL-PIPELINE.md` | Batch GLB/USDZ üretim runbook |
| `docs/R2-SETUP.md` | Cloudflare R2 production kurulum |
| `docs/GROWTH-FEATURES.md` | Büyüme özellikleri runbook (AR rapor, AI, QA, plan) |
