import "../styles/main.css";
import { products, categories, productCard, formatPrice } from "./data.js";
import { initDrawer } from "./drawer.js";
import { initOdandaViewer } from "./ar/odanda.js";

/* Reveal page only after CSS module is applied — kills FOUC flash */
document.documentElement.classList.add("is-ready");

initDrawer();

const header = document.querySelector(".site-header");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* Hero */
const hero = document.querySelector("[data-hero]");
if (hero) {
  const slides = [...hero.querySelectorAll(".home-hero-slide")];
  const dots = [...hero.querySelectorAll("[data-hero-dot]")];
  let i = 0;
  let timer;
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    dots.forEach((d, idx) =>
      idx === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")
    );
  };
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 5200);
  };
  hero.querySelector("[data-hero-prev]")?.addEventListener("click", () => {
    go(i - 1);
    restart();
  });
  hero.querySelector("[data-hero-next]")?.addEventListener("click", () => {
    go(i + 1);
    restart();
  });
  dots.forEach((d, idx) =>
    d.addEventListener("click", () => {
      go(idx);
      restart();
    })
  );
  restart();
}

/* Mount category grid */
const catMount = document.querySelector("[data-categories]");
if (catMount) {
  catMount.innerHTML = categories
    .map(
      (c) => `
    <a class="cat-card reveal" href="./products.html?category=${c.id}">
      <img src="${c.img}" alt="${c.name}" loading="lazy" />
      <span>${c.name}</span>
    </a>`
    )
    .join("");
}

/* Mount product grids */
document.querySelectorAll("[data-products]").forEach((el) => {
  const mode = el.dataset.products;
  let list = [...products];
  if (mode === "bestseller") list = list.filter((p) => p.badges?.includes("cok-satan"));
  if (mode === "new") list = list.filter((p) => p.badges?.includes("yeni"));
  if (mode === "campaign") list = list.filter((p) => p.oldPrice);
  if (mode === "featured") list = list.slice(0, 8);
  const limit = Number(el.dataset.limit || list.length);
  el.innerHTML = list.slice(0, limit).map(productCard).join("");
});

/* Products page filters */
const catalog = document.querySelector("[data-catalog]");
if (catalog) {
  const params = new URLSearchParams(location.search);
  let activeCat = params.get("category") || "all";
  let activeFilter = params.get("filter") || "all";
  const countEl = document.querySelector("[data-count]");
  const chips = document.querySelectorAll("[data-filter-cat]");

  const render = () => {
    let list = [...products];
    if (activeCat !== "all") list = list.filter((p) => p.category === activeCat);
    if (activeFilter === "bestseller") list = list.filter((p) => p.badges?.includes("cok-satan"));
    if (activeFilter === "new") list = list.filter((p) => p.badges?.includes("yeni"));
    if (activeFilter === "campaign") list = list.filter((p) => p.oldPrice);
    catalog.innerHTML = list.map(productCard).join("");
    if (countEl) countEl.textContent = `${list.length} ürün listeleniyor`;
    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filterCat === activeCat));
    document.querySelectorAll("[data-filter-mode]").forEach((c) =>
      c.classList.toggle("is-active", c.dataset.filterMode === activeFilter)
    );
    bindCart();
    revealNow();
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      activeCat = chip.dataset.filterCat;
      render();
    })
  );
  document.querySelectorAll("[data-filter-mode]").forEach((chip) =>
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filterMode;
      render();
    })
  );
  render();
}

/* Product detail */
const detail = document.querySelector("[data-product-detail]");
if (detail) {
  const id = Number(new URLSearchParams(location.search).get("id") || 10);
  const p = products.find((x) => x.id === id) || products[0];
  detail.innerHTML = `
    <div class="detail-grid reveal">
      <div class="detail-media">
        <img src="${p.img}" alt="${p.name}" />
      </div>
      <div class="detail-copy">
        <p class="kicker">${p.catLabel}</p>
        <h1>${p.name}</h1>
        <div class="price-row price-lg">
          <strong>${formatPrice(p.price)}</strong>
          ${p.oldPrice ? `<s>${formatPrice(p.oldPrice)}</s>` : ""}
        </div>
        <p class="stock">✔ Stokta var</p>
        <dl class="spec-list">
          <div><dt>Renk</dt><dd>${p.color}</dd></div>
          <div><dt>Ölçü</dt><dd>${p.size}</dd></div>
          <div><dt>Materyal</dt><dd>${p.material}</dd></div>
          <div><dt>Dokuma</dt><dd>${p.weave}</dd></div>
          <div><dt>Kullanım</dt><dd>${p.area}</dd></div>
        </dl>
        <p class="detail-lead">
          ${p.name}, doğal tonları ve dengeli dokusuyla yaşam alanınıza sakin bir karakter katar.
          RugVision ile satın almadan önce odanızda deneyimleyebilirsiniz.
        </p>
        <div class="detail-actions">
          <button class="btn-ink" type="button" data-add="${p.id}">Sepete Ekle</button>
          <a class="btn-ink" href="./odanda-gor.html?id=${p.id}">VR / AR Odanda Gör</a>
          <a class="btn-outline" href="./odanda-gor.html?id=${p.id}&live=1">Canlı kamera</a>
        </div>
      </div>
    </div>`;
  document.title = `${p.name} — RugVision Halı Concept`;
  bindCart();
}

/* Odanda Gör — full VR/AR viewer */
const odanda = document.querySelector("[data-odanda]");
if (odanda) {
  const id = Number(new URLSearchParams(location.search).get("id") || 10);
  const p = products.find((x) => x.id === id) || products[0];
  initOdandaViewer(odanda, p, products).catch((err) => {
    console.error(err);
    const meta = odanda.querySelector("[data-odanda-meta]");
    if (meta) meta.textContent = "AR görüntüleyici yüklenemedi. Sayfayı yenileyin.";
  });
}

function bindCart() {
  document.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const badge = document.querySelector(".cart-badge em");
      if (badge) badge.textContent = String(Number(badge.textContent || 0) + 1);
      btn.textContent = "Eklendi";
      setTimeout(() => (btn.textContent = "Sepete Ekle"), 1200);
    });
  });
}
bindCart();

function revealNow() {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
}

const reveals = document.querySelectorAll(".reveal");
if (reveals.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.01, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
  /* Above-the-fold content: reveal immediately so mobile never looks blank */
  requestAnimationFrame(() => {
    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add("is-in");
    });
  });
} else {
  revealNow();
}
