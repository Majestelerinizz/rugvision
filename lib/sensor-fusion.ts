/**
 * Sensör Füzyonu Motoru (Kamera + Jiroskop / İvmeölçer)
 *
 * Telefonun fiziksel yönelim açılarını (pitch/beta, roll/gamma, yaw/alpha) dinler,
 * el titremelerini düşük geçiren filtre (low-pass filter) ile yumuşatır ve
 * halının zemin düzlemine (yerçekimine) göre doğru perspektifte kalmasını sağlar.
 */

export interface RawOrientation {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export interface SmoothOrientation {
  pitch: number;      // Yere bakış eğim açısı (derece, [10, 82])
  roll: number;       // Ufuk çizgisi düzeltmesi (derece, [-45, 45])
  heading: number;    // Pusula/Dönüş açısı (derece, [0, 360))
}

/**
 * iOS 13+ için DeviceOrientation izin talebi.
 * Kullanıcı bir butona tıkladığında çağrılmalıdır.
 */
export async function requestDeviceOrientationPermission(): Promise<boolean> {
  if (
    typeof window !== "undefined" &&
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === "function"
  ) {
    try {
      const response = await (
        DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
      ).requestPermission();
      return response === "granted";
    } catch {
      return false;
    }
  }
  // Android ve diğer tarayıcılarda doğrudan izinlidir.
  return true;
}

/**
 * Telefonun 'beta' (pitch) açısından zemine göre dinamik perspektif açısını hesaplar.
 *
 * Tipik kullanım:
 * - Telefon dik tutulursa (beta ~ 85-90°): Zemin uzaklaşır, derinlik perspektifi artar (~75-80°).
 * - Telefon yere doğru eğilirse (beta ~ 45-55°): Halı daha yatay ve belirgin görünür (~50-55°).
 * - Telefon tamamen yere paralel tutulursa (beta ~ 10-20°): Halı kuşbakışına yaklaşır (~15-20°).
 */
export function calculateFloorPitch(beta: number): number {
  // Beta açısını [15, 85] aralığına sınırla
  // Beta 90 olduğunda dikey duruş, 0 olduğunda düz masa üstü duruşudur.
  const clampedBeta = Math.max(15, Math.min(85, Math.abs(beta)));
  
  // Hafif doğrusal olmayan eğri ile zemin perspektifini daha doğal yap
  const normalized = (clampedBeta - 15) / (85 - 15); // 0 ile 1 arası
  const pitch = 20 + normalized * 58; // 20° ile 78° arası perspektif
  
  return Number(pitch.toFixed(1));
}

/**
 * Telefonun yana yatma 'gamma' (roll) açısından ufuk çizgisi dengelemesi hesaplar.
 * Telefon sağa/sola yatırıldığında halının zeminde düz kalması için ters açı üretilir.
 */
export function calculateFloorRoll(gamma: number): number {
  // Aşırı taklaları filtrele, [-35, 35] derece aralığında sabitle
  const clamped = Math.max(-35, Math.min(35, gamma));
  return Number((-clamped).toFixed(1));
}

/**
 * Düşük geçiren filtre (Low-pass filter):
 * Titremeleri önlemek için yeni sensör değerini önceki değerle ağırlıklı ortalama alır.
 *
 * @param current Önceki yumuşatılmış değer
 * @param target Sensörden gelen anlık ham değer
 * @param factor Yumuşatma katsayısı (0.05 = çok pürüzsüz/ağır, 0.3 = daha hızlı tepki)
 */
export function applyLowPassFilter(
  current: number,
  target: number,
  factor = 0.18
): number {
  return current + (target - current) * factor;
}

/**
 * Halının CSS transform dizesini oluşturur.
 */
export function buildRugCssTransform({
  offsetX,
  offsetY,
  scale,
  pitchDeg,
  rollDeg,
  userRotationDeg = 0,
}: {
  offsetX: number;
  offsetY: number;
  scale: number;
  pitchDeg: number;
  rollDeg: number;
  userRotationDeg?: number;
}): string {
  // Toplam zemin açısı
  const totalRoll = rollDeg + userRotationDeg;
  
  return [
    `translate(calc(-50% + ${Math.round(offsetX)}px), ${Math.round(offsetY)}px)`,
    `scale(${scale.toFixed(2)})`,
    `perspective(750px)`,
    `rotateX(${pitchDeg.toFixed(1)}deg)`,
    `rotateZ(${totalRoll.toFixed(1)}deg)`,
  ].join(" ");
}
