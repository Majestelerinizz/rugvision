# VR Odamda Gor - Proje Takip Dokumani

Bu dosya, RugVision "Odamda Gor" gelistirmesini 3 fazda takip etmek icin hazirlandi.  
Tamamlananlar isaretlendi, kalanlar bos birakildi.

## Projenin Genel Tanimi

RugVision; halici ve ev dekorasyon markalarinin urun sayfalarina tek satir kod ile
"Odamda Gor" ozelligi ekleyebilmesini hedefleyen SaaS AR platformudur.

Urun hedef davranisi:

- E-ticaret urun detay sayfasinda `Sepete Ekle` butonu yaninda `Odamda Gor` butonu gosterilir.
- Kullanici butona bastiginda telefonunda AR deneyimi acilir.
- iPhone tarafinda Quick Look (`USDZ`), Android tarafinda Scene Viewer/WebXR (`GLB`) akisi kullanilir.
- Kullanici haliyi kendi odasinin zemininde gorerek satin alma kararini daha dogru verir.

Desteklenecek cihaz hedefi:

- iPhone (Safari/Quick Look)
- Android ekosistemi (Samsung, Xiaomi, Huawei dahil, cihaz destegine gore Scene Viewer/WebXR)

## Son Guncellemeler (Bu Asamaya Kadar)

### Pilot entegrasyon (16–17.06.2026) — savasdogantekstil.com/rugvision CANLI AR ✅
- [x] Ilk gercek e-ticaret pilot sitesi: **https://savasdogantekstil.com/rugvision/** (PHP, 10 urun, SKU'lu).
- [x] Pilot merchant olusturuldu: **Savas Dogan Tekstil** (`savas@rugvision.com`).
- [x] Merchant ID: `cmqgswc5a000004lanqoxc666`.
- [x] `products.sql` ile birebir **10 SKU** RugVision paneline eklendi (`RV-LUNA-001` … `RV-NARIN-010`).
- [x] Demo model: `/models/Modern_rug.glb` + USDZ (tum urunlerde pilot icin).
- [x] `config/rugvision.php` hosting'e yuklendi (widget base + merchant ID).
- [x] `product-detail.php` widget entegrasyonu tamamlandi (eski koprü butonu kaldirildi).
- [x] **iPhone'da canli AR dogrulandi** — urun detay sayfasindan Quick Look acildi, hali goruldu.
- [~] `includes/functions.php` — ana sayfa urun kartlarindaki "Odanda Gor" linki (1 satir, Adim 3 bekliyor).
- [x] Model format notu: AR icin **GLB + USDZ zorunlu**; JPG/PNG/WebP sadece urun fotografi (`coverImage`).

**Pilot embed ornegi (`product-detail.php`):**
```html
<script src="https://rugvision-o54d.vercel.app/widget.js"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="<?= e($product['sku']) ?>"
  data-target="[data-rugvision]"
  defer></script>
```

**Pilot test URL:** `https://savasdogantekstil.com/rugvision/product-detail.php?id=3` (Arya, SKU: `RV-ARYA-003`)

Detayli kurulum: **`docs/PILOT-ECOMMERCE.md`**

### Production (16.06.2026) — Vercel + Neon CANLI
- [x] **Neon PostgreSQL** acildi (proje: `rugvision`, Postgres 16, AWS US East 1).
- [x] `npm run db:deploy` ile sema Neon'a uygulandi (migration basarili).
- [x] **Vercel production deploy** tamamlandi: `https://rugvision-o54d.vercel.app`
- [x] GitHub `main` guncellendi (commit `fae8c2c`: guvenlik + production hazirligi).
- [x] `/api/v1/health` production'da `{"status":"ok","db":"up"}` donuyor.
- [x] Ilk production merchant olusturuldu: **Demo Magaza** (`demo@ornek.com`).
- [x] Ilk production hali eklendi: **Modern Hali** (SKU: `HALI-001`).
- [x] **iPhone 12** uzerinde production HTTPS ile Quick Look AR dogrulandi (sorunsuz).
- [x] SKU widget eslemesi production'da calisiyor (`data-merchant-id` + `data-sku`).
- [x] `DATABASE_URL` format hatasi cozuldu: Vercel'e sadece `postgresql://...` (psql/tirnak/channel_binding OLMAMALI).

