# RugVision — Master Reference v1.0

## Proje Ozeti

**RugVision**, halicilar ve ev dekorasyonu markalari icin gelistirilen SaaS tabanli artirilmis gerceklik (AR) platformudur.

Amac:

Kullanicilarin satin almak istedikleri halilari kendi odalarinda gercek olculeriyle goruntuleyebilmesini saglamak.

Sistem:

- Web tabanli SaaS
- AR goruntuleme
- 3D hali goruntuleme
- Gomulebilir widget
- Analitik panel
- E-ticaret entegrasyonlari
- AI destekli oda analizi

## Vizyon

Dunyadaki tum halicilarin;

tek satir kod ile,

urun sayfalarina

"Odamda Gor"

ozelligi ekleyebilmesini saglamak.

## Misyon

Online hali satislarinda:

- Iade oranlarini azaltmak
- Donusum oranlarini artirmak
- Musteri guvenini yukseltmek
- Satin alma kararini hizlandirmak

## Sistem Mimarisi

```txt
Kullanici

↓

E-Ticaret Sitesi

↓

RugVision Widget

↓

RugVision API

↓

PostgreSQL

↓

AR Engine

↓

AI Engine
```

## Monorepo Yapisi

```txt
rugvision/

apps/
│
├── dashboard/
├── landing/
├── api/
├── widget/
│
packages/
│
├── ui/
├── database/
├── analytics/
├── auth/
│
services/
│
├── ar-engine/
├── ai-engine/
├── image-processing/
│
infrastructure/
│
├── docker/
├── nginx/
├── cloudflare/
│
prisma/
```

## Kullanici Rolleri

### SUPER_ADMIN

Tum sistemi yonetir.

Yetkiler:

- Firma yonetimi
- Abonelik yonetimi
- Sistem ayarlari
- Analitik goruntuleme
- Kullanici yonetimi

### MERCHANT

Halici firma hesabi

Yetkiler:

- Urun ekleme
- Urun silme
- Urun guncelleme
- Widget olusturma
- Analitik goruntuleme
- Domain yonetimi

### STAFF

Firma calisani

Yetkiler:

- Urun yonetimi
- Gorsel yukleme
- Model yukleme

## Veritabani

Ana Tablolar:

```txt
users
merchants
staff_members

subscriptions

rugs
rug_images
rug_models
rug_variants

widget_settings

analytics_events

domains

api_keys

ai_scans
```

## Hali Sistemi

Her hali icin:

```txt
ID
SKU
Slug

Urun Adi

Kategori

Marka

Aciklama

Genislik

Uzunluk

Fiyat

Renkler

Kapak Gorseli

3D Model

Aktif/Pasif
```

## Gorsel Sistemi

Desteklenen formatlar:

```txt
JPG
PNG
WEBP
AVIF
```

Optimizasyon:

```txt
WebP donusumu

Thumbnail uretimi

CDN cache
```

## 3D Model Sistemi

Format:

```txt
GLB
GLTF
```

Ozellikler:

```txt
LOD destegi

Sikistirma

Texture optimizasyonu

Model dogrulama
```

## AR Sistemi

Teknolojiler:

```txt
WebXR

Google Scene Viewer

Apple Quick Look

model-viewer
```

Ozellikler:

```txt
Gercek olcu

Dondurme

Olcekleme

Golge

Yuzey algilama
```

## AI Engine

### AI Room Detection

Algilanacak nesneler:

```txt
Duvar

Zemin

Koltuk

Masa

Perde

Yatak

TV Unitesi
```

### AI Floor Detection

Amac:

```txt
Haliyi dogru zemine yerlestirmek
```

### AI Color Match

Analiz:

```txt
Duvar renkleri

Mobilya renkleri

Perde renkleri

Dekorasyon uyumu
```

### AI Recommendation

Oneriler:

```txt
Bu odaya uygun halilar

Renk onerileri

Boyut onerileri
```

## API

Prefix:

```txt
/api/v1
```

### Auth

