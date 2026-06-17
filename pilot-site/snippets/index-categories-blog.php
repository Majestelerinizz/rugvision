<?php
/**
 * Adim 11 — index.php degisiklikleri (3 ve 5)
 *
 * 3) Kategori sayisini azalt (LCP / istek sayisi)
 * Dosya: index.php — kategorileri ceken satiri bulun ve LIMIT 4 yapin:
 */
// $categories = $pdo->query("SELECT * FROM categories WHERE status = 1 ORDER BY id ASC LIMIT 4")->fetchAll();

/**
 * 5) Blog kartlari — erisilebilirlik (aria-label)
 * Dosya: index.php — blog dongusundeki <a> etiketine ekleyin:
 */
// <a href="blog-detail.php?id=<?= (int)$post['id'] ?>" aria-label="<?= e(lang_field($post, 'title')) ?>">
