# RugVision — Resmi Proje Durum Raporu

> Belge turu: Proje Durum / Kabul Raporu
> Surum: 1.1
> Tarih: 16.06.2026
> Hazirlayan: RugVision Gelistirme
> Durum ozeti: **Faz 1 + Faz 2 %100 TAMAMLANDI; guvenlik sertlestirildi; Faz 3 temelleri atildi.**

---

## 1. Yonetici Ozeti

RugVision, halici ve ev dekorasyon markalarinin urun sayfalarina **tek satir kod** ile
"Odamda Gor" (artirilmis gerceklik) ozelligi ekleyebilmesini saglayan SaaS platformudur.

Bugun itibariyle platform, bir halicinin urununu kendi web sitesinde **"Sepete Ekle"
butonunun yaninda "Odamda Gor" butonu** ile gosterebilecek ve musterinin telefonuyla
haliyi kendi odasinin zemininde **gercek boyutta** gorebilecegi seviyede **calisir
durumdadir**.

**Satisa hazir demo bugun itibariyle mevcuttur.**

---

## 2. Tamamlanan Kapsam (Kanitli)

### Faz 1 — AR Cekirdegi (%100)
- 3D/AR goruntuleyici sayfasi (`/odamda-gor/:id`) — `model-viewer` tabanli.
- iPhone **Quick Look** AR: gercek cihazda (iPhone 12) test edildi; hali zemine
  gercek boyutta (2.30 x 1.60 x 0.02 m) oturuyor, tasima/dondurme/olcek calisiyor.
- Android **Scene Viewer** akisi (intent fallback) + WebXR.
- USDZ dogru `Content-Type` (`model/vnd.usdz+zip`) ile servis ediliyor.
- Model uretim hattinin otomasyonu (Blender headless scriptleri):
  - `scripts/fix_rug_model.py` (olcek/pivot/yatay yerlesim)
  - `scripts/export_quicklook_usdz.py` (iOS uyumlu Y-up + ASCII USDZ)

### Faz 2 — Islevsel Urunlesme (%100)
- **Tek satir embed widget** (`public/widget.js`): "Sepete Ekle" yanina otomatik
  "Odamda Gor" butonu enjekte eder; mobilde dogrudan AR tetikler.
- **Tema uyumu**: yaygin "sepete ekle" selector listesi + `data-target` override.
- **Analytics**: `WIDGET_OPENED`, `AR_STARTED`, `VIEW_3D`, `PRODUCT_VIEWED` eventleri
  `analytics_events` tablosuna yaziliyor (CORS + `sendBeacon`).
- **Merchant paneli** (`/panel`): giris, analitik kartlari, hali listesi, model
  yukleme, embed kodu ureteci; refresh token ile otomatik oturum yenileme.
- **Dosya yukleme** (`POST /api/v1/uploads/model`): GLB/USDZ/GLTF.
- **Domain dogrulama** (`POST /api/v1/domains` + `/verify`).
- **Abonelik plan limiti**: urun ekleme `productLimit`'e gore sinirlanir.
- **Depolama soyutlamasi** (`lib/storage.ts`): yerel driver aktif; R2/S3 driver Faz 3'te.
- **Otomatik test paketi**: `npm test` (`node:test` + `tsx`, 13 test).
- **Standart API hata kodlari** (`lib/api.ts` + `lib/errors.ts`) + zod dogrulama.
- **JWT auth guard** + merchant izolasyonu (`lib/auth-guard.ts`).

### Guvenlik Sertlestirme (Yeni)
- Rugs CRUD + widget/settings artik **auth + merchant izolasyonu** zorunlu (eskiden acikti);
  `:id` islemlerinde sahiplik dogrulamasi.
- **Rate limiting** (`lib/rate-limit.ts`): login/register/refresh/analytics/widget/domain-verify;
  brute-force + kullanici-sayimi (enumeration) onleme (sabit-zaman parola karsilastirma).
- **JWT**: issuer/audience + HS256 sabit; `JWT_SECRET < 32` ise uygulama baslamaz.
- **HTTP guvenlik basliklari** (`next.config.ts`): HSTS, nosniff, Referrer-Policy,
  Permissions-Policy, clickjacking korumasi (embed icin `/odamda-gor` haric).
- **SSRF korumasi**: domain dogrulamada ozel-ic IP reddi + redirect takibi kapali.
- Tum yanitlarda ham hata mesaji sizdirilmiyor; tekrar eden kayit -> 409 CONFLICT.