```txt
POST /auth/register

POST /auth/login

POST /auth/logout

POST /auth/refresh

POST /auth/forgot-password

POST /auth/reset-password
```

### Rugs

```txt
GET /rugs

GET /rugs/:id

POST /rugs

PUT /rugs/:id

DELETE /rugs/:id
```

### Widget

```txt
GET /widget/rug/:id

GET /widget/settings

PUT /widget/settings
```

### Analytics

```txt
GET /analytics/overview

GET /analytics/products

GET /analytics/ar-views

GET /analytics/conversions
```

### Domains

```txt
POST /domains

DELETE /domains/:id

GET /domains
```

## Analitik Sistemi

Takip Edilecek Olaylar:

```txt
Widget Acildi

AR Baslatildi

3D Goruntuleme

Urun Goruntuleme

Sepete Ekleme

Satin Alma

Paylasim
```

### Dashboard Kartlari

```txt
Toplam Urun

Toplam AR Goruntuleme

Toplam Widget Kullanimi

Toplam Satis

Donusum Orani

Aylik Gelir
```

## Widget Sistemi

Firma Sitesine Eklenecek Kod:

```html
<div
data-rugvision-widget
data-rug-id="PRODUCT_ID">
</div>

<script src="https://widget.rugvision.com/widget.js"></script>
```

### Widget Ozellestirme

```txt
Buton Rengi

Buton Yazisi

Border Radius

Firma Logosu

Dark Mode
```

## Halici Paneli

Menuler:

```txt
Dashboard

Urunler

Widget

Analitik

Alan Adlari

Abonelik

Ayarlar
```

### Dashboard

Kartlar:

```txt
Toplam Urun

Aktif Widget

AR Kullanimi

Donusum

Abonelik Durumu
```

## Abonelik Sistemi

### Starter

```txt
999 TL / Ay

50 Urun

Temel Widget

Temel Analitik
```

### Pro

```txt
2499 TL / Ay

500 Urun

Ozel Widget

Detayli Analitik

Alan Adi Dogrulama
```

### Enterprise

```txt
Ozel Fiyat

Sinirsiz Urun

API

Ozel Entegrasyonlar

Ozel Destek
```

## Entegrasyonlar

### Shopify

Ozellikler:

```txt
Urun Senkronizasyonu

Stok Senkronizasyonu

Otomatik Widget
```

### WooCommerce

Ozellikler:

```txt
WordPress Eklentisi

Tek Tik Kurulum
```

### Ticimax

```txt
XML Aktarim
```

### Ideasoft

```txt
XML Aktarim
```

## Guvenlik

```txt
JWT

Refresh Token

Rate Limiting

Cloudflare

WAF

API Key

2FA

Audit Logs
```

## Dosya Depolama

```txt
Cloudflare R2

Amazon S3

Backblaze B2
```

## Deployment

Frontend:

```txt
Vercel
```

Backend:

```txt
Docker

Ubuntu

Nginx

PM2
```

Veritabani:

```txt
PostgreSQL
```

CDN:

```txt
Cloudflare
```

## Gelecek Mobil Uygulama

Platformlar:

```txt
iOS

Android
```

Ozellikler:

```txt
AR Tarama

QR Kod

Katalog

Bildirimler
```

## MVP Yol Haritasi

### Faz 1

```txt
Auth

Urun CRUD

Dashboard

Widget

AR Goruntuleme
```

### Faz 2

```txt
Abonelik

Analitik

Domain Dogrulama

Dosya Yonetimi
```

### Faz 3

```txt
Shopify

WooCommerce

Ticimax

Ideasoft
```

### Faz 4

```txt
AI Floor Detection

AI Room Detection

AI Color Match
```

### Faz 5

```txt
Mobil Uygulama

Native AR

3D Katalog
```

## Uzun Vadeli Hedef

RugVision'in hedefi:

Dunyadaki halicilarin ve ev dekorasyonu markalarinin urunlerini musterilerine kendi evlerinde artirilmis gerceklik ile deneyimletebildigi lider SaaS platformu olmaktir.

Surum: v1.0.0  
Durum: Planlama
