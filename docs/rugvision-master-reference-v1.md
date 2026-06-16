# RugVision — Master Reference v1.0

## Proje Özeti

**RugVision**, halıcılar ve ev dekorasyonu markaları için geliştirilen SaaS tabanlı artırılmış gerçeklik (AR) platformudur.

Amaç:

Kullanıcıların satın almak istedikleri halıları kendi odalarında gerçek ölçüleriyle görüntüleyebilmesini sağlamak.

Sistem:

- Web tabanlı SaaS
- AR görüntüleme
- 3D halı görüntüleme
- Gömülebilir widget
- Analitik panel
- E-ticaret entegrasyonları
- AI destekli oda analizi

## Vizyon

Dünyadaki tüm halıcıların;

tek satır kod ile,

ürün sayfalarına

"Odamda Gör"

özelliği ekleyebilmesini sağlamak.

## Misyon

Online halı satışlarinda:

- İade oranlarını azaltmak
- Dönüşüm oranlarını artırmak
- Müşteri güvenini yükseltmek
- Satın alma kararını hızlandırmak

## Sistem Mimarisi

```txt
Kullanıcı

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

## Kullanıcı Rolleri

### SUPER_ADMIN

Tüm sistemi yonetir.

Yetkiler:

- Firma yönetimi
- Abonelik yönetimi
- Sistem ayarları
- Analitik görüntüleme
- Kullanıcı yönetimi

### MERCHANT

Halıcı firma hesabı

Yetkiler:

- Ürün ekleme
- Ürün silme
- Ürün güncelleme
- Widget oluşturma
- Analitik görüntüleme
- Domain yönetimi

### STAFF

Firma çalışani

Yetkiler:

- Ürün yönetimi
- Görsel yükleme
- Model yükleme

## Veritabanı

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

## Halı Sistemi

Her halı için:

```txt
ID
SKU
Slug

Ürün Adi

Kategori

Marka

Açıklama

Genislik

Uzunluk

Fiyat

Renkler

Kapak Görseli

3D Model

Aktif/Pasif
```

## Görsel Sistemi

Desteklenen formatlar:

```txt
JPG
PNG
WEBP
AVIF
```

Optimizasyon:

```txt
WebP dönüşümu

Thumbnail üretimi

CDN cache
```

## 3D Model Sistemi

Format:

```txt
GLB
GLTF
```

Özellikler:

```txt
LOD destegi

Sikistirma

Texture optimizasyonu

Model doğrulama
```

## AR Sistemi

Teknolojiler:

```txt
WebXR

Google Scene Viewer

Apple Quick Look

model-viewer
```

Özellikler:

```txt
Gerçek ölçü

Dondurme

Ölçekleme

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

Amaç:

```txt
Halıyı doğru zemine yerleştirmek
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
Bu odaya uygun halılar

Renk önerileri

Boyut önerileri
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

3D Görüntüleme

Ürün Görüntüleme

Sepete Ekleme

Satın Alma

Paylasim
```

### Dashboard Kartlari

```txt
Toplam Ürün

Toplam AR Görüntüleme

Toplam Widget Kullanımi

Toplam Satış

Dönüşüm Orani

Aylık Gelir
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

### Widget Özellestirme

```txt
Buton Rengi

Buton Yazisi

Border Radius

Firma Logosu

Dark Mode
```

## Halıcı Paneli

Menuler:

```txt
Dashboard

Ürünler

Widget

Analitik

Alan Adlari

Abonelik

Ayarlar
```

### Dashboard

Kartlar:

```txt
Toplam Ürün

Aktif Widget

AR Kullanımi

Dönüşüm

Abonelik Durumu
```

## Abonelik Sistemi

### Starter

```txt
999 TL / Ay

50 Ürün

Temel Widget

Temel Analitik
```

### Pro

```txt
2499 TL / Ay

500 Ürün

Özel Widget

Detaylı Analitik

Alan Adi Doğrulama
```

### Enterprise

```txt
Özel Fiyat

Sinirsiz Ürün

API

Özel Entegrasyonlar

Özel Destek
```

## Entegrasyonlar

### Shopify

Özellikler:

```txt
Ürün Senkronizasyonu

Stok Senkronizasyonu

Otomatik Widget
```

### WooCommerce

Özellikler:

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

## Güvenlik

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

Veritabanı:

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

Özellikler:

```txt
AR Tarama

QR Kod

Katalog

Bildirimler
```

## MVP Yol Haritası

### Faz 1

```txt
Auth

Ürün CRUD

Dashboard

Widget

AR Görüntüleme
```

### Faz 2

```txt
Abonelik

Analitik

Domain Doğrulama

Dosya Yönetimi
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

Dünyadaki halıcıların ve ev dekorasyonu markalarının ürünlerini müşterilerine kendi evlerinde artırılmış gerçeklik ile deneyimletebildiği lider SaaS platformu olmaktır.

Sürüm: v1.0.0  
Durum: Planlama
