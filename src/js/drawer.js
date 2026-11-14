/** Side menu is NOT in the HTML — created only when opened. No refresh flash. */

const DRAWER_HTML = `
<div class="nav-drawer" id="nav-drawer" aria-hidden="true">
  <div class="nav-backdrop" data-nav-close></div>
  <aside class="nav-panel" role="dialog" aria-modal="true" aria-label="Menü">
    <div class="nav-panel-head">
      <a class="brand" href="./index.html" aria-label="RugVision">
        <img class="brand-logo" src="/logo-mark.jpg" alt="" width="36" height="36" />
        <span class="brand-text"><strong>RugVision</strong><span>Menü</span></span>
      </a>
      <button class="icon-btn" type="button" data-nav-close aria-label="Kapat">✕</button>
    </div>
    <div class="nav-group">
      <h3>Keşfet</h3>
      <a href="./products.html">Ürünler</a>
      <a href="./products.html?filter=bestseller">En Çok Satanlar</a>
      <a href="./products.html?filter=new">Yeni Ürünler</a>
      <a href="./products.html?filter=campaign">Kampanyalar</a>
      <a href="./odanda-gor.html">Odanda Gör</a>
      <a href="./blog.html">Blog</a>
      <a href="./contact.html">İletişim</a>
    </div>
  </aside>
</div>`;

let drawerEl = null;
let closeTimer = 0;

function bindClose(root) {
  root.querySelectorAll("[data-nav-close]").forEach((el) => {
    el.addEventListener("click", closeDrawer);
  });
}

export function openDrawer() {
  clearTimeout(closeTimer);
  if (!drawerEl) {
    const wrap = document.createElement("div");
    wrap.innerHTML = DRAWER_HTML.trim();
    drawerEl = wrap.firstElementChild;
    document.body.appendChild(drawerEl);
    bindClose(drawerEl);
  }
  drawerEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => drawerEl?.classList.add("is-open"));
  });
}

export function closeDrawer() {
  if (!drawerEl) return;
  drawerEl.classList.remove("is-open");
  drawerEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => {
    drawerEl?.remove();
    drawerEl = null;
  }, 360);
}

export function initDrawer() {
  // Kill any leftover static drawer from old HTML/cache — never paint on load
  document.querySelectorAll(".nav-drawer").forEach((el) => el.remove());

  document.querySelectorAll("[data-nav-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer();
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
}
