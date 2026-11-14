import {
  RUG_SIZE_PRESETS,
  arModesForViewer,
  isXiaomiDevice,
  modelViewerScale,
  mustUseInBrowserWebAr,
  openIosQuickLook,
  openSceneViewer,
  parseUserAgent,
  resolveArLaunchMode,
  shouldDisableModelViewerAr,
} from "./device-ar.js";
import { createLiveWebAr } from "./live-webar.js";
import { mountPhotoPlacer } from "./photo-placer.js";

function ensureModelViewer() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("model-viewer yüklenemedi"));
    document.head.appendChild(s);
    const t = setInterval(() => {
      if (customElements.get("model-viewer")) {
        clearInterval(t);
        resolve();
      }
    }, 80);
    setTimeout(() => clearInterval(t), 8000);
  });
}

export async function initOdandaViewer(root, product, products) {
  const ua = navigator.userAgent;
  const profile = parseUserAgent(ua);
  const inBrowserOnly = shouldDisableModelViewerAr(ua);
  const arModes = arModesForViewer(ua);
  let size = {
    widthCm: product.widthCm,
    lengthCm: product.lengthCm,
    label: `${product.widthCm}×${product.lengthCm}`,
  };
  let photoMounted = false;

  const nameEl = root.querySelector("[data-odanda-name]");
  const metaEl = root.querySelector("[data-odanda-meta]");
  const hintEl = root.querySelector("[data-odanda-hint]");
  const select = root.querySelector("[data-odanda-select]");
  const sizeSelect = root.querySelector("[data-odanda-size]");
  const viewerHost = root.querySelector("[data-odanda-viewer]");
  const tabBtns = [...root.querySelectorAll("[data-odanda-tab]")];
  const panels = {
    ar: root.querySelector('[data-odanda-panel="ar"]'),
    photo: root.querySelector('[data-odanda-panel="photo"]'),
  };
  const launchBtn = root.querySelector("[data-odanda-launch]");
  const launchLabel = root.querySelector("[data-odanda-launch-label]");
  const webar = createLiveWebAr(document);

  root.classList.toggle("is-xiaomi-ar", isXiaomiDevice(ua) || mustUseInBrowserWebAr(ua));

  if (nameEl) nameEl.textContent = product.name;
  if (metaEl) {
    metaEl.textContent = `${product.sku} · ${size.widthCm}×${size.lengthCm} cm · ${profile.hint}`;
  }
  if (hintEl) hintEl.textContent = profile.hint;
  if (launchLabel) {
    launchLabel.textContent = profile.buttonLabel || "Odanda Gör";
  }

  if (select) {
    select.innerHTML = products
      .map((x) => `<option value="${x.id}" ${x.id === product.id ? "selected" : ""}>${x.name}</option>`)
      .join("");
    select.addEventListener("change", () => {
      location.href = `./odanda-gor.html?id=${select.value}`;
    });
  }

  function fillSizes() {
    if (!sizeSelect) return;
    const presets = [...RUG_SIZE_PRESETS];
    if (!presets.some((p) => p.widthCm === product.widthCm && p.lengthCm === product.lengthCm)) {
      presets.unshift({
        label: `${product.widthCm}×${product.lengthCm}`,
        widthCm: product.widthCm,
        lengthCm: product.lengthCm,
      });
    }
    sizeSelect.innerHTML = presets
      .map(
        (p) =>
          `<option value="${p.widthCm}x${p.lengthCm}" ${
            p.widthCm === size.widthCm && p.lengthCm === size.lengthCm ? "selected" : ""
          }>${p.label} cm</option>`
      )
      .join("");
  }
  fillSizes();
  sizeSelect?.addEventListener("change", () => {
    const [w, l] = sizeSelect.value.split("x").map(Number);
    size = { widthCm: w, lengthCm: l, label: `${w}×${l}` };
    updateViewerScale();
    if (metaEl) metaEl.textContent = `${product.sku} · ${w}×${l} cm · ${profile.hint}`;
  });

  await ensureModelViewer();

  // Xiaomi: model-viewer AR attribute KAPALI → Scene Viewer / Google app intent tetiklenmez
  const arAttrs = inBrowserOnly
    ? ""
    : `ar ar-modes="${arModes}" ar-placement="floor"`;

  viewerHost.innerHTML = `
    <model-viewer
      class="odanda-model"
      src="${product.glb}"
      ${product.usdz ? `ios-src="${product.usdz}"` : ""}
      poster="${product.img}"
      alt="${product.name}"
      ${arAttrs}
      camera-controls
      touch-action="pan-y"
      shadow-intensity="0.85"
      exposure="1"
      environment-image="neutral"
      auto-rotate
      rotation-per-second="18deg"
      scale="${modelViewerScale(product.widthCm, product.lengthCm, size.widthCm, size.lengthCm)}"
    ></model-viewer>
  `;

  const mv = viewerHost.querySelector("model-viewer");

  function updateViewerScale() {
    if (!mv) return;
    mv.setAttribute(
      "scale",
      modelViewerScale(product.widthCm, product.lengthCm, size.widthCm, size.lengthCm)
    );
  }

  function setTab(tab) {
    tabBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.odandaTab === tab));
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.hidden = key !== tab;
    });
    if (tab === "photo" && !photoMounted) {
      mountPhotoPlacer(panels.photo, {
        rugImageUrl: product.img,
        rugName: product.name,
        widthCm: size.widthCm,
        lengthCm: size.lengthCm,
      });
      photoMounted = true;
    }
  }

  tabBtns.forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.odandaTab)));
  setTab("ar");

  async function launchAr() {
    const currentUa = navigator.userAgent;
    let mode = resolveArLaunchMode(currentUa, Boolean(product.usdz));

    // Emniyet kemeri: Xiaomi her koşulda in-browser
    if (isXiaomiDevice(currentUa) || mustUseInBrowserWebAr(currentUa)) {
      mode = "universal-webar";
    }

    launchBtn.disabled = true;
    try {
      if (mode === "quick-look" && product.usdz) {
        openIosQuickLook(product.usdz);
        return;
      }
      if (mode === "scene-viewer") {
        const opened = openSceneViewer(currentUa, product.glb);
        if (opened) return;
        // blocked → fall through to WebAR
      }
      await webar.open({
        rugImageUrl: product.img,
        widthCm: size.widthCm,
        lengthCm: size.lengthCm,
      });
    } finally {
      launchBtn.disabled = false;
    }
  }

  launchBtn?.addEventListener("click", launchAr);

  const params = new URLSearchParams(location.search);
  if (params.get("live") === "1" || params.get("ar") === "1") {
    setTimeout(() => launchAr(), 400);
  }
}
