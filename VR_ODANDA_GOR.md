# VR Odamda Gör - Proje Takip Dokümani

Bu dosya, RugVision "Odamda Gör" geliştirmesini 3 fazda takip etmek için hazırlandi.  
Tamamlananlar işaretlendi, kalanlar bos birakildi.

## Projenin Genel Tanımı

RugVision; halıcı ve ev dekorasyon markalarının ürün sayfalarına tek satır kod ile
"Odamda Gör" özelliği ekleyebilmesini hedefleyen SaaS AR platformudur.

Ürün hedef davranışı:

- E-ticaret ürün detay sayfasında `Sepete Ekle` butonu yanında `Odamda Gör` butonu gosterilir.
- Kullanıcı butona bastığında telefonunda AR deneyimi açılır.
- iPhone tarafında Quick Look (`USDZ`), Android tarafında Scene Viewer/WebXR (`GLB`) akışı kullanılır.
- Kullanıcı halıyı kendi odasının zemininde görerek satın alma kararını daha doğru verir.

Desteklenecek cihaz hedefi:

- iPhone (Safari/Quick Look)
- Android ekosistemi (Samsung, Xiaomi, Huawei dahil, cihaz destegine göre Scene Viewer/WebXR)

## Son Güncellemeler (Bu Aşamaya Kadar)

### Pilot entegrasyon (16–17.06.2026) — savasdogantekstil.com/rugvision CANLI AR ✅
- [x] İlk gerçek e-ticaret pilot sitesi: **https://savasdogantekstil.com/rugvision/** (PHP, 10 ürün, SKU'lu).
- [x] Pilot merchant oluşturuldu: **Savas Dogan Tekstil** (`savas@rugvision.com`).
- [x] Merchant ID: `cmqgswc5a000004lanqoxc666`.
- [x] `products.sql` ile birebir **10 SKU** RugVision paneline eklendi (`RV-LUNA-001` … `RV-NARIN-010`).
- [x] **Ürün bazlı GLB/USDZ:** her SKU için ayrı model (`/models/RV-*.glb`) — commit `29a31d3`, Vercel'de CANLI.
- [x] **Ürün bazlı kapak görselleri:** `public/rug-covers/RV-*.png` + Neon `coverImage` güncellendi.
- [x] Halı sitesinde **10 ayrı ürün fotoğrafı:** `assets/images/products/RV-*.png` (FTP + SQL).
- [x] `npm run models:batch` + `npm run models:attach` ile 10 pilot SKU üretildi ve DB'ye bağlandı.
- [x] `config/rugvision.php` hosting'e yüklendi (widget base + merchant ID).
- [x] `product-detail.php` widget entegrasyonu tamamlandı (eski koprü butonu kaldirildi).
- [x] **iPhone'da canlı AR doğrulandi** — ürün detay sayfasından Quick Look acildi, halı görüldü.
- [x] `includes/functions.php` — ana sayfa ürün kartlarındaki "Odanda Gör" linki ürün detaya yönlendirildi.
- [x] Model format notu: AR için **GLB + USDZ zorunlu**; JPG/PNG/WebP sadece ürün fotoğrafı (`coverImage`).

**Pilot embed örneği (`product-detail.php`):**
```html
<script src="https://rugvision-o54d.vercel.app/widget.js"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="<?= e($product['sku']) ?>"
  data-target="[data-rugvision]"
  defer></script>
```

**Pilot test URL:** `https://savasdogantekstil.com/rugvision/product-detail.php?id=3` (Arya, SKU: `RV-ARYA-003`, model: `/models/RV-ARYA-003.glb`)

**Ürün listesi (farklı görseller):** `https://savasdogantekstil.com/rugvision/products.php`

Detaylı kurulum: **`docs/PILOT-ECOMMERCE.md`** · Model pipeline: **`docs/MODEL-PIPELINE.md`**

### Production (16.06.2026) — Vercel + Neon CANLI
- [x] **Neon PostgreSQL** acildi (proje: `rugvision`, Postgres 16, AWS US East 1).
- [x] `npm run db:deploy` ile şema Neon'a uygulandi (migration başarılı).
- [x] **Vercel production deploy** tamamlandı: `https://rugvision-o54d.vercel.app`
- [x] GitHub `main` güncellendi (commit `fae8c2c`: güvenlik + production hazırligi).
- [x] `/api/v1/health` production'da `{"status":"ok","db":"up"}` donuyor.
- [x] İlk production merchant oluşturuldu: **Demo Mağaza** (`demo@ornek.com`).
- [x] İlk production halı eklendi: **Modern Halı** (SKU: `HALI-001`).
- [x] **iPhone 12** üzerinde production HTTPS ile Quick Look AR doğrulandi (sorunsuz).
- [x] SKU widget eşlemesi production'da çalışıyor (`data-merchant-id` + `data-sku`).
- [x] `DATABASE_URL` format hatası çözüldü: Vercel'e sadece `postgresql://...` (psql/tirnak/channel_binding OLMAMALI).

