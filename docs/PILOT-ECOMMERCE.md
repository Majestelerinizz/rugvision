# RugVision — E-Ticaret Pilot Entegrasyon Rehberi

> Pilot site: **https://savasdogantekstil.com/rugvision/**  
> Durum: **CANLI** — 10 ürün, ürün bazlı fotoğraf + AR model, iPhone Quick Look doğrulandı  
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
| AR modeller | `/models/RV-{SKU}.glb` (her ürün kendi modeli) |
| Site görselleri | `assets/images/products/RV-{SKU}.png` |

---

## Kurulum adımları (PHP alt klasör `/rugvision`)

### Adım 1 — `config/rugvision.php` ✅

```php
<?php
if (!defined('RUGVISION_WIDGET_BASE')) {
    define('RUGVISION_WIDGET_BASE', 'https://rugvision-o54d.vercel.app');
}
if (!defined('RUGVISION_MERCHANT_ID')) {
    define('RUGVISION_MERCHANT_ID', 'cmqgswc5a000004lanqoxc666');
}
```

### Adım 2 — `product-detail.php` ✅

Widget script (footer öncesi):

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

Ürün kartlarında "Odanda Gör" → ürün detay sayfasına yönlendirir.

### Adım 4 — Ürün görselleri (SKU bazlı) ✅

Her halı **kendi fotoğrafını** gösterir (artık tek `hali123.jpg` yok).

**4a) FTP — görselleri yükle**

cPanel → `rugvision/assets/images/products/` klasörüne:

```
RV-LUNA-001.png
RV-TERRA-002.png
RV-ARYA-003.png
RV-NOVA-004.png
RV-MIRA-005.png
RV-SAFIR-006.png
RV-ELARA-007.png
RV-VERONA-008.png
RV-LIVA-009.png
RV-NARIN-010.png
```

Kaynak (RugVision repo): `public/rug-covers/RV-*.png`

**4b) phpMyAdmin — veritabanını güncelle**

`docs/sql/update_product_images.sql` import et veya SQL sekmesinde çalıştır:

```sql
UPDATE products
SET image = CONCAT('assets/images/products/', sku, '.png')
WHERE sku LIKE 'RV-%';

UPDATE product_images pi
INNER JOIN products p ON p.id = pi.product_id
SET pi.image = p.image
WHERE p.sku LIKE 'RV-%';
```

**Kontrol:** https://savasdogantekstil.com/rugvision/products.php → 10 farklı halı görseli.

---

## SKU eşleme tablosu

| id | Ürün | SKU | Site görseli | AR model |
|----|------|-----|--------------|----------|
| 1 | Luna | RV-LUNA-001 | `RV-LUNA-001.png` | `/models/RV-LUNA-001.glb` |
| 2 | Terra | RV-TERRA-002 | `RV-TERRA-002.png` | `/models/RV-TERRA-002.glb` |
| 3 | Arya | RV-ARYA-003 | `RV-ARYA-003.png` | `/models/RV-ARYA-003.glb` |
| 4 | Nova | RV-NOVA-004 | `RV-NOVA-004.png` | `/models/RV-NOVA-004.glb` |
| 5 | Mira | RV-MIRA-005 | `RV-MIRA-005.png` | `/models/RV-MIRA-005.glb` |
| 6 | Safir | RV-SAFIR-006 | `RV-SAFIR-006.png` | `/models/RV-SAFIR-006.glb` |
| 7 | Elara | RV-ELARA-007 | `RV-ELARA-007.png` | `/models/RV-ELARA-007.glb` |
| 8 | Verona | RV-VERONA-008 | `RV-VERONA-008.png` | `/models/RV-VERONA-008.glb` |
| 9 | Liva | RV-LIVA-009 | `RV-LIVA-009.png` | `/models/RV-LIVA-009.glb` |
| 10 | Narin | RV-NARIN-010 | `RV-NARIN-010.png` | `/models/RV-NARIN-010.glb` |

---

## Test

| Test | URL / beklenen |
|------|----------------|
| Ürün listesi | https://savasdogantekstil.com/rugvision/products.php |
| Ürün detay | https://savasdogantekstil.com/rugvision/product-detail.php?id=3 |
| SKU | `RV-ARYA-003` |
| iPhone AR | Quick Look → ürünün kendi halısı zeminde |
| API | `GET .../widget/rug?merchantId=cmqgswc5a000004lanqoxc666&sku=RV-ARYA-003` |

---

## Model formatları

| Format | Kullanım |
|--------|----------|
| **GLB** | Android AR, masaüstü 3D |
| **USDZ** | iPhone Quick Look |
| PNG | Ürün fotoğrafı (sitede) — AR modeli değil |

Modeller RugVision'da: `https://rugvision-o54d.vercel.app/models/RV-ARYA-003.glb`

Yeni halı ekleme: `docs/MODEL-PIPELINE.md` (`npm run models:batch` + `models:attach`)

---

## Sıradaki işler (opsiyonel)

- [x] Widget + ürün detay AR ✅
- [x] 10 SKU ürün bazlı model ✅
- [x] 10 SKU ürün bazlı site görselleri ✅
- [ ] Cloudflare R2 production (100+ halı ölçeği)
- [ ] Slider/footer köprü linkleri
- [ ] Domain doğrulama panelde
- [ ] Fotoğraf inset temizleme (AR kalite iyileştirme)
