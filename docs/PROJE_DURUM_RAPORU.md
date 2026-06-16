# RugVision — Resmi Proje Durum Raporu



> Belge turu: Proje Durum / Kabul Raporu

> Surum: 1.3

> Tarih: 17.06.2026

> Hazirlayan: RugVision Gelistirme

> Durum ozeti: **Faz 1 + Faz 2 %100; Faz 3 pilot CANLI AR (gercek musteri sitesi).**



---



## 1. Yonetici Ozeti



RugVision, halici ve ev dekorasyon markalarinin urun sayfalarina **tek satir kod** ile

"Odamda Gor" (artirilmis gerceklik) ozelligi ekleyebilmesini saglayan SaaS platformudur.



**17 Haziran 2026 itibariyle:**

- Platform production'da CANLI: **https://rugvision-o54d.vercel.app**

- **Ilk gercek musteri pilotu CANLI:** **https://savasdogantekstil.com/rugvision/**

- iPhone'da urun detay sayfasindan Quick Look AR **basariyla dogrulandi**

- 10 urun SKU eslemesi tamam (merchant: Savas Dogan Tekstil)



**Temel deger onerisi (haliyi odada AR ile gosterme) gercek musteri sitesinde kanitlandi.**



---



## 2. Tamamlanan Kapsam (Kanitli)



### Faz 1 — AR Cekirdegi (%100)

- Quick Look (iPhone) + Scene Viewer (Android) + Blender pipeline.



### Faz 2 — Islevsel Urunlesme (%100)

- Widget, panel, analytics, guvenlik sertlestirme, 13 unit test.



### Faz 3 Adim 1 — Production (%90)

- Vercel + Neon, health `db: up`, panel yenilendi (`ef4295a`).



### Faz 3 Adim 3 — E-ticaret pilotu (%95)

- [x] Pilot site: savasdogantekstil.com/rugvision (PHP)

- [x] Merchant: `cmqgswc5a000004lanqoxc666`, 10 SKU

- [x] `config/rugvision.php` + `product-detail.php` widget

- [x] **Canli iPhone AR** urun detaydan

- [x] `functions.php` ana sayfa kart linki



---



## 3. Kabul / Dogrulama Kanitlari



| Test | Sonuc |

|------|-------|

| Production health | **200 OK, db: "up"** |

| RugVision panel | Calisiyor (yeni UI) |

| Pilot widget API (RV-ARYA-003) | **200, model3dUrl dolu** |

| Pilot urun detay + widget | **Buton + AR calisiyor** |

| iPhone Quick Look (pilot site) | **Hali goruldu, zemine oturdu** |

| GLB production | `rugvision-o54d.vercel.app/models/Modern_rug.glb` 200 |

| Otomatik testler | 13/13 |



---



## 4. Canli Erisim



### RugVision SaaS

- **Site:** https://rugvision-o54d.vercel.app

- **Panel:** https://rugvision-o54d.vercel.app/panel

- **Pilot panel:** `savas@rugvision.com` / `Savas2026!`



### Pilot musteri sitesi

- **Magaza:** https://savasdogantekstil.com/rugvision/

- **Test urun:** https://savasdogantekstil.com/rugvision/product-detail.php?id=3

- **Merchant ID:** `cmqgswc5a000004lanqoxc666`



### Embed kodu (pilot)



```html

<script

  src="https://rugvision-o54d.vercel.app/widget.js"

  data-merchant-id="cmqgswc5a000004lanqoxc666"

  data-sku="RV-ARYA-003"

  data-target="[data-rugvision]"

  defer

></script>

```



Kurulum detayi: **`docs/PILOT-ECOMMERCE.md`**



---



## 5. Model formatlari



- **AR icin zorunlu:** GLB (Android) + USDZ (iPhone)

- **Urun fotografi:** JPG/PNG/WebP (AR degil, e-ticaret gorseli)

- Pilotte tum urunlerde tek demo model; ileride urun bazli GLB/USDZ



---



## 6. Kalan Isler



| Oncelik | Is |

|---------|-----|

| 1 | E-ticaret `functions.php` kart linki |

| 2 | R2/S3 bulut depolama |

| 3 | Urun bazli 3D modeller |

| 4 | Kalici domain (`app.rugvision.com`) |

| 5 | Shopify/WooCommerce, AI, CI |



---



## 7. Sure Tahmini



| Asama | Durum |

|-------|-------|

| Faz 1–2 | %100 |

| Faz 3 Adim 1 | %90 |

| Faz 3 Adim 3 pilot | %95 |

| Faz 3 Adim 2 (R2/S3) | bekliyor |



**Tum proje (tam vizyon):** ~%82-85  

**TEMEL satis paketi:** ~%93 — kalan ~2-3 is gunu  

**Tam urunlesme ek sure:** +10-14 is gunu



---



## 8. Sonuc



RugVision artik sadece kendi sunucusunda degil, **gercek bir halı e-ticaret sitesinde**

canli AR olarak calisiyor. Pilot basarili; olcekleme icin bulut depolama ve urun bazli

modeller siradaki teknik adimlar.

