/**
 * Three.js Tabanlı Evrensel WebGL Zemin AR Sahnesi
 *
 * Kamera akışının üzerine şeffaf bir WebGL katmanı oluşturur.
 * Halıyı zemin (X-Z) düzleminde gerçekçi kontak gölgesi, ışıklandırma ve
 * anizotropik doku filtreleme ile 60 FPS renderlar.
 */

import * as THREE from "three";

export interface FloorSceneOptions {
  canvas: HTMLCanvasElement;
  rugImageUrl?: string;
  widthCm: number;
  lengthCm: number;
  initialPitch?: number;
  initialRoll?: number;
}

export interface WebGLFloorSceneController {
  updateOrientation: (pitchDeg: number, rollDeg: number) => void;
  setRugPositionFromScreen: (clientX: number, clientY: number, screenW: number, screenH: number) => boolean;
  applyDisplacement: (dxM: number, dzM: number) => void;
  updateDimensions: (widthCm: number, lengthCm: number) => void;
  setGizmoVisible: (visible: boolean) => void;
  setScale: (scale: number) => void;
  setUserRotation: (deg: number) => void;
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

/**
 * İki halı ölçüsü arasındaki oransal ölçek farkını hesaplar.
 */
export function calculateDimensionScaleRatio(
  fromW: number,
  fromL: number,
  toW: number,
  toL: number
): { scaleX: number; scaleZ: number } {
  const safeFromW = fromW > 0 ? fromW : 160;
  const safeFromL = fromL > 0 ? fromL : 230;
  const safeToW = toW > 0 ? toW : 160;
  const safeToL = toL > 0 ? toL : 230;

  return {
    scaleX: Number((safeToW / safeFromW).toFixed(4)),
    scaleZ: Number((safeToL / safeFromL).toFixed(4)),
  };
}

/**
 * 3D zemin gizmosu için 4 köşe L-şeklinde kılavuz çizgilerinin vertex tamponunu üretir.
 */
export function createGizmoCornerVertices(
  widthM: number,
  lengthM: number,
  bracketSizeM = 0.15
): Float32Array {
  const hw = (widthM > 0 ? widthM : 1.6) / 2;
  const hl = (lengthM > 0 ? lengthM : 2.3) / 2;
  const b = Math.min(bracketSizeM, Math.min(hw, hl) * 0.4);
  const y = 0.007; // Halının biraz üstünde

  // 4 köşe için her biri 2 çizgi segmenti (4 nokta -> 12 float) x 4 köşe = 48 float
  const vertices = [
    // 1. Sol-Üst köşe (-hw, -hl)
    -hw, y, -hl,   -hw + b, y, -hl,
    -hw, y, -hl,   -hw, y, -hl + b,

    // 2. Sağ-Üst köşe (hw, -hl)
    hw, y, -hl,    hw - b, y, -hl,
    hw, y, -hl,    hw, y, -hl + b,

    // 3. Sağ-Alt köşe (hw, hl)
    hw, y, hl,     hw - b, y, hl,
    hw, y, hl,     hw, y, hl - b,

    // 4. Sol-Alt köşe (-hw, hl)
    -hw, y, hl,    -hw + b, y, hl,
    -hw, y, hl,    -hw, y, hl - b,
  ];

  return new Float32Array(vertices);
}

/**
 * Telefon eğim ve yuvarlanma açılarını (derece) Three.js radyan açılarına dönüştürür.
 */
export function calculateCameraRotation(pitchDeg: number, rollDeg: number): { pitchRad: number; rollRad: number } {
  const pitchRad = -THREE.MathUtils.degToRad(Math.max(10, Math.min(85, pitchDeg)));
  const rollRad = THREE.MathUtils.degToRad(Math.max(-45, Math.min(45, rollDeg)));
  return { pitchRad, rollRad };
}

/**
 * Santimetre cinsinden ebatları Three.js dünya birimlerine (metre) dönüştürür.
 */
export function calculateRugMeshDimensions(widthCm: number, lengthCm: number): { widthM: number; lengthM: number } {
  const w = widthCm > 0 ? widthCm / 100 : 1.6;
  const l = lengthCm > 0 ? lengthCm / 100 : 2.3;
  return { widthM: Number(w.toFixed(2)), lengthM: Number(l.toFixed(2)) };
}

/**
 * Ekrandaki dokunma noktasından (Normalized Device Coordinates: -1..1)
 * Zemin (Y=0) düzlemine ışın fırlatarak zemin koordinatını (X, Z) hesaplar.
 */
export function raycastFloorIntersection(
  ndcX: number,
  ndcY: number,
  cameraY: number,
  cameraPitchRad: number,
  fovDeg = 60,
  aspect = 9 / 16
): { x: number; z: number } | null {
  const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(fovDeg / 2));
  const rayDirCam = new THREE.Vector3(
    ndcX * tanHalfFov * aspect,
    ndcY * tanHalfFov,
    -1
  ).normalize();

