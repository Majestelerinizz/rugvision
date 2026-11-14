/** Perspective photo rug placer — vanilla port of PhotoRugPlacer core */

function computeMatrix3d(quad, imgW, imgH) {
  const [tl, tr, br, bl] = quad;
  const sx = tl.x;
  const sy = tl.y;
  const ax = tr.x - tl.x;
  const ay = tr.y - tl.y;
  const bx = bl.x - tl.x;
  const by = bl.y - tl.y;
  const cx = br.x - tl.x - ax - bx;
  const cy = br.y - tl.y - ay - by;
  const den = ax * by - ay * bx;
  if (Math.abs(den) < 1e-10) return "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)";
  const g = (cx * by - cy * bx) / den;
  const h = (ax * cy - ay * cx) / den;
  const a = ax + g * ax;
  const b = bx + h * bx;
  const c = sx;
  const d = ay + g * ay;
  const e = by + h * by;
  const f = sy;
  const scaleX = 1 / imgW;
  const scaleY = 1 / imgH;
  return `matrix3d(${a * scaleX},${d * scaleX},0,${g * scaleX},${b * scaleY},${e * scaleY},0,${h * scaleY},0,0,1,0,${c},${f},0,1)`;
}

export function mountPhotoPlacer(root, { rugImageUrl, rugName, widthCm, lengthCm }) {
  const stage = root.querySelector("[data-photo-stage]");
  const fileInput = root.querySelector("[data-photo-file]");
  const pickBtn = root.querySelector("[data-photo-pick]");
  const downloadBtn = root.querySelector("[data-photo-download]");
  const shareBtn = root.querySelector("[data-photo-share]");
  const empty = root.querySelector("[data-photo-empty]");

  let roomImg = null;
  let rugImg = null;
  let quad = null;
  let drag = null;

  const rug = new Image();
  rug.crossOrigin = "anonymous";
  rug.src = rugImageUrl;
  rug.onload = () => {
    rugImg = rug;
    paint();
  };

  function defaultQuad(w, h) {
    const aspect = widthCm / Math.max(lengthCm, 1);
    const rw = Math.min(w * 0.55, h * 0.55 * aspect);
    const rh = rw / Math.max(aspect, 0.15);
    const cx = w * 0.5;
    const cy = h * 0.62;
    return [
      { x: cx - rw / 2, y: cy - rh / 2 },
      { x: cx + rw / 2, y: cy - rh / 2 },
      { x: cx + rw / 2, y: cy + rh / 2 },
      { x: cx - rw / 2, y: cy + rh / 2 },
    ];
  }

  function paint() {
    if (!stage || !roomImg) return;
    stage.innerHTML = "";
    stage.style.aspectRatio = `${roomImg.naturalWidth} / ${roomImg.naturalHeight}`;

    const bg = document.createElement("img");
    bg.className = "photo-room";
    bg.src = roomImg.src;
    bg.alt = "Oda fotoğrafı";
    stage.appendChild(bg);

    const wrap = document.createElement("div");
    wrap.className = "photo-rug-wrap";
    const overlay = document.createElement("img");
    overlay.className = "photo-rug";
    overlay.src = rugImageUrl;
    overlay.alt = rugName;
    wrap.appendChild(overlay);
    stage.appendChild(wrap);

    const rect = stage.getBoundingClientRect();
    if (!quad) quad = defaultQuad(rect.width, rect.height);
    wrap.style.width = `${rug.naturalWidth || 600}px`;
    wrap.style.height = `${rug.naturalHeight || 600}px`;
    wrap.style.transformOrigin = "0 0";
    wrap.style.transform = computeMatrix3d(quad, rug.naturalWidth || 600, rug.naturalHeight || 600);

    quad.forEach((pt, i) => {
      const h = document.createElement("button");
      h.type = "button";
      h.className = "photo-handle";
      h.style.left = `${pt.x}px`;
      h.style.top = `${pt.y}px`;
      h.setAttribute("aria-label", `Köşe ${i + 1}`);
      h.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        h.setPointerCapture(e.pointerId);
        drag = { i, ox: e.clientX - pt.x, oy: e.clientY - pt.y };
      });
      h.addEventListener("pointermove", (e) => {
        if (!drag || drag.i !== i) return;
        const r = stage.getBoundingClientRect();
        quad[i] = {
          x: Math.min(r.width, Math.max(0, e.clientX - r.left - drag.ox + (drag.ox ? 0 : 0))),
          y: Math.min(r.height, Math.max(0, e.clientY - r.top)),
        };
        // simpler: use client relative
        quad[i] = {
          x: Math.min(r.width, Math.max(0, e.clientX - r.left)),
          y: Math.min(r.height, Math.max(0, e.clientY - r.top)),
        };
        h.style.left = `${quad[i].x}px`;
        h.style.top = `${quad[i].y}px`;
        wrap.style.transform = computeMatrix3d(quad, rug.naturalWidth || 600, rug.naturalHeight || 600);
      });
      h.addEventListener("pointerup", () => {
        drag = null;
      });
      stage.appendChild(h);
    });

    if (empty) empty.hidden = true;
    if (downloadBtn) downloadBtn.disabled = false;
    if (shareBtn) shareBtn.disabled = false;
  }

  async function exportPng() {
    if (!roomImg || !quad) return null;
    const canvas = document.createElement("canvas");
    canvas.width = roomImg.naturalWidth;
    canvas.height = roomImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(roomImg, 0, 0);
    // Approximate: draw rug using 2D transform via path fill with pattern — simplified drawImage with corners via clipping
    if (rugImg) {
      const rect = stage.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      const mapped = quad.map((p) => ({ x: p.x * sx, y: p.y * sy }));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mapped[0].x, mapped[0].y);
      mapped.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.clip();
      // stretch rug into bounding box of quad
      const minX = Math.min(...mapped.map((p) => p.x));
      const maxX = Math.max(...mapped.map((p) => p.x));
      const minY = Math.min(...mapped.map((p) => p.y));
      const maxY = Math.max(...mapped.map((p) => p.y));
      ctx.drawImage(rugImg, minX, minY, maxX - minX, maxY - minY);
      ctx.restore();
    }
    return canvas;
  }

  pickBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      roomImg = img;
      quad = null;
      paint();
    };
    img.src = url;
  });

  downloadBtn?.addEventListener("click", async () => {
    const canvas = await exportPng();
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${rugName.replace(/\s+/g, "-").toLowerCase()}-odanda.png`;
    a.click();
  });

  shareBtn?.addEventListener("click", async () => {
    const canvas = await exportPng();
    if (!canvas) return;
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    if (navigator.share && blob) {
      const file = new File([blob], "odanda-gor.png", { type: "image/png" });
      try {
        await navigator.share({ files: [file], title: rugName, text: "RugVision Odanda Gör" });
      } catch {
        /* user cancel */
      }
    }
  });

  return {
    setRug(next) {
      Object.assign(arguments[0] || {}, next);
    },
  };
}
