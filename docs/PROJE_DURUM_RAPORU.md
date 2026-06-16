# RugVision — Resmi Proje Durum Raporu

> Belge türü: Proje Durum / Kabul Raporu  
> Sürüm: 1.5  
> Tarih: 17.06.2026  
> Hazırlayan: RugVision Geliştirme  
> Durum özeti: **Faz 1 + Faz 2 + Faz 3 Adım 1 %100; pilot CANLI AR.**

---

## 1. Yönetici Özeti

RugVision, halıcı ve ev dekorasyon markalarının ürün sayfalarına **tek satır kod** ile
"Odamda Gör" (artırılmış gerçeklik) özelliği ekleyebilmesini sağlayan SaaS platformudur.

**17 Hazıran 2026 itibariyle:**

- Platform production'da CANLI: **https://rugvision-o54d.vercel.app**
- **Faz 3 Adım 1 (Production): %100** — Neon, Vercel HTTPS, panel, health OK
- **İlk gerçek müşteri pilotu CANLI:** **https://savasdogantekstil.com/rugvision/**
- iPhone'da ürün detay sayfasından Quick Look AR **başarıyla doğrulandi**
- 10 ürün SKU eşlemesi tamam (merchant: Savas Dogan Tekstil)
- GitHub repo güncel: **https://github.com/Majestelerinizz/rugvision** (commit `edc8f3e`)

**Temel değer önerisi (halıyı odada AR ile gösterme) gerçek müşteri sitesinde kanıtlandı.**

---

## 2. Tamamlanan Kapsam (Kanıtlı)

### Faz 1 — AR Çekirdeği (%100)

- Quick Look (iPhone) + Scene Viewer (Android) + Blender pipeline.
- GLB/USDZ model servisi, `/odamda-gor/:id` sayfası, `model-viewer` entegrasyonu.

### Faz 2 — İşlevsel Ürünlesme (%100)

- Embed widget (`public/widget.js`), merchant paneli, analytics, JWT auth.
- Upload, domain doğrulama, güvenlik sertleştirme, 13 unit test (`npm test`).

### Faz 3 Adım 1 — Production (%100)

