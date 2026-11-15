# RugVision Panel — giriş + embed

Canlı panel: https://rugvision.vercel.app/panel

> Eski `demo@ornek.com` / `savas@…` hesapları production DB’de şifre uyuşmazlığı verebilir
> (`Geçersiz kimlik bilgileri`). Aşağıdaki **yeni** hesapları kullan.

## Hesaplar (2026-11-15 — doğrulanmış login)

| Rol | E-posta | Şifre | Merchant ID |
|-----|---------|-------|-------------|
| **Demo** (normal mağaza) | `demo@rugvision.app` | `Demo2026Rv!` | `cmwi2o7u5000008jkqalcl68f` |
| **Pilot** (yönetici mağaza) | `pilot@rugvision.app` | `Pilot2026Rv!` | `cmwi2o8k6000408jko3ygfwg0` |
| **Savaş Doğan Tekstil** | `yonetici@rugvision.app` | `Yonetici2026Rv!` | `cmwi4h4mm000008l6raprl490` |

`savas@rugvision.com` kayıtlı ama eski şifre drift — sıfırlama: `POST /api/v1/auth/set-password` (kurtarma anahtarı 17.11.2026’ya kadar).

Aynı e-posta/şifre e-ticaret sitesinde de geçerli:
- Site admin (Pilot): https://rugvision-app.web.app/admin.html  
- Site müşteri/normal (Demo): https://rugvision-app.web.app/login.html  

## Embed kodu alma

1. https://rugvision.vercel.app/panel → Demo veya Pilot ile giriş  
2. Halı seç (yoksa yükle)  
3. **Embed** kutusundaki `<script>` kodunu kopyala  

Örnek (kendi merchant id’n ile):

```html
<script
  src="https://rugvision.vercel.app/widget.js"
  data-merchant-id="cmwi2o8k6000408jko3ygfwg0"
  data-sku="RV-LUNA-001"
  data-target=".add-to-cart"
  defer
></script>
```

Pilot merchant için hazır snippet listesi: `data/embed-snippets.html` (eski pilot id ile; panelden taze kopya al).

## Widget davranışı

- iPhone → Quick Look · Samsung/Pixel → Scene Viewer · Xiaomi → Universal WebAR
