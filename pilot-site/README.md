# Pilot Site — savasdogantekstil.com/rugvision

> **Durum: Pilot tamamlandı** (17.06.2026)  
> Canlı site FTP/cPanel üzerinde; bu klasör referans + yedek.

## PageSpeed Mobil (son)

| Metrik | Skor |
|--------|------|
| Performans | **71** |
| Erişilebilirlik | **93** |
| En İyi Uygulamalar | **100** |
| SEO | **100** |

LCP hero: `assets/images/hali123-640.webp` (~149 KB) + preload + srcset.

## Canlıda yapılanlar (FTP)

| Adım | Dosya | Değişiklik |
|------|-------|------------|
| 2 | `includes/header.php` | Font async, preconnect, LCP preload, `style.min.css` |
| 3 | `includes/footer.php` | `main.min.js` + `defer` |
| 4 | `header.php` + `style.css` | Arama `label`, `.visually-hidden` |
| 5–11 | `index.php` | DOM küçültme, hero LCP picture, kategori LIMIT 4, blog aria-label |
| 6 | `functions.php`, `product-detail.php`, `footer.php` | `img_tag`, WebP, lazy |
| 7 | `assets/css/`, `assets/js/` | `style.min.css`, `main.min.js` |
| 9 | `product-detail.php` only | RugVision `widget.js` |

## Repo klasörleri

```
pilot-site/
  snippets/index.php              ← Tam ana sayfa (FTP kopyala-yapıştır)
  snippets/cssvejs/               ← Güncel CSS/JS kaynak + min
  snippets/functions-img-helper.php
  snippets/header-lcp-preload.php
  snippets/index-hero-lcp.php
  backup/2026-06-17/                ← İlk yedek snapshot
```

## RugVision (ayrı sistem)

- Widget: `https://rugvision-o54d.vercel.app/widget.js`
- Merchant ID: `cmqgswc5a000004lanqoxc666`
- AR modeller: R2 CDN

## Opsiyonel (yapılmadı)

- Adım 8: PWA `manifest.webmanifest` + ikonlar
- Adım 10: Ek mobil CSS — bkz. `docs/PILOT-MOBIL.md` (`cssvejs/style.css` güncellendi)

## Test

- PageSpeed: https://pagespeed.web.dev/ → `https://savasdogantekstil.com/rugvision/`
- AR: ürün detay → Odamda Gör