### Onceki aşama (lokal + tunnel)
- [x] `odamda-gor/:id` demo sayfası ile 3D model görüntüleme aktif edildi.
- [x] `model3dUrl` alanindan ürüne dinamik model bağlama tamamlandı.
- [x] iOS Quick Look için özel USDZ endpoint'i eklendi: `/api/v1/ar/usdz/:filename`
- [x] USDZ dosyası doğru `Content-Type` (`model/vnd.usdz+zip`) ile servis edilir hale getirildi.
- [x] Postman koleksiyonu genisletildi (Auth + Rugs + Widget test adımlari).
- [x] Localtunnel üzerinden iPhone HTTPS test akışı kuruldu.
- [x] USDZ/GLB model kalitesi/pivot/ölçek Blender ile otomatik (headless script) duzeltildi: 2.30 x 1.60 x 0.02 m, yere yatik, pivot ortalanmis.
- [x] Tekrarlanabilir model düzeltme scripti eklendi: `scripts/fix_rug_model.py`.
- [x] iPhone Quick Look "nesne acilamadi" hatası çözüldü: USDZ Y-up + ASCII (.usda) içerikli, STORED + 64-byte hizali Apple-spec paket olarak yeniden üretildi (`scripts/export_quicklook_usdz.py`).
- [x] iPhone'da AR doğrulandi: halı gerçek boyutta yere otürüyor, tasima/dondurme/ölçeklendirme çalışıyor.
- [x] Android için Scene Viewer intent fallback eklendi (`ar-viewer-client.tsx`); GLB `model/gltf-binary` ile servis ediliyor.
- [x] Tek satır embed widget yazildi (`public/widget.js`): "Sepete Ekle" yanına otomatik "Odamda Gör" butonu enjekte ediyor.
- [x] Analytics endpoint'i eklendi (`/api/v1/analytics/events`) + CORS; WIDGET_OPENED/AR_STARTED/VIEW_3D/PRODUCT_VIEWED kaydediliyor.
- [x] Mobil AR kritik düzeltmesi: iframe içinden mobil AR engellendigi için widget mobilde doğrudan AR tetikliyor (iOS Quick Look / Android Scene Viewer), masaüstünde 3D modal kaliyor.
- [x] Embed test sayfası (`public/widget-demo.html`): otomatik buton + her zaman çalışan doğrudan AR (`rel="ar"`) bağlantısi.
- [x] Sabit demo adresi: `https://rugvision-demo.loca.lt` (localtunnel `--subdomain rugvision-demo`).
- [x] Otomatik yeniden bağlanan sabit tunnel scripti eklendi: `scripts/tunnel.mjs` + `npm run tunnel` / `npm run dev:all` (koparsa aynı adrese tekrar bağlanır).
- [x] Tunnel "kendi kendini iyileştirme" iyileştirildi: süreç artık kendiliğinden kapanmıyor (keepalive), sağlık kontrolü 429/4xx'i "canlı" sayıyor (yanlış-pozitif reconnect yok), sadece gerçek gateway/timeout hatalarında yeniden bağlanıyor. Böylece "Tunnel is busy" churn'ü giderildi.
- [x] Kesintisiz çalışma için `baslat.bat` eklendi: tüm süreç çökerse 3 sn'de otomatik yeniden başlar; Cursor kapalı olsa da çalışmaya devam eder.
- [x] Merchant paneli tarayıcıda canlı doğrulandi: giriş + analytics kartları (1 halı / 7 widget açılış / 4 AR başlatma / 9 3D görüntüleme) + halı listesi + embed kodu üreteci çalışıyor.

## Faz 1 - MVP Temel Altyapi

