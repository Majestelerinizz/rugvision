# RugVision

RugVision, halıcı ve ev dekorasyonu markaları için geliştirilen **SaaS tabanlı AR (artırılmış gerçeklik) platformudur**.
Amaç: bir e-ticaret ürün sayfasına **tek satır kod** ekleyerek, müşterinin halıcı telefonuyla
kendi odasının zemininde **gerçek boyutta** görmesini sağlamaktır ("Odamda Gör").

> _RugVision is a SaaS AR platform that lets e-commerce stores add a one-line script to show
> rugs in the customer's room at real scale (iOS Quick Look + Android Scene Viewer)._

---

## İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji](#teknoloji)
- [Gereksinimler](#gereksinimler)
- [Hızlı Kurulum](#hızlı-kurulum)
- [Veritabanı Seçenekleri](#veritabanı-seçenekleri)
- [İlk Hesabı Oluşturma](#ilk-hesabı-oluşturma)
- [Panel Kullanımı](#panel-kullanımı)
- [Widget'ı Bir Siteye Ekleme](#widgetı-bir-siteye-ekleme)
- [AR / 3D Model Notları](#ar--3d-model-notları)
- [Telefonda Test (HTTPS Tunnel)](#telefonda-test-https-tunnel)
- [Komutlar](#komutlar)
- [Proje Yapısı](#proje-yapısı)
- [API Özeti](#api-özeti)
- [Yol Haritası](#yol-haritası)
- [Canlı Production](#canlı-production)

---

## Özellikler

- 3D/AR görüntüleyici sayfası (`/odamda-gor/:id`) - `model-viewer` tabanlı.
- iPhone **Quick Look** (USDZ) + Android **Scene Viewer** (GLB) AR akışı.
- Tek satır **embed widget** (`public/widget.js`): "Sepete Ekle" yanına otomatik "Odamda Gör" butonu.
- Merchant paneli (`/panel`): giriş, analitik, halı listesi, model yükleme, embed kodu üreteci.
- JWT auth (register/login/refresh/logout) + merchant bazlı izolasyon.
- Rugs CRUD, widget ayarları, analytics, domain doğrulama, model upload endpoint'leri.

## Teknoloji

- **Next.js 16** (App Router) + React 19
- **Prisma 7** + **PostgreSQL** (pg adapter)
- **TailwindCSS 4**
- Auth: `jose` (JWT) + `bcryptjs`, doğrulama: `zod`
- AR: `<model-viewer>`, GLB (Android/WebXR) ve USDZ (iOS Quick Look)

---

## Gereksinimler

- **Node.js 20+** ve npm
- Bir **PostgreSQL veritabanı** (aşağıdaki seçeneklerden biri)
- (Opsiyonel) Telefonda AR testi için HTTPS - bu repo `localtunnel` ile gelir

---

## Hızlı Kurulum

```bash
# 1) Projeyi klonla
git clone https://github.com/Majestelerinizz/rugvision.git
cd rugvision

# 2) Bağımlılıkları kur
npm install

# 3) Ortam değişkenlerini ayarla
cp .env.example .env
#   .env içindeki DATABASE_URL ve JWT_SECRET değerlerini doldur (aşağıya bak)

# 4) Veritabanı şemasını oluştur + Prisma client üret
npx prisma migrate dev --name init
npx prisma generate

# 5) Çalıştır
npm run dev
```

Uygulama: **http://localhost:3000**

`.env` örneği:

```env
DATABASE_URL="postgresql://KULLANICI:SIFRE@HOST:5432/rugvision?schema=public"
JWT_SECRET="çok-uzun-rastgele-bir-değer"   # EN AZ 32 KARAKTER (kısa olursa uygulama başlamaz)
# STORAGE_DRIVER="local"                    # Faz 3'te: r2 / s3 / b2
```

Hazır şablon için `.env.example` dosyasını kopyalayabilirsin.

Güçlü bir `JWT_SECRET` üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Veritabanı Seçenekleri

Şema PostgreSQL'dir; **Docker zorunlu değildir**. Iki kolay yol:

### A) Bulutta yönetilen Postgres (önerilen, Docker yok)
[Neon](https://neon.tech), [Supabase](https://supabase.com) veya Vercel Postgres üzerinden
ücretsiz bir veritabanı ac, bağlantı adresini `.env` -> `DATABASE_URL`'e yapıştır. Başka
kod değişikliği gerekmez.

### B) Yerelde Docker ile Postgres
```bash
docker run --name rugvision-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rugvision -p 5432:5432 -d postgres:16
```
Sonra `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rugvision?schema=public"
```

Her iki durumda da şemayi kurmak için: `npx prisma migrate dev` (veya production'da `npx prisma migrate deploy`).

---

## İlk Hesabı Oluşturma

Panelde şu an **kayıt (register)** ekranı yoktur; ilk merchant hesabıni API ile oluşturursun.

**macOS / Linux (curl):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ornek.com","password":"Test12345!","fullName":"Demo Kullanıcı","companyName":"Demo Mağaza"}'
```

**Windows (PowerShell):**
```powershell
$body = @{ email="demo@ornek.com"; password="Test12345!"; fullName="Demo Kullanıcı"; companyName="Demo Mağaza" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body $body
```

Alan kuralları: `password` en az 8 karakter, `fullName` ve `companyName` en az 2 karakter.
Kayıt sonrası donen `merchantId` ve token'lar ile panele giriş yapabilirsin.

---

## Panel Kullanımı

1. `http://localhost:3000/panel` adresini aç.
2. Kayıt ettigin **e-posta + şifre** ile giriş yap.
3. Panelde: analitik kartları, halı listesi, **model yükleme (GLB/USDZ)** ve **embed kodu üreteci** bulunur.

Halı oluşturmak için `POST /api/v1/rugs` endpoint'ini kullan (bkz. [API Özeti](#api-özeti)).
Oluşturduğun halıyı `http://localhost:3000/odamda-gor/<RUG_ID>` adresinde 3D/AR olarak görebilirsin.

---

## Widget'ı Bir Siteye Ekleme

Müşteri sitesinin arka planı **fark etmez** (PHP, Laravel, WordPress/WooCommerce, düz HTML...).
`widget.js` tamamen tarayıcıda çalışır. Ürün sayfası şablonuna su tek satırı ekle:

```html
<script
  src="https://SENIN-ADRESIN/widget.js"
  data-rug-id="RUG_ID"
  data-target=".add-to-cart"
  defer
></script>
```

- `data-rug-id`: RugVision'daki halı kimliği.
- `data-target`: O sitedeki "Sepete Ekle" butonunun CSS selector'u. Widget butonu onun yanına eklenir.

Alternatif: kendi SKU'nuzla eşleme (rug-id yerine):

```html
<script
  src="https://SENIN-ADRESIN/widget.js"
  data-merchant-id="MERCHANT_ID"
  data-sku="URUN_SKU"
  data-target=".add-to-cart"
  defer
></script>
```

Lokal deneme için hazır bir örnek sayfa: `public/widget-demo.html`.

---

## AR / 3D Model Notları

- **Android / masaüstü:** `GLB` formatı kullanılır (`model/gltf-binary`).
- **iOS (Quick Look):** `USDZ` formatı gerekir; doğru `Content-Type` (`model/vnd.usdz+zip`) ile servis edilir.
- USDZ'in iPhone'da sorunsuz açılması için **Y-up + ASCII** paketleme önemlidir.
- Model hazırlama/düzeltme için Blender headless scriptleri:
  - `scripts/fix_rug_model.py` - ölçek/pivot/yatay yerleşim
  - `scripts/export_quicklook_usdz.py` - iOS uyumlu USDZ üretimi
- Örnek modeller: `public/models/` — pilot 10 SKU: `RV-LUNA-001.glb` … `RV-NARIN-010.glb`
- Toplu üretim: `npm run models:batch` + `npm run models:attach` (bkz. `docs/MODEL-PIPELINE.md`)

### Cihaz uyumluluğu (özet)

| Platform | Tam AR | Not |
|----------|--------|-----|
| iPhone / iPad | Evet | Quick Look |
| Samsung, Pixel, Oppo/Vivo (global) | Evet | ARCore + Scene Viewer |
| POCO / Xiaomi | Kısmen | Modele bağlı |
| Huawei (GMS yok) | 3D only | Tam AR desteklenmez |
| Masaüstü | 3D modal | Tam AR değil |

Detay: `docs/PROJE_DURUM_RAPORU.md` §7.

---

## Telefonda Test (HTTPS Tunnel)

Mobil AR için HTTPS gerekir. Repo, sabit adresli ve **kendi kendini iyileştiren** bir tunnel ile gelir:

```bash
npm run dev:all     # next dev + tunnel birlikte
```

Varsayılan adres: `https://rugvision-demo.loca.lt` (değiştirmek için `TUNNEL_SUBDOMAIN` ortam degiskeni).
Windows'ta kesintisiz çalışmak için `baslat.bat` (çökerse otomatik yeniden başlar) kullanılabilir.

> Not: `loca.lt` ilk açılışta bir uyarı/şifre sayfası gösterebilir; bu sadece geliştirme içindir.
> Production'da gerçek domain + HTTPS kullanılır (tunnel'a gerek kalmaz).

---

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu (http://localhost:3000) |
| `npm run dev:all` | Sunucu + sabit HTTPS tunnel birlikte |
| `npm run tunnel` | Sadece tunnel |
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint |
| `npm test` | Otomatik birim testleri (`node:test` + `tsx`) |
| `npm run models:batch` | Foto+ölçü → GLB/USDZ toplu üretim (Blender) |
| `npm run models:attach` | Üretilen modelleri DB'ye bağla (`model3dUrl`) |
| `npx prisma migrate dev` | Şema migration (geliştirme) |
| `npx prisma studio` | Veritabanı görsel arayüzü |

---

## Proje Yapısı

```
app/
  api/v1/            # API endpoint'leri (auth, rugs, widget, analytics, uploads, domains, ar)
  odamda-gor/[id]/   # 3D/AR görüntüleyici sayfası
  panel/             # Merchant paneli
lib/                 # prisma, auth, auth-guard, cors, api helper'ları
prisma/              # schema.prisma
public/
  widget.js          # Embed widget scripti
  widget-demo.html   # Örnek müşteri sayfası
  models/            # Örnek 3D modeller (GLB/USDZ)
scripts/             # tunnel.mjs + Blender model scriptleri
docs/                # Master reference + durum raporu
```

---

## API Özeti

Tüm endpoint'ler `/api/v1/*` altındadır.

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/health` | Servis kontrolü |
| POST | `/auth/register` | Merchant + kullanıcı oluştur |
| POST | `/auth/login` | Giriş (access/refresh token) |
| POST | `/auth/refresh` | Token yenile |
| POST | `/auth/logout` | Çıkış |
| GET/POST | `/rugs` | Halı listesi / oluşturma |
| GET/PUT/DELETE | `/rugs/:id` | Halı detay / güncelle / sil |
| GET | `/widget/rug/:id` | Widget için halı verisi (CORS) |
| GET/PUT | `/widget/settings` | Widget ayarları |
| POST | `/analytics/events` | Olay kaydı (CORS) |
| GET | `/analytics/overview` | Merchant analitik özeti (auth) |
| POST | `/uploads/model` | GLB/USDZ/GLTF yükleme (auth) |
| GET/POST | `/domains` | Domain listele / kaydet (auth) |
| POST | `/domains/verify` | Domain doğrula (auth) |
| GET | `/ar/usdz/:filename` | USDZ dosyasını doğru Content-Type ile servis et |

Postman koleksiyonu: `docs/postman/`.

---

## Yol Haritası

- **Faz 1 - AR çekirdeği:** Tamamlandı (iPhone + Android AR, model pipeline).
- **Faz 2 - Ürünlesme çekirdeği:** Tamamlandı (embed widget, analytics, panel, upload, domain doğrulama, auth guard).
- **Faz 3 - Production & büyüme:**
  - Adım 1 (Production): **%100** — Vercel + Neon CANLI
  - Adım 2 (Model pipeline + R2): **%100** — Cloudflare R2 CDN canlı
  - Adım 3 (Pilot e-ticaret): **%100** — savasdogantekstil.com CANLI AR + 10 SKU görsel
  - Adım 4-7 (Shopify, AI, CI): planlandı

Detaylı kapsam ve takip:
- `docs/rugvision-master-reference-v1.md` (master reference)
- `docs/PROJE_DURUM_RAPORU.md` (resmi durum raporu)
- `docs/DEPLOY.md` (production runbook)
- `docs/PILOT-ECOMMERCE.md` (PHP pilot entegrasyon)
- `docs/MODEL-PIPELINE.md` (batch GLB/USDZ üretim)
- `VR_ODANDA_GOR.md` (faz takibi + Faz 3 adım adım plan)

**Tamamlanma:** ~%90 (tam vizyon) | **TEMEL satış paketi:** **%100** (pilot satışa hazır)

---

## Canlı Production

| Alan | Değer |
|------|-------|
| SaaS | https://rugvision-o54d.vercel.app |
| Panel | https://rugvision-o54d.vercel.app/panel |
| Pilot mağaza | https://savasdogantekstil.com/rugvision/ |
| GitHub | https://github.com/Majestelerinizz/rugvision |

Demo: `demo@ornek.com` / `Test12345!`  
Pilot: `savas@rugvision.com` / `Savas2026!`

---

## Lisans

Özel Proje. Tüm hakları saklı (c) Yusuf KARAGUZEL.
