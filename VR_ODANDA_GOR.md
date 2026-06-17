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

- iPhone (Safari/Quick Look) — **pilot dogrulandi**
- Android: Samsung, Pixel, OPPO/vivo (Scene Viewer) — **pilot / cihaz testi dogrulandi**
- Xiaomi / POCO: ARCore uyumlu modellerde Scene Viewer; uyumsuz cihazda **3D onizleme** (tam AR desteklenmez)
- Huawei (GMS yok): **3D onizleme** (AR yok)

## Son Guncellemeler (Bu Asamaya Kadar)

- [x] Auth + Rugs + Widget temel API akislari ayaga kaldirildi ve test edildi.
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
- [x] **Production yayini:** Neon PostgreSQL + Vercel HTTPS — **https://rugvision-o54d.vercel.app** (`docs/DEPLOY.md`).
- [x] **Cloudflare R2** production: `STORAGE_DRIVER=r2`, GLB/USDZ CDN + same-origin API proxy (`/api/v1/ar/glb`, `/api/v1/ar/usdz`).
- [x] **Pilot e-ticaret CANLI:** savasdogantekstil.com/rugvision — 10 SKU, `data-merchant-id` + `data-sku` widget (`docs/PILOT-ECOMMERCE.md`).
- [x] Otomatik model pipeline: `scripts/generate_rug_model.py`, `npm run models:batch`, `npm run models:attach`, `npm run models:upload-r2`.
- [x] Cihaz AR profili: `lib/device-ar.ts` — Samsung Scene Viewer intent, iOS Quick Look, HyperOS → Chrome handoff.
- [x] **AI zemin / oda tespiti v1:** `lib/ai-detection.ts` + `lib/floor-scan-client.ts` + `POST /api/v1/ai/scans` + AR oncesi kamera heuristik (`ar-viewer-client.tsx`, `widget.js`).
- [x] AR kabul raporu (10 pilot SKU): `npm run reports:ar-acceptance` + panel CSV.
- [x] Analitik raporlari: `GET /api/v1/analytics/report`, CSV export, panel dashboard.
- [x] Abonelik / plan limitleri: `GET /api/v1/subscription`, rug olusturma limiti.
- [x] Birim testleri: `npm test` (42 test: slug, auth, device-ar, **device-matrix**, ai-detection, subscription, vb.)
- [x] Performans: widget preconnect/prefetch, GLB/USDZ cache headers, pilot LCP optimizasyonu (PageSpeed mobil 71).

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

- [~] Abonelik kurallari ve plan limitleri (su an kapsam disi - "hali gosterimi" oncelikli)
- [x] JWT tabanli auth guard eklendi (`lib/auth-guard.ts`); korumali endpointler merchant'a gore izole (`requireAuth` + `resolveMerchantId`)
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
- [x] R2/S3/B2 bulut depolama: **Cloudflare R2 production** (`STORAGE_DRIVER=r2`, `docs/R2-SETUP.md`)
- [x] Birim test paketi: `npm test` (36 test); E2E runner + CI buyume fazina ertelendi

Faz 2 Durumu: **Tamamlandi** — embed widget + buton enjeksiyonu + analytics + panel + upload + domain dogrulama + R2 depolama + hata standardi calisir durumda.

---

## Ilgili Dokumanlar

| Dosya | Icerik |
|-------|--------|
| `README.md` | Kurulum, API ozeti, widget kullanimi |
| `docs/PROJE_DURUM_RAPORU.md` | Resmi kabul / durum raporu (surum 1.7) |
| `docs/DEPLOY.md` | Production deploy runbook (Neon + Vercel) |
| `docs/DEPLOY-CONTABO.md` | Contabo CloudPanel Node.js deploy (`rugvision.vefayazilim.com`) |
| `docs/PILOT-ECOMMERCE.md` | PHP pilot entegrasyon + SKU eslemesi |
| `docs/PILOT-TAMAMLANDI.md` | Pilot tamamlanma ozeti + PageSpeed |
| `docs/MODEL-PIPELINE.md` | Batch GLB/USDZ uretim runbook |
| `docs/R2-SETUP.md` | Cloudflare R2 production kurulum |
| `docs/GROWTH-FEATURES.md` | AR rapor, AI zemin v1, QA, abonelik runbook |
| `lib/device-matrix.ts` | 18 cihaz AR yonlendirme matrisi |
| `.github/workflows/ci.yml` | GitHub Actions CI (lint + test + build) |
| `pilot-site/README.md` | Pilot site FTP / snippet rehberi |

