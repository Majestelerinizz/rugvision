# PageSpeed Mobil — Sonuç ve kalan işler

> Tarih: 17.06.2026  
> URL: https://savasdogantekstil.com/rugvision/

## Skorlar (Mobil)

| Metrik | Skor | Durum |
|--------|------|--------|
| **Performans** | **73** | Turuncu — iyileştirme gerek |
| Erişilebilirlik | 88 | Turuncu — küçük düzeltmeler |
| En İyi Uygulamalar | 100 | Mükemmel |
| SEO | 100 | Mükemmel |

### Core Web Vitals

| Metrik | Değer | Hedef |
|--------|-------|-------|
| **LCP** | **5,8 sn** | < 2,5 sn |
| FCP | 2,3 sn | < 1,8 sn |
| Speed Index | 4,5 sn | Düşük |
| TBT | 0 ms | İyi |
| CLS | 0 | Mükemmel |

**Ana sorun: LCP** — sayfadaki en büyük görsel (hero slider) geç yükleniyor.

---

## Zaten yapılmış (canlıda doğrulandı)

- `style.min.css` + `main.min.js` defer
- Font async (preload + onload)
- WebP `<picture>` (hali123.webp)
- Lazy loading (hero dışı görseller)
- DOM küçültme, widget sadece ürün detay
- Mobil CSS (dokunma, iOS zoom)

Optimizasyonlar **çalışıyor**; skor 73 çünkü **hero görseli hâlâ ağır** ve hosting TTFB yavaş olabilir.

---

## Neden LCP 5,8 sn?

1. **Aynı büyük görsel** (`hali123`) hero + 8 kategori + ürünlerde tekrarlanıyor
2. Mobilde ~390px genişlik için **1200px görsel** sunuluyor (“Properly size images”)
3. **Paylaşımlı hosting** — ilk byte gecikmesi (TTFB)
4. **CSS hâlâ render-blocking** (minify var ama blokluyor — normal)

---

## Öncelikli düzeltmeler (mobil LCP)

### 1) Küçük hero WebP (en etkili — ~1–2 sn kazanç)

[squoosh.app](https://squoosh.app):

1. `hali123.jpg` aç
2. Resize: **genişlik 640px**
3. WebP, kalite ~75
4. Kaydet: `hali123-640.webp`
5. FTP: `assets/images/hali123-640.webp`

`header.php` `<head>` içine ekle:

```html
<link rel="preload" as="image" href="<?= asset('assets/images/hali123-640.webp') ?>" type="image/webp" fetchpriority="high">
```

### 2) Hero `srcset` — `index.php` ilk slide

İlk slide `img_tag` yerine (sadece ilk slide):

```php
<picture>
  <source
    srcset="<?= asset('assets/images/hali123-640.webp') ?> 640w, <?= asset('assets/images/hali123.webp') ?> 1200w"
    sizes="100vw"
    type="image/webp">
  <img src="<?= asset($slide['image']) ?>"
       alt="<?= e(lang_field($slide, 'title')) ?>"
       width="1200" height="560"
       loading="eager" fetchpriority="high" decoding="async">
</picture>
```

(Diğer slide’lar lazy + aynı srcset kalabilir.)

### 3) Erişilebilirlik 88 → 95 — blog linkleri

`index.php` blog kartında:

**ESKİ:**
```php
<a href="blog-detail.php?id=...">
```

**YENİ:**
```php
<a href="blog-detail.php?id=..." aria-label="<?= e(lang_field($post, 'title')) ?>">
```

(PageSpeed: “Links do not have discernible name”)

### 4) Kontrast (opsiyonel)

`style.css` içinde:

```css
.topbar-item { color: #e8e0d4; }  /* biraz daha açık */
.breadcrumb, .section-head p { color: #6f675e; }  /* muted koyulaştır */
```

Sonra `style.min.css` yeniden üret.

### 5) Kategorileri mobilde 4’e düşür (opsiyonel)

`index.php`: `LIMIT 8` → mobilde 4 kategori = daha az görsel isteği.

---

## Beklenen skor (düzeltme sonrası)

| Metrik | Şimdi | Hedef |
|--------|-------|-------|
| Performans | 73 | **85–92** |
| Erişilebilirlik | 88 | **92–96** |
| LCP | 5,8 sn | **2,5–3,5 sn** |

> 95+ performans için CDN veya daha hızlı hosting gerekir; paylaşımlı cPanel’de 85–90 gerçekçi hedef.

---

## Kontrol listesi

- [ ] `hali123-640.webp` yüklendi
- [ ] `header.php` preload eklendi
- [ ] Hero ilk slide srcset
- [ ] Blog `aria-label`
- [ ] `style.min.css` güncellendi
- [ ] PageSpeed Mobil tekrar ölçüldü

---

## AR (Odamda Gör)

Performans skorundan **bağımsız** — AR çalışıyorsa pilot hazır.  
Mobil AR için widget + ürün detay yeterli.