### Onceki asama (lokal + tunnel)
- [x] `odamda-gor/:id` demo sayfasi ile 3D model goruntuleme aktif edildi.
- [x] `model3dUrl` alanindan urune dinamik model baglama tamamlandi.
- [x] iOS Quick Look icin ozel USDZ endpointi eklendi: `/api/v1/ar/usdz/:filename`
- [x] USDZ dosyasi dogru `Content-Type` (`model/vnd.usdz+zip`) ile servis edilir hale getirildi.
- [x] Postman koleksiyonu genisletildi (Auth + Rugs + Widget test adimlari).
- [x] Localtunnel uzerinden iPhone HTTPS test akisi kuruldu.
- [x] USDZ/GLB model kalitesi/pivot/olcek Blender ile otomatik (headless script) duzeltildi: 2.30 x 1.60 x 0.02 m, yere yatik, pivot ortalanmis.
- [x] Tekrarlanabilir model duzeltme scripti eklendi: `scripts/fix_rug_model.py`.
- [x] iPhone Quick Look "nesne acilamadi" hatasi cozuldu: USDZ Y-up + ASCII (.usda) icerikli, STORED + 64-byte hizali Apple-spec paket olarak yeniden uretildi (`scripts/export_quicklook_usdz.py`).
- [x] iPhone'da AR dogrulandi: hali gercek boyutta yere oturuyor, tasima/dondurme/olceklendirme calisiyor.
- [x] Android icin Scene Viewer intent fallback eklendi (`ar-viewer-client.tsx`); GLB `model/gltf-binary` ile servis ediliyor.
- [x] Tek satir embed widget yazildi (`public/widget.js`): "Sepete Ekle" yanina otomatik "Odamda Gor" butonu enjekte ediyor.
- [x] Analytics endpointi eklendi (`/api/v1/analytics/events`) + CORS; WIDGET_OPENED/AR_STARTED/VIEW_3D/PRODUCT_VIEWED kaydediliyor.
- [x] Mobil AR kritik duzeltmesi: iframe icinden mobil AR engellendigi icin widget mobilde dogrudan AR tetikliyor (iOS Quick Look / Android Scene Viewer), masaustunde 3D modal kaliyor.
- [x] Embed test sayfasi (`public/widget-demo.html`): otomatik buton + her zaman calisan dogrudan AR (`rel="ar"`) baglantisi.
- [x] Sabit demo adresi: `https://rugvision-demo.loca.lt` (localtunnel `--subdomain rugvision-demo`).
- [x] Otomatik yeniden baglanan sabit tunnel scripti eklendi: `scripts/tunnel.mjs` + `npm run tunnel` / `npm run dev:all` (koparsa ayni adrese tekrar baglanir).
- [x] Tunnel "kendi kendini iyilestirme" iyilestirildi: surec artik kendiliginden kapanmiyor (keepalive), saglik kontrolu 429/4xx'i "canli" sayiyor (yanlis-pozitif reconnect yok), sadece gercek gateway/timeout hatalarinda yeniden baglaniyor. Boylece "Tunnel is busy" churn'i giderildi.
- [x] Kesintisiz calisma icin `baslat.bat` eklendi: tum surec cokerse 3 sn'de otomatik yeniden baslar; Cursor kapali olsa da calismaya devam eder.
- [x] Merchant paneli tarayicida canli dogrulandi: giris + analytics kartlari (1 hali / 7 widget acilis / 4 AR baslatma / 9 3D goruntuleme) + hali listesi + embed kodu ureteci calisiyor.

## Faz 1 - MVP Temel Altyapi

