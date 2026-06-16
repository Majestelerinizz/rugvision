-- =============================================================================
-- RugVision Halı Concept — Ürün görsellerini SKU bazlı güncelle
-- Her ürün kendi halı fotoğrafını kullanır (GLB/AR ile aynı eşleme).
--
-- Ön koşul: assets/images/products/RV-*.png dosyaları FTP ile yüklenmiş olmalı.
-- Kaynak PNG: RugVision repo public/rug-covers/RV-*.png (aynı dosyalar)
-- phpMyAdmin > hosting veritabanı > Import > bu dosyayı çalıştırın.
-- =============================================================================

UPDATE products
SET image = CONCAT('assets/images/products/', sku, '.png')
WHERE sku LIKE 'RV-%';

UPDATE product_images pi
INNER JOIN products p ON p.id = pi.product_id
SET pi.image = p.image
WHERE p.sku LIKE 'RV-%';
