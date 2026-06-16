# RugVision — Resmi Proje Durum Raporu

> Belge turu: Proje Durum / Kabul Raporu
> Surum: 1.2
> Tarih: 16.06.2026
> Hazirlayan: RugVision Gelistirme
> Durum ozeti: **Faz 1 + Faz 2 %100; Faz 3 Adim 1 CANLI (Vercel + Neon).**

---

## 1. Yonetici Ozeti

RugVision, halici ve ev dekorasyon markalarinin urun sayfalarina **tek satir kod** ile
"Odamda Gor" (artirilmis gerceklik) ozelligi ekleyebilmesini saglayan SaaS platformudur.

**16 Haziran 2026 itibariyle platform production'da CANLI:**
- Adres: **https://rugvision-o54d.vercel.app**
- Neon PostgreSQL baglantisi aktif (`db: "up"`)
- iPhone 12 uzerinde production HTTPS ile Quick Look AR dogrulandi
- Ilk merchant (Demo Magaza) ve demo hali (HALI-001) olusturuldu

**Satisa hazir demo production uzerinde mevcuttur.**

---

## 2. Tamamlanan Kapsam (Kanitli)

### Faz 1 — AR Cekirdegi (%100)
- 3D/AR goruntuleyici sayfasi (`/odamda-gor/:id`) — `model-viewer` tabanli.
- iPhone **Quick Look** AR: lokal + **production** (iPhone 12) test edildi; hali zemine
  gercek boyutta oturuyor.
- Android **Scene Viewer** akisi (intent fallback) + WebXR.
- USDZ dogru `Content-Type` (`model/vnd.usdz+zip`) ile servis ediliyor.
- Blender headless model pipeline (`fix_rug_model.py`, `export_quicklook_usdz.py`).

### Faz 2 — Islevsel Urunlesme (%100)
- Tek satir embed widget (`public/widget.js`) + SKU eslemesi (`data-merchant-id` + `data-sku`).
- Analytics, merchant paneli, domain dogrulama, upload, abonelik plan limiti.
- Depolama soyutlamasi (`lib/storage.ts`), otomatik testler (`npm test`, 13 test).
- Guvenlik sertlestirme: auth guard, rate limit, JWT issuer/audience, HTTP headers, SSRF.

### Faz 3 Adim 1 — Production (%90)
- [x] Neon PostgreSQL (proje `rugvision`, Postgres 16, AWS US East 1)
- [x] `npm run db:deploy` — sema Neon'a uygulandi
- [x] Vercel deploy (GitHub `fae8c2c`, build: `prisma generate && next build`)
- [x] Environment variables: `DATABASE_URL`, `JWT_SECRET`, `STORAGE_DRIVER=local`
- [x] Health endpoint: `{"status":"ok","db":"up"}`
- [x] Ilk production merchant + hali olusturuldu
- [x] iPhone 12 production AR dogrulandi
- [ ] Kalici domain (`app.rugvision.com`) — opsiyonel, Vercel URL calisiyor

### Altyapi
- **Production:** Vercel + Neon PostgreSQL
- **Gelistirme:** localtunnel (`rugvision-demo.loca.lt`) + `baslat.bat`
- Next.js 16 + Prisma 7 + PostgreSQL (pg adapter)
- GitHub: https://github.com/Majestelerinizz/rugvision

---

## 3. Kabul / Dogrulama Kanitlari

| Test | Sonuc |
|------|-------|
| `GET /api/v1/health` (production) | **200 OK, db: "up"** |
| Production site acilisi | **https://rugvision-o54d.vercel.app** calisiyor |
| Auth register/login (production) | Calisiyor |
| Rugs CRUD (production, auth korumali) | Calisiyor |
| iPhone Quick Look AR (production, iPhone 12) | **Hali yere oturuyor, olcek dogru** |
| Android Scene Viewer | Intent akisi hazir |
| SKU widget (`data-merchant-id` + `data-sku`) | Production API calisiyor |
| Merchant panel (production) | Giris + analytics + embed kodu calisiyor |
| Guvenlik: yetkisiz erisim | 401/403 |
| Otomatik testler (`npm test`) | 13/13 gecti |

---

## 4. Canli Erisim

### Production (ana)
- **Site:** https://rugvision-o54d.vercel.app
- **Panel:** https://rugvision-o54d.vercel.app/panel
- **Health:** https://rugvision-o54d.vercel.app/api/v1/health
- **Demo giris:** `demo@ornek.com` / `Test12345!`
- **Demo halı AR:** `/odamda-gor/cmqgnzmh8000404l70apwfjat`

### Gelistirme (lokal/tunnel)
- Tunnel: `https://rugvision-demo.loca.lt` (sadece gelistirme icin)
- `npm run dev:all` veya `baslat.bat`

### Embed kodu (production)

```html
<script
  src="https://rugvision-o54d.vercel.app/widget.js"
  data-merchant-id="cmqgnzgta000004l771zd8kb5"
  data-sku="HALI-001"
  data-target=".add-to-cart"
  defer
></script>
```

---

## 5. Kalan Isler (Faz 3)

### Adim 1 (kalan)
- [ ] Kalici domain baglama (`app.rugvision.com`)

### Adim 2 — Bulut depolama
- [ ] R2/S3 driver (`lib/storage.ts` soyutlamasi HAZIR)
- [ ] Otomatik GLB → USDZ donusum hatti
- [ ] Otomatik model uretimi (foto + olcu → GLB)

### Adim 3 — E-ticaret entegrasyonu
- [ ] Ilk gercek halici embed (orn. tarzhaliconcept.com)
- [ ] SKU toplu esleme operasyonu
- [ ] 2-3 urunde uctan uca canli test

### Buyume (Adim 4-7)
- [ ] Shopify / WooCommerce eklentileri
- [ ] Coklu cihaz AR test matrisi
- [ ] AI floor/room detection
- [ ] E2E test + CI
- [ ] Rate limiter → Upstash/Redis

---

## 6. Sure Tahmini

| Asama | Durum | Kalan sure |
|-------|-------|------------|
| Faz 1 (AR cekirdegi) | %100 | — |
| Faz 2 (islevsel urunlesme) | %100 | — |
| Faz 3 Adim 1 (production) | %90 | domain opsiyonel |
| Faz 3 Adim 2-7 | devam ediyor | ~10-15 is gunu |

- **Tum projenin tamamlanma orani:** ~%75-78
- **Production CANLI:** https://rugvision-o54d.vercel.app
- **Ilk halici pilotu:** hazir (embed + AR calisiyor)

---

## 7. Sonuc

Platform **production'da canli ve calisir durumdadir**. Temel deger onerisi (AR ile
haliyi odada gosterme) iPhone 12 uzerinde production HTTPS ile dogrulandi.
Geri kalan calismalar: bulut depolama, ilk gercek halici embed, olceklenme ve AI.