  const cosPitch = Math.cos(cameraPitchRad);
  const sinPitch = Math.sin(cameraPitchRad);

  const rayDirWorld = new THREE.Vector3(
    rayDirCam.x,
    rayDirCam.y * cosPitch - rayDirCam.z * sinPitch,
    rayDirCam.y * sinPitch + rayDirCam.z * cosPitch
  ).normalize();

  if (Math.abs(rayDirWorld.y) < 1e-4) return null;

  const t = -cameraY / rayDirWorld.y;
  if (t <= 0) return null;

  return {
    x: Number((rayDirWorld.x * t).toFixed(3)),
    z: Number((rayDirWorld.z * t).toFixed(3)),
  };
}

/**
 * Halı dokusu için gradient yumuşak kontak gölgesi canvas'ı üretir.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 64, 128, 128, 128);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
    gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.28)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Three.js Sahnesi ve WebGL Renderer başlatıcı
 */
export function initWebGLFloorScene(options: FloorSceneOptions): WebGLFloorSceneController {
  const { canvas, rugImageUrl, widthCm, lengthCm, initialPitch = 55, initialRoll = 0 } = options;

  // 1. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // 2. Sahne & Kamera
  const scene = new THREE.Scene();

  const aspect = (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight);
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 50);

  const cameraHeight = 1.3;
  camera.position.set(0, cameraHeight, 0);

  const initialRot = calculateCameraRotation(initialPitch, initialRoll);
  camera.rotation.order = "YXZ";
  camera.rotation.x = initialRot.pitchRad;
  camera.rotation.z = initialRot.rollRad;

  // 3. Işıklandırma
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.2);
  sunLight.position.set(1.5, 4.0, 1.0);
  scene.add(sunLight);

  // 4. Halı Geometrisi & Materyali
  let currentDimensions = calculateRugMeshDimensions(widthCm, lengthCm);
  let rugGeometry = new THREE.PlaneGeometry(currentDimensions.widthM, currentDimensions.lengthM);
  rugGeometry.rotateX(-Math.PI / 2);

  let rugMaterial: THREE.Material;

  if (rugImageUrl) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const rugTexture = textureLoader.load(
      rugImageUrl,
      () => {
        rugTexture.colorSpace = THREE.SRGBColorSpace;
        rugTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        rugTexture.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    rugMaterial = new THREE.MeshStandardMaterial({
      map: rugTexture,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  } else {
    rugMaterial = new THREE.MeshStandardMaterial({
      color: 0x965a28,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }

  // Halı Grubu
  const rugGroup = new THREE.Group();
  rugGroup.position.set(0, 0.005, -1.6);

  const rugMesh = new THREE.Mesh(rugGeometry, rugMaterial);
  rugGroup.add(rugMesh);

  // Kontak Gölgesi
  const shadowTexture = createContactShadowTexture();
  let shadowGeometry = new THREE.PlaneGeometry(currentDimensions.widthM * 1.15, currentDimensions.lengthM * 1.15);
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadowMesh.position.y = -0.002;
  rugGroup.add(shadowMesh);

  // 3D Zemin Gizmosu (Köşe Kılavuzları)
  let gizmoGeometry = new THREE.BufferGeometry();
  gizmoGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(createGizmoCornerVertices(currentDimensions.widthM, currentDimensions.lengthM), 3)
  );
  const gizmoMaterial = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });
  const gizmoMesh = new THREE.LineSegments(gizmoGeometry, gizmoMaterial);
  gizmoMesh.visible = false; // Başlangıçta gizli, dokununca görünür
  rugGroup.add(gizmoMesh);

  scene.add(rugGroup);

  // Zemin Düzlemi (Raycaster)
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const raycaster = new THREE.Raycaster();

  // 5. Kontrolcü Metotları
  return {
    updateOrientation(pitchDeg: number, rollDeg: number) {
      const rot = calculateCameraRotation(pitchDeg, rollDeg);
      camera.rotation.x = rot.pitchRad;
      camera.rotation.z = rot.rollRad;
    },

    setRugPositionFromScreen(clientX: number, clientY: number, screenW: number, screenH: number): boolean {
      if (screenW <= 0 || screenH <= 0) return false;

      const ndcX = (clientX / screenW) * 2 - 1;
      const ndcY = -(clientY / screenH) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const intersection = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(floorPlane, intersection);

      if (hit && intersection.z < -0.3 && intersection.z > -7.0) {
        rugGroup.position.x = intersection.x;
        rugGroup.position.z = intersection.z;
        return true;
      }
      return false;
    },

    applyDisplacement(dxM: number, dzM: number) {
      const newX = rugGroup.position.x - dxM;
      const newZ = rugGroup.position.z - dzM;
      if (newZ < -0.3 && newZ > -7.0 && Math.abs(newX) < 4.0) {
        rugGroup.position.x = Number(newX.toFixed(3));
        rugGroup.position.z = Number(newZ.toFixed(3));
      }
    },

    updateDimensions(newWidthCm: number, newLengthCm: number) {
      currentDimensions = calculateRugMeshDimensions(newWidthCm, newLengthCm);

      // Eski geometrileri temizle ve yenilerini oluştur
      rugGeometry.dispose();
      rugGeometry = new THREE.PlaneGeometry(currentDimensions.widthM, currentDimensions.lengthM);
      rugGeometry.rotateX(-Math.PI / 2);
      rugMesh.geometry = rugGeometry;

      shadowGeometry.dispose();
      shadowGeometry = new THREE.PlaneGeometry(currentDimensions.widthM * 1.15, currentDimensions.lengthM * 1.15);
      shadowGeometry.rotateX(-Math.PI / 2);
      shadowMesh.geometry = shadowGeometry;

      gizmoGeometry.dispose();
      gizmoGeometry = new THREE.BufferGeometry();
      gizmoGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(createGizmoCornerVertices(currentDimensions.widthM, currentDimensions.lengthM), 3)
      );
      gizmoMesh.geometry = gizmoGeometry;
    },

    setGizmoVisible(visible: boolean) {
      gizmoMesh.visible = visible;
    },

    setScale(scale: number) {
      const s = Math.max(0.4, Math.min(2.8, scale));
      rugGroup.scale.set(s, 1, s);
    },

    setUserRotation(deg: number) {
      rugGroup.rotation.y = THREE.MathUtils.degToRad(deg);
    },

    resize(width: number, height: number) {
      if (width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },

    render() {
      renderer.render(scene, camera);
    },

    dispose() {
      rugGeometry.dispose();
      rugMaterial.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      gizmoGeometry.dispose();
      gizmoMaterial.dispose();
      renderer.dispose();
    },
  };
}
