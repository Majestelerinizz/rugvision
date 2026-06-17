<?php
/**
 * RugVision Hali Concept - Ana Sayfa (Adim 6 + 11 LCP + blog aria-label)
 */
$page_title = 'RugVision Hali Concept - Premium Hali Koleksiyonu';
include 'includes/header.php';

$sliders = $pdo->query("SELECT * FROM sliders WHERE status = 1 ORDER BY id ASC")->fetchAll();
$categories = $pdo->query("SELECT * FROM categories WHERE status = 1 ORDER BY id ASC LIMIT 4")->fetchAll();

function fetch_products($pdo, $whereExtra = '', $limit = 8)
{
    $catName = current_lang() === 'en' ? 'c.name_en' : 'c.name_tr';
    $sql = "SELECT p.*, $catName AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.status = 1 $whereExtra
            ORDER BY p.created_at DESC
            LIMIT " . (int)$limit;
    return $pdo->query($sql)->fetchAll();
}

$featured = fetch_products($pdo, '', 4);

$posts = $pdo->query("SELECT * FROM blog_posts WHERE status = 1 ORDER BY created_at DESC LIMIT 3")->fetchAll();
?>

<section class="hero">
    <div class="hero-slides">
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
                    <div class="container">
                        <div class="hero-content">
                            <h1><?= e(lang_field($slide, 'title')) ?></h1>
                            <p><?= e(lang_field($slide, 'description')) ?></p>
                            <div class="hero-buttons">
                                <a href="<?= url('products.php') ?>" class="btn btn-accent"><?= e(t('explore_products')) ?></a>
                                <a href="<?= url('products.php') ?>" class="btn btn-light"><?= e(t('view_in_room')) ?></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php if (count($sliders) > 1): ?>
        <div class="hero-nav">
            <?php foreach ($sliders as $i => $slide): ?>
                <button type="button" class="hero-dot <?= $i === 0 ? 'active' : '' ?>" aria-label="Slide <?= $i + 1 ?>"></button>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>

<section class="section" id="categories">
    <div class="container">
        <div class="section-head">
            <h2><?= e(t('categories_title')) ?></h2>
            <div class="line"></div>
        </div>
        <div class="category-grid">
            <?php foreach ($categories as $cat): ?>
                <a href="<?= url('products.php?category=' . $cat['slug']) ?>" class="category-card" aria-label="<?= e(lang_field($cat, 'name')) ?>">
                    <?= img_tag($cat['image'], lang_field($cat, 'name'), ['width' => 300, 'height' => 400, 'loading' => 'lazy']) ?>
                    <div class="category-card-overlay">
                        <h3><?= e(lang_field($cat, 'name')) ?></h3>
                    </div>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section section-cream">
    <div class="container">
        <div class="section-head">
            <h2><?= e(t('featured_products')) ?></h2>
            <p><a href="<?= url('products.php') ?>" class="link-arrow"><?= e(t('explore_products')) ?> &rarr;</a></p>
            <div class="line"></div>
        </div>
        <div class="product-grid cols-4">
            <?php foreach ($featured as $product) { echo render_product_card($product); } ?>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-head">
            <h2><?= e(t('menu_products')) ?></h2>
            <div class="line"></div>
        </div>
        <div class="discover-links">
            <a href="<?= url('products.php?filter=bestseller') ?>" class="btn btn-outline"><?= e(t('bestsellers_title')) ?></a>
            <a href="<?= url('products.php?filter=new') ?>" class="btn btn-outline"><?= e(t('new_products_title')) ?></a>
            <a href="<?= url('products.php?filter=campaign') ?>" class="btn btn-outline"><?= e(t('campaigns_title')) ?></a>
            <a href="<?= url('products.php') ?>" class="btn btn-accent"><?= e(t('explore_products')) ?></a>
        </div>
    </div>
</section>

<?php if ($posts): ?>
<section class="section section-cream">
    <div class="container">
        <div class="section-head">
            <h2><?= e(t('blog_title')) ?></h2>
            <div class="line"></div>
        </div>
        <div class="blog-grid">
            <?php foreach ($posts as $post):
                $postTitle = lang_field($post, 'title');
                $postAria = e($postTitle);
                $postUrl = 'blog-detail.php?id=' . (int)$post['id'];
            ?>
                <article class="blog-card">
                    <a href="<?= $postUrl ?>" aria-label="<?= $postAria ?>">
                        <?= img_tag($post['image'] ?: 'assets/images/hali123.jpg', $postTitle, ['width' => 640, 'height' => 400, 'loading' => 'lazy']) ?>
                    </a>
                    <div class="blog-card-body">
                        <span class="blog-card-date"><?= e(date('d.m.Y', strtotime($post['created_at']))) ?></span>
                        <h3><a href="<?= $postUrl ?>" aria-label="<?= $postAria ?>"><?= e($postTitle) ?></a></h3>
                        <p><?= e(str_excerpt(lang_field($post, 'content'), 120)) ?>...</p>
                        <a href="<?= $postUrl ?>" class="link-arrow" aria-label="<?= $postAria ?> — <?= e(t('read_more')) ?>"><?= e(t('read_more')) ?> &rarr;</a>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<?php include 'includes/footer.php'; ?>