- [x] Prisma veri modeli kuruldu (users, merchants, rugs, widget_settings, analytics_events vb.)
- [x] Veritabanı migration çalıştı
- [x] Prisma client üretildi ve adapter ile çalışır hale getirildi
- [x] `GET /api/v1/health` endpoint'i aktif
- [x] Auth endpoint'leri aktif (`register`, `login`, `refresh`, `logout`)
- [x] `forgot-password` ve `reset-password` MVP placeholder endpoint'leri eklendi
- [x] Rugs CRUD endpoint'leri aktif (`GET/POST`, `GET/PUT/DELETE :id`)
- [x] Widget endpoint'leri aktif (`/api/v1/widget/rug/:id`, `/api/v1/widget/settings`)
- [x] Postman koleksiyonu oluşturuldu ve test edildi (Auth + Rugs)
- [x] `model3dUrl` ile ürüne 3D model bağlama tamamlandı
- [x] `odamda-gor/:id` sayfası oluşturuldu (model-viewer ile 3D/AR demo)
- [x] iOS Quick Look için `usdz` servis endpoint'i eklendi (`/api/v1/ar/usdz/:filename`)
- [x] iPhone Safari üzerinden AR akışına giriş doğrulandi (kamera/Quick Look aciliyor)
- [x] iOS buton fallback'i iyileştirildi (Quick Look tetikleme akışı)
- [x] USDZ model kalite-optimizasyonu (zemine doğru ölçek ve pivot) tamamlandı (Blender headless script ile)
- [x] iPhone Quick Look uyumluluğu çözüldü (Y-up + ASCII usdz) ve gerçek cihazda AR test edildi
- [x] Android Scene Viewer fallback eklendi (GLB tabanlı AR akışı hazır)

