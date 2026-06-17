<?php
/**
 * index.php — HERO bolumu (Adim 11 LCP)
 * Mevcut hero foreach icindeki img_tag satirini bununla degistir.
 */
?>
        <?php foreach ($sliders as $i => $slide): ?>
            <div class="hero-slide <?= $i === 0 ? 'active' : '' ?>">
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
                <div class="hero-overlay">
                    <!-- ... mevcut hero-overlay icerigi ayni kalir ... -->
