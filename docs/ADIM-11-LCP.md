# Adım 11 — Performans 73 → 85+ (LCP odak)

> JPG 827 KB oldu ama skor aynı kalabilir: PageSpeed **LCP görselinin boyutunu** ve **tekrar sayısını** ölçer.  
> Ana sayfada `hali123` **30 kez** geçiyor (hero + 8 kategori + ürünler…).

## Hedef

| Metrik | Şimdi | Hedef |
|--------|-------|-------|
| Performans | 73 | 82–88 |
| LCP | ~5,8 sn | 3–4 sn |
| Erişilebilirlik | 88 | 92+ |

---

## 1) `hali123-640.webp` oluştur + yükle (10 dk)

[squoosh.app](https://squoosh.app):

1. Küçültülmüş `hali123.jpg` (827 KB) aç
2. Resize: **640px genişlik**
3. WebP, kalite **75**
4. Kaydet: `hali123-640.webp` (~80–150 KB olmalı)
5. FTP: `assets/images/hali123-640.webp`

**Mevcut `hali123.webp` ve `.jpg` kalsın.**

---

## 2) `includes/header.php` — LCP preload

`<head>` içinde, `style.min.css` satırından **önce** ekle:

```php
    <link rel="preload" as="image" href="<?= asset('assets/images/hali123-640.webp') ?>" type="image/webp" fetchpriority="high">
```

---

## 3) `index.php` — hero ilk slide (LCP)

Hero `foreach` içinde, **sadece ilk slide** (`$i === 0`) için `img_tag` yerine:

```php
                <?php if ($i === 0): ?>
                <picture>
                  <source
                    srcset="<?= asset('assets/images/hali123-640.webp') ?> 640w, <?= asset('assets/images/hali123.webp') ?> 1200w"
                    sizes="100vw"
                    type="image/webp">
                  <img src="<?= asset($slide['image']) ?>"
                       alt="<?= e(lang_field($slide, 'title')) ?>"
                       width="1200" height="560"
                       loading="eager" fetchpriority="high" decoding="async">
                </picture>
                <?php else: ?>
                <?= img_tag($slide['image'], lang_field($slide, 'title'), [
                    'width' => 1200,
                    'height' => 560,
                    'loading' => 'lazy',
                ]) ?>
                <?php endif; ?>
```

Slide 2–3 lazy kalır → daha az ilk yükleme.

---

## 4) `index.php` — kategori sayısını azalt

```php
$categories = $pdo->query("SELECT * FROM categories WHERE status = 1 ORDER BY id ASC LIMIT 4")->fetchAll();
```

`LIMIT 8` → `LIMIT 4` (4 görsel daha az istek).

---

## 5) Erişilebilirlik 88 → 92 — blog linkleri

Blog kartında:

```php
<a href="blog-detail.php?id=<?= (int)$post['id'] ?>" aria-label="<?= e(lang_field($post, 'title')) ?>">
```

---

## 6) (İleri) CSS async — FOUC riski var

Sadece 1–5 yetmezse `header.php`:

```php
<link rel="preload" href="<?= asset('assets/css/style.min.css') ?>" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="<?= asset('assets/css/style.min.css') ?>"></noscript>
```

Eski doğrudan `<link rel="stylesheet">` satırını **sil**. Sayfa 1 sn “çıplak” görünebilir — test et.

---

## Test

1. Yükle → Ctrl+Shift+R  
2. F12 → Network → ilk görsel `hali123-640.webp` mi?  
3. PageSpeed **Mobil** (gizli sekme, önbellek temiz)

---

## Gerçekçi tavan

Paylaşımlı cPanel hosting ile **90+ performans** zor. **82–88** iyi sonuç.  
AR ve e-ticaret **çalışıyorsa** pilot satış için yeterli.
