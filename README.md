# RugVision

RugVision, halici ve ev dekorasyonu markalari icin gelistirilen **SaaS tabanli AR (artirilmis gerceklik) platformudur**.
Amac: bir e-ticaret urun sayfasina **tek satir kod** ekleyerek, musterinin halici telefonuyla
kendi odasinin zemininde **gercek boyutta** gormesini saglamaktir ("Odamda Gor").

> _RugVision is a SaaS AR platform that lets e-commerce stores add a one-line script to show
> rugs in the customer's room at real scale (iOS Quick Look + Android Scene Viewer)._

---

## Icindekiler

- [Ozellikler](#ozellikler)
- [Teknoloji](#teknoloji)
- [Gereksinimler](#gereksinimler)
- [Hizli Kurulum](#hizli-kurulum)
- [Veritabani Secenekleri](#veritabani-secenekleri)
- [Ilk Hesabi Olusturma](#ilk-hesabi-olusturma)
- [Panel Kullanimi](#panel-kullanimi)
- [Widget'i Bir Siteye Ekleme](#widgeti-bir-siteye-ekleme)
- [AR / 3D Model Notlari](#ar--3d-model-notlari)
- [Telefonda Test (HTTPS Tunnel)](#telefonda-test-https-tunnel)
- [Komutlar](#komutlar)
- [Proje Yapisi](#proje-yapisi)
- [API Ozeti](#api-ozeti)
- [Yol Haritasi](#yol-haritasi)

---

## Ozellikler

- 3D/AR goruntuleyici sayfasi (`/odamda-gor/:id`) - `model-viewer` tabanli.
- iPhone **Quick Look** (USDZ) + Android **Scene Viewer** (GLB) AR akisi.
- Tek satir **embed widget** (`public/widget.js`): "Sepete Ekle" yanina otomatik "Odamda Gor" butonu.
- Merchant paneli (`/panel`): giris, analitik, hali listesi, model yukleme, embed kodu ureteci.
- JWT auth (register/login/refresh/logout) + merchant bazli izolasyon.
- Rugs CRUD, widget ayarlari, analytics, domain dogrulama, model upload endpointleri.

## Teknoloji

- **Next.js 16** (App Router) + React 19
- **Prisma 7** + **PostgreSQL** (pg adapter)
- **TailwindCSS 4**
- Auth: `jose` (JWT) + `bcryptjs`, dogrulama: `zod`
- AR: `<model-viewer>`, GLB (Android/WebXR) ve USDZ (iOS Quick Look)

---

## Gereksinimler

- **Node.js 20+** ve npm
- Bir **PostgreSQL veritabani** (asagidaki seceneklerden biri)
- (Opsiyonel) Telefonda AR testi icin HTTPS - bu repo `localtunnel` ile gelir

---

## Hizli Kurulum

```bash
# 1) Projeyi klonla
git clone https://github.com/Majestelerinizz/rugvision.git
cd rugvision

# 2) Bagimliliklari kur
npm install

# 3) Ortam degiskenlerini ayarla
cp .env.example .env
#   .env icindeki DATABASE_URL ve JWT_SECRET degerlerini doldur (asagiya bak)

# 4) Veritabani semasini olustur + Prisma client uret
npx prisma migrate dev --name init
npx prisma generate

# 5) Calistir
npm run dev
```

Uygulama: **http://localhost:3000**

`.env` ornegi:

```env
DATABASE_URL="postgresql://KULLANICI:SIFRE@HOST:5432/rugvision?schema=public"
JWT_SECRET="cok-uzun-rastgele-bir-deger"
```

Guclu bir `JWT_SECRET` uretmek icin:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Veritabani Secenekleri

Sema PostgreSQL'dir; **Docker zorunlu degildir**. Iki kolay yol:

### A) Bulutta yonetilen Postgres (onerilen, Docker yok)
[Neon](https://neon.tech), [Supabase](https://supabase.com) veya Vercel Postgres uzerinden
ucretsiz bir veritabani ac, baglanti adresini `.env` -> `DATABASE_URL`'e yapistir. Baska
kod degisikligi gerekmez.

### B) Yerelde Docker ile Postgres
```bash
docker run --name rugvision-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rugvision -p 5432:5432 -d postgres:16
```
Sonra `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rugvision?schema=public"
```

Her iki durumda da semayi kurmak icin: `npx prisma migrate dev` (veya production'da `npx prisma migrate deploy`).

---

## Ilk Hesabi Olusturma

Panelde su an **kayit (register)** ekrani yoktur; ilk merchant hesabini API ile olusturursun.

**macOS / Linux (curl):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ornek.com","password":"Test12345!","fullName":"Demo Kullanici","companyName":"Demo Magaza"}'
```

**Windows (PowerShell):**
```powershell
$body = @{ email="demo@ornek.com"; password="Test12345!"; fullName="Demo Kullanici"; companyName="Demo Magaza" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body $body
```

Alan kurallari: `password` en az 8 karakter, `fullName` ve `companyName` en az 2 karakter.
Kayit sonrasi donen `merchantId` ve token'lar ile panele giris yapabilirsin.

---

## Panel Kullanimi

1. `http://localhost:3000/panel` adresini ac.
2. Kayit ettigin **e-posta + sifre** ile giris yap.
3. Panelde: analitik kartlari, hali listesi, **model yukleme (GLB/USDZ)** ve **embed kodu ureteci** bulunur.

Hali olusturmak icin `POST /api/v1/rugs` endpointini kullan (bkz. [API Ozeti](#api-ozeti)).
Olusturdugun haliyi `http://localhost:3000/odamda-gor/<RUG_ID>` adresinde 3D/AR olarak gorebilirsin.

---

## Widget'i Bir Siteye Ekleme

Musteri sitesinin arka plani **fark etmez** (PHP, Laravel, WordPress/WooCommerce, duz HTML...).
`widget.js` tamamen tarayicida calisir. Urun sayfasi sablonuna su tek satiri ekle:

```html
<script
  src="https://SENIN-ADRESIN/widget.js"
  data-rug-id="RUG_ID"
  data-target=".add-to-cart"
  defer
></script>
```

- `data-rug-id`: RugVision'daki hali kimligi (veya SKU eslemesi).
- `data-target`: O sitedeki "Sepete Ekle" butonunun CSS selector'u. Widget butonu onun yanina eklenir.

Lokal deneme icin hazir bir ornek sayfa: `public/widget-demo.html`.

---

## AR / 3D Model Notlari

- **Android / masaustu:** `GLB` formati kullanilir (`model/gltf-binary`).
- **iOS (Quick Look):** `USDZ` formati gerekir; dogru `Content-Type` (`model/vnd.usdz+zip`) ile servis edilir.
- USDZ'in iPhone'da sorunsuz acilmasi icin **Y-up + ASCII** paketleme onemlidir.
- Model hazirlama/duzeltme icin Blender headless scriptleri:
  - `scripts/fix_rug_model.py` - olcek/pivot/yatay yerlesim
  - `scripts/export_quicklook_usdz.py` - iOS uyumlu USDZ uretimi
- Ornek modeller: `public/models/` (orn. `Modern_rug.glb`, `Modern_rug.usdz`).

---

## Telefonda Test (HTTPS Tunnel)

Mobil AR icin HTTPS gerekir. Repo, sabit adresli ve **kendi kendini iyilestiren** bir tunnel ile gelir:

```bash
npm run dev:all     # next dev + tunnel birlikte
```

Varsayilan adres: `https://rugvision-demo.loca.lt` (degistirmek icin `TUNNEL_SUBDOMAIN` ortam degiskeni).
Windows'ta kesintisiz calismak icin `baslat.bat` (cokerse otomatik yeniden baslar) kullanilabilir.

> Not: `loca.lt` ilk acilista bir uyari/sifre sayfasi gosterebilir; bu sadece gelistirme icindir.
> Production'da gercek domain + HTTPS kullanilir (tunnel'a gerek kalmaz).

---

## Komutlar

| Komut | Aciklama |
|-------|----------|
| `npm run dev` | Gelistirme sunucusu (http://localhost:3000) |
| `npm run dev:all` | Sunucu + sabit HTTPS tunnel birlikte |
| `npm run tunnel` | Sadece tunnel |
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | Sema migration (gelistirme) |
| `npx prisma studio` | Veritabani gorsel arayuzu |

---

## Proje Yapisi

```
app/
  api/v1/            # API endpointleri (auth, rugs, widget, analytics, uploads, domains, ar)
  odamda-gor/[id]/   # 3D/AR goruntuleyici sayfasi
  panel/             # Merchant paneli
lib/                 # prisma, auth, auth-guard, cors, api helper'lari
prisma/              # schema.prisma
public/
  widget.js          # Embed widget scripti
  widget-demo.html   # Ornek musteri sayfasi
  models/            # Ornek 3D modeller (GLB/USDZ)
scripts/             # tunnel.mjs + Blender model scriptleri
docs/                # Master reference + durum raporu
```

---

## API Ozeti

Tum endpointler `/api/v1/*` altindadir.

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | `/health` | Servis kontrolu |
| POST | `/auth/register` | Merchant + kullanici olustur |
| POST | `/auth/login` | Giris (access/refresh token) |
| POST | `/auth/refresh` | Token yenile |
| POST | `/auth/logout` | Cikis |
| GET/POST | `/rugs` | Hali listesi / olusturma |
| GET/PUT/DELETE | `/rugs/:id` | Hali detay / guncelle / sil |
| GET | `/widget/rug/:id` | Widget icin hali verisi (CORS) |
| GET/PUT | `/widget/settings` | Widget ayarlari |
| POST | `/analytics/events` | Olay kaydi (CORS) |
| GET | `/analytics/overview` | Merchant analitik ozeti (auth) |
| POST | `/uploads/model` | GLB/USDZ/GLTF yukleme (auth) |
| GET/POST | `/domains` | Domain listele / kaydet (auth) |
| POST | `/domains/verify` | Domain dogrula (auth) |
| GET | `/ar/usdz/:filename` | USDZ dosyasini dogru Content-Type ile servis et |

Postman koleksiyonu: `docs/postman/`.

---

## Yol Haritasi

- **Faz 1 - AR cekirdegi:** Tamamlandi (iPhone + Android AR, model pipeline).
- **Faz 2 - Urunlesme cekirdegi:** Tamamlandi (embed widget, analytics, panel, upload, domain dogrulama, auth guard).
- **Faz 3 - Production & buyume:** Planlandi (production deploy + yonetilen DB + bulut depolama + otomatik model uretimi + Shopify/WooCommerce + AI zemin tespiti).

Detayli kapsam ve takip:
- `docs/rugvision-master-reference-v1.md` (master reference)
- `docs/PROJE_DURUM_RAPORU.md` (resmi durum raporu)
- `VR_ODANDA_GOR.md` (faz takibi + Faz 3 adim adim plan)

---

## Lisans

Ozel proje. Tum haklari sakli (c) Yusuf KARAGUZEL.