- [x] Prisma veri modeli kuruldu (users, merchants, rugs, widget_settings, analytics_events vb.)
- [x] Veritabani migration calisti
- [x] Prisma client uretildi ve adapter ile calisir hale getirildi
- [x] `GET /api/v1/health` endpointi aktif
- [x] Auth endpointleri aktif (`register`, `login`, `refresh`, `logout`)
- [x] `forgot-password` ve `reset-password` MVP placeholder endpointleri eklendi
- [x] Rugs CRUD endpointleri aktif (`GET/POST`, `GET/PUT/DELETE :id`)
- [x] Widget endpointleri aktif (`/api/v1/widget/rug/:id`, `/api/v1/widget/settings`)
- [x] Postman koleksiyonu olusturuldu ve test edildi (Auth + Rugs)
- [x] `model3dUrl` ile urune 3D model baglama tamamlandi
- [x] `odamda-gor/:id` sayfasi olusturuldu (model-viewer ile 3D/AR demo)
- [x] iOS Quick Look icin `usdz` servis endpointi eklendi (`/api/v1/ar/usdz/:filename`)
- [x] iPhone Safari uzerinden AR akisina giris dogrulandi (kamera/Quick Look aciliyor)
- [x] iOS buton fallback'i iyilestirildi (Quick Look tetikleme akisi)
- [x] USDZ model kalite-optimizasyonu (zemine dogru olcek ve pivot) tamamlandi (Blender headless script ile)
- [x] iPhone Quick Look uyumlulugu cozuldu (Y-up + ASCII usdz) ve gercek cihazda AR test edildi
- [x] Android Scene Viewer fallback eklendi (GLB tabanli AR akisi hazir)