Faz 1 Durumu: **Tamamlandı (iPhone'da AR canlı test edildi)**.

---

## Faz 2 - İşlevsel Ürünlesme

- [x] Abonelik plan limiti uygulandı: `POST /api/v1/rugs` aktif abonelikteki `productLimit`'i kontrol eder (abonelik yoksa engellemez); iptal/ödeme gecikmesi durumunda ürün eklenemez
- [x] JWT tabanlı auth guard eklendi (`lib/auth-guard.ts`); korumali endpoint'ler merchant'a göre izole (`requireAuth` + `resolveMerchantId`)
- [x] GÜVENLİK SERTLEŞTİRME: Rugs CRUD + widget/settings artık auth + merchant izolasyonu zorunlu (eskiden açıktı); `:id` işlemlerinde sahiplik doğrulamasi
- [x] GÜVENLİK: tüm endpoint'lerde standart hata (`lib/api.ts` + `lib/errors.ts`) + zod doğrulama (`lib/validation.ts`); ham hata mesajı sızdırılmıyor; P2002 -> 409 CONFLICT
- [x] GÜVENLİK: rate limiting (`lib/rate-limit.ts`) login/register/refresh/analytics/widget/domain-verify; brute-force + kullanıcı-sayimi (enumeration) önleme
- [x] GÜVENLİK: JWT issuer/audience + HS256 sabit + JWT_SECRET < 32 karakter ise uygulama başlamaz; güçlü parola politikası (harf+rakam)
- [x] GÜVENLİK: HTTP güvenlik başlıkları (`next.config.ts`): HSTS, nosniff, Referrer-Policy, Permissions-Policy, clickjacking'e karşı X-Frame-Options/CSP (embed için `/odamda-gor` hariç)
- [x] GÜVENLİK: domain doğrulamada SSRF koruması (özel-iç IP reddi + redirect takibi kapalı)
- [x] Panel otürüm dayanikliligi: refresh token saklanir, access token dolunca 401'de otomatik yenilenir
- [x] Gerçek widget embed scripti (`public/widget.js`) üretildi ve test edildi (tek satır kod)
- [x] Ürün sayfasında `Sepete Ekle` yanına otomatik `Odamda Gör` butonu enjekte ediliyor
- [x] Farklı tema yapılarında buton selector fallback mekanizması eklendi (common add-to-cart selector listesi + `data-target`)
- [x] Widget açılış/AR/3D/ürün görüntüleme eventleri `analytics_events` tablosuna yazılıyor (WIDGET_OPENED, AR_STARTED, VIEW_3D, PRODUCT_VIEWED)
- [x] Widget-facing endpoint'lere CORS eklendi (`/api/v1/widget/rug/:id`, `/api/v1/analytics/events`)
- [x] Iframe modal embed görünümü eklendi (`/odamda-gor/:id?embed=1`)
- [x] Embed test ortami: `public/widget-demo.html` (sahte ürün sayfası)
- [x] Mobil AR düzeltmesi: iframe içinden mobil AR engellendigi için widget mobilde doğrudan AR tetikliyor (iOS Quick Look anchor / Android Scene Viewer intent), masaüstünde 3D modal kaliyor
- [x] Dashboard özet endpoint'i tamamlandı: `GET /api/v1/analytics/overview` (toplamlar + tipe göre + en çok AR alan halılar)
- [x] Merchant paneli eklendi: `/panel` (giriş, analytics, halı listesi, model yükleme, embed kodu üreteci)
- [x] Domain doğrulama akışı tamamlandı: `POST /api/v1/domains` (kayıt) + `POST /api/v1/domains/verify` (.well-known dosya kontrolü) + `GET` liste
- [x] Dosya yönetimi akışı tamamlandı: `POST /api/v1/uploads/model` (GLB/USDZ/GLTF upload + URL doner)
- [x] API hata kodlari standardıze edildi (`lib/api.ts`: BAD_REQUEST/UNAUTHORIZED/FORBIDDEN/NOT_FOUND/CONFLICT/UNPROCESSABLE/INTERNAL)
- [x] Yeni endpoint'ler uctan uca test edildi (register -> token -> overview/domains/verify/upload)
- [x] Depolama soyutlaması eklendi (`lib/storage.ts`): upload artık driver üzerinden çalışır; şu an `local` driver aktif, R2/S3 driver Faz 3 Adım 2'de tek noktadan eklenecek (kod değişmeden `STORAGE_DRIVER` ile seçilir)
- [x] Otomatik test paketi eklendi: `node:test` + `tsx`, `npm test` (13 test) - slug, SSRF host kontrolü, rate limit, JWT imzala/doğrula güvenlik-kritik saf mantık kapsandı
- [x] (Faz 3 hazırligi) Widget SKU eşlemesi: `data-rug-id` yerine `data-merchant-id` + `data-sku` ile çözümleme (`GET /api/v1/widget/rug?merchantId=&sku=`)

Faz 2 Durumu: **%100 Tamamlandı** - embed widget + buton enjeksiyonu + analytics + panel + upload + domain doğrulama + hata standardı + abonelik plan limiti + depolama soyutlaması + otomatik test + güvenlik sertleştirme çalışır durumda.

---

## Faz 3 - Adım Adım Plan (Karışıklık Olmasin)

Faz 3, sırayla yapılacak 7 adımdan oluşur. Her adımin bağımlılığı bir öncekidir;
yukaridan aşağıya gidilir. Toplam: TEMEL (Adım 1-3) ~6-10 gün, BUYUME (Adım 4-7) +12-18 gün.

### ADIM 1 - Production yayını (siteyi internete tasi)  [~2 gün]
> Amaç: `localhost`/tunnel yerine gerçek, kalıcı HTTPS adres.
> **DURUM: %100 TAMAMLANDI** — `https://rugvision-o54d.vercel.app` (Neon DB, health OK, HTTPS, panel, AR).
> Runbook: **`docs/DEPLOY.md`**
- [x] 1.1 Yönetilen veritabanı acildi: **Neon** (proje `rugvision`, Postgres 16)
- [x] 1.2 Vercel env: `DATABASE_URL` + `JWT_SECRET` (>=32) + `STORAGE_DRIVER=local`
- [x] 1.3 `npm run db:deploy` ile tablolar Neon'a kuruldu
- [x] 1.4 Vercel'e deploy edildi (GitHub `edc8f3e`, build: `prisma generate && next build`)
- [x] 1.5 HTTPS production adresi aktif (Vercel otomatik SSL) — **TAMAM**
- [x] 1.6 Tunnel artık production için gereksiz (sadece lokal geliştirme için kalır)

> **Not:** Özel alan adi (`app.rugvision.com`) Adım 1 kapsami dışında birakildi; Büyüme fazında opsiyonel.

**Production erisim:**
- Site: `https://rugvision-o54d.vercel.app`
- Panel: `https://rugvision-o54d.vercel.app/panel`
- Health: `https://rugvision-o54d.vercel.app/api/v1/health`
- Örnek AR: `https://rugvision-o54d.vercel.app/odamda-gor/<RUG_ID>`

### ADIM 2 - Model dosya altyapısı (bulut depolama + otomatik üretim)  [~3-4 gün]
> Amaç: Modelleri sunucu diski yerine bulutta tut; yüzlerce halı için üretimi otomatikleştir.
> **DURUM: %95 TAMAMLANDI** — 10 SKU batch + foto inset temizleme + R2 script/runbook hazır; Cloudflare credentials + Vercel env kullanıcı tarafında.
> Runbook: **`docs/MODEL-PIPELINE.md`** · R2: **`docs/R2-SETUP.md`**
- [x] 2.0 Depolama soyutlaması genişletildi: `readModel` + S3/R2 driver (`lib/storage.ts`)
- [x] 2.0 USDZ endpoint storage üzerinden okur (local + R2)
- [x] 2.3 **Otomatik model üretimi (v1):** `scripts/generate_rug_model.py` — foto + en/boy → GLB/USDZ
- [x] 2.3 **Batch runner:** `npm run models:batch` + `data/rugs-batch.csv` (10 pilot SKU)
- [x] 2.3 **DB bağlama:** `npm run models:attach` → `model3dUrl` + `coverImage` güncelleme
- [x] 2.4 Pilot 10 SKU için gerçek fotoğraflarla batch üretim + **canlı iPhone AR doğrulama** (commit `29a31d3`)
- [x] 2.4b **Fotoğraf inset temizleme:** `npm run photos:clean` (`scripts/clean_rug_photo.py`) — 2/10 pilot fotoğrafta inset kaldırıldı, kapaklar `rug-covers` ile senkron
- [x] 2.1 R2 upload script + runbook: `npm run models:upload-r2` + `docs/R2-SETUP.md` + `.env.example`
- [ ] 2.1b Cloudflare R2 bucket + API token oluştur (kullanıcı) → Vercel env
- [ ] 2.2 `STORAGE_DRIVER=r2` production'da etkin + `npm run models:upload-r2` + attach `--base-url`
- [ ] 2.5 Model pipeline standardı: toplu QA raporu (100+ halı ölçeği için)

### ADIM 3 - E-ticaret entegrasyonu (müşteri sitesine ekleme)  [~1-2 gün]
> Amaç: Tek satır kod ile müşteri ürün sayfasında buton + AR.
> **DURUM: %100 TAMAMLANDI** — `savasdogantekstil.com/rugvision` pilot CANLI (ürün detay AR + kart linkleri).
- [x] 3.1 Embed kurulum dokümani: `docs/PILOT-ECOMMERCE.md` (PHP alt klasör `/rugvision`)
- [x] 3.2 İlk pilot müşteri sitesi: **savasdogantekstil.com/rugvision** — `product-detail.php` widget
- [x] 3.3 SKU eşlemesi: 10 ürün (`RV-LUNA-001` … `RV-NARIN-010`) merchant `cmqgswc5a000004lanqoxc666`
- [x] 3.4 Canlı AR testi: iPhone Quick Look, ürün detay sayfasından **BAŞARILI**
- [x] 3.5 Ana sayfa ürün kartları: `functions.php` — "Odanda Gör" artık ürün detaya yönlendiriyor

> **Not:** Slider/footer köprü linkleri ve panel domain doğrulama Adım 3 kapsamı dışında bırakıldı (Büyüme fazı / opsiyonel cila).

Faz 3 Durumu: **Adım 1 + Adım 3 %100; Adım 2 batch + pilot modeller %95 (R2 env + upload kullanıcıda).**

### ADIM 4 - Platform eklentileri  [BUYUME]
> Amaç: Kurulumu "tek tik" yapan resmi eklentiler.
- [ ] 4.1 Shopify uygulaması/eklentisi MVP
- [ ] 4.2 WooCommerce eklentisi MVP

### ADIM 5 - AR kalite ve cihaz testleri  [BUYUME]
- [ ] 5.1 iOS Quick Look + Android Scene Viewer çoklu cihazda doğrulama (geniş matris)
- [~] 5.2 Production (HTTPS) üzerinde mobil AR acceptance testi (iPhone 12 Quick Look OK; geniş matris bekliyor)
- [~] 5.3 En az 10 üründe AR gecis raporu (pilot 10 SKU iPhone OK; resmi rapor bekliyor)

### ADIM 6 - AI özellikleri  [BUYUME]
- [ ] 6.1 AI floor (zemin) detection ilk sürüm
- [ ] 6.2 AI room (oda) detection ilk sürüm

### ADIM 7 - Izleme, raporlama ve otomasyon  [BUYUME]
- [ ] 7.1 Dönüşüm + AR kullanım analitikleri dashboard'da raporlansin
- [ ] 7.2 Otomatik test paketi (E2E runner) + CI
- [ ] 7.3 (Opsiyonel) Abonelik/plan limitleri

---

## Model formatları (AR için onemli)

| Format | Rol | AR'de kullanılır mi? |
|--------|-----|----------------------|
| **GLB** | Android Scene Viewer, masaüstü 3D | ✅ Evet |
| **USDZ** | iPhone Quick Look | ✅ Evet |
| JPG / PNG / WebP | Ürün fotoğrafı, kapak görseli | ❌ AR modeli değil |

Halıcı fotoğraf verir; sistem batch pipeline ile GLB/USDZ üretir (`npm run models:batch`). Pilot'te **10 SKU için ayrı model** canlıda (`RV-LUNA-001` … `RV-NARIN-010`).

---

## Hemen Sonraki İş (Öncelik) + Faz 3 Gun Plani

Faz 1 ve Faz 2 cekirdek isleri tamamlandı. **Adım 1 (production) CANLI.** Sıradaki öncelikler:

### A) Tek gerçek müşteriyi (örn. tarzhalıconcept.com) canlıya alma - TEMEL
| İş | Durum | Tahmini gün |
|----|-------|-------------|
| Production deploy (Vercel + Neon DB) | **TAMAM** | — |
| Kalıcı domain + HTTPS | opsiyonel | 0.5 |
| Bulut depolama (R2/S3) | **SIRADA** | 1-2 |
| Otomatik foto+ölçü -> GLB/USDZ üretimi (ilk sürüm) | **TAMAM** (10 SKU) | — |
| Müşteri temasina embed + buton yerleşimi + SKU eşlemesi | **PILOT TAMAM** | — |
| Gerçek halılarla test (10 ürün) | **iPhone AR OK** (ürün bazlı model) | — |
| Halı sitesi ürün fotoğrafları (SKU bazlı) | **TAMAM** (FTP + SQL) | — |
| Bulut depolama (R2/S3) — 100+ halı ölçeği | **SIRADA** | 1-2 |
| **Kalan toplam (TEMEL)** | | **~1-2 iş günü** (R2) |

### B) Tam ürünlesme (her e-ticarete dagitilabilir) - BUYUME
- Shopify + WooCommerce resmi eklentileri
- AI floor/room detection ilk sürüm
- Çoklu cihaz AR kabul testleri (geniş matris)
- Oto dönüşüm hattınin olgunlasmasi + otomatik test runner + CI
- **Ek sure:** ~12-18 iş günü

**Ozet:** Production CANLI; tek müşteride canlı pilot ~1 hafta; tam ürünlesmis hal ~4-6 hafta.

---

## E-Ticaret Entegrasyon Modeli (Onemli)

RugVision widget'ı **backend-bağımsızdir**. Müşteri sitesinin arka planı PHP, Laravel,
WordPress/WooCommerce, OpenCart, Shopify veya düz HTML olabilir; fark etmez. Cunku
`widget.js` tamamen tarayıcıda (client-side) çalışır.

Calisma modeli:

```
[Müşteri sitesi - örn. PHP]              [RugVision - bizim sunucu]
   ürün detay sayfası                       Next.js + DB + 3D modeller
        |                                            ^
        |  <script src=".../widget.js" ...>  ------> |
        |                                            |
        +-- "Odamda Gör" butonu otomatik <-- AR <----+
            "Sepete Ekle" yanına eklenir
```

- Müşterinin PHP koduna dokunulmaz; veritabanları birleştirilmez.
- Tek satır kod ürün sayfası şablonuna yapıştırılır (örnek pilot):
  `<script src="https://rugvision-o54d.vercel.app/widget.js" data-merchant-id="cmqgswc5a000004lanqoxc666" data-sku="RV-ARYA-003" data-target="[data-rugvision]" defer></script>`
- `data-target` ile sitedeki hedef alan seçilir (pilot: `[data-rugvision]` veya `.js-add-cart`).
- Bu yüzden PHP/Laravel site ile "birleştirme" derdi YOKTUR; sadece bir HTML satırı.

---

## Pazar / Rakip Analizi (Doğrulama)

Aynı isi yapan referans siteler (hedef davranış doğrulandi):

- Sultan Halı - "Halıyı Odanda Gor" (oda fotoğrafı yükle + halıcı yerleştir + renk/desen dene)
- Pera Halı - "Odalara Göre Halılar"
- Evinde Gor (Gumussuyu Halı)

Fark: Bu örnekler çoğunlukla **fotoğraf üzerine 2D yerleştirme** kullanır; RugVision **canlı
kamera AR** (Quick Look / Scene Viewer) ile gerçek zemine gerçek boyutta yerleştirir -
yani daha modern bir yöntem. İstenirse ileride "oda fotoğrafı yukle" modu da eklenebilir.

---

## Satışa Çıkış Paketi (Faz 3 Sonrasi)

Bu bölüm, Faz 3 tamamlandığında halıcı firmalara sunulacak operasyon modelini özetler.

### Halıcıdan İstenenler

- [ ] Ürün verisi: SKU, ürün adi, ölçü, fiyat
- [ ] Ürün görselleri
- [ ] 3D model dosyalari (`GLB` ve iOS için `USDZ`) veya GLB verip dönüşümu bize birakma onayi
- [ ] Site entegrasyon yetkisi (Shopify admin / özel tema script erisimi)
- [ ] Marka özellestirme bilgileri (buton metni, renk, logo)
- [ ] Domain doğrulama için gerekli DNS/teknik onay

### RugVision Tarafindan Verilecekler

- [ ] `Sepete Ekle` yanında çalışan `Odamda Gör` butonu
- [ ] iPhone (Quick Look) + Android (Scene Viewer/WebXR) AR deneyimi
- [ ] Merchant paneli (ürün/model/widget yönetimi)
- [ ] Analitik paneli (tıklama, AR açılış, dönüşüm metrikleri)
- [ ] Entegrasyon dokümani + canlıya alim destegi
- [ ] Teknik destek ve model kalite kontrol süreçi

### Canlıya Gecis Kontrol Listesi

- [ ] En az 10 üründe AR test gecis raporu
- [ ] iPhone ve Android cihaz testleri tamamlandı
- [ ] Tüm kritik ürün sayfalarinda buton gorunurlugu doğrulandi
- [ ] Analytics eventleri doğru sekilde kaydoluyor
- [ ] Domain doğrulama ve HTTPS production yayını tamam
- [ ] Destek/SLA ve iletisim kanali netleştirildi

---

## Son Durum (Gun Sonu Özeti)

### Pilot + Production (17.06.2026 — güncel)
- [x] **10 SKU ürün bazlı AR CANLI:** her halı kendi GLB/USDZ + kendi site fotoğrafı.
- [x] GitHub `29a31d3`: modeller, rug-covers, batch manifest push edildi; Vercel deploy OK.
- [x] iPhone Quick Look: ürün detaydan **ürün bazlı halı** zeminde görüldü (kullanıcı onayı).
- [x] `products.php`: 10 farklı ürün görseli (`assets/images/products/RV-*.png`).

### Production (16.06.2026)
- [x] **Vercel + Neon production CANLI:** `https://rugvision-o54d.vercel.app`
- [x] Health: `db: "up"` — Neon bağlantısi çalışıyor.
- [x] GitHub güncel (commit `7513861`): 10 SKU model + pilot dokümantasyon.
- [x] İlk merchant + halı production'da oluşturuldu (Demo Mağaza / HALI-001).
- [x] iPhone 12 production HTTPS üzerinde Quick Look AR doğrulandi.
- [x] Panel girişi production'da çalışıyor.

### Onceki tamamlananlar
- [x] Postman testleriyle auth + rugs + widget akislari doğrulandi.
- [x] iPhone Quick Look AR canlı cihazda doğrulandi (halı gerçek boyutta yere otürüyor).
- [x] USDZ modelinin zemine doğru oturmasi çözüldü (Y-up + ASCII usdz, Blender headless pipeline).
- [x] Android Scene Viewer fallback eklendi; GLB doğru `model/gltf-binary` ile servis ediliyor.
- [x] Faz 2 çekirdeği tamamlandı: embed widget + sepete ekle yanına buton + analytics + panel + upload + domain doğrulama + hata standardı.
- [x] Sabit, kendi kendini iyileştiren demo adresi çalışır durumda: `https://rugvision-demo.loca.lt` (churn/`Tunnel is busy` sorunu giderildi).
- [x] Kesintisiz çalışma için `baslat.bat` (otomatik yeniden başlatma) eklendi.
- [x] Merchant paneli tarayıcıda canlı doğrulandi (giriş + analytics + halı listesi + embed kodu üreteci).
- [x] Tunnel üzerinden uctan uca doğrulama: health/panel/login/usdz hepsi 200.
- [x] Resmi durum/kabul raporu güncellendi: `docs/PROJE_DURUM_RAPORU.md`.
- [x] E-ticaret entegrasyon modeli netleştirildi: widget backend-bağımsız (PHP/Laravel/WooCommerce/düz HTML fark etmez), tek satır script.
- [x] Pazar/rakip analizi yapıldı (Sultan Halı / Pera Halı / Evinde Gor) - hedef davranış doğrulandi; RugVision canlı kamera AR ile daha modern.
- [x] Faz 3 gün plani 2 kademeye ayrıldı: tek müşteri canlıya alma ~6-10 gün, tam ürünlesme +12-18 gün.
- [x] Otomatik model üretimi (foto+ölçü -> GLB/USDZ) Faz 3 önceliği olarak eklendi (yuzlerce halı için ölçeklenme).
- [x] Docker'siz DB seçenekleri belirlendi: Neon / Supabase / Vercel Postgres (şema ayni, sadece `DATABASE_URL`).
- [ ] Faz 3 kalan: Cloudflare R2 production, Shopify/WooCommerce, AI floor detection.
- [x] İlk halıcı embed CANLI: savasdogantekstil.com/rugvision (pilot).

---

## Timeline (Tahmini)

- **Faz 1:** %100 tamamlandı
- **Faz 2:** %100 tamamlandı (güvenlik sertleştirme dahil)
- **Faz 3 Adım 1:** %100 tamamlandı (production CANLI, HTTPS, Neon, panel)
- **Faz 3 Adım 3:** %100 tamamlandı (pilot entegrasyon + canlı AR + kart linkleri)
- **Faz 3 Adım 2:** **%85** (10 SKU batch + canlı AR tamam; R2 production sırada)

**Tüm projenin tamamlanma orani:** ~%88-90 (tam ürün vizyonu)

**TEMEL paket (canlı satış demosu):** ~%98 — **yalnızca R2 production kaldı**

**Canlı production adresi:** `https://rugvision-o54d.vercel.app`  
**Canlı pilot müşteri sitesi:** `https://savasdogantekstil.com/rugvision/`

**Kalan iş günü (tahmini):**
- TEMEL bitirmek için: **~1-2 iş günü** (R2/S3)
- Tam ürünlesme (Shopify, AI, CI vb.): **+10-14 iş günü**

---

## RESMI PROJE TANIMI

> Bu bölüm, RugVision projesinin ne oldugünü resmi ve nihai olarak tanımlar.

**Proje adi:** RugVision

**Tur:** SaaS tabanlı artırılmış gerçeklik (AR) platformu.

**Ne yapar (tek cumle):**
RugVision, halıcı ve ev dekorasyon markalarının web sitelerine **tek satır kod** ile
"Odamda Gör" özelliği ekleyerek, müşterilerin bir halıyı satın almadan önce kendi
odalarinin zemininde **telefon kameralariyla gerçek boyutta** görmesini sağlar.

**Çözdüğü problem:**
Online halı alışverişinde müşteri, halınin odasinda nasıl duracagini, ölçüsunun ve
renginin mekanina uyup uymadigini göremez. Bu belirsizlik satın almayi zorlastirir ve
iade oranını artırır. RugVision, halıyı gerçek mekanda AR ile göstererek bu belirsizliği
ortadan kaldirir; satın alma güvenini ve dönüşüm oranını yükseltir.

**Nasıl çalışır:**
1. Halıcı, RugVision panelinden ürünunu ve 3D modelini (GLB/USDZ) ekler.
2. RugVision, halıcı sitesindeki ürün sayfasına "Sepete Ekle" yanında otomatik bir
   "Odamda Gör" butonu yerleştirir (tek satır embed script).
3. Müşteri butona basar; iPhone'da Quick Look, Android'de Scene Viewer ile AR açılır.
4. Halı, müşterinin odasinin zeminine gerçek ölçekte yerleşir.
5. Tüm etkileşimler (açılış, AR başlatma, 3D görüntüleme) analitik olarak toplanır.

**Hedef kullanıcılar:**
- Halıcı ve ev tekstili / dekorasyon markaları (e-ticaret).
- Son tüketici (ürün sayfasıni ziyaret eden alışveriş yapan kisi).

**Desteklenen cihazlar:**
- iPhone / iPad (Safari + AR Quick Look) — tam AR, en stabil
- Android ARCore uyumlu cihazlar (Samsung, Pixel, cogu Oppo/Vivo global) — Scene Viewer
- Diger Android / Huawei (GMS yok): 3D görüntüleme fallback (tam zemin AR olmayabilir)

**Teknik özet:**
- Next.js 16 (App Router) + Prisma 7 + PostgreSQL.
- 3D/AR: `model-viewer`, GLB (Android/WebXR) ve USDZ (iOS Quick Look).
- Auth: JWT (access/refresh) + bcrypt; merchant bazlı izolasyon.
- Embed widget: bağımsız `widget.js` (tek satır kurulum, tema uyumlu buton enjeksiyonu).
- Analitik: olay tabanlı (`analytics_events`) + merchant paneli özet raporu.

**Ticari model (hedef):**
Halıcılara aylık abonelik karşılığında ürün/model/widget yönetimi, AR deneyimi ve
analitik panel sunan bir SaaS hizmeti. (Abonelik modülü şu an kapsam dışı, geliştirme
önceliği "halı gösterimi" üzerinedir.)

**Mevcut olgunluk:** Faz 1 (%100), Faz 2 (%100), **Faz 3 Adım 1 (%100)**, **Adım 3 (%100)**, **Adım 2 (%85)**.
**Toplam:** ~%88-90 | **TEMEL demo paketi:** ~%98 | **Kalan TEMEL:** ~1-2 iş günü (R2 production).
