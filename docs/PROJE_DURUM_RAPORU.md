# RugVision — Resmi Proje Durum Raporu

> Belge turu: Proje Durum / Kabul Raporu  
> Surum: 1.5  
> Tarih: 17.06.2026  
> Hazirlayan: RugVision Gelistirme  
> Durum ozeti: **Faz 1 + Faz 2 + Faz 3 Adim 1 %100; pilot CANLI AR.**

---

## 1. Yonetici Ozeti

RugVision, halici ve ev dekorasyon markalarinin urun sayfalarina **tek satir kod** ile
"Odamda Gor" (artirilmis gerceklik) ozelligi ekleyebilmesini saglayan SaaS platformudur.

**17 Haziran 2026 itibariyle:**

- Platform production'da CANLI: **https://rugvision-o54d.vercel.app**
- **Faz 3 Adim 1 (Production): %100** — Neon, Vercel HTTPS, panel, health OK
- **Ilk gercek musteri pilotu CANLI:** **https://savasdogantekstil.com/rugvision/**
- iPhone'da urun detay sayfasindan Quick Look AR **basariyla dogrulandi**
- 10 urun SKU eslemesi tamam (merchant: Savas Dogan Tekstil)
- GitHub repo guncel: **https://github.com/Majestelerinizz/rugvision** (commit `edc8f3e`)

**Temel deger onerisi (haliyi odada AR ile gosterme) gercek musteri sitesinde kanitlandi.**

---

## 2. Tamamlanan Kapsam (Kanitli)

### Faz 1 — AR Cekirdegi (%100)

- Quick Look (iPhone) + Scene Viewer (Android) + Blender pipeline.
- GLB/USDZ model servisi, `/odamda-gor/:id` sayfasi, `model-viewer` entegrasyonu.

### Faz 2 — Islevsel Urunlesme (%100)

- Embed widget (`public/widget.js`), merchant paneli, analytics, JWT auth.
- Upload, domain dogrulama, guvenlik sertlestirme, 13 unit test (`npm test`).

### Faz 3 Adim 1 — Production (%100)

