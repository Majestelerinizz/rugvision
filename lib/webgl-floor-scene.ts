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
  updateDeviceOrientation: (alpha: number, beta: number, gamma: number, screenAngle?: number) => void;
  placeUnderCrosshair: () => boolean;
  /** Zemin raycast veya varsayılan mesafe ile gerçek ölçüde yerleştir (scale=1). */
  autoPlaceOnFloor: () => boolean;
  updateFloorGuide: () => boolean;
  setRugVisible: (visible: boolean) => void;
  setGuideVisible: (visible: boolean) => void;
  setVerticalFov: (fovDeg: number) => void;
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
/**
 * Telefon kamerasının dikey görüş açısı.
 * Video yatay kadrajda gelir; object-cover ile ekranda görünen yükseklik bu açıdır.
 * 60° sanal kamera halıyı yerdeki halıdan büyük/küçük bir resim gibi gösterir.
 */
export function estimatePhoneVerticalFov(
  videoWidth: number,
  videoHeight: number,
  horizontalFovDeg = 67
): number {
  if (videoWidth <= 0 || videoHeight <= 0) return 46;
  const aspect = videoWidth / videoHeight;
  const halfH = (horizontalFovDeg * Math.PI) / 360;
  const vRad = 2 * Math.atan(Math.tan(halfH) / aspect);
  const vDeg = (vRad * 180) / Math.PI;
  return Number(Math.max(36, Math.min(62, vDeg)).toFixed(1));
}

export function calculateRugMeshDimensions(widthCm: number, lengthCm: number): { widthM: number; lengthM: number } {
  const w = widthCm > 0 ? widthCm / 100 : 1.6;
  const l = lengthCm > 0 ? lengthCm / 100 : 2.3;
  return { widthM: Number(w.toFixed(2)), lengthM: Number(l.toFixed(2)) };
}

/**
 * Telefon yönelimini arka kameranın baktığı yöne çevirir.
 * Halı Y=0 zemininde kalır; telefon dönünce halı odada sabit durur.
 * Three.js DeviceOrientationControls ile aynı dönüş: kamera cihazın arkasından bakar.
 */
export function applyRearCameraOrientation(
  camera: THREE.PerspectiveCamera,
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle = 0
): void {
  const deg = THREE.MathUtils.degToRad;
  const euler = new THREE.Euler();
  const q0 = new THREE.Quaternion();
  const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  euler.set(deg(beta), deg(alpha), deg(-gamma), "YXZ");
  camera.quaternion.setFromEuler(euler);
  camera.quaternion.multiply(q1);
  camera.quaternion.multiply(q0.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -deg(screenAngle)));
  camera.updateMatrixWorld(true);
}

