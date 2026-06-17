# Pilot Site — Mobil odak (PageSpeed + AR)

> PageSpeed Insights'ta **Mobil** sekmesi = zaten hedefimiz.  
> AR (Odamda Gor) = dogasi geregi **telefon oncelikli**.

## Simdi ne durumda?

| Konu | Mobil |
|------|--------|
| Font async, defer, minify | ✅ Mobil LCP/FCP iyilestirir |
| DOM kucultme | ✅ Dusuk guc telefonlarda onemli |
| WebP + lazy | ✅ Mobilde veri tasarrufu |
| Widget sadece urun detay | ✅ Ana sayfada gereksiz JS yok |
| RugVision coklu cihaz AR | ✅ iPhone, Samsung, Pixel, Huawei fallback |

## Ek mobil iyilestirme (Adim 10)

`pilot-site/snippets/cssvejs/style.css` sonuna **MOBIL** blogu eklendi:

1. **Input 16px** — iPhone odakta zoom engeli
2. **Min 44px dokunma** — butonlar, menu, sepete ekle
3. **Odamda Gor 48px** — AR butonu kolay tiklanir
4. **Hero 360px** (560px alti) — daha kucuk LCP alani

### cPanel'e yukle

1. Guncel `style.css` + yeniden uretilen `style.min.css` yukle
2. `header.php` zaten `style.min.css` kullaniyor — degismez
3. Ctrl+Shift+R (telefonda da hard refresh)

### style.min.css yeniden uret (bilgisayarda)

```powershell
cd pilot-site\snippets\cssvejs
npx clean-css-cli -o style.min.css style.css
```

## header.php — opsiyonel meta (mobil PWA hissi)

`<head>` icine eklenebilir:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

AR icin sart degil; iPhone'da tam ekran hissi verir.

## PageSpeed olcumu — sadece Mobil

1. https://pagespeed.web.dev/
2. URL: `https://savasdogantekstil.com/rugvision/`
3. **Mobil** sekmesi (Masaustu degil)
4. 4G / Slow 4G simulasyonu PageSpeed'in kendi ayarinda

## AR mobil test matrisi

| Cihaz | Beklenen |
|-------|----------|
| iPhone | Quick Look AR |
| Samsung / Pixel | Scene Viewer veya web viewer |
| Huawei (GMS yok) | 3D onizleme fallback |

`?mobile=1` parametresi widget'ta mobil viewer icin zaten var.

## Ozet

**Evet, mobil icin yapabilir ve cogu zaten yapildi.**  
Ek CSS blogu + minify yuklemesi = son mobil cilasi.
