<?php
/**
 * Pilot site <head> performans snippet'i.
 * includes/head.php icine veya mevcut <head> bloguna ekleyin.
 *
 * Bkz. docs/PILOT-PAGESPEED.md
 */
?>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<?= e($pageDescription ?? 'Premium hali koleksiyonu') ?>">
<meta name="theme-color" content="#b45309">
<base href="/rugvision/">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://rugvision-o54d.vercel.app" crossorigin>

<link rel="preload" href="/rugvision/assets/css/style.min.css" as="style">
<link rel="stylesheet" href="/rugvision/assets/css/style.min.css">

<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600&display=swap"
  onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600&display=swap">
</noscript>

<link rel="manifest" href="/rugvision/manifest.webmanifest">
<link rel="apple-touch-icon" href="/rugvision/assets/icons/apple-touch-icon.png">
