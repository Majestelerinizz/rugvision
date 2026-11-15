# RugVision Panel — giriş + embed

Canlı panel: https://rugvision.vercel.app/panel

## Hesaplar (doğrulanmış)

| Rol | E-posta | Şifre | Merchant ID |
|-----|---------|-------|-------------|
| **Savaş / Pilot mağaza** | `savas@rugvision.com` | `SavasPanel2026!` | `cmqgswc5a000004lanqoxc666` |
| **Demo** (normal) | `demo@rugvision.app` | `Demo2026Rv!` | `cmwi2o7u5000008jkqalcl68f` |
| **Pilot** (yedek) | `pilot@rugvision.app` | `Pilot2026Rv!` | `cmwi2o8k6000408jko3ygfwg0` |
| **Yönetici yedek** | `yonetici@rugvision.app` | `Yonetici2026Rv!` | `cmwi4h4mm000008l6raprl490` |

E-ticaret admin (Firebase): `pilot@rugvision.app` / aynı şifre → https://rugvision-app.web.app/admin.html

## Embed

1. Panele giriş  
2. Halı seç  
3. Embed `<script>` kopyala  

```html
<script
  src="https://rugvision.vercel.app/widget.js"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="RV-LUNA-001"
  data-target=".add-to-cart"
  defer
></script>
```
