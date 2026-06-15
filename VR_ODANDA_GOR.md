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
- [~] R2/S3/B2 bulut depolama: MVP'de yerel `public/models` kullaniliyor; bulut entegrasyonu Faz 3'e birakildi
- [~] Otomatik test paketi: manuel/script E2E yapildi; otomatik test runner Faz 3'e birakildi

Faz 2 Durumu: **Tamamlandi (cekirdek urunlesme)** - embed widget + buton enjeksiyonu + analytics + panel + upload + domain dogrulama + hata standardi calisir durumda. (Bulut depolama ve otomatik test runner Faz 3'e tasindi.)

---

## Faz 3 - Adim Adim Plan (Karisiklik Olmasin)

Faz 3, sirayla yapilacak 7 adimdan olusur. Her adimin bagimliligi bir oncekidir;
yukaridan asagiya gidilir. Toplam: TEMEL (Adim 1-3) ~6-10 gun, BUYUME (Adim 4-7) +12-18 gun.

### ADIM 1 - Production yayini (siteyi internete tasi)  [~2 gun]
> Amac: `localhost`/tunnel yerine gercek, kalici HTTPS adres.
- [ ] 1.1 Yonetilen veritabani ac (Docker'siz): Neon (onerilen) / Supabase / Vercel Postgres
- [ ] 1.2 `.env` -> `DATABASE_URL`'i yeni DB'ye cevir (sema ayni, kod degismez)
- [ ] 1.3 `npx prisma migrate deploy` ile tablolari bulut DB'ye kur
- [ ] 1.4 Projeyi Vercel'e deploy et
- [ ] 1.5 Kalici domain bagla + HTTPS (orn. `app.rugvision.com`)
- [ ] 1.6 Tunnel ve `baslat.bat` artik gereksiz (sadece lokal gelistirme icin kalir)

### ADIM 2 - Model dosya altyapisi (bulut depolama + otomatik uretim)  [~3-4 gun]
> Amac: Modelleri sunucu diski yerine bulutta tut; yuzlerce hali icin uretimi otomatiklestir.
- [ ] 2.1 Bulut depolama bagla (Cloudflare R2 / AWS S3 / Backblaze B2)
- [ ] 2.2 `uploads/model` endpointini bulut depolamaya yonlendir
- [ ] 2.3 **Otomatik model uretimi**: urun fotografi (ustten) + en/boy olcusu -> gercek boyutlu dokulu GLB
- [ ] 2.4 Otomatik GLB -> USDZ donusum hatti (sunucu tarafi, iOS uyumlu)
- [ ] 2.5 Model pipeline standardi: olcek, pivot, axis, texture sabitlensin

### ADIM 3 - E-ticaret entegrasyonu (musteri sitesine ekleme)  [~1-2 gun]
> Amac: Tek satir kod ile musteri urun sayfasinda buton + AR.
- [ ] 3.1 Embed kurulum dokumani yaz (tek satir `<script>` + `data-target` kullanimi)
- [ ] 3.2 Musteri temasinda buton yerlesimini dogrula (orn. tarzhaliconcept.com PHP)
- [ ] 3.3 SKU eslemesi: musteri urunu -> RugVision hali/model baglantisi
- [ ] 3.4 Gercek halilarla 1-2 urunde uctan uca canli test

### ADIM 4 - Platform eklentileri  [BUYUME]
> Amac: Kurulumu "tek tik" yapan resmi eklentiler.
- [ ] 4.1 Shopify uygulamasi/eklentisi MVP
- [ ] 4.2 WooCommerce eklentisi MVP

### ADIM 5 - AR kalite ve cihaz testleri  [BUYUME]
- [ ] 5.1 iOS Quick Look + Android Scene Viewer coklu cihazda dogrulama (genis matris)
- [ ] 5.2 Production (HTTPS) uzerinde mobil AR acceptance testi
- [ ] 5.3 En az 10 urunde AR gecis raporu

### ADIM 6 - AI ozellikleri  [BUYUME]
- [ ] 6.1 AI floor (zemin) detection ilk surum
- [ ] 6.2 AI room (oda) detection ilk surum

### ADIM 7 - Izleme, raporlama ve otomasyon  [BUYUME]
- [ ] 7.1 Donusum + AR kullanim analitikleri dashboard'da raporlansin
- [ ] 7.2 Otomatik test paketi (E2E runner) + CI
- [ ] 7.3 (Opsiyonel) Abonelik/plan limitleri

Faz 3 Durumu: **Planlandi (Adim 1'den baslanacak)**.

---

## Hemen Sonraki Is (Oncelik) + Faz 3 Gun Plani

Faz 1 ve Faz 2 cekirdek isleri tamamlandi. Faz 3 iki kademede planlandi:

### A) Tek gercek musteriyi (orn. tarzhaliconcept.com) canliya alma - TEMEL
| Is | Tahmini gun |
|----|-------------|
| Production deploy (Vercel + Neon/Supabase DB) | 1-2 |
| Kalici domain + HTTPS | 0.5 |
| Bulut depolama (R2/S3) | 1-2 |
| Otomatik foto+olcu -> GLB/USDZ uretimi (ilk surum) | 2-3 |
| Musteri temasina embed + buton yerlesimi + SKU eslemesi | 1-2 |
| Gercek halilarla test (birkac urun) | 1 |
| **Toplam** | **~6-10 is gunu** |

### B) Tam urunlesme (her e-ticarete dagitilabilir) - BUYUME
- Shopify + WooCommerce resmi eklentileri
- AI floor/room detection ilk surum
- Coklu cihaz AR kabul testleri (genis matris)
- Oto donusum hattinin olgunlasmasi + otomatik test runner + CI
- **Ek sure:** ~12-18 is gunu

**Ozet:** Tek musteride canli, satisa donuk kurulum ~2 hafta; tam urunlesmis hal ~4-6 hafta.

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
  `<script src="https://app.rugvision.com/widget.js" data-rug-id="SKU" data-target=".sepete-ekle" defer></script>`
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

- [x] Faz 1 cekirdek API ve AR demo altyapisi calisiyor.
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
- [ ] Faz 3: production yayini, bulut depolama, oto GLB->USDZ, Shopify/WooCommerce, AI floor detection.

---

## Timeline (Tahmini)

- **Faz 1:** %100 tamamlandi (iPhone'da AR canli test edildi)
  - Model olcek/pivot/yatay yerlesim Blender headless script ile cozuldu (2.30 x 1.60 x 0.02 m)
  - iPhone Quick Look uyumlulugu: Y-up + ASCII usdz (`scripts/export_quicklook_usdz.py`)
  - Android: Scene Viewer intent fallback + `model/gltf-binary` GLB servisi
- **Faz 2:** cekirdek %100 tamamlandi (embed widget + buton + analytics + panel + upload + domain + hata standardi; panel tarayicida canli dogrulandi)
  - Faz 3'e tasinan kalemler: bulut depolama (R2/S3) + otomatik test runner + oto GLB->USDZ pipeline
- **Faz 3:** 12-18 is gunu
  - (mobil AR stabilizasyonu coklu cihaz, GLB->USDZ pipeline standardi, Shopify/WooCommerce
    entegrasyonu, AI floor/room detection, production acceptance)

**Toplam kalan sure:** ~18-27 is gunu (yaklasik 3.5 - 5.5 hafta)

**Bugune kadar tamamlanan (kabaca):** Tum projenin ~%60-65'i
(Faz 1 bitti, Faz 2 cekirdek urunlesme tamamlandi).

Not: Dar kapsamli "hiz modu" (tek halici + temel embed + mobil AR) ile ilk canli satis demosu
bugun itibariyle HAZIR. Geri kalan sure panel/otomasyon/entegrasyon/AI icin.

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

**Mevcut olgunluk:** Faz 1 (%100) ve Faz 2 cekirdegi tamamlandi; tek halici ile canli
satis demosu hazir. Faz 3 (production yayini, bulut depolama, e-ticaret entegrasyonlari,
AI zemin tespiti) planlanmis durumda.
