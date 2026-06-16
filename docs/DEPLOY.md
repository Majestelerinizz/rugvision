# RugVision — Production Yayın Runbook (Faz 3 · Adım 1)

> Amaç: `localhost`/tunnel yerine kalıcı, HTTPS, gerçek bir production adresi.
> Önerilen yığın: **Neon (PostgreSQL) + Vercel (Next.js)**. Docker gerekmez.

---

## 0. Ön koşul: Güçlü `JWT_SECRET` üret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Uygulama, `JWT_SECRET` 32 karakterden kısaysa **başlamaz** (güvenlik gereği).

---

## 1. Veritabanı: Neon (yönetilen Postgres)

1. [neon.tech](https://neon.tech) → ücretsiz proje oluştur.
2. **Connection string**'i kopyala (pooled değil, doğrudan `postgresql://...` yeterli).
3. Bunu `DATABASE_URL` olarak kullanacağız.

> Alternatif: Supabase veya Vercel Postgres. Şema aynı; sadece `DATABASE_URL` değişir.

---

## 2. Şemayı production DB'ye kur

Lokalden, production `DATABASE_URL` ile bir kez migration uygula:

```bash
# Geçici olarak production DB'yi göstererek:
DATABASE_URL="postgresql://...neon..." npm run db:deploy
```

`db:deploy` = `prisma migrate deploy` (mevcut migration'ları uygular, veri kaybı yok).

---

## 3. İlk merchant hesabını oluştur

DB hazır olunca (lokal veya production'a istek atarak):

```bash
curl -X POST https://<APP_URL>/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ornek.com","password":"Test12345!","fullName":"Demo","companyName":"Demo Magaza"}'
```

Dönen `merchant.id` → embed'de `data-merchant-id` olarak kullanılır.

---

## 4. Vercel'e deploy

1. [vercel.com](https://vercel.com) → "New Project" → GitHub `rugvision` reposunu içe aktar.
2. Framework otomatik **Next.js** algılanır. Ekstra `vercel.json` gerekmez.
3. **Build command** zaten doğru: `prisma generate && next build` (package.json'da tanımlı).
4. **Environment Variables** (Production + Preview):

| Değişken | Değer |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Adım 0'daki 96 karakterlik değer |
| `STORAGE_DRIVER` | `local` (Adım 2'de `s3`/`r2` olacak) |

5. **Deploy**. Build bitince `https://rugvision-xxx.vercel.app` adresin hazır.

---

## 5. Kalıcı domain + HTTPS

1. Vercel → Project → **Settings → Domains** → `app.rugvision.com` ekle.
2. DNS'te `CNAME` kaydını Vercel'in verdiği hedefe yönlendir.
3. HTTPS sertifikası Vercel tarafından otomatik üretilir.

Artık tunnel ve `baslat.bat` gereksiz (sadece lokal geliştirme için kalır).

---

## 6. Doğrulama (smoke test)

```bash
curl https://app.rugvision.com/api/v1/health      # {"status":"ok","db":"up"}
```

- `/panel` → giriş yapılabiliyor mu?
- Bir halıya model bağlı mı? `/odamda-gor/<RUG_ID>` açılıyor mu?
- Embed: müşteri sayfasına script eklenince buton çıkıyor mu?

Embed (production):
```html
<script src="https://app.rugvision.com/widget.js"
  data-merchant-id="MERCHANT_ID" data-sku="URUN_SKU"
  data-target=".add-to-cart" defer></script>
```

---

## ⚠️ Önemli kısıt: Model dosyaları (Adım 2'ye köprü)

Vercel'in dosya sistemi **salt-okunurdur**; `STORAGE_DRIVER=local` ile
`POST /api/v1/uploads/model` production'da **çalışmaz** (diske yazamaz).

İki seçenek:
1. **Geçici:** Modelleri repoya (`public/models/`) commit'le; upload kullanma.
2. **Kalıcı (önerilen):** **Adım 2** — `lib/storage.ts`'e R2/S3 driver ekle,
   `STORAGE_DRIVER=s3` yap. Kod soyutlaması zaten hazır.

---

## Production hazırlık kontrol listesi

- [ ] `JWT_SECRET` ≥ 32 karakter, güçlü ve gizli
- [ ] `DATABASE_URL` Neon'a işaret ediyor, `migrate deploy` çalıştı
- [ ] Vercel env değişkenleri Production + Preview için set edildi
- [ ] `/api/v1/health` → `db: "up"`
- [ ] Kalıcı domain + HTTPS aktif
- [ ] Model dosyaları için strateji seçildi (commit veya cloud storage)
- [ ] (Sonraki) Rate limiter çok-instance için Upstash/Redis'e taşınacak
