/* =====================================================================
   RugVision Halı Concept - Vanilla JavaScript
   Hamburger menü, hero slider, ürün galerisi, adet kutusu,
   mobil filtre paneli ve sepete ekleme (AJAX) işlevleri.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    /* ---------------- Mobil hamburger menü ---------------- */
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
    }

    /* ---------------- Hero slider (otomatik geçişli) ---------------- */
    var slides = document.querySelectorAll('.hero-slide');
    var dots = document.querySelectorAll('.hero-dot');
    if (slides.length > 1) {
        var current = 0;
        var showSlide = function (index) {
            slides.forEach(function (s, i) {
                s.classList.toggle('active', i === index);
            });
            dots.forEach(function (d, i) {
                d.classList.toggle('active', i === index);
            });
            current = index;
        };
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () { showSlide(i); });
        });
        setInterval(function () {
            var next = (current + 1) % slides.length;
            showSlide(next);
        }, 5500);
    }

    /* ---------------- Ürün detay galerisi ---------------- */
    var mainImg = document.getElementById('pdMainImg');
    var thumbs = document.querySelectorAll('.pd-thumbs img');
    if (mainImg && thumbs.length) {
        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                mainImg.src = this.src;
                thumbs.forEach(function (t) { t.classList.remove('active'); });
                this.classList.add('active');
            });
        });
    }

    /* ---------------- Adet artır / azalt (ürün detay) ---------------- */
    var qtyBox = document.querySelector('.qty-box');
    if (qtyBox) {
        var input = qtyBox.querySelector('input');
        var minus = qtyBox.querySelector('.qty-minus');
        var plus = qtyBox.querySelector('.qty-plus');
        if (minus) minus.addEventListener('click', function () {
            var v = parseInt(input.value, 10) || 1;
            if (v > 1) input.value = v - 1;
        });
        if (plus) plus.addEventListener('click', function () {
            var v = parseInt(input.value, 10) || 1;
            input.value = v + 1;
        });
    }

    /* ---------------- Mobil filtre aç/kapat ---------------- */
    var filterToggle = document.getElementById('filterToggle');
    var filterPanel = document.getElementById('filterPanel');
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', function () {
            filterPanel.classList.toggle('open');
        });
    }

    /* ---------------- Sıralama değişince formu gönder ---------------- */
    var sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            this.form.submit();
        });
    }

    /* ---------------- Sepete ekle (AJAX) ---------------- */
    document.querySelectorAll('.js-add-cart').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var productId = this.getAttribute('data-id');
            var qty = this.getAttribute('data-qty') || 1;
            var qtyInput = document.getElementById('detailQty');
            if (qtyInput) qty = qtyInput.value;

            var formData = new FormData();
            formData.append('product_id', productId);
            formData.append('quantity', qty);
            formData.append('action', 'add');

            fetch('cart.php', { method: 'POST', body: formData })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.success) {
                        var badge = document.querySelector('.cart-badge');
                        if (badge) badge.textContent = data.count;
                        showToast(data.message);
                    } else {
                        showToast(data.message || 'Hata');
                    }
                })
                .catch(function () { showToast('Bir hata oluştu.'); });
        });
    });

    /* ---------------- Basit toast bildirimi ---------------- */
    function showToast(message) {
        var toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText =
            'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);' +
            'background:#1c1a17;color:#fff;padding:14px 26px;border-radius:8px;' +
            'font-size:14px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.25);' +
            'opacity:0;transition:opacity .3s ease;';
        document.body.appendChild(toast);
        requestAnimationFrame(function () { toast.style.opacity = '1'; });
        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () { toast.remove(); }, 300);
        }, 2200);
    }
});
