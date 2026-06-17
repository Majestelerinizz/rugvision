# Pilot Site — PageSpeed & Eksiksiz Optimizasyon

> Hedef: `https://savasdogantekstil.com/rugvision/`  
> PageSpeed (mobil): Performans 93 · Erişilebilirlik 87 · SEO 100 · PWA 57

---

## Nerede ne düzeltilir?

| Katman | Nerede | Kim düzenler |
|--------|--------|--------------|
| **HTML / CSS / JS / PHP** | `savasdogantekstil.com/rugvision/` (FTP) | Siz / halıcı sitesi |
| **AR widget** | `rugvision-o54d.vercel.app/widget.js` | RugVision (repo) |
| **3D / AR modeller** | R2 CDN + RugVision API | RugVision (repo) |

**Evet — PageSpeed’deki eksiklerin çoğu halıcı sitesinin HTML/CSS/JS tarafında düzeltilir.** RugVision AR’ı etkilemez; site hızını ve erişilebilirliği yükseltir.

---

## 1. Render-blocking (~0,74 sn) — PHP `header` / `<head>`

**Sorun:** Google Fonts ve `style.css` sayfa açılışını blokluyor.

**Çözüm:** `includes/head.php` veya tüm sayfalardaki `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/rugvision/assets/css/style.css" as="style">
<link rel="stylesheet" href="/rugvision/assets/css/style.css">

<!-- Font: render-blocking olmasin -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600&display=swap"
  onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600&display=swap">
</noscript>
```

**JS (footer):**

```html
<script src="/rugvision/assets/js/main.js" defer></script>
<!-- RugVision widget zaten defer ile -->
```

---

## 2. Erişilebilirlik (87 → 95+)

| PageSpeed uyarısı | Düzeltme (PHP/HTML) |
|-------------------|---------------------|
| Butonlarda erişilebilir ad yok | `aria-label="Ara"` (arama), `aria-label="Menü"` (hamburger) |
| Form etiketi yok | Arama kutusu: `<label for="search" class="sr-only">Ürün ara</label>` |
| Görsellerde alt yok | Tüm `<img>` → anlamlı `alt` (ürün adı) |
| RugVision butonu | Widget otomatik: `aria-label="Odamda Gör — AR ile odada gör"` ✅ (repo) |

**Arama formu örneği:**

```html
<label for="site-search" class="visually-hidden">Ürün, kategori veya renk ara</label>
<input id="site-search" type="search" name="q" placeholder="Ürün ara..." autocomplete="off">
<button type="submit" aria-label="Ara">&#128269;</button>
```

`assets/css/style.css` içine:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

---

## 3. DOM boyutu (1.221 node)

**Sorun:** Ana sayfada aynı ürün listesi 4 kez tekrarlanıyor (Öne Çıkan, En Çok Satan, Yeni, Kampanya).

**Çözüm (PHP `index.php`):**

- Tek ürün grid’i kullan; diğer bölümlerde sadece **3–4 ürün** göster veya
- Tekrarlayan blokları kaldırıp “Tümünü gör” linki ver
- Hedef: **< 800 DOM node**

---

## 4. Görseller (WebP + boyut)

| Yapılacak | Dosya |
|-----------|--------|
| Ürün PNG → WebP (veya AVIF) | `assets/images/products/RV-*.webp` |
| `width` + `height` ekle | Her `<img>` (CLS önler) |
| `loading="lazy"` | Fold altı görseller |
| Hero slider | `fetchpriority="high"` sadece ilk slide |

```html
<img
  src="/rugvision/assets/images/products/RV-LUNA-001.webp"
  alt="Luna Natural Siyah Bordürlü Halı"
  width="400"
  height="400"
  loading="lazy"
  decoding="async"
>
```

---

## 5. CSS / JS küçültme

FTP / build adımları:

```bash
# CSS (sunucuda veya lokal)
npx clean-css-cli -o style.min.css style.css

# JS
npx terser main.js -o main.min.js -c -m
```

PHP’de `.min.css` / `.min.js` kullan.

Kullanılmayan CSS kurallarını temizle (özellikle kullanılmayan slider/footer stilleri).

---

## 6. PWA (57 → isteğe bağlı)

AR için PWA şart değil; PageSpeed PWA skorunu yükseltmek için:

**`manifest.webmanifest`:**

```json
{
  "name": "RugVision Halı Concept",
  "short_name": "RugVision",
  "start_url": "/rugvision/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#b45309",
  "icons": [
    { "src": "/rugvision/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/rugvision/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**`<head>`:**

```html
<link rel="manifest" href="/rugvision/manifest.webmanifest">
<link rel="apple-touch-icon" href="/rugvision/assets/icons/apple-touch-icon.png">
<meta name="theme-color" content="#b45309">
```

Service worker opsiyonel (offline gerekmezse eklemeyin).

---

## 7. RugVision embed — doğru kullanım

Sadece **ürün detay** sayfasında (`product-detail.php`):

```html
<div data-rugvision></div>
<script
  src="https://rugvision-o54d.vercel.app/widget.js"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="<?= e($product['sku']) ?>"
  data-target="[data-rugvision]"
  data-button-text="Odamda Gör"
  data-button-color="#b45309"
  defer
></script>
```

Ana sayfaya widget koymayın (gereksiz JS + API çağrısı).

---

## Kontrol listesi (eksik kalmasın)

### Halıcı sitesi (FTP)
- [ ] Font async yükleme
- [ ] `main.js` → `defer`
- [ ] CSS/JS minify
- [ ] Arama formu `label` + `aria-label`
- [ ] Tüm butonlarda `aria-label`
- [ ] Görseller: alt + width/height + lazy
- [ ] WebP ürün görselleri
- [ ] Ana sayfa DOM sadeleştirme
- [ ] (Opsiyonel) manifest + apple-touch-icon

### RugVision (repo — otomatik deploy)
- [x] Widget `aria-label`
- [x] Widget `defer`
- [x] Çoklu cihaz AR fallback
- [x] GLB proxy (masaüstü 3D)
- [x] R2 CDN cache

---

## Beklenen skor (düzeltme sonrası)

| Metrik | Şimdi | Hedef |
|--------|-------|-------|
| Performans | 93 | 95–98 |
| Erişilebilirlik | 87 | 92–98 |
| En İyi Uygulamalar | 96 | 96+ |
| SEO | 100 | 100 |
| PWA | 57 | 70+ (manifest ile) |

---

## Özet

**PageSpeed = halıcı sitesi işi (PHP/HTML/CSS/JS).**  
**AR = RugVision işi (widget + API + R2).**  

İkisi ayrı; ikisini de tamamlayınca hem hızlı hem AR’lı tam paket olur.

FTP erişiminiz varsa `pilot-site/` snippet’lerini `includes/head.php` ve `index.php`’ye uygulayın; RugVision tarafı zaten güncel.
