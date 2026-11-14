/**
 * Universal WebAR — camera + Three.js floor rug (adapted from rugvision webar-demo).
 * Loads Three from CDN on first open.
 */

let threePromise = null;

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = () => resolve(window.THREE);
    s.onerror = () => reject(new Error("Three.js yüklenemedi"));
    document.head.appendChild(s);
  });
  return threePromise;
}

export function createLiveWebAr(root) {
  let stream = null;
  let raf = 0;
  let scene;
  let camera;
  let renderer;
  let rugMesh;
  let pitch = 0.55;
  let yaw = 0;
  let scaleM = 1.6;
  let orientHandler = null;

  const els = {
    shell: root.querySelector("[data-webar-shell]"),
    video: root.querySelector("[data-webar-video]"),
    canvas: root.querySelector("[data-webar-canvas]"),
    close: root.querySelector("[data-webar-close]"),
    scale: root.querySelector("[data-webar-scale]"),
    rotate: root.querySelector("[data-webar-rotate]"),
    tilt: root.querySelector("[data-webar-tilt]"),
    reset: root.querySelector("[data-webar-reset]"),
    sensor: root.querySelector("[data-webar-sensor]"),
    error: root.querySelector("[data-webar-error]"),
  };

  function showError(msg) {
    if (!els.error) return;
    els.error.hidden = false;
    els.error.querySelector("[data-webar-error-text]").textContent = msg;
  }

  function hideError() {
    if (els.error) els.error.hidden = true;
  }

  async function initScene(rugImageUrl, widthCm, lengthCm) {
    const THREE = await loadThree();
    const w = els.canvas.clientWidth || window.innerWidth;
    const h = els.canvas.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, w / h, 0.01, 100);
    camera.position.set(0, 1.4, 2.4);

    renderer = new THREE.WebGLRenderer({
      canvas: els.canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.55);
    dir.position.set(2, 4, 2);
    scene.add(dir);

    scaleM = Math.max(widthCm, lengthCm) / 100;
    const aspect = widthCm / Math.max(lengthCm, 1);
    const planeW = scaleM;
    const planeH = scaleM / Math.max(aspect, 0.2);

    const loader = new THREE.TextureLoader();
    const tex = await new Promise((resolve, reject) => {
      loader.load(rugImageUrl, resolve, undefined, reject);
    });
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;

    const geo = new THREE.PlaneGeometry(planeW, planeH);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    rugMesh = new THREE.Mesh(geo, mat);
    rugMesh.rotation.x = -Math.PI / 2;
    rugMesh.position.set(0, 0, 0);
    scene.add(rugMesh);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(planeW * 1.05, planeH * 1.05),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.002;
    scene.add(shadow);

    applyTransforms();
  }

  function applyTransforms() {
    if (!rugMesh || !camera) return;
    rugMesh.rotation.z = (yaw * Math.PI) / 180;
    const s = Number(els.scale?.value || scaleM) / Math.max(scaleM, 0.1);
    rugMesh.scale.set(s, s, s);
    camera.position.set(0, Number(els.tilt?.value || 3), 2.6);
    camera.lookAt(0, 0, 0);
    camera.rotation.x = -pitch + (Number(els.tilt?.value || 3) - 3) * 0.04;
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function onResize() {
    if (!camera || !renderer) return;
    const w = els.canvas.clientWidth || window.innerWidth;
    const h = els.canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  async function open({ rugImageUrl, widthCm, lengthCm }) {
    hideError();
    els.shell.hidden = false;
    document.documentElement.classList.add("webar-open");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      els.video.srcObject = stream;
      await els.video.play();
      if (els.scale) els.scale.value = String(Math.max(widthCm, lengthCm) / 100);
      await initScene(rugImageUrl, widthCm, lengthCm);
      window.addEventListener("resize", onResize);
      loop();
    } catch (err) {
      showError(err?.message || "Kamera açılamadı. HTTPS ve kamera izni gerekir.");
    }
  }

  function close() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    if (orientHandler) {
      window.removeEventListener("deviceorientation", orientHandler);
      orientHandler = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (els.video) els.video.srcObject = null;
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    scene = null;
    camera = null;
    rugMesh = null;
    els.shell.hidden = true;
    document.documentElement.classList.remove("webar-open");
    hideError();
  }

  els.close?.addEventListener("click", close);
  els.error?.querySelector("[data-webar-error-close]")?.addEventListener("click", hideError);
  els.scale?.addEventListener("input", applyTransforms);
  els.rotate?.addEventListener("input", () => {
    yaw = Number(els.rotate.value || 0);
    applyTransforms();
  });
  els.tilt?.addEventListener("input", applyTransforms);
  els.reset?.addEventListener("click", () => {
    yaw = 0;
    pitch = 0.55;
    if (els.rotate) els.rotate.value = "0";
    if (els.tilt) els.tilt.value = "3";
    applyTransforms();
  });

  els.sensor?.addEventListener("click", async () => {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
        const state = await DeviceOrientationEvent.requestPermission();
        if (state !== "granted") return;
      }
      orientHandler = (e) => {
        if (typeof e.beta === "number") pitch = Math.min(1.2, Math.max(0.15, (e.beta || 40) / 90));
        if (typeof e.gamma === "number") yaw = e.gamma * 0.8;
        if (els.rotate) els.rotate.value = String(Math.round(yaw));
        applyTransforms();
      };
      window.addEventListener("deviceorientation", orientHandler, true);
      els.sensor.hidden = true;
    } catch {
      showError("Jiroskop izni alınamadı.");
    }
  });

  // Show sensor button on iOS
  if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission && els.sensor) {
    els.sensor.hidden = false;
  }

  return { open, close };
}