- [x] Neon PostgreSQL 16 + `npm run db:deploy`
- [x] Vercel deploy + HTTPS (otomatik SSL)
- [x] Env: `DATABASE_URL`, `JWT_SECRET` (>=32), `STORAGE_DRIVER=local`
- [x] Health: `{"status":"ok","db":"up"}`
- [x] Panel yenilendi + merchant girisleri calisiyor
- [x] iPhone production AR dogrulandi
- [x] GitHub guncel (`edc8f3e`)
- [ ] Ozel domain (`app.rugvision.com`) → Buyume fazina ertelendi (Adim 1'i engellemez)

Runbook: **`docs/DEPLOY.md`**

### Faz 3 Adim 3 — E-ticaret pilotu (%95)

- [x] Pilot site: **savasdogantekstil.com/rugvision** (PHP alt klasor)
- [x] Merchant: `cmqgswc5a000004lanqoxc666`, 10 SKU (`RV-LUNA-001` … `RV-NARIN-010`)
- [x] `config/rugvision.php` + `product-detail.php` widget entegrasyonu
- [x] **Canli iPhone AR** urun detay sayfasindan
- [x] `includes/functions.php` — ana sayfa urun kartlari urun detaya yonlendiriyor
- [ ] Opsiyonel: `index.php` slider + `footer.php` strip linkleri (eski kopru sayfasi)
- [ ] Opsiyonel: domain dogrulama panelde (`savasdogantekstil.com`)

Kurulum: **`docs/PILOT-ECOMMERCE.md`**

### Faz 3 Adim 2 — Bulut depolama (%0, sirada)

- [ ] R2/S3 driver (`lib/storage.ts` uzerinden)
- [ ] Production'da kalici model upload

---

## 3. Son Kontrol (17.06.2026)

| Kontrol | Sonuc |
|---------|-------|
| `npm run lint` | Gecti |
| `npm test` | 13/13 gecti |
| `npx tsc --noEmit` | Hata yok |
| `npm run build` | Basarili |
| Production health | `ok`, `db: up` |
| Widget API (RV-ARYA-003) | 200, `model3dUrl` dolu |
| Pilot urun detay + widget | Buton + AR calisiyor |
| iPhone Quick Look (pilot site) | Hali goruldu, zemine oturdu |

---

## 4. Kabul / Dogrulama Kanitlari

| Test | Sonuc |
|------|-------|
| Production health | **200 OK, db: "up"** |
| RugVision panel | Calisiyor (`demo@` + `savas@`) |
| Pilot widget API (RV-ARYA-003) | **200, model3dUrl dolu** |
| Pilot urun detay + widget | **Buton + AR calisiyor** |
| iPhone Quick Look (pilot site) | **Hali goruldu, zemine oturdu** |
| GLB production | `rugvision-o54d.vercel.app/models/Modern_rug.glb` → 200 |
| USDZ production | `/api/v1/ar/usdz/Modern_rug.usdz` → 200 |
| Otomatik testler | 13/13 |

---

## 5. Canli Erisim

### RugVision SaaS

| Alan | Deger |
|------|-------|
| Site | https://rugvision-o54d.vercel.app |
| Panel | https://rugvision-o54d.vercel.app/panel |
| Health | https://rugvision-o54d.vercel.app/api/v1/health |
| Demo merchant | `demo@ornek.com` / `Test12345!` |
| Pilot merchant | `savas@rugvision.com` / `Savas2026!` |

### Pilot musteri sitesi

| Alan | Deger |
|------|-------|
| Magaza | https://savasdogantekstil.com/rugvision/ |
| Test urun | https://savasdogantekstil.com/rugvision/product-detail.php?id=3 |
| Merchant ID | `cmqgswc5a000004lanqoxc666` |
| Ornek SKU | `RV-ARYA-003` |

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

## 6. Model formatlari

| Format | Rol | AR'de kullanilir mi? |
|--------|-----|----------------------|
| **GLB** | Android Scene Viewer, masaustu 3D | Evet |
| **USDZ** | iPhone Quick Look | Evet |
| JPG / PNG / WebP | Urun fotografi, kapak gorseli | Hayir (AR modeli degil) |

Pilotte tum urunlerde tek demo model (`Modern_rug.glb` / `Modern_rug.usdz`) kullanildi.
Ileride urun bazli GLB/USDZ uretilecek.

---

## 7. Cihaz uyumlulugu (AR)

RugVision **tum cihazlarda** acilir; **tam zemin AR** cihaz ve isletim sistemine baglidir.

| Platform / marka | Tam AR (odaya koyma) | Not |
|------------------|----------------------|-----|
| **iPhone / iPad** | Evet | Quick Look — en stabil demo cihazi |
| **Samsung, Pixel** | Evet | ARCore + Scene Viewer |
| **Oppo / Vivo (global)** | Cogunlukla evet | GMS + destek listesindeki modeller |
| **POCO / Xiaomi** | Kismen | Modele ve ROM'a bagli; bazi cihazlarda Play/ARCore hatasi |
| **Honor (yeni global)** | Modele gore | GMS'li modellerde genelde calisir |
| **Huawei (2019+)** | Hayir (tam AR) | Google servisleri yok → **3D goruntuleme** fallback |
| **Masaustu** | Hayir (tam AR) | 3D onizleme modal |

Desteklenmeyen cihazlarda widget yine acilir; musteri modeli **3D olarak** dondurup inceleyebilir.

---

## 8. Kalan Isler

| Oncelik | Is | Durum |
|---------|-----|-------|
| 1 | R2/S3 bulut depolama | Bekliyor (Adim 2) |
| 2 | Urun bazli 3D modeller | Bekliyor |
| 3 | Pilot slider/footer linkleri | Opsiyonel cila |
| 4 | Ozel domain (`app.rugvision.com`) | Opsiyonel |
| 5 | Shopify/WooCommerce, AI zemin, CI | Buyume fazı |

---

## 9. Sure Tahmini

| Asama | Durum |
|-------|-------|
| Faz 1–2 | %100 |
| **Faz 3 Adim 1** | **%100** |
| Faz 3 Adim 3 pilot | %95 |
| Faz 3 Adim 2 (R2/S3) | %0 — bekliyor |

**Tum proje (tam vizyon):** ~%83-86  
**TEMEL satis paketi:** ~%93 — kalan ~2-3 is gunu (R2/S3)  
**Tam urunlesme ek sure:** +10-14 is gunu

---

## 10. Sonuc

RugVision artik sadece kendi sunucusunda degil, **gercek bir hali e-ticaret sitesinde**
canli AR olarak calisiyor. Production altyapisi tamamlandi; pilot basarili.

Siradaki kritik teknik is: **R2/S3 bulut depolama** (Adim 2).

---

## 11. Ilgili dokumanlar

| Dosya | Icerik |
|-------|--------|
| `README.md` | Kurulum, API ozeti, widget kullanimi |
| `VR_ODANDA_GOR.md` | Faz takibi, adim adim plan, resmi proje tanimi |
| `docs/DEPLOY.md` | Production deploy runbook |
| `docs/PILOT-ECOMMERCE.md` | PHP pilot entegrasyon rehberi |
| `docs/rugvision-master-reference-v1.md` | Master referans |
