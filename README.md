# RugVision — Universal In-Browser WebAR & 3D Rug Visualizer

[![Tests](https://img.shields.io/badge/Tests-65%20Passing%20(100%25)-success?style=flat-square)](tests/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-blue?style=flat-square&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

RugVision, halı ve ev dekorasyonu markaları için geliştirilen **yeni nesil SaaS tabanlı AR (artırılmış gerçeklik) platformudur**.
E-ticaret sitelerine eklenen **tek satır widget kodu** ile müşterilerinizin, hiçbir uygulama (Google Play Services / ARCore APK) indirmesine gerek kalmadan halıyı kendi odalarında **canlı kamera ve gerçek ölçekte (Three.js WebGL)** deneyimlemesini sağlar.

---

## 🌐 Canlı Demo & Pilot Bağlantıları

| Servis | Canlı URL | Açıklama |
|---|---|---|
| **Canlı WebAR Halı Görüntüleyici** | [rugvision.vercel.app/odamda-gor/cmqgswcn5000404la5os5ls7v](https://rugvision.vercel.app/odamda-gor/cmqgswcn5000404la5os5ls7v) | Universal WebAR, 3D zemin, sensör füzyonu, boyut seçici |
| **SaaS Yönetim Paneli** | [rugvision.vercel.app/panel](https://rugvision.vercel.app/panel) | Halı yönetimi, analitik, embed kodu üretici, model yükleme |
| **Pilot E-Ticaret Entegrasyonu** | [savasdogantekstil.com/rugvision](https://savasdogantekstil.com/rugvision/product-detail.php?id=3) | Savaş Doğan Tekstil pilot mağaza tek satır widget testi |

---

## 🚀 Yeni: Evrensel Tarayıcı İçi WebAR Motoru (Universal In-Browser WebAR)

Mevcut sistem AR çözümleri (Apple Quick Look ve Google Scene Viewer), kullanıcıyı tarayıcı dışına çıkarmakta ve özellikle **Xiaomi, POCO, Redmi ve Huawei** gibi cihazlarda ARCore eksikliğinden dolayı başarısız olmaktaydı. RugVision, bu problemi **tamamen tarayıcı içinde çalışan Three.js WebGL motoru** ile çözmüştür:

1. **Three.js WebGL 3D Zemin Sahnesi (`lib/webgl-floor-scene.ts`):**
   - 60° görüş açılı (FOV) dinamik kamera ve gerçekçi zemin kontakt gölgesi (contact shadow).
   - Gerçek dünya santimetre ölçülerini (`80×150 cm` ... `200×300 cm`) Three.js dünya koordinatlarına hassas dönüştürme.
   - 3D Neon köşe kılavuzları (**Gizmo Corner Lines**): Halının zemindeki sınırlarını ve yönünü netleştiren görsel çerçeve.

2. **Sensör Füzyonu & Jiroskop Takibi (`lib/sensor-fusion.ts`):**
   - Telefonun ivmeölçer ve jiroskop verilerini (`DeviceOrientationEvent`) dinler.
   - Çift yönlü Düşük Geçiren Filtre (**Low-Pass Filter**) ile el titremelerini süzer, pürüzsüz ve gerçekçi zemin eğim açısı (pitch/roll) üretir.
   - iOS 13+ Safari izin protokolünü otomatik yönetir.

3. **Optik Akış Tabanlı Zemin Odometrisi (`lib/floor-odometry.ts`):**
   - Kamera görüntüsünden 160×120 çözünürlükte zemin doku özellikleri (Harris benzeri kontrast gradyanları) çıkarır.
   - Blok eşleştirme optik akışı ile telefon hareket ettiğinde halıyı zemin üzerinde sabitler (Visual Odometry).
   - Aykırı değerleri (outlier) medyan filtresi ile temizleyerek kararlı sabitleme sağlar.

4. **Canlı Boyut Değiştirici & Fotoğraf Yakalama (`components/LiveCameraRugOverlay.tsx`):**
   - Kamerayı kapatmadan anında ebat değişimi (`80×150`, `120×180`, `160×230`, `200×290`, `200×300 cm`).
   - WebGL 3D sahnesi ile kamera akışını birleştiren yüksek çözünürlüklü snapshot çekimi.
   - Doğrudan `navigator.share` veya PNG indirme desteği.

---

## 📱 Kapsamlı Cihaz & Tarayıcı Uyumluluk Matrisi

| Cihaz Grubu | Evrensel WebAR (Yeni Motor) | Sistem AR Alternatifi | Fotoğrafta Gör (Perspektif) |
|---|:---:|:---:|:---:|
| **iPhone & iPad (iOS 14+)** | ✅ Doğrudan Safari & Chrome | ✅ Apple Quick Look (.USDZ) | ✅ Desteklenir |
| **Samsung Galaxy Serisi** | ✅ Chrome & Samsung Internet | ✅ Google Scene Viewer (.GLB) | ✅ Desteklenir |
| **Xiaomi / POCO / Redmi** | ✅ HyperOS & MIUI Chrome | ⚡ Otomatik WebAR Fallback | ✅ Desteklenir |
| **Huawei & Honor (GMS'siz)** | ✅ Huawei Browser & Chrome | ⚡ Otomatik WebAR Fallback | ✅ Desteklenir |
| **OPPO / vivo / OnePlus** | ✅ Android Chrome | ✅ Google Scene Viewer | ✅ Desteklenir |
| **Masaüstü (PC / Mac)** | ✅ Web Kamerası ile WebAR | 🖥️ 3D Model İnceleme | ✅ Desteklenir |

---

## 🧪 Kapsamlı Test Kapsamı (65/65 Birim Testi — %100 Başarı)

Tüm algoritmalar ve donanım yönlendirmeleri otomatik testlerle güvence altına alınmıştır:

```bash
npm test
```

- `tests/sensor-fusion.test.ts`: Düşük geçiren filtre yumuşatma, pitch/roll zemin açıları.
- `tests/webgl-scene.test.ts`: Three.js sahne üretimi, zemin raycasting, kamera rotasyonları.
- `tests/floor-odometry.test.ts`: Özellik noktası yakalama, blok eşleştirme ve medyan filtreleme.
- `tests/webgl-dimensions.test.ts`: Dinamik boyut oranları ve 3D köşe gizmo vertex tamponu.
- `tests/device-matrix.test.ts`: 18 farklı cihaz ve tarayıcı kombinasyonu için UA yönlendirme doğrulaması.
- `tests/device-ar.test.ts`: Scene Viewer intent ve Quick Look parametre testleri.
- `tests/model-urls.test.ts`: GLB/USDZ proxy ve güvenli aynı köken (same-origin) API yönlendirmeleri.
- `tests/rug-scale.test.ts`: Ebat çarpanları ve Türkiye halı standartları ölçek hesaplamaları.
- `tests/auth.test.ts`, `tests/slug.test.ts`, `tests/domain.test.ts`, `tests/rate-limit.test.ts`, `tests/storage.test.ts`, `tests/subscription.test.ts`.

---

## 🛠️ Teknoloji Yığını

- **Çekirdek:** Next.js 16 (App Router), React 19, TypeScript 5
- **3D & WebAR Motoru:** Three.js 0.186, HTML5 Canvas, WebGL, WebXR, MediaDevices API
- **Veritabanı & ORM:** PostgreSQL, Prisma 7, `@prisma/adapter-pg`
- **Tasarım:** TailwindCSS 4, modern koyu mod ve cam efekti (glassmorphism)
- **Güvenlik & Auth:** `jose` (JWT), `bcryptjs`, `zod`
- **Depolama & CDN:** Cloudflare R2 / AWS S3 uyumlu obje depolama + Yerel disk sürücüsü

---

## 📦 Hızlı Başlangıç

### 1) Depoyu Klonlayın ve Bağımlılıkları Kurun
```bash
git clone https://github.com/Majestelerinizz/rugvision.git
cd rugvision
npm install
```

### 2) Ortam Değişkenlerini Tanımlayın
`.env` dosyasını oluşturun:
```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/rugvision?schema=public"
JWT_SECRET="en-az-32-karakterli-guclu-bir-gizli-anahtar-degeri"
```

### 3) Veritabanı ve Prisma'yı Hazırlayın
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4) Uygulamayı Başlatın
```bash
npm run dev
```
Uygulama: `http://localhost:3000`

Mobil cihazlardan test etmek için dahili HTTPS tünelini çalıştırabilirsiniz:
```bash
npm run dev:all
```

---

## 🔌 E-Ticaret Sitelerine Tek Satır Widget Entegrasyonu

Müşteri sitenizin altyapısı ne olursa olsun (WooCommerce, Shopify, Ideasoft, Ticimax, Magento, PHP, düz HTML), ürün sayfasına şu tek satırı eklemeniz yeterlidir:

```html
<script
  src="https://rugvision.vercel.app/widget.js"
  data-rug-id="cmqgswc5a000004lanqoxc666"
  data-target=".add-to-cart"
  defer
></script>
```

- `data-rug-id`: RugVision panelinde tanımlı halının kimlik kodu.
- `data-target`: Ürün sayfasındaki "Sepete Ekle" butonunun CSS seçicisi.

---

## 📜 Lisans

**RugVision** — Özel Mülkiyet Yazılımıdır (Proprietary).  
© 2026 **Yusuf Karagüzel** · Tüm hakları saklıdır.  
İzinsiz kopyalama, dağıtım veya ticari kullanımı yasaktır.
