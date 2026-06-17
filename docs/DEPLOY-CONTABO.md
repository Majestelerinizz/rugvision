# RugVision — Contabo + CloudPanel Deploy (Yol B)

> **DURUM: IPTAL / ERTELENDI (Haziran 2026)**  
> Production **Vercel** uzerinde kalir: https://rugvision-o54d.vercel.app  
> Bu dosya ileride Contabo'ya tasinmak istenirse referans icin saklanir.

---
> **Sunucu:** Contabo VPS + CloudPanel (Node.js)  
> **Veritabanı:** Neon PostgreSQL (ayni kalir)  
> **Modeller:** Cloudflare R2 (ayni kalir)  
> **Pilot magaza:** `savasdogantekstil.com/rugvision/` (degismez, sadece widget URL guncellenir)

Tahmini sure: **10 adim, ilk kurulum ~1,5-2 saat** (SSH deneyimin varsa ~1 saat).

---

## Mimari

```
savasdogantekstil.com/rugvision/     Halı magazasi (PHP, musteri sitesi)
rugvision.vefayazilim.com            RugVision SaaS (Node.js, sizin sunucu)
  ├── /panel                         Merchant paneli
  ├── /widget.js                     Embed script
  ├── /api/v1/*                      API + AR proxy
  └── /odamda-gor/:id                AR onizleme
```

---

## ADIM 1 — CloudPanel'de Node.js sitesi ac (5 dk)

