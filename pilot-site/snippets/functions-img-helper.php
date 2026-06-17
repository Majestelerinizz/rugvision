<?php
/**
 * Adim 6 — functions.php icine asset() fonksiyonundan HEMEN SONRA yapistir.
 */

function img_webp_variant(string $src): ?string
{
    if (!preg_match('/\.(jpe?g|png)$/i', $src)) {
        return null;
    }
    $webp = preg_replace('/\.(jpe?g|png)$/i', '.webp', $src);
    $abs  = dirname(__DIR__) . '/' . ltrim(str_replace('\\', '/', $webp), '/');
    return is_file($abs) ? $webp : null;
}

function img_tag(string $src, string $alt, array $opts = []): string
{
    $width   = (int)($opts['width'] ?? 400);
    $height  = (int)($opts['height'] ?? 400);
    $loading = (($opts['loading'] ?? 'lazy') === 'eager') ? 'eager' : 'lazy';

    $attrs = [
        'src="' . e(asset($src)) . '"',
        'alt="' . e($alt) . '"',
        'width="' . $width . '"',
        'height="' . $height . '"',
        'loading="' . $loading . '"',
        'decoding="async"',
    ];

    if (!empty($opts['class'])) {
        $attrs[] = 'class="' . e($opts['class']) . '"';
    }
    if (!empty($opts['id'])) {
        $attrs[] = 'id="' . e($opts['id']) . '"';
    }
    if (!empty($opts['fetchpriority']) && in_array($opts['fetchpriority'], ['high', 'low'], true)) {
        $attrs[] = 'fetchpriority="' . $opts['fetchpriority'] . '"';
    }

    $img = '<img ' . implode(' ', $attrs) . '>';

    $webp = img_webp_variant($src);
    if ($webp) {
        return '<picture><source srcset="' . e(asset($webp)) . '" type="image/webp">' . $img . '</picture>';
    }

    return $img;
}