- [x] Neon PostgreSQL 16 + `npm run db:deploy`
- [x] Vercel deploy + HTTPS (otomatik SSL)
- [x] Env: `DATABASE_URL`, `JWT_SECRET` (>=32), `STORAGE_DRIVER=local`
- [x] Health: `{"status":"ok","db":"up"}`
- [x] Panel yenilendi + merchant girişleri çalışıyor
- [x] iPhone production AR doğrulandi
- [x] GitHub güncel (`edc8f3e`)
- [ ] Özel domain (`app.rugvision.com`) → Büyüme fazına ertelendi (Adım 1'i engellemez)

Runbook: **`docs/DEPLOY.md`**

### Faz 3 Adım 3 — E-ticaret pilotu (%95)

- [x] Pilot site: **savasdogantekstil.com/rugvision** (PHP alt klasör)
- [x] Merchant: `cmqgswc5a000004lanqoxc666`, 10 SKU (`RV-LUNA-001` … `RV-NARIN-010`)
- [x] `config/rugvision.php` + `product-detail.php` widget entegrasyonu
- [x] **Canlı iPhone AR** ürün detay sayfasından
- [x] `includes/functions.php` — ana sayfa ürün kartları ürün detaya yönlendiriyor
- [ ] Opsiyonel: `index.php` slider + `footer.php` strip linkleri (eski köprü sayfası)
- [ ] Opsiyonel: domain doğrulama panelde (`savasdogantekstil.com`)

Kurulum: **`docs/PILOT-ECOMMERCE.md`**

### Faz 3 Adım 2 — Bulut depolama (%0, sırada)

- [ ] R2/S3 driver (`lib/storage.ts` üzerinden)
- [ ] Production'da kalıcı model upload

---

## 3. Son Kontrol (17.06.2026)

| Kontrol | Sonuç |
|---------|-------|
| `npm run lint` | Geçti |
| `npm test` | 13/13 geçti |
| `npx tsc --noEmit` | Hata yok |
| `npm run build` | Başarılı |
| Production health | `ok`, `db: up` |
| Widget API (RV-ARYA-003) | 200, `model3dUrl` dolu |
| Pilot ürün detay + widget | Buton + AR çalışıyor |
| iPhone Quick Look (pilot site) | Halı görüldü, zemine oturdu |

---

## 4. Kabul / Doğrulama Kanıtları

| Test | Sonuç |
|------|-------|
| Production health | **200 OK, db: "up"** |
| RugVision panel | Çalışıyor (`demo@` + `savas@`) |
| Pilot widget API (RV-ARYA-003) | **200, model3dUrl dolu** |
| Pilot ürün detay + widget | **Buton + AR çalışıyor** |
| iPhone Quick Look (pilot site) | **Halı görüldü, zemine oturdu** |
| GLB production | `rugvision-o54d.vercel.app/models/Modern_rug.glb` → 200 |
| USDZ production | `/api/v1/ar/usdz/Modern_rug.usdz` → 200 |
| Otomatik testler | 13/13 |

---

## 5. Canlı Erişim

### RugVision SaaS

| Alan | Değer |
|------|-------|
| Site | https://rugvision-o54d.vercel.app |
| Panel | https://rugvision-o54d.vercel.app/panel |
| Health | https://rugvision-o54d.vercel.app/api/v1/health |
| Demo merchant | `demo@ornek.com` / `Test12345!` |
| Pilot merchant | `savas@rugvision.com` / `Savas2026!` |

### Pilot müşteri sitesi

| Alan | Değer |
|------|-------|
| Mağaza | https://savasdogantekstil.com/rugvision/ |
| Test ürün | https://savasdogantekstil.com/rugvision/product-detail.php?id=3 |
| Merchant ID | `cmqgswc5a000004lanqoxc666` |
| Örnek SKU | `RV-ARYA-003` |

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

## 6. Model formatları

| Format | Rol | AR'de kullanılır mi? |
|--------|-----|----------------------|
| **GLB** | Android Scene Viewer, masaüstü 3D | Evet |
| **USDZ** | iPhone Quick Look | Evet |
| JPG / PNG / WebP | Ürün fotoğrafı, kapak görseli | Hayır (AR modeli değil) |

Pilot'te tüm ürünlerde tek demo model (`Modern_rug.glb` / `Modern_rug.usdz`) kullanıldı.
İleride ürün bazlı GLB/USDZ üretilecek.

---

## 7. Cihaz uyumluluğu (AR)

RugVision **tüm cihazlarda** açılır; **tam zemin AR** cihaz ve işletim sistemine bağlıdır.

| Platform / marka | Tam AR (odaya koyma) | Not |
|------------------|----------------------|-----|
| **iPhone / iPad** | Evet | Quick Look — en stabil demo cihazi |
| **Samsung, Pixel** | Evet | ARCore + Scene Viewer |
| **Oppo / Vivo (global)** | Çoğunlukla evet | GMS + destek listesindeki modeller |
| **POCO / Xiaomi** | Kısmen | Modele ve ROM'a bağlı; bazı cihazlarda Play/ARCore hatası |
| **Honor (yeni global)** | Modele göre | GMS'li modellerde genelde çalışır |
| **Huawei (2019+)** | Hayır (tam AR) | Google servisleri yok → **3D görüntüleme** fallback |
| **Masaüstü** | Hayır (tam AR) | 3D önizleme modal |

Desteklenmeyen cihazlarda widget yine açılır; müşteri modeli **3D olarak** döndürüp inceleyebilir.

---

## 8. Kalan İşler

| Öncelik | İş | Durum |
|---------|-----|-------|
| 1 | R2/S3 bulut depolama | Bekliyor (Adım 2) |
| 2 | Ürün bazlı 3D modeller | Bekliyor |
| 3 | Pilot slider/footer linkleri | Opsiyonel cila |
| 4 | Özel domain (`app.rugvision.com`) | Opsiyonel |
| 5 | Shopify/WooCommerce, AI zemin, CI | Büyüme fazı |

---

## 9. Süre Tahmini

| Aşama | Durum |
|-------|-------|
| Faz 1–2 | %100 |
| **Faz 3 Adım 1** | **%100** |
| Faz 3 Adım 3 pilot | %95 |
| Faz 3 Adım 2 (R2/S3) | %0 — bekliyor |

**Tüm proje (tam vizyon):** ~%83-86  
**TEMEL satış paketi:** ~%93 — kalan ~2-3 iş günü (R2/S3)  
**Tam ürünlesme ek sure:** +10-14 iş günü

---

## 10. Sonuç

RugVision artık sadece kendi sunucusunda değil, **gerçek bir halı e-ticaret sitesinde**
canlı AR olarak çalışıyor. Production altyapısı tamamlandı; pilot başarılı.

Sıradaki kritik teknik is: **R2/S3 bulut depolama** (Adım 2).

---

## 11. İlgili dokümanlar

| Dosya | İçerik |
|-------|--------|
| `README.md` | Kurulum, API özeti, widget kullanımi |
| `VR_ODANDA_GOR.md` | Faz takibi, adım adım plan, resmi proje tanımı |
| `docs/DEPLOY.md` | Production deploy runbook |
| `docs/PILOT-ECOMMERCE.md` | PHP pilot entegrasyon rehberi |
| `docs/rugvision-master-reference-v1.md` | Master referans |
