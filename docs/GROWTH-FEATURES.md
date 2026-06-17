# RugVision — Buyume Ozellikleri (Faz 4+)

> Shopify haric buyume maddeleri — 17.06.2026 itibariyla hazir.

---

## 1. AR kabul raporu (10 pilot SKU)

**Script:**
```powershell
npm run reports:ar-acceptance
```

**Cikti:** `docs/reports/ar-acceptance-pilot-10-*.csv` + `.html` (Yazdir → PDF)

**Panel / API:**
- `GET /api/v1/reports/ar-acceptance?format=csv` (auth)
- Panel → Analitik Rapor → **AR Kabul CSV**

---

## 2. AI zemin / oda tespiti (v1)

Heuristik tabanli on-tespit; AR baslatildiginda kayit altina alinir.

| Bilesen | Yol |
|---------|-----|
| Motor | `lib/ai-detection.ts` |
| API | `POST /api/v1/ai/scans` |
| AR hook | `app/odamda-gor/[id]/ar-viewer-client.tsx` |
| DB | `ai_scans` tablosu |

`model-viewer` → `ar-placement="floor"` ile zemin hizalama desteklenir.

---

## 3. Analitik dashboard raporlari

| API | Aciklama |
|-----|----------|
| `GET /api/v1/analytics/report?days=30` | Donusum + gunluk seri + top AR |
| `GET /api/v1/analytics/export` | CSV indir (5000 olay) |

**Panel:** 30 gun donusum, plan kullanimi, top AR tablosu, CSV indirme.

---

## 4. 100+ hali QA pipeline

```powershell
# Pilot 10 SKU
npm run models:qa

# Olcek manifest (10 + yeni satirlar)
npm run models:qa -- --manifest data/rugs-batch-scale.csv
```

**Cikti:** `docs/reports/qa-rugs-{N}-sku-*.csv` + `.json`

Kontroller: foto var mi, GLB/USDZ boyutu, olcu alanlari.

---

## 5. Abonelik / plan limitleri

| Plan | Urun limiti | Aylik (kurus) |
|------|-------------|---------------|
| STARTER | 50 | 999 |
| PRO | 200 | 2999 |
| ENTERPRISE | 10 000 | 9999 |

| API | Aciklama |
|-----|----------|
| `GET /api/v1/subscription` | Plan, kullanim, deneme gunu |
| `POST /api/v1/rugs` | Limit + deneme suresi kontrolu |

**Panel:** Abonelik karti + kullanim cubugu.

---

## 6. Genis cihaz matrisi + CI

18 cihaz/tarayici kombinasyonu (iPhone, Samsung, Pixel, Xiaomi, OPPO, vivo, Huawei, masaustu).

| Bilesen | Yol |
|---------|-----|
| Matris | `lib/device-matrix.ts` |
| Test | `tests/device-matrix.test.ts` |
| Rapor | `npm run reports:device-matrix` |
| CI | `.github/workflows/ci.yml` (push/PR → lint, test, build) |

**Cikti:** `docs/reports/device-matrix-ar-18-devices-*.csv` + `.html`

---

## Komut ozeti

| Komut | Is |
|-------|-----|
| `npm run reports:ar-acceptance` | 10 SKU AR kabul CSV/HTML |
| `npm run models:qa` | Model QA raporu |
| `npm run reports:device-matrix` | 18 cihaz AR matris CSV/HTML |
| `npm test` | Birim testleri (42 test: device-matrix dahil) |
