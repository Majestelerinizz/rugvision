# RugVision — Production Yayın Runbook (Faz 3 · Adım 1)

> Amaç: `localhost`/tunnel yerine kalıcı, HTTPS, gerçek bir production adresi.
> Önerilen yığın: **Neon (PostgreSQL) + Vercel (Next.js)**. Docker gerekmez.

---

## ✅ Canlı Production (17.06.2026)

| Bilgi | Değer |
|-------|--------|
| **Site** | https://rugvision-o54d.vercel.app |
| **Panel** | https://rugvision-o54d.vercel.app/panel |
| **Health** | https://rugvision-o54d.vercel.app/api/v1/health |
| **Veritabanı** | Neon PostgreSQL 16 (proje: `rugvision`) |
| **Hosting** | Vercel (GitHub: `Majestelerinizz/rugvision`, branch `main`) |
| **Son commit** | `edc8f3e` — durum raporu + Faz 3 Adım 1 %100 |
| **Health durumu** | `{"status":"ok","db":"up"}` |
| **AR doğrulama** | RugVision + **pilot müşteri sitesi** iPhone Quick Look ✅ |

**Demo merchant:** `demo@ornek.com` / `Test12345!` (Demo Magaza)

**Pilot merchant:** `savas@rugvision.com` / `Savas2026!` (Savas Dogan Tekstil)  
**Pilot site:** https://savasdogantekstil.com/rugvision/  
**Pilot kurulum:** `docs/PILOT-ECOMMERCE.md`

---

## 0. Ön koşul: Güçlü `JWT_SECRET` üret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Uygulama, `JWT_SECRET` 32 karakterden kısaysa **başlamaz** (güvenlik gereği).

---

## 1. Veritabanı: Neon (yönetilen Postgres)

1. [neon.tech](https://neon.tech) → ücretsiz proje oluştur (örn. `rugvision`, Postgres 16).
2. **Connection string**'i kopyala.
3. Bunu `DATABASE_URL` olarak kullan.

> Alternatif: Supabase veya Vercel Postgres. Şema aynı; sadece `DATABASE_URL` değişir.

### ⚠️ DATABASE_URL formatı (kritik)

Vercel'e **sadece** saf connection string yapıştır:

```
postgresql://KULLANICI:SIFRE@HOST/neondb?sslmode=require
```

**YANLIŞ** (bunları ekleme):
- `psql '` öneki
- Sondaki `'` tırnak
- `channel_binding=require` (Prisma/Vercel'de sorun çıkarabilir)

---

## 2. Şemayı production DB'ye kur

Lokalden, production `DATABASE_URL` ile bir kez migration uygula:

```powershell
# PowerShell:
$env:DATABASE_URL="postgresql://...neon..."
npm run db:deploy
```

`db:deploy` = `prisma migrate deploy` (mevcut migration'ları uygular, veri kaybı yok).

---

## 3. İlk merchant hesabını oluştur

```powershell
$body = @{
  email="demo@ornek.com"
  password="Test12345!"
  fullName="Demo Kullanici"
  companyName="Demo Magaza"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://rugvision-o54d.vercel.app/api/v1/auth/register" `
  -Method POST -ContentType "application/json" -Body $body
```

Dönen `merchant.id` → embed'de `data-merchant-id` olarak kullanılır.

---

## 4. Vercel'e deploy

1. [vercel.com](https://vercel.com) → "New Project" → GitHub `rugvision` reposunu içe aktar.
2. Framework otomatik **Next.js** algılanır.
3. **Build command:** `prisma generate && next build` (package.json'da tanımlı).
4. **Environment Variables** (Production + Preview):

| Değişken | Değer |
|----------|-------|
| `DATABASE_URL` | Neon connection string (sadece `postgresql://...`, psql yok) |
| `JWT_SECRET` | 96 karakterlik güçlü değer (≥32 zorunlu) |
| `STORAGE_DRIVER` | `local` (Adım 2'de `s3`/`r2` olacak) |

5. **Deploy**. Build bitince `https://rugvision-xxx.vercel.app` adresin hazır.

### GitHub push sonrası

Vercel GitHub'a bağlıysa `git push origin main` otomatik yeni deploy tetikler.

---

## 5. Kalıcı domain + HTTPS (opsiyonel)

1. Vercel → Project → **Settings → Domains** → `app.rugvision.com` ekle.
2. DNS'te `CNAME` kaydını Vercel'in verdiği hedefe yönlendir.
3. HTTPS sertifikası Vercel tarafından otomatik üretilir.

> Şu an `rugvision-o54d.vercel.app` ile production çalışıyor; domain bağlama opsiyonel.

---

## 6. Doğrulama (smoke test)

```bash
curl https://rugvision-o54d.vercel.app/api/v1/health
# Beklenen: {"status":"ok","db":"up",...}
```

- `/panel` → giriş yapılabiliyor mu?
- `/odamda-gor/<RUG_ID>` → AR açılıyor mu? (iPhone'da test et)
- Embed: müşteri sayfasına script eklenince buton çıkıyor mu?

### Embed (production)

```html
<script
  src="https://rugvision-o54d.vercel.app/widget.js"
  data-merchant-id="MERCHANT_ID"
  data-sku="URUN_SKU"
  data-target=".add-to-cart"
  defer
></script>
```

---

## ⚠️ Önemli kısıt: Model dosyaları (Adım 2'ye köprü)

Vercel'in dosya sistemi **salt-okunurdur**; `STORAGE_DRIVER=local` ile
`POST /api/v1/uploads/model` production'da **kalıcı çalışmaz** (diske yazamaz).

İki seçenek:
1. **Geçici:** Modelleri repoda (`public/models/`) commit'le; upload kullanma.
2. **Kalıcı (önerilen):** **Adım 2** — `lib/storage.ts`'e R2/S3 driver ekle,
   `STORAGE_DRIVER=s3` yap.

---

## Production hazırlık kontrol listesi

- [x] `JWT_SECRET` ≥ 32 karakter, güçlü ve gizli
- [x] `DATABASE_URL` Neon'a işaret ediyor, `migrate deploy` çalıştı
- [x] Vercel env değişkenleri Production için set edildi
- [x] `/api/v1/health` → `db: "up"`
- [x] iPhone 12 production AR doğrulandı
- [x] İlk merchant + demo halı oluşturuldu
- [x] **Pilot:** savasdogantekstil.com/rugvision canlı AR (ürün detay)
- [x] HTTPS production aktif (Vercel otomatik SSL) — Adım 1 tamam
- [ ] Özel alan adı (`app.rugvision.com`) — opsiyonel, Buyume fazı
- [ ] Model dosyaları için bulut depolama (R2/S3) — Adım 2
- [ ] Rate limiter'ı dağıtık store'a (Upstash/Redis) taşı (çok-instance için)

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `db: "down"` | `DATABASE_URL` formatını kontrol et (psql/tırnak/channel_binding yok) |
| Build fail | GitHub'da güncel commit var mı? (`edc8f3e`+) |
| Panel 401 | Token süresi dolmuş; yeniden giriş yap |
| Upload çalışmıyor | Normal — Vercel'de `local` storage yazamaz; R2/S3 gerekir |