### Altyapi
- Next.js 16 (App Router) + Prisma 7 (PostgreSQL, pg adapter).
- Auth: register / login / refresh / logout (JWT, bcrypt).
- Rugs CRUD + Widget ayarlari endpointleri.
- Postman koleksiyonu (Auth + Rugs + Widget).
- Sabit, **kendi kendini iyilestiren** tunnel (`scripts/tunnel.mjs`): kopma/timeout/
  rate-limit (429) durumlarini ayirt eder, gercek kopmada ayni adrese (`rugvision-demo`)
  otomatik geri baglanir; URL hic degismez.
- Kesintisiz calisma icin otomatik yeniden baslatan baslatici: `baslat.bat`
  (cokerse 3 sn'de tekrar ayaga kalkar) + `npm run dev:all`.

---

## 3. Kabul / Dogrulama Kanitlari

| Test | Sonuc |
|------|-------|
| `GET /api/v1/health` | 200 OK |
| Auth register/login/refresh/logout | Calisiyor (Postman) |
| Rugs CRUD | Calisiyor (404/422 standart hatalar dahil) |
| iPhone Quick Look AR (gercek cihaz) | Hali yere oturuyor, olcek dogru |
| Android Scene Viewer | Intent akisi hazir |
| Embed widget buton enjeksiyonu | `widget-demo.html` uzerinde calisiyor |
| Analytics overview | Dogru sayimlar donuyor (auth korumali) |
| Domain create + verify | 201 / 422 (dogru davranis) |
| Model upload | 201 + URL donuyor |
| Yetkisiz erisim | 401/403 (auth guard calisiyor) |
| **Merchant panel (tarayici)** | **Canli giris dogrulandi: analytics kartlari (1 hali / 7 widget / 4 AR / 9 3D), hali listesi, embed kodu ureteci calisiyor** |
| Embed kodu ureteci | Panelden tek satir `<script ... widget.js ...>` uretiliyor |

---

## 4. Canli Demo Erisimi

- Merchant panel: `https://rugvision-demo.loca.lt/panel`
  - Giris: `demo@rugvision.test` / `Test12345!`
- Embed demo (halici sitesi simulasyonu): `https://rugvision-demo.loca.lt/widget-demo.html`
- Not: `loca.lt` gelistirme tuneli; ilk acilista IP sifre sayfasi gosterebilir.
  Kalici musteri teslimi gercek domain + production yayini ile yapilir.

Embed kodu (panelden uretilir, ornek):
```
<script src="https://rugvision-demo.loca.lt/widget.js" data-rug-id="<RUG_ID>" data-target=".add-to-cart" defer></script>
```

Calistirma (yerel):
```
npm run dev:all     # site + sabit tunnel birlikte (gelistirme)
baslat.bat          # kesintisiz mod: cokerse otomatik yeniden baslar
```

---

## 5. Kalan Isler (Faz 3 — Production & Buyume)

- [ ] Production yayini (Vercel/sunucu) + kalici domain + HTTPS (tunnel'siz).
- [ ] Bulut depolama (R2/S3/B2) driver'i ekle (soyutlama HAZIR: `lib/storage.ts`).
- [ ] Otomatik GLB -> USDZ donusum hatti (sunucu tarafi).
- [ ] SKU eslemesi operasyonu (widget altyapisi HAZIR: `data-merchant-id` + `data-sku`).
- [ ] Shopify ve WooCommerce resmi entegrasyon/eklenti.
- [ ] Coklu cihazda AR kabul testleri (genis cihaz matrisi).
- [ ] AI floor/room detection ilk surum.
- [ ] Rate limiter'i dagitik store'a (Upstash/Redis) tasi (cok-instance icin).
- [ ] E2E test runner + CI (birim test temeli atildi: `npm test`).

---

## 6. Sure Tahmini

| Asama | Durum | Kalan sure |
|-------|-------|------------|
| Faz 1 (AR cekirdegi) | %100 | — |
| Faz 2 (islevsel urunlesme) | %100 | — (plan limiti + depolama soyutlamasi + otomatik test + guvenlik dahil) |
| Faz 3 (production + entegrasyon + AI) | basliyor | ~12-18 is gunu |

- **Tum projenin tamamlanma orani:** ~%70.
- **Production'a tam hazir (Faz 3 dahil):** ~3.5 - 5.5 hafta.
- **Tek halici ile canli satis demosu:** BUGUN HAZIR.

---

## 7. Sonuc

Platformun **temel deger onerisi calisir durumdadir**: bir halicinin urununu, musterinin
telefonunda kendi odasinda gercek boyutta gosterme akisi uctan uca tamamlanmistir.
Geri kalan calismalar olceklenme, entegrasyon ve production sertlestirme odaklidir.