1. [panel.vefayazilim.com](https://panel.vefayazilim.com) → giris
2. **Siteler** → **+ SITE EKLE**
3. **Node.js Sitesi Olustur** sec (Statik HTML DEGIL)
4. Alan adi: `rugvision.vefayazilim.com`
5. Site kullanicisi: ornek `vefayazilim-rugvision` (CloudPanel otomatik onerir)
6. Guclu sifre olustur → **Olustur**

Site listesinde `rugvision.vefayazilim.com` **NODEJS** olarak gorunmeli.

---

## ADIM 2 — DNS kaydi (5-30 dk)

`vefayazilim.com` DNS yonetiminde (CloudPanel DNS veya domain paneli):

| Tur | Ad (Host) | Deger |
|-----|-----------|--------|
| **A** | `rugvision` | Contabo sunucu **public IP** |

Kayit yayilinca:

```bash
ping rugvision.vefayazilim.com
```

Sunucu IP'nizi gostermeli.

---

## ADIM 3 — SSL sertifikasi (2 dk)

CloudPanel → `rugvision.vefayazilim.com` → **SSL/TLS** → **Let's Encrypt** → Etkinlestir.

Tarayicida kilit ikonu gorunene kadar bekleyin.

---

## ADIM 4 — SSH ile sunucuya baglan (5 dk)

Windows PowerShell veya PuTTY:

```bash
ssh vefayazilim-rugvision@SUNUCU_IP
```

CloudPanel'de site kullanicisi ve SSH bilgileri **Ayarlar** altindadir.

Site kok dizini genelde:

```text
/home/vefayazilim-rugvision/htdocs/rugvision.vefayazilim.com/
```

(CloudPanel → Site → **Dosyalar** ile tam yolu kontrol edin.)

---

## ADIM 5 — Kodu sunucuya al (10 dk)

SSH icinde site kok dizinine gidin:

```bash
cd /home/vefayazilim-rugvision/htdocs/rugvision.vefayazilim.com
```

### Secenek A — Git (onerilen)

```bash
git clone https://github.com/Majestelerinizz/rugvision.git .
```

### Secenek B — Guncelleme (sonraki deploylar)

```bash
cd /home/vefayazilim-rugvision/htdocs/rugvision.vefayazilim.com
git pull origin main
npm ci
npm run build
pm2 restart rugvision
```

---

## ADIM 6 — Node.js surumu (2 dk)

CloudPanel → Site → **Node.js** ayarlari:

- **Node.js surumu:** 20.x (LTS)
- **Uygulama modu:** Production

SSH'ta kontrol:

```bash
node -v    # v20.x olmali
npm -v
```

---

## ADIM 7 — Ortam degiskenleri `.env` (10 dk)

Site kok dizininde `.env` dosyasi olusturun:

```bash
nano .env
```

Icerik (Vercel Production env'den kopyalayin):

```env
DATABASE_URL=postgresql://KULLANICI:SIFRE@HOST/neondb?sslmode=require
JWT_SECRET=96_karakterlik_guclu_deger_buraya
STORAGE_DRIVER=r2
R2_BUCKET=rugvision-models
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-692fed61add14fdca565fa5967c47df1.r2.dev
RUGVISION_PUBLIC_BASE=https://rugvision.vefayazilim.com
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
```

Kaydet: `Ctrl+O`, `Enter`, `Ctrl+X`.

> `JWT_SECRET` 32 karakterden kisa olursa uygulama **baslamaz**.

---

## ADIM 8 — Veritabani + build (15 dk)

```bash
cd /home/vefayazilim-rugvision/htdocs/rugvision.vefayazilim.com

npm ci
npm run db:deploy
npm run build
```

Hata yoksa `.next` klasoru olusur.

---

## ADIM 9 — PM2 ile calistir (10 dk)

PM2 global kur (bir kez, root veya site kullanicisi):

```bash
npm install -g pm2
```

Proje kokunde (repo'daki `ecosystem.config.cjs` ile):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

`pm2 startup` ciktisindaki komutu **root** olarak calistirin (sunucu acilisinda otomatik baslar).

Durum kontrol:

```bash
pm2 status
pm2 logs rugvision --lines 50
```

CloudPanel Node.js sitesi genelde **port 3000**'e reverse proxy yapar. Site ayarlarinda **Application Port: 3000** oldugunu dogrulayin.

---

## ADIM 10 — Dogrulama + pilot guncelleme (15 dk)

### Smoke test

```bash
curl https://rugvision.vefayazilim.com/api/v1/health
```

Beklenen: `{"status":"ok","db":"up",...}`

Tarayici:

| URL | Beklenen |
|-----|----------|
| https://rugvision.vefayazilim.com/panel | Giris ekrani |
| https://rugvision.vefayazilim.com/widget.js | JS dosyasi |
| https://rugvision.vefayazilim.com/odamda-gor/RUG_ID | 3D onizleme |

### Pilot site (savasdogantekstil.com)

FTP / cPanel → `rugvision/config/rugvision.php` veya `product-detail.php`:

```php
define('RUGVISION_WIDGET_BASE', 'https://rugvision.vefayazilim.com');
```

```html
<script
  src="https://rugvision.vefayazilim.com/widget.js?v=7"
  data-merchant-id="cmqgswc5a000004lanqoxc666"
  data-sku="RV-LUNA-001"
  defer
></script>
```

iPhone'dan pilot urun detay → **Odamda Gor** → Quick Look AR test.

---

## Sonraki deploylar (git push sonrasi)

```bash
ssh vefayazilim-rugvision@SUNUCU_IP
cd /home/vefayazilim-rugvision/htdocs/rugvision.vefayazilim.com
git pull origin main
npm ci
npm run build
pm2 restart rugvision
```

---

## Vercel'i kapatma (opsiyonel)

Contabo tam calisinca:

1. Pilot ve tum embed'ler `rugvision.vefayazilim.com` kullaniyor mu — dogrula
2. Vercel projesini **pause** edebilir veya domain redirect birakabilirsin
3. `RUGVISION_PUBLIC_BASE` ve panel embed kodu yeni adresi gostermeli

---

## Sorun giderme

| Belirti | Cozum |
|---------|--------|
| `502 Bad Gateway` | `pm2 status` — process down mi? `pm2 restart rugvision` |
| `db: down` | `.env` icinde `DATABASE_URL` formati (psql on eki yok) |
| Build RAM hatasi | Contabo'da swap ekle veya `NODE_OPTIONS=--max-old-space-size=2048 npm run build` |
| Widget CORS | `widget.js` same-origin API kullanir; `RUGVISION_WIDGET_BASE` dogru mu? |
| SSL hatasi | CloudPanel Let's Encrypt yenile |

---

## Kontrol listesi

- [ ] CloudPanel NODEJS sitesi: `rugvision.vefayazilim.com`
- [ ] DNS A kaydi `rugvision` → sunucu IP
- [ ] SSL aktif (HTTPS)
- [ ] `.env` production degerleri
- [ ] `npm run db:deploy` + `npm run build` basarili
- [ ] PM2 `rugvision` online
- [ ] `/api/v1/health` → `db: up`
- [ ] Pilot widget URL guncellendi
- [ ] iPhone AR pilot test OK

---

## Ilgili dosyalar

| Dosya | Aciklama |
|-------|----------|
| `ecosystem.config.cjs` | PM2 yapilandirmasi |
| `docs/DEPLOY.md` | Neon + R2 + Vercel (eski) |
| `docs/PILOT-ECOMMERCE.md` | Pilot embed rehberi |