/** Test için: arka kameranın dünya uzayındaki bakış yönü. */
export function rearCameraLookDirection(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle = 0
): { x: number; y: number; z: number } {
  const camera = new THREE.PerspectiveCamera();
  applyRearCameraOrientation(camera, alpha, beta, gamma, screenAngle);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  return {
    x: Number(dir.x.toFixed(3)),
    y: Number(dir.y.toFixed(3)),
    z: Number(dir.z.toFixed(3)),
  };
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
    // Yumuşak kontak gölgesi — yerdeki halıyla uyumlu, sert kenar yok
    const gradient = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    gradient.addColorStop(0, "rgba(20, 14, 8, 0.42)");
    gradient.addColorStop(0.45, "rgba(20, 14, 8, 0.22)");
    gradient.addColorStop(0.78, "rgba(20, 14, 8, 0.08)");
    gradient.addColorStop(1, "rgba(20, 14, 8, 0)");

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
  const camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 50);

  const cameraHeight = 1.3;
  camera.position.set(0, cameraHeight, 0);

  const initialRot = calculateCameraRotation(initialPitch, initialRoll);
  camera.rotation.order = "YXZ";
  camera.rotation.x = initialRot.pitchRad;
  camera.rotation.z = initialRot.rollRad;

  // 3. Işıklandırma — oda zeminiyle uyumlu, sert “sticker” hissi yok
  const ambientLight = new THREE.AmbientLight(0xf5f0e8, 0.88);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff4e6, 0.95);
  sunLight.position.set(1.2, 3.6, 0.8);
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xe8eef5, 0.35);
  fillLight.position.set(-1.4, 2.2, -0.6);
  scene.add(fillLight);

  // 4. Halı Geometrisi & Materyali
  let currentDimensions = calculateRugMeshDimensions(widthCm, lengthCm);
  let rugGeometry = new THREE.PlaneGeometry(
    currentDimensions.widthM,
    currentDimensions.lengthM,
    1,
    1
  );
  rugGeometry.rotateX(-Math.PI / 2);

  let rugMaterial: THREE.MeshStandardMaterial;

  if (rugImageUrl) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const rugTexture = textureLoader.load(
      rugImageUrl,
      () => {
        rugTexture.colorSpace = THREE.SRGBColorSpace;
        rugTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        rugTexture.wrapS = THREE.ClampToEdgeWrapping;
        rugTexture.wrapT = THREE.ClampToEdgeWrapping;
        rugTexture.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    rugMaterial = new THREE.MeshStandardMaterial({
      map: rugTexture,
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.DoubleSide,
      // Zemine yapışık hissi; z-fighting yok
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      // Hafif çevresel karışım — fotoğraf gibi uçmaz
      envMapIntensity: 0.15,
    });
  } else {
    rugMaterial = new THREE.MeshStandardMaterial({
      color: 0x965a28,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  // Halı her zaman zemin düzleminde (Y≈0). Havada yükseltilmez.
  const rugGroup = new THREE.Group();
  const RUG_FLOOR_Y = 0.0015;
  rugGroup.position.set(0, RUG_FLOOR_Y, -1.6);
  rugGroup.visible = false;

  const rugMesh = new THREE.Mesh(rugGeometry, rugMaterial);
  rugGroup.add(rugMesh);

  // Kontak gölgesi — yerdeki halıyla yumuşak uyum
  const shadowTexture = createContactShadowTexture();
  let shadowGeometry = new THREE.PlaneGeometry(
    currentDimensions.widthM * 1.08,
    currentDimensions.lengthM * 1.08
  );
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadowMesh.position.y = -0.0008;
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

  // Ayarlama halkası: yere bakılınca yerde yatan bir daire olur, duvara bakınca kaybolur.
  const guide = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.64, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })
  );
  guide.rotation.x = -Math.PI / 2;
  guide.position.set(0, 0.01, -1.2);
  scene.add(guide);

  // Zemin Düzlemi (Raycaster)
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const raycaster = new THREE.Raycaster();

  function placeRugOnFloor(ndcX: number, ndcY: number): boolean {
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(floorPlane, intersection);
    if (!hit) return false;

    const dist = Math.hypot(
      intersection.x - camera.position.x,
      intersection.z - camera.position.z
    );
    // Çok yakın veya ufka yakın vuruş halıyı havada gibi gösterir.
    if (dist < 0.35 || dist > 5.5) return false;

    rugGroup.position.set(intersection.x, RUG_FLOOR_Y, intersection.z);
    return true;
  }

  function commitFloorPlacement(): boolean {
    rugGroup.scale.set(1, 1, 1);
    rugGroup.visible = true;
    guide.visible = false;
    return true;
  }

  // 5. Kontrolcü Metotları
  return {
    updateOrientation(pitchDeg: number, rollDeg: number) {
      const rot = calculateCameraRotation(pitchDeg, rollDeg);
      camera.rotation.order = "YXZ";
      camera.rotation.x = rot.pitchRad;
      camera.rotation.z = rot.rollRad;
      camera.rotation.y = 0;
      camera.updateMatrixWorld(true);
    },

    updateDeviceOrientation(alpha: number, beta: number, gamma: number, screenAngle = 0) {
      applyRearCameraOrientation(camera, alpha, beta, gamma, screenAngle);
    },

    updateFloorGuide() {
      camera.updateMatrixWorld(true);
      raycaster.setFromCamera(new THREE.Vector2(0, -0.2), camera);
      const intersection = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(floorPlane, intersection);
      if (!hit) {
        guide.visible = false;
        return false;
      }
      const dist = Math.hypot(
        intersection.x - camera.position.x,
        intersection.z - camera.position.z
      );
      if (dist < 0.45 || dist > 3.2) {
        guide.visible = false;
        return false;
      }
      guide.visible = true;
      guide.position.set(intersection.x, 0.01, intersection.z);
      return true;
    },

    setRugVisible(visible: boolean) {
      rugGroup.visible = visible;
    },

    setGuideVisible(visible: boolean) {
      guide.visible = visible;
    },

    setVerticalFov(fovDeg: number) {
      camera.fov = Math.max(36, Math.min(62, fovDeg));
      camera.updateProjectionMatrix();
    },

    placeUnderCrosshair() {
      const placed = placeRugOnFloor(0, -0.2);
      if (!placed) return false;
      return commitFloorPlacement();
    },

    autoPlaceOnFloor() {
      // Önce bakış noktasını dene; olmazsa ekranın alt-orta bölgesini tara.
      const probes: Array<[number, number]> = [
        [0, -0.2],
        [0, -0.35],
        [0, -0.5],
        [-0.15, -0.25],
        [0.15, -0.25],
      ];
      for (const [x, y] of probes) {
        if (placeRugOnFloor(x, y)) return commitFloorPlacement();
      }
      // Son çare: kameranın önünde sabit zemin mesafesi (gerçek cm ölçü, scale=1).
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      const dist = 1.55;
      rugGroup.position.set(
        camera.position.x + forward.x * dist,
        RUG_FLOOR_Y,
        camera.position.z + forward.z * dist
      );
      return commitFloorPlacement();
    },

    setRugPositionFromScreen(clientX: number, clientY: number, screenW: number, screenH: number): boolean {
      if (screenW <= 0 || screenH <= 0) return false;
      const ndcX = (clientX / screenW) * 2 - 1;
      const ndcY = -(clientY / screenH) * 2 + 1;
      return placeRugOnFloor(ndcX, ndcY);
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
      guide.geometry.dispose();
      (guide.material as THREE.Material).dispose();
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