## Faz 3 - Adim Adim Plan (Karisiklik Olmasin)

Faz 3, sirayla yapilacak 7 adimdan olusur. Her adimin bagimliligi bir oncekidir;
yukaridan asagiya gidilir. Toplam: TEMEL (Adim 1-3) ~6-10 gun, BUYUME (Adim 4-7) +12-18 gun.

**Guncel durum (Haziran 2026):** **PROJE TAMAMLANDI.** Production: Vercel + Neon + R2. Pilot canli.
Iptal/ertelenen: ozel domain (`app.rugvision.com`, `rugvision.vefayazilim.com`), Shopify/WooCommerce eklentileri.

### ADIM 1 - Production yayini (siteyi internete tasi)  [~2 gun] — **TAMAMLANDI**
> Amac: `localhost`/tunnel yerine gercek, kalici HTTPS adres.
- [x] 1.1 Yonetilen veritabani ac (Docker'siz): **Neon PostgreSQL 16**
- [x] 1.2 `.env` -> `DATABASE_URL` bulut DB'ye cevrildi
- [x] 1.3 `npm run db:deploy` / `prisma migrate deploy` ile tablolar kuruldu
- [x] 1.4 Proje **Vercel'e deploy** edildi — https://rugvision-o54d.vercel.app
- [-] 1.5 Ozel domain — **iptal / ertelendi** (production Vercel adresi ile devam)
- [x] 1.6 Tunnel ve `baslat.bat` artik sadece lokal gelistirme icin (production'da gereksiz)

Runbook: `docs/DEPLOY.md`

### ADIM 2 - Model dosya altyapisi (bulut depolama + otomatik uretim)  [~3-4 gun] — **TAMAMLANDI**
> Amac: Modelleri sunucu diski yerine bulutta tut; yuzlerce hali icin uretimi otomatiklestir.
- [x] 2.1 Bulut depolama: **Cloudflare R2** (`lib/storage.ts`, `docs/R2-SETUP.md`)
- [x] 2.2 `uploads/model` endpointi R2/local driver ile calisiyor (`STORAGE_DRIVER`)
- [x] 2.3 **Otomatik model uretimi**: urun fotografi + en/boy -> GLB (`scripts/generate_rug_model.py`)
- [x] 2.4 Otomatik GLB -> USDZ donusum (`scripts/export_quicklook_usdz.py`, batch pipeline)
- [x] 2.5 Model pipeline standardi: olcek 2.30x1.60x0.02 m, pivot, Y-up, texture (`scripts/fix_rug_model.py`)

Runbook: `docs/MODEL-PIPELINE.md` · 100+ SKU QA: `npm run models:qa`

### ADIM 3 - E-ticaret entegrasyonu (musteri sitesine ekleme)  [~1-2 gun] — **TAMAMLANDI**
> Amac: Tek satir kod ile musteri urun sayfasinda buton + AR.
- [x] 3.1 Embed kurulum dokumani: `docs/PILOT-ECOMMERCE.md`, `README.md`, `data/embed-snippets.html`
- [x] 3.2 Musteri temasinda buton yerlesimi: **savasdogantekstil.com/rugvision** (`product-detail.php`)
- [x] 3.3 SKU eslemesi: `data-merchant-id` + `data-sku` -> RugVision hali/model (`/api/v1/widget/rug`)
- [x] 3.4 Gercek halilarla uctan uca canli test: **10 SKU** (iPhone Quick Look + Samsung Scene Viewer dogrulandi)

Pilot ozet: `docs/PILOT-TAMAMLANDI.md`

### ADIM 4 - Platform eklentileri  [BUYUME] — **BEKLEMEDE**
> Amac: Kurulumu "tek tik" yapan resmi eklentiler.
- [ ] 4.1 Shopify uygulamasi/eklentisi MVP
- [ ] 4.2 WooCommerce eklentisi MVP

Not: Mevcut `widget.js` tek satir embed tum platformlarda calisir; eklenti kolay kurulum icindir.

### ADIM 5 - AR kalite ve cihaz testleri  [BUYUME] — **TAMAMLANDI**
- [x] 5.1 iOS Quick Look + Android Scene Viewer — iPhone 12, Samsung Galaxy pilot dogrulandi
- [x] 5.2 Production (HTTPS) uzerinde mobil AR acceptance testi — Vercel + pilot site
- [x] 5.3 En az 10 urunde AR gecis raporu — `npm run reports:ar-acceptance` + panel CSV
- [x] 5.4 Genis cihaz matrisi + otomatik CI — `lib/device-matrix.ts` (18 cihaz), `tests/device-matrix.test.ts`, `npm run reports:device-matrix`, `.github/workflows/ci.yml`

### ADIM 6 - AI ozellikleri  [BUYUME] — **TAMAMLANDI (v1)**
- [x] 6.1 **AI floor (zemin) detection ilk surum**
  - Motor: `lib/ai-detection.ts` (`detectFloorPlane`, `sampleBottomRegionStats`)
  - Istemci: `lib/floor-scan-client.ts` — AR oncesi kamera alt bolge analizi (heuristik v1)
  - API: `POST /api/v1/ai/scans` (`scanType: FLOOR_DETECTION`)
  - Entegrasyon: `ar-viewer-client.tsx` + `public/widget.js` (AR butonu -> tarama -> AR ac)
  - DB: `ai_scans` tablosu (Prisma `AiScan`)
  - Zemin hizalama: `model-viewer` `ar-placement="floor"` (iOS Quick Look / desteklenen Android)
- [x] 6.2 **AI room (oda) detection ilk surum**
  - Motor: `lib/ai-detection.ts` (`detectRoomContext` — portre, aspect ratio heuristikleri)
  - API: `POST /api/v1/ai/scans` (`scanType: ROOM_DETECTION`)
  - AR baslatildiginda oda baglami kaydedilir (analytics ile birlikte)

Runbook: `docs/GROWTH-FEATURES.md` (bolum 2) · Test: `tests/ai-detection.test.ts`

Not: v1 tam ML degil; cihaz + kamera heuristikleri ile AR on-hazirlik sinyali. v2 (gercek ML modeli) buyume fazina birakildi.

### ADIM 7 - Izleme, raporlama ve otomasyon  [BUYUME] — **KISMEN TAMAMLANDI**
- [x] 7.1 Donusum + AR kullanim analitikleri dashboard'da raporlaniyor (`/api/v1/analytics/report`, panel, CSV export)
- [x] 7.2 Birim test paketi: `npm test` (42 test) + GitHub Actions CI (`.github/workflows/ci.yml`)
- [x] 7.2b Cihaz matrisi raporu: `npm run reports:device-matrix` → `docs/reports/device-matrix-ar-*.csv`
- [x] 7.3 Abonelik/plan limitleri: STARTER/PRO/ENTERPRISE (`lib/subscription.ts`, panel karti)

Faz 3 Durumu: **TAMAMLANDI — PROJE BITTI.**

Canli adres: https://rugvision-o54d.vercel.app · Pilot: savasdogantekstil.com/rugvision/

---

## Hemen Sonraki Is (Oncelik) + Faz 3 Gun Plani

Faz 1, Faz 2 ve Faz 3 **TEMEL paketi** tamamlandi. Oncelik sirasi:

### A) Tamamlandi — TEMEL satis paketi
| Is | Durum |
|----|-------|
| Production deploy (Vercel + Neon DB) | **Tamamlandi** |
| Bulut depolama (Cloudflare R2) | **Tamamlandi** |
| Otomatik foto+olcu -> GLB/USDZ uretimi | **Tamamlandi** |
| Pilot musteri embed + SKU eslemesi (10 SKU) | **Tamamlandi** |
| iPhone + Samsung AR canli test | **Tamamlandi** |
| AI zemin/oda tespiti v1 | **Tamamlandi** |
| AR kabul raporu + analitik dashboard | **Tamamlandi** |

### B) Iptal / gelecek faz (simdilik yapilmayacak)
- [-] Ozel domain (`app.rugvision.com`, Contabo `rugvision.vefayazilim.com`) — **iptal**
- [-] Shopify + WooCommerce resmi eklentileri — **gerek yok** (`widget.js` yeterli)
- [-] AI v2 ML zemin segmentasyonu — v1 heuristik yeterli

**Ozet:** Satis paketi **%100 hazir ve bitti.** Production Vercel uzerinde kalir.

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
- Tek satir kod urun sayfasi sablonuna yapistirilir:
  `<script src="https://rugvision-o54d.vercel.app/widget.js" data-merchant-id="..." data-sku="..." defer></script>`
- `data-target` ile sitedeki "Sepete Ekle" butonu hedeflenir; widget butonu yanina koyar.
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

- [x] `Sepete Ekle` yaninda calisan `Odamda Gor` butonu
- [x] iPhone (Quick Look) + Android (Scene Viewer) AR deneyimi
- [x] Merchant paneli (urun/model/widget yonetimi)
- [x] Analitik paneli (tiklama, AR acilis, donusum metrikleri)
- [x] Entegrasyon dokumani + canliya alim destegi (`docs/PILOT-ECOMMERCE.md`)
- [x] AI zemin/oda on-tespiti v1 (AR oncesi kamera heuristik + `ai_scans` kaydi)
- [~] Teknik destek ve model kalite kontrol sureci (pilot ile dogrulandi, SLA opsiyonel)

### Canliya Gecis Kontrol Listesi

- [x] En az 10 urunde AR test gecis raporu (`npm run reports:ar-acceptance`)
- [x] iPhone ve Samsung cihaz testleri tamamlandi (pilot)
- [x] Tum kritik urun sayfalarinda buton gorunurlugu dogrulandi (pilot 10 SKU)
- [x] Analytics eventleri dogru sekilde kaydoluyor
- [x] HTTPS production yayini tamam (Vercel + Neon)
- [~] Domain dogrulama (ozel domain opsiyonel)
- [ ] Destek/SLA ve iletisim kanali netlestirildi (operasyonel)

---

## Son Durum (Gun Sonu Ozeti)

- [x] Faz 1 cekirdek API ve AR demo altyapisi calisiyor.
- [x] Postman testleriyle auth + rugs + widget akislari dogrulandi.
- [x] iPhone Quick Look AR canli cihazda dogrulandi (hali gercek boyutta yere oturuyor).
- [x] USDZ modelinin zemine dogru oturmasi cozuldu (Y-up + ASCII usdz, Blender headless pipeline).
- [x] Android Scene Viewer fallback eklendi; GLB same-origin API proxy ile servis ediliyor.
- [x] Faz 2 cekirdegi tamamlandi: embed widget + sepete ekle yanina buton + analytics + panel + upload + domain dogrulama + hata standardi.
- [x] **Production CANLI:** https://rugvision-o54d.vercel.app (Neon + Vercel + R2).
- [x] **Pilot CANLI:** https://savasdogantekstil.com/rugvision/ (10 SKU, iPhone AR dogrulandi).
- [x] Merchant paneli tarayicida canli dogrulandi (giris + analytics + hali listesi + embed kodu ureteci).
- [x] Resmi durum/kabul raporu: `docs/PROJE_DURUM_RAPORU.md` (surum 1.7).
- [x] E-ticaret entegrasyon modeli netlestirildi: widget backend-bagimsiz, tek satir script.
- [x] Pazar/rakip analizi yapildi — RugVision canli kamera AR ile daha modern.
- [x] Otomatik model uretimi + R2 CDN + batch pipeline tamamlandi.
- [x] **AI zemin/oda tespiti v1 tamamlandi:** `lib/ai-detection.ts`, `lib/floor-scan-client.ts`, `/api/v1/ai/scans`, widget + AR viewer entegrasyonu.
- [x] AR kabul raporu, analitik dashboard, abonelik limitleri, 36 birim testi.
- [-] Ozel domain (`app.rugvision.com`) — iptal, Vercel adresi kullaniliyor
- [-] Shopify / WooCommerce resmi eklentileri — iptal, widget.js yeterli

---

## Timeline (Tahmini)

- **Faz 1:** %100 tamamlandi (iPhone'da AR canli test edildi)
  - Model olcek/pivot/yatay yerlesim Blender headless script ile cozuldu (2.30 x 1.60 x 0.02 m)
  - iPhone Quick Look uyumlulugu: Y-up + ASCII usdz (`scripts/export_quicklook_usdz.py`)
  - Android: Scene Viewer intent fallback + GLB/USDZ API proxy
- **Faz 2:** %100 tamamlandi (embed widget + buton + analytics + panel + upload + domain + hata standardi)
- **Faz 3 TEMEL (Adim 1-3):** %100 tamamlandi
  - Production: Neon + Vercel + Cloudflare R2
  - Pilot: savasdogantekstil.com/rugvision (10 SKU)
  - Model pipeline: batch GLB/USDZ + QA raporu
- **Faz 3 BUYUME (Adim 4-7):** **%100 tamamlandi** (cihaz matrisi + CI dahil)

**Toplam proje:** **%100 — TAMAMLANDI** (satis paketi)

**Canli adresler (nihai):**
- SaaS: https://rugvision-o54d.vercel.app
- Pilot: https://savasdogantekstil.com/rugvision/
- Repo: https://github.com/Majestelerinizz/rugvision

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
- iPhone / iPad (Safari + AR Quick Look) — pilot dogrulandi
- Samsung / Pixel / OPPO-vivo (Scene Viewer) — pilot dogrulandi
- Xiaomi / POCO: ARCore uyumlu modellerde Scene Viewer; uyumsuzda 3D onizleme
- Huawei (GMS yok): 3D onizleme

**Teknik ozet:**
- Next.js 16 (App Router) + Prisma 7 + PostgreSQL (Neon).
- 3D/AR: `model-viewer`, GLB (Android Scene Viewer) ve USDZ (iOS Quick Look).
- Auth: JWT (access/refresh) + bcrypt; merchant bazli izolasyon.
- Embed widget: bagimsiz `widget.js` (tek satir kurulum, tema uyumlu buton enjeksiyonu).
- Analitik: olay tabanli (`analytics_events`) + merchant paneli ozet raporu.
- AI v1: heuristik zemin/oda tespiti (`lib/ai-detection.ts`, `lib/floor-scan-client.ts`, `ai_scans`).
- Depolama: Cloudflare R2 + same-origin GLB/USDZ API proxy.

**Ticari model (hedef):**
Halicilara aylik abonelik karsiliginda urun/model/widget yonetimi, AR deneyimi ve
analitik panel sunan bir SaaS hizmeti. Abonelik modulu (STARTER/PRO/ENTERPRISE) aktif;
plan limitleri rug olusturmada kontrol edilir.

**Mevcut olgunluk:** **Proje tamamlandi.** Faz 1-3, pilot e-ticaret, 10 SKU AR, R2 CDN, AI zemin v1,
18 cihaz matrisi + GitHub CI. Production: **https://rugvision-o54d.vercel.app**
