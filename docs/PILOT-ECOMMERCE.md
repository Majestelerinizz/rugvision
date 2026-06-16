# RugVision — E-Ticaret Pilot Entegrasyon Rehberi

> Pilot site: **https://savasdogantekstil.com/rugvision/**  
> Durum: **Ürün detay sayfasında canlı AR çalışıyor** (iPhone Quick Look doğrulandı)  
> Tarih: 17.06.2026

---

## Mimari (iki ayrı sistem)

```
savasdogantekstil.com/rugvision/     →  Halı e-ticaret (PHP + MySQL)
rugvision-o54d.vercel.app            →  RugVision SaaS (AR + widget + modeller)
```

Widget ve 3D modeller **RugVision sunucusundan** gelir. Halı sitesine GLB yüklemeye gerek yok.

---

## Pilot merchant bilgileri

| Alan | Değer |
|------|--------|
| Firma | Savas Dogan Tekstil |
| Merchant ID | `cmqgswc5a000004lanqoxc666` |
| Panel giriş | `savas@rugvision.com` / `Savas2026!` |
| Ürün sayısı | 10 (SKU: `RV-LUNA-001` … `RV-NARIN-010`) |
| Demo model | `/models/Modern_rug.glb` (tüm ürünlerde pilot için) |

---

## Kurulum adımları (PHP alt klasör `/rugvision`)

### Adım 1 — `config/rugvision.php` ✅

Yol: `rugvision/config/rugvision.php`

```php
<?php
if (!defined('RUGVISION_WIDGET_BASE')) {
    define('RUGVISION_WIDGET_BASE', 'https://rugvision-o54d.vercel.app');
}
if (!defined('RUGVISION_MERCHANT_ID')) {
    define('RUGVISION_MERCHANT_ID', 'cmqgswc5a000004lanqoxc666');
}
```

> `config/` klasörü `.htaccess` ile tarayıcıdan kapalıdır (403 normal). PHP `require_once` ile okur.

### Adım 2 — `product-detail.php` ✅

1. `require_once __DIR__ . '/config/rugvision.php';` ekle
2. Eski turuncu köprü butonunu sil (`rugvision_url` linki)
3. `<div class="pd-cart-row" data-rugvision>` işareti ekle
4. Footer öncesi widget script:

```html
<script
  src="<?= e(RUGVISION_WIDGET_BASE) ?>/widget.js"
  data-merchant-id="<?= e(RUGVISION_MERCHANT_ID) ?>"
  data-sku="<?= e($product['sku']) ?>"
  data-target="[data-rugvision]"
  data-button-text="<?= e(t('view_in_room')) ?>"
  data-button-color="#b45309"
  defer></script>
```

### Adım 3 — `includes/functions.php` ✅

`render_product_card` içinde kart linki ürün detaya yönlendirildi.

### Opsiyonel — slider ve footer (henüz köprü sayfasına gider)

- `index.php` slider: `rugvision/index.php` → `products.php` yapılabilir
- `includes/footer.php` strip: aynı şekilde

---

## Test

| Test | URL / beklenen |
|------|----------------|
| Ürün detay | https://savasdogantekstil.com/rugvision/product-detail.php?id=3 |
| SKU | `RV-ARYA-003` |
| Buton | Tek "Odanda Gör" (widget) — eski turuncu buton yok |
| iPhone | Quick Look AR açılır, halı zeminde görünür |
| Masaüstü | 3D modal (iframe) — normal |

API doğrulama:

```
GET https://rugvision-o54d.vercel.app/api/v1/widget/rug?merchantId=cmqgswc5a000004lanqoxc666&sku=RV-ARYA-003
```

---

## Model formatları

| Format | Kullanım |
|--------|----------|
| **GLB** | Android AR, masaüstü 3D |
| **USDZ** | iPhone Quick Look |
| JPG/PNG/WebP | Ürün fotoğrafı only — AR değil |

Modeller RugVision'da: `https://rugvision-o54d.vercel.app/models/Modern_rug.glb`

---

## Cihaz uyumlulugu (AR)

| Marka / platform | Tam AR | Fallback |
|------------------|--------|----------|
| iPhone / iPad | Evet (Quick Look) | — |
| Samsung, Pixel | Evet (Scene Viewer) | 3D |
| Oppo / Vivo global | Cogunlukla evet | 3D |
| POCO / Xiaomi | Kismen | 3D |
| Huawei (GMS yok) | Hayir | 3D |

Tam tablo: `docs/PROJE_DURUM_RAPORU.md` §7.

---

## Sıradaki işler

- [x] `functions.php` kart linki (Adım 3) ✅
- [ ] Slider/footer köprü linkleri → `products.php` (opsiyonel)
- [ ] Domain doğrulama (`savasdogantekstil.com` panelde)
- [ ] R2/S3 bulut depolama (kalıcı upload)
- [ ] Ürün bazlı GLB/USDZ (şu an tek demo model)
