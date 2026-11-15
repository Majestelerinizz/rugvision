# RugVision Panel — giriş + embed

Canlı panel: https://rugvision.vercel.app/panel  
(Alternatif deploy: https://rugvision-o54d.vercel.app/panel)

## Mağaza hesapları (production seed / pilot)

| Hesap | E-posta | Şifre | Not |
|-------|---------|-------|-----|
| Demo mağaza | `demo@ornek.com` | `Test12345!` | Test / embed denemesi |
| Pilot (Savaş Doğan) | `savas@rugvision.com` | `Savas2026!` | Pilot merchant |

Kaynak: `docs/DEPLOY.md`, `docs/PROJE_DURUM_RAPORU.md`

Hesap yoksa panelde **Mağaza kaydı oluştur**.

## Embed kodu alma

1. Panele giriş yap  
2. Sol/listeden bir halı seç  
3. **Embed** kutusundaki `<script …>` kodunu kopyala  

Örnek (pilot merchant):

```html
<script
  src="https://rugvision.vercel.app/widget.js"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="RV-LUNA-001"
  data-target=".add-to-cart"
  defer
></script>
```

Tam liste: `data/embed-snippets.html`

## Widget davranışı

- iPhone → Quick Look (USDZ)  
- Samsung / Pixel → Scene Viewer (GLB)  
- Xiaomi / Huawei / diğer → Universal WebAR (tarayıcı kamerası)

E-ticaret Firebase sitesi (ayrı): https://rugvision-app.web.app — admin `admin@rugvision.app`
