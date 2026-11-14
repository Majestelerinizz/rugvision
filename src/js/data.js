export const BASE = "https://rugvision-app.web.app";

export const products = [
  {
    id: 10,
    slug: "narin-natural",
    name: "Narin Natural Koridor Halısı",
    category: "koridor-halilari",
    catLabel: "Koridor",
    price: 1499,
    oldPrice: 1899,
    badges: ["yeni", "indirim", "cok-satan"],
    color: "Naturel",
    size: "80x200 cm",
    material: "Pamuk",
    weave: "Makine Dokuma",
    area: "Koridor, Mutfak",
    img: `${BASE}/assets/images/products/RV-NARIN-010.png`,
  },
  {
    id: 9,
    slug: "liva-bej",
    name: "Liva Bej Siyah Çerçeveli Halı",
    category: "modern-halilar",
    catLabel: "Modern",
    price: 2599,
    badges: ["yeni"],
    color: "Bej / Siyah",
    size: "160x230 cm",
    material: "Polipropilen",
    weave: "Makine Dokuma",
    area: "Salon",
    img: `${BASE}/assets/images/products/RV-LIVA-009.png`,
  },
  {
    id: 8,
    slug: "verona",
    name: "Verona Klasik Modern Halı",
    category: "klasik-halilar",
    catLabel: "Klasik",
    price: 3999,
    oldPrice: 4799,
    badges: ["indirim", "cok-satan"],
    color: "Bordo / Krem",
    size: "200x290 cm",
    material: "Yün Karışımı",
    weave: "Makine Dokuma",
    area: "Salon, Oturma Odası",
    img: `${BASE}/assets/images/products/RV-VERONA-008.png`,
  },
  {
    id: 7,
    slug: "elara",
    name: "Elara Doğal Dokulu Halı",
    category: "dogal-dokulu-halilar",
    catLabel: "Doğal Doku",
    price: 4199,
    badges: ["yeni"],
    color: "Naturel / Bej",
    size: "200x300 cm",
    material: "Jüt / Pamuk",
    weave: "El Dokuma",
    area: "Salon",
    img: `${BASE}/assets/images/products/RV-ELARA-007.png`,
  },
  {
    id: 6,
    slug: "safir",
    name: "Safir Premium Salon Halısı",
    category: "salon-halilari",
    catLabel: "Salon",
    price: 5999,
    oldPrice: 6999,
    badges: ["indirim", "cok-satan"],
    color: "Antrasit",
    size: "200x300 cm",
    material: "Yün Karışımı",
    weave: "Makine Dokuma",
    area: "Salon",
    img: `${BASE}/assets/images/products/RV-SAFIR-006.png`,
  },
  {
    id: 5,
    slug: "mira",
    name: "Mira Soft Yatak Odası Halısı",
    category: "yatak-odasi-halilari",
    catLabel: "Yatak Odası",
    price: 2899,
    oldPrice: 3499,
    badges: ["indirim", "yeni"],
    color: "Pudra / Krem",
    size: "160x230 cm",
    material: "Polyester",
    weave: "Makine Dokuma",
    area: "Yatak Odası",
    img: `${BASE}/assets/images/products/RV-MIRA-005.png`,
  },
  {
    id: 4,
    slug: "nova",
    name: "Nova Minimal Desenli Halı",
    category: "modern-halilar",
    catLabel: "Modern",
    price: 2999,
    badges: [],
    color: "Gri / Bej",
    size: "160x230 cm",
    material: "Polipropilen",
    weave: "Makine Dokuma",
    area: "Oturma Odası, Çalışma Odası",
    img: `${BASE}/assets/images/products/RV-NOVA-004.png`,
  },
  {
    id: 3,
    slug: "arya",
    name: "Arya Modern Naturel Halı",
    category: "dogal-dokulu-halilar",
    catLabel: "Doğal Doku",
    price: 3299,
    oldPrice: 3899,
    badges: ["indirim", "cok-satan"],
    color: "Naturel",
    size: "200x290 cm",
    material: "Jüt / Pamuk",
    weave: "El Dokuma",
    area: "Salon",
    img: `${BASE}/assets/images/products/RV-ARYA-003.png`,
  },
];

export const categories = [
  { id: "salon-halilari", name: "Salon Halıları", img: `${BASE}/assets/images/products/RV-SAFIR-006.png` },
  { id: "yatak-odasi-halilari", name: "Yatak Odası Halıları", img: `${BASE}/assets/images/products/RV-MIRA-005.png` },
  { id: "koridor-halilari", name: "Koridor Halıları", img: `${BASE}/assets/images/products/RV-NARIN-010.png` },
  { id: "modern-halilar", name: "Modern Halılar", img: `${BASE}/assets/images/products/RV-LIVA-009.png` },
  { id: "klasik-halilar", name: "Klasik Halılar", img: `${BASE}/assets/images/products/RV-VERONA-008.png` },
  { id: "dogal-dokulu-halilar", name: "Doğal Dokulu Halılar", img: `${BASE}/assets/images/products/RV-ELARA-007.png` },
  { id: "cocuk-odasi-halilari", name: "Çocuk Odası Halıları", img: `${BASE}/assets/images/products/RV-NOVA-004.png` },
  { id: "yolluklar", name: "Yolluklar", img: `${BASE}/assets/images/products/RV-NARIN-010.png` },
];

export const formatPrice = (n) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);

export function productCard(p) {
  const badges = (p.badges || [])
    .map((b) => {
      const map = { yeni: "Yeni", indirim: "İndirim", "cok-satan": "Çok Satan" };
      return `<span class="badge badge-${b}">${map[b] || b}</span>`;
    })
    .join("");
  const old = p.oldPrice
    ? `<s>${formatPrice(p.oldPrice)}</s>`
    : "";
  return `
  <article class="rv-card reveal">
    <a class="rv-card-media" href="./product.html?id=${p.id}">
      <img src="${p.img}" alt="${p.name}" loading="lazy" width="640" height="800" />
      <div class="badge-row">${badges}</div>
    </a>
    <div class="rv-card-body">
      <p>${p.catLabel}</p>
      <h3><a href="./product.html?id=${p.id}">${p.name}</a></h3>
      <div class="price-row"><strong>${formatPrice(p.price)}</strong>${old}</div>
      <div class="rv-card-actions">
        <button type="button" class="btn-ink btn-sm" data-add="${p.id}">Sepete Ekle</button>
        <a class="link-arrow" href="./product.html?id=${p.id}">Detay</a>
        <a class="link-odanda" href="./odanda-gor.html?id=${p.id}">Odanda Gör</a>
      </div>
    </div>
  </article>`;
}