Faz 1 Durumu: **Tamamlandi (iPhone'da AR canli test edildi)**.

---

## Faz 2 - Islevsel Urunlesme

- [x] Abonelik plan limiti uygulandi: `POST /api/v1/rugs` aktif abonelikteki `productLimit`'i kontrol eder (abonelik yoksa engellemez); iptal/odeme-gecikmesi durumunda urun eklenemez
- [x] JWT tabanli auth guard eklendi (`lib/auth-guard.ts`); korumali endpointler merchant'a gore izole (`requireAuth` + `resolveMerchantId`)
- [x] GUVENLIK SERTLESTIRME: Rugs CRUD + widget/settings artik auth + merchant izolasyonu zorunlu (eskiden acikti); `:id` islemlerinde sahiplik dogrulamasi
- [x] GUVENLIK: tum endpointlerde standart hata (`lib/api.ts` + `lib/errors.ts`) + zod dogrulama (`lib/validation.ts`); ham hata mesaji sizdirilmiyor; P2002 -> 409 CONFLICT
- [x] GUVENLIK: rate limiting (`lib/rate-limit.ts`) login/register/refresh/analytics/widget/domain-verify; brute-force + kullanici-sayimi (enumeration) onleme
- [x] GUVENLIK: JWT issuer/audience + HS256 sabit + JWT_SECRET < 32 karakter ise uygulama baslamaz; guclu parola politikasi (harf+rakam)
- [x] GUVENLIK: HTTP guvenlik basliklari (`next.config.ts`): HSTS, nosniff, Referrer-Policy, Permissions-Policy, clickjacking'e karsi X-Frame-Options/CSP (embed icin `/odamda-gor` haric)
- [x] GUVENLIK: domain dogrulamada SSRF korumasi (ozel-ic IP reddi + redirect takibi kapali)
- [x] Panel oturum dayanikliligi: refresh token saklanir, access token dolunca 401'de otomatik yenilenir
- [x] Gercek widget embed scripti (`public/widget.js`) uretildi ve test edildi (tek satir kod)
- [x] Urun sayfasinda `Sepete Ekle` yanina otomatik `Odamda Gor` butonu enjekte ediliyor
- [x] Farkli tema yapilarinda buton selector fallback mekanizmasi eklendi (common add-to-cart selector listesi + `data-target`)
- [x] Widget acilis/AR/3D/urun goruntuleme eventleri `analytics_events` tablosuna yaziliyor (WIDGET_OPENED, AR_STARTED, VIEW_3D, PRODUCT_VIEWED)
- [x] Widget-facing endpointlere CORS eklendi (`/api/v1/widget/rug/:id`, `/api/v1/analytics/events`)
- [x] Iframe modal embed gorunumu eklendi (`/odamda-gor/:id?embed=1`)
- [x] Embed test ortami: `public/widget-demo.html` (sahte urun sayfasi)
- [x] Mobil AR duzeltmesi: iframe icinden mobil AR engellendigi icin widget mobilde dogrudan AR tetikliyor (iOS Quick Look anchor / Android Scene Viewer intent), masaustunde 3D modal kaliyor
- [x] Dashboard ozet endpointi tamamlandi: `GET /api/v1/analytics/overview` (toplamlar + tipe gore + en cok AR alan halilar)
- [x] Merchant paneli eklendi: `/panel` (giris, analytics, hali listesi, model yukleme, embed kodu ureteci)
- [x] Domain dogrulama akisi tamamlandi: `POST /api/v1/domains` (kayit) + `POST /api/v1/domains/verify` (.well-known dosya kontrolu) + `GET` liste
- [x] Dosya yonetimi akisi tamamlandi: `POST /api/v1/uploads/model` (GLB/USDZ/GLTF upload + URL doner)
- [x] API hata kodlari standardize edildi (`lib/api.ts`: BAD_REQUEST/UNAUTHORIZED/FORBIDDEN/NOT_FOUND/CONFLICT/UNPROCESSABLE/INTERNAL)
- [x] Yeni endpointler uctan uca test edildi (register -> token -> overview/domains/verify/upload)
- [x] Depolama soyutlamasi eklendi (`lib/storage.ts`): upload artik driver uzerinden calisir; su an `local` driver aktif, R2/S3 driver Faz 3 Adim 2'de tek noktadan eklenecek (kod degismeden `STORAGE_DRIVER` ile secilir)
- [x] Otomatik test paketi eklendi: `node:test` + `tsx`, `npm test` (13 test) - slug, SSRF host kontrolu, rate limit, JWT imzala/dogrula guvenlik-kritik saf mantik kapsandi
- [x] (Faz 3 hazirligi) Widget SKU eslemesi: `data-rug-id` yerine `data-merchant-id` + `data-sku` ile cozumleme (`GET /api/v1/widget/rug?merchantId=&sku=`)

Faz 2 Durumu: **%100 Tamamlandi** - embed widget + buton enjeksiyonu + analytics + panel + upload + domain dogrulama + hata standardi + abonelik plan limiti + depolama soyutlamasi + otomatik test + guvenlik sertlestirme calisir durumda.

---

## Faz 3 - Adim Adim Plan (Karisiklik Olmasin)

Faz 3, sirayla yapilacak 7 adimdan olusur. Her adimin bagimliligi bir oncekidir;
yukaridan asagiya gidilir. Toplam: TEMEL (Adim 1-3) ~6-10 gun, BUYUME (Adim 4-7) +12-18 gun.

### ADIM 1 - Production yayini (siteyi internete tasi)  [~2 gun]
> Amac: `localhost`/tunnel yerine gercek, kalici HTTPS adres.
> **DURUM: %100 TAMAMLANDI** — `https://rugvision-o54d.vercel.app` (Neon DB, health OK, HTTPS, panel, AR).
> Runbook: **`docs/DEPLOY.md`**
- [x] 1.1 Yonetilen veritabani acildi: **Neon** (proje `rugvision`, Postgres 16)
- [x] 1.2 Vercel env: `DATABASE_URL` + `JWT_SECRET` (>=32) + `STORAGE_DRIVER=local`
- [x] 1.3 `npm run db:deploy` ile tablolar Neon'a kuruldu
- [x] 1.4 Vercel'e deploy edildi (GitHub `256a49e`, build: `prisma generate && next build`)
- [x] 1.5 HTTPS production adresi aktif (Vercel otomatik SSL) — **TAMAM**
- [x] 1.6 Tunnel artik production icin gereksiz (sadece lokal gelistirme icin kalir)

> **Not:** Ozel alan adi (`app.rugvision.com`) Adim 1 kapsami disinda birakildi; Buyume fazinda opsiyonel.

**Production erisim:**
- Site: `https://rugvision-o54d.vercel.app`
- Panel: `https://rugvision-o54d.vercel.app/panel`
- Health: `https://rugvision-o54d.vercel.app/api/v1/health`
- Ornek AR: `https://rugvision-o54d.vercel.app/odamda-gor/<RUG_ID>`

### ADIM 2 - Model dosya altyapisi (bulut depolama + otomatik uretim)  [~3-4 gun]
> Amac: Modelleri sunucu diski yerine bulutta tut; yuzlerce hali icin uretimi otomatiklestir.
> HAZIRLIK YAPILDI: `lib/storage.ts` driver soyutlamasi mevcut; sadece yeni driver eklenip `STORAGE_DRIVER` ile secilecek (route kodu degismez).
- [ ] 2.1 Bulut depolama bagla (Cloudflare R2 / AWS S3 / Backblaze B2) — `StorageDriver` arayuzune yeni driver ekle
- [ ] 2.2 `STORAGE_DRIVER=s3` (vb.) ile yeni driver'i etkinlestir (`uploads/model` zaten soyutlama uzerinden calisiyor)
- [ ] 2.3 **Otomatik model uretimi**: urun fotografi (ustten) + en/boy olcusu -> gercek boyutlu dokulu GLB
- [ ] 2.4 Otomatik GLB -> USDZ donusum hatti (sunucu tarafi, iOS uyumlu)
- [ ] 2.5 Model pipeline standardi: olcek, pivot, axis, texture sabitlensin

### ADIM 3 - E-ticaret entegrasyonu (musteri sitesine ekleme)  [~1-2 gun]
> Amac: Tek satir kod ile musteri urun sayfasinda buton + AR.
> **DURUM: PILOT CANLI** — `savasdogantekstil.com/rugvision` urun detayda AR calisiyor.
- [x] 3.1 Embed kurulum dokumani: `docs/PILOT-ECOMMERCE.md` (PHP alt klasor `/rugvision`)
- [x] 3.2 Ilk pilot musteri sitesi: **savasdogantekstil.com/rugvision** — `product-detail.php` widget
- [x] 3.3 SKU eslemesi: 10 urun (`RV-LUNA-001` … `RV-NARIN-010`) merchant `cmqgswc5a000004lanqoxc666`
- [x] 3.4 Canli AR testi: iPhone Quick Look, urun detay sayfasindan **BASARILI**
- [x] 3.5 Ana sayfa urun kartlari: `functions.php` — "Odanda Gor" artik urun detaya yonlendiriyor
- [ ] 3.6 Domain dogrulama: `savasdogantekstil.com` panelde kayit (opsiyonel guvenlik)

Faz 3 Durumu: **Adim 1 + Adim 3 pilot TAMAM (detay + kartlar); Adim 2 (R2/S3) sirada.**

### ADIM 4 - Platform eklentileri  [BUYUME]
> Amac: Kurulumu "tek tik" yapan resmi eklentiler.
- [ ] 4.1 Shopify uygulamasi/eklentisi MVP
- [ ] 4.2 WooCommerce eklentisi MVP

### ADIM 5 - AR kalite ve cihaz testleri  [BUYUME]
- [ ] 5.1 iOS Quick Look + Android Scene Viewer coklu cihazda dogrulama (genis matris)
- [~] 5.2 Production (HTTPS) uzerinde mobil AR acceptance testi (iPhone 12 Quick Look OK; genis matris bekliyor)
- [ ] 5.3 En az 10 urunde AR gecis raporu

### ADIM 6 - AI ozellikleri  [BUYUME]
- [ ] 6.1 AI floor (zemin) detection ilk surum
- [ ] 6.2 AI room (oda) detection ilk surum

### ADIM 7 - Izleme, raporlama ve otomasyon  [BUYUME]
- [ ] 7.1 Donusum + AR kullanim analitikleri dashboard'da raporlansin
- [ ] 7.2 Otomatik test paketi (E2E runner) + CI
- [ ] 7.3 (Opsiyonel) Abonelik/plan limitleri

Faz 3 Durumu: **Adim 1 + Adim 3 pilot CANLI; Adim 2 (R2/S3) sirada.**

---

## Model formatlari (AR icin onemli)

| Format | Rol | AR'de kullanilir mi? |
|--------|-----|----------------------|
| **GLB** | Android Scene Viewer, masaustu 3D | ✅ Evet |
| **USDZ** | iPhone Quick Look | ✅ Evet |
| JPG / PNG / WebP | Urun fotografi, kapak gorseli | ❌ AR modeli degil |

Halici fotoğraf verir; sistem (manuel veya otomatik pipeline) GLB/USDZ uretir. Pilotte tum urunlerde tek demo model (`Modern_rug.glb`) kullanildi.

---

## Hemen Sonraki Is (Oncelik) + Faz 3 Gun Plani

Faz 1 ve Faz 2 cekirdek isleri tamamlandi. **Adim 1 (production) CANLI.** Siradaki oncelikler:

### A) Tek gercek musteriyi (orn. tarzhaliconcept.com) canliya alma - TEMEL
| Is | Durum | Tahmini gun |
|----|-------|-------------|
| Production deploy (Vercel + Neon DB) | **TAMAM** | — |
| Kalici domain + HTTPS | opsiyonel | 0.5 |
| Bulut depolama (R2/S3) | **SIRADA** | 1-2 |
| Otomatik foto+olcu -> GLB/USDZ uretimi (ilk surum) | bekliyor | 2-3 |
| Musteri temasina embed + buton yerlesimi + SKU eslemesi | **PILOT TAMAM** (detay sayfasi) | — |
| Gercek halilarla test (birkac urun) | **iPhone AR OK** (savasdogantekstil) | — |
| Ana sayfa kart linkleri (`functions.php`) | bekliyor | 0.1 |
| **Kalan toplam** | | **~5-8 is gunu** |

### B) Tam urunlesme (her e-ticarete dagitilabilir) - BUYUME
- Shopify + WooCommerce resmi eklentileri
- AI floor/room detection ilk surum
- Coklu cihaz AR kabul testleri (genis matris)
- Oto donusum hattinin olgunlasmasi + otomatik test runner + CI
- **Ek sure:** ~12-18 is gunu

**Ozet:** Production CANLI; tek musteride canli pilot ~1 hafta; tam urunlesmis hal ~4-6 hafta.

---

## E-Ticaret Entegrasyon Modeli (Onemli)

RugVision widget'i **backend-bagimsizdir**. Musteri sitesinin arka plani PHP, Laravel,
WordPress/WooCommerce, OpenCart, Shopify veya duz HTML olabilir; fark etmez. Cunku
`widget.js` tamamen tarayicida (client-side) calisir.

Calisma modeli:

```
[Musteri sitesi - orn. PHP]              [RugVision - bizim sunucu]
   urun detay sayfasi                       Next.js + DB + 3D modeller
        |                                            ^
        |  <script src=".../widget.js" ...>  ------> |
        |                                            |
        +-- "Odamda Gor" butonu otomatik <-- AR <----+
            "Sepete Ekle" yanina eklenir
```

- Musterinin PHP koduna dokunulmaz; veritabanlari birlestirilmez.
- Tek satir kod urun sayfasi sablonuna yapistirilir (ornek pilot):
  `<script src="https://rugvision-o54d.vercel.app/widget.js" data-merchant-id="cmqgswc5a000004lanqoxc666" data-sku="RV-ARYA-003" data-target="[data-rugvision]" defer></script>`
- `data-target` ile sitedeki hedef alan secilir (pilot: `[data-rugvision]` veya `.js-add-cart`).
- Bu yuzden PHP/Laravel site ile "birlestirme" derdi YOKTUR; sadece bir HTML satiri.

---

## Pazar / Rakip Analizi (Dogrulama)

Ayni isi yapan referans siteler (hedef davranis dogrulandi):

- Sultan Hali - "Haliyi Odanda Gor" (oda fotografi yukle + halici yerlestir + renk/desen dene)
- Pera Hali - "Odalara Gore Halilar"
- Evinde Gor (Gumussuyu Hali)

Fark: Bu ornekler cogunlukla **foto uzerine 2D yerlestirme** kullanir; RugVision **canli
kamera AR** (Quick Look / Scene Viewer) ile gercek zemine gercek boyutta yerlestirir -
yani daha modern bir yontem. Istenirse ileride "oda fotografi yukle" modu da eklenebilir.

---

## Satisa Cikis Paketi (Faz 3 Sonrasi)

Bu bolum, Faz 3 tamamlandiginda halici firmalara sunulacak operasyon modelini ozetler.

### Halicidan Istenenler

- [ ] Urun verisi: SKU, urun adi, olcu, fiyat
- [ ] Urun gorselleri
- [ ] 3D model dosyalari (`GLB` ve iOS icin `USDZ`) veya GLB verip donusumu bize birakma onayi
- [ ] Site entegrasyon yetkisi (Shopify admin / ozel tema script erisimi)
- [ ] Marka ozellestirme bilgileri (buton metni, renk, logo)
- [ ] Domain dogrulama icin gerekli DNS/teknik onay

### RugVision Tarafindan Verilecekler

- [ ] `Sepete Ekle` yaninda calisan `Odamda Gor` butonu
- [ ] iPhone (Quick Look) + Android (Scene Viewer/WebXR) AR deneyimi
- [ ] Merchant paneli (urun/model/widget yonetimi)
- [ ] Analitik paneli (tiklama, AR acilis, donusum metrikleri)
- [ ] Entegrasyon dokumani + canliya alim destegi
- [ ] Teknik destek ve model kalite kontrol sureci

### Canliya Gecis Kontrol Listesi

- [ ] En az 10 urunde AR test gecis raporu
- [ ] iPhone ve Android cihaz testleri tamamlandi
- [ ] Tum kritik urun sayfalarinda buton gorunurlugu dogrulandi
- [ ] Analytics eventleri dogru sekilde kaydoluyor
- [ ] Domain dogrulama ve HTTPS production yayini tamam
- [ ] Destek/SLA ve iletisim kanali netlestirildi

---

## Son Durum (Gun Sonu Ozeti)

### Pilot + Production (17.06.2026)
- [x] **Ilk gercek halici pilot CANLI:** https://savasdogantekstil.com/rugvision/
- [x] Merchant: Savas Dogan Tekstil (`cmqgswc5a000004lanqoxc666`), 10 SKU eslemesi.
- [x] Urun detayda widget + **iPhone Quick Look AR basarili** (canli musteri sitesi).
- [x] Merchant paneli yenilendi (okunakli UI, SKU tabanli embed ureteci) — commit `ef4295a`.
- [x] E-ticaret `functions.php` kart linki tamamlandi (Adim 3).

### Production (16.06.2026)
- [x] **Vercel + Neon production CANLI:** `https://rugvision-o54d.vercel.app`
- [x] Health: `db: "up"` — Neon baglantisi calisiyor.
- [x] GitHub guncel (commit `fae8c2c`): guvenlik sertlestirme + Faz 3 hazirligi.
- [x] Ilk merchant + hali production'da olusturuldu (Demo Magaza / HALI-001).
- [x] iPhone 12 production HTTPS uzerinde Quick Look AR dogrulandi.
- [x] Panel girisi production'da calisiyor.

### Onceki tamamlananlar
- [x] Postman testleriyle auth + rugs + widget akislari dogrulandi.
- [x] iPhone Quick Look AR canli cihazda dogrulandi (hali gercek boyutta yere oturuyor).
- [x] USDZ modelinin zemine dogru oturmasi cozuldu (Y-up + ASCII usdz, Blender headless pipeline).
- [x] Android Scene Viewer fallback eklendi; GLB dogru `model/gltf-binary` ile servis ediliyor.
- [x] Faz 2 cekirdegi tamamlandi: embed widget + sepete ekle yanina buton + analytics + panel + upload + domain dogrulama + hata standardi.
- [x] Sabit, kendi kendini iyilestiren demo adresi calisir durumda: `https://rugvision-demo.loca.lt` (churn/`Tunnel is busy` sorunu giderildi).
- [x] Kesintisiz calisma icin `baslat.bat` (otomatik yeniden baslatma) eklendi.
- [x] Merchant paneli tarayicida canli dogrulandi (giris + analytics + hali listesi + embed kodu ureteci).
- [x] Tunnel uzerinden uctan uca dogrulama: health/panel/login/usdz hepsi 200.
- [x] Resmi durum/kabul raporu guncellendi: `docs/PROJE_DURUM_RAPORU.md`.
- [x] E-ticaret entegrasyon modeli netlestirildi: widget backend-bagimsiz (PHP/Laravel/WooCommerce/duz HTML fark etmez), tek satir script.
- [x] Pazar/rakip analizi yapildi (Sultan Hali / Pera Hali / Evinde Gor) - hedef davranis dogrulandi; RugVision canli kamera AR ile daha modern.
- [x] Faz 3 gun plani 2 kademeye ayrildi: tek musteri canliya alma ~6-10 gun, tam urunlesme +12-18 gun.
- [x] Otomatik model uretimi (foto+olcu -> GLB/USDZ) Faz 3 onceligi olarak eklendi (yuzlerce hali icin olceklenme).
- [x] Docker'siz DB secenekleri belirlendi: Neon / Supabase / Vercel Postgres (sema ayni, sadece `DATABASE_URL`).
- [ ] Faz 3 kalan: kalici domain, bulut depolama (R2/S3), ilk halici embed, oto GLB->USDZ, Shopify/WooCommerce, AI floor detection.

---

## Timeline (Tahmini)

- **Faz 1:** %100 tamamlandi
- **Faz 2:** %100 tamamlandi (guvenlik sertlestirme dahil)
- **Faz 3 Adim 1:** %100 tamamlandi (production CANLI, HTTPS, Neon, panel)
- **Faz 3 Adim 3:** %95 tamamlandi (pilot entegrasyon tamam; opsiyonel slider/footer linkleri kaldi)
- **Faz 3 Adim 2:** devam ediyor (R2/S3)

**Tum projenin tamamlanma orani:** ~%83-86 (tam urun vizyonu)

**TEMEL paket (canli satis demosu):** ~%93 — sadece R2/S3 + opsiyonel cilalar kaldi

**Canli production adresi:** `https://rugvision-o54d.vercel.app`  
**Canli pilot musteri sitesi:** `https://savasdogantekstil.com/rugvision/`

**Kalan is gunu (tahmini):**
- TEMEL bitirmek icin: **~2-3 is gunu** (R2/S3 + opsiyonel domain/cila)
- Tam urunlesme (Shopify, AI, CI vb.): **+10-14 is gunu**

---

## RESMI PROJE TANIMI

> Bu bolum, RugVision projesinin ne oldugunu resmi ve nihai olarak tanimlar.

**Proje adi:** RugVision

**Tur:** SaaS tabanli artirilmis gerceklik (AR) platformu.

**Ne yapar (tek cumle):**
RugVision, halici ve ev dekorasyon markalarinin web sitelerine **tek satir kod** ile
"Odamda Gor" ozelligi ekleyerek, musterilerin bir haliyi satin almadan once kendi
odalarinin zemininde **telefon kameralariyla gercek boyutta** gormesini saglar.

**Cozdugu problem:**
Online hali alisverisinde musteri, halinin odasinda nasil duracagini, olcusunun ve
renginin mekanina uyup uymadigini goremez. Bu belirsizlik satin almayi zorlastirir ve
iade oranini artirir. RugVision, haliyi gercek mekanda AR ile gostererek bu belirsizligi
ortadan kaldirir; satin alma guvenini ve donusum oranini yukseltir.

**Nasil calisir:**
1. Halici, RugVision panelinden urununu ve 3D modelini (GLB/USDZ) ekler.
2. RugVision, halici sitesindeki urun sayfasina "Sepete Ekle" yaninda otomatik bir
   "Odamda Gor" butonu yerlestirir (tek satir embed script).
3. Musteri butona basar; iPhone'da Quick Look, Android'de Scene Viewer ile AR acilir.
4. Hali, musterinin odasinin zeminine gercek olcekte yerlesir.
5. Tum etkilesimler (acilis, AR baslatma, 3D goruntuleme) analitik olarak toplanir.

**Hedef kullanicilar:**
- Halici ve ev tekstili / dekorasyon markalari (e-ticaret).
- Son tuketici (urun sayfasini ziyaret eden alisveris yapan kisi).

**Desteklenen cihazlar:**
- iPhone / iPad (Safari + AR Quick Look)
- Android ekosistemi (Scene Viewer / WebXR; Samsung, Xiaomi, Huawei vb.)

**Teknik ozet:**
- Next.js 16 (App Router) + Prisma 7 + PostgreSQL.
- 3D/AR: `model-viewer`, GLB (Android/WebXR) ve USDZ (iOS Quick Look).
- Auth: JWT (access/refresh) + bcrypt; merchant bazli izolasyon.
- Embed widget: bagimsiz `widget.js` (tek satir kurulum, tema uyumlu buton enjeksiyonu).
- Analitik: olay tabanli (`analytics_events`) + merchant paneli ozet raporu.

**Ticari model (hedef):**
Halicilara aylik abonelik karsiliginda urun/model/widget yonetimi, AR deneyimi ve
analitik panel sunan bir SaaS hizmeti. (Abonelik modulu su an kapsam disi, gelistirme
onceligi "hali gosterimi" uzerinedir.)

**Mevcut olgunluk:** Faz 1 (%100), Faz 2 (%100), **Faz 3 Adim 1 (%100)**, Adim 3 pilot (%95), Adim 2 (%0).
**Toplam:** ~%83-86 | **TEMEL demo paketi:** ~%93 | **Kalan TEMEL:** ~2-3 is gunu (R2/S3).
