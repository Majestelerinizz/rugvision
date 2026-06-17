# Pilot Site — savasdogantekstil.com/rugvision

> **Durum: Optimizasyon tamamlandı** (Haziran 2026)  
> Canlı site FTP/cPanel üzerinde; bu klasör referans + yedek.

## Canlıda yapılanlar (FTP)

| Adım | Dosya | Değişiklik |
|------|-------|------------|
| 2 | `includes/header.php` | Font async, preconnect, `style.min.css` |
| 3 | `includes/footer.php` | `main.min.js` + `defer` |
| 4 | `header.php` + `style.css` | Arama `label`, `.visually-hidden` |
| 5 | `index.php` | DOM küçültme (4 ürün + keşfet linkleri) |
| 6 | `functions.php`, `index.php`, `product-detail.php`, `footer.php` | `img_tag`, WebP, lazy |
| 7 | `assets/css/`, `assets/js/` | `style.min.css`, `main.min.js` |
| 9 | `product-detail.php` only | RugVision `widget.js` |

## Repo klasörleri

```
pilot-site/
  snippets/cssvejs/     ← Güncel CSS/JS kaynak + min (cPanel yükleme)
  snippets/index-step6.php
  snippets/product-detail-step6.php
  snippets/functions-img-helper.php
  backup/2026-06-17/    ← İlk yedek snapshot
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
