# RugVision Pilot — Tamamlandı

> Tarih: 17.06.2026  
> Pilot mağaza: https://savasdogantekstil.com/rugvision/  
> SaaS: https://rugvision-o54d.vercel.app

## PageSpeed Mobil (son ölçüm)

| Metrik | Skor |
|--------|------|
| Performans | **71** |
| Erişilebilirlik | **93** |
| En İyi Uygulamalar | **100** |
| SEO | **100** |

Paylaşımlı cPanel hosting için 71 performans kabul edilebilir hedef. AR ve e-ticaret çalışıyor.

## Canlı doğrulama (17.06.2026)

| Kontrol | Sonuç |
|---------|--------|
| API health | `ok`, DB `up` |
| Widget SKU (10/10) | `RV-LUNA-001` … `RV-NARIN-010` → 200 |
| GLB proxy | `/api/v1/ar/glb/*.glb` → 200 |
| USDZ proxy (iOS) | `/api/v1/ar/usdz/*.usdz` → 200 |
| `widget.js` deploy | USDZ API + Türkçe hata mesajları + Samsung intent (404 fix) |
| LCP görsel | `hali123-640.webp` → 149 KB |
| Ürün detay embed | `data-merchant-id` + `data-sku` + `defer` |

## Pilot FTP özeti

- `index.php` — hero LCP, 4 kategori, blog aria-label, 4 öne çıkan ürün
- `includes/header.php` — preload + min CSS + async font
- `product-detail.php` — RugVision widget (sadece ürün detay)
- `functions.php` — `img_tag()` WebP + lazy

## RugVision merchant

- Merchant ID: `cmqgswc5a000004lanqoxc666`
- Embed: `data/embed-snippets.html`
- Onboarding: `npm run rugs:onboard`

## Repo testleri

```bash
npm test    # 31/31 geçer
npm run build
```

## Opsiyonel (ileride)

- PWA manifest + ikonlar
- Kategori/blog için `hali123-300.webp` (~40 KB)
- CDN veya daha hızlı hosting → performans 85+
