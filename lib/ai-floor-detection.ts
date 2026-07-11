type Point = { x: number; y: number };
type Quad = [Point, Point, Point, Point];

/**
 * AI perspektif zemin algılama motoru (Sobel + Hough Transform + Vanishing Point).
 * Odanın perspektif açılarını analiz edip zemin düzlemini otomatik tespit eder.
 */
export function detectFloorPerspective(
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  aspectRatio: number
): Quad {
  // Varsayılan fallback quad (AI başarısız olursa kullanılacak güvenli zemin açısı)
  const defaultQuad = (): Quad => {
    const rugW = Math.round(canvasW * 0.55);
    const rugH = Math.round(rugW / aspectRatio);
    const cx = Math.round(canvasW / 2);
    const cy = Math.round(canvasH * 0.65);
    const hw = Math.round(rugW / 2);
    const hh = Math.round(rugH / 2);
    const skew = Math.round(rugW * 0.08);

    return [
      { x: cx - hw + skew, y: cy - hh },
      { x: cx + hw - skew, y: cy - hh },
      { x: cx + hw + skew, y: cy + hh },
      { x: cx - hw - skew, y: cy + hh },
    ];
  };

  try {
    // 1. Resmi analiz etmek için geçici küçük bir offscreen canvas oluşturalım (Hız için 160x120 piksel yeterli)
    const analysisW = 160;
    const analysisH = 120;
    const canvas = document.createElement("canvas");
    canvas.width = analysisW;
    canvas.height = analysisH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return defaultQuad();

    ctx.drawImage(img, 0, 0, analysisW, analysisH);
    const imgData = ctx.getImageData(0, 0, analysisW, analysisH);
    const data = imgData.data;

    // 2. Grayscale & Sobel Edge Detection
    const gray = new Float32Array(analysisW * analysisH);
    const edges = new Uint8Array(analysisW * analysisH);

    // Grayscale dönüştür
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Sobel filtresi uygula
    const threshold = 40;
    for (let y = 1; y < analysisH - 1; y++) {
      for (let x = 1; x < analysisW - 1; x++) {
        const idx = y * analysisW + x;

        // Yatay gradyan
        const gx =
          -1 * gray[idx - analysisW - 1] + 1 * gray[idx - analysisW + 1] +
          -2 * gray[idx - 1] + 2 * gray[idx + 1] +
          -1 * gray[idx + analysisW - 1] + 1 * gray[idx + analysisW + 1];

        // Dikey gradyan
        const gy =
          -1 * gray[idx - analysisW - 1] - 2 * gray[idx - analysisW] - 1 * gray[idx - analysisW + 1] +
          1 * gray[idx + analysisW - 1] + 2 * gray[idx + analysisW] + 1 * gray[idx + analysisW + 1];

        const mag = Math.sqrt(gx * gx + gy * gy);
        edges[idx] = mag > threshold ? 255 : 0;
      }
    }

    // 3. Hough Line Transform (Basitleştirilmiş)
    // Perspektif belirten diagonal çizgileri (duvar-zemin birleşimi, halı kenarları, parke derzleri) yakalayalım
    const rhoMax = Math.ceil(Math.sqrt(analysisW * analysisW + analysisH * analysisH));
    const thetaBins = 90; // 0-180 derece arası, her 2 derece bir bin
    const accumulator = new Uint32Array(thetaBins * rhoMax * 2);

    // Derece-Radyan dönüşüm tablosunu önbelleğe al
    const cosTable = new Float32Array(thetaBins);
    const sinTable = new Float32Array(thetaBins);
    for (let theta = 0; theta < thetaBins; theta++) {
      const rad = (theta * 2 * Math.PI) / 180;
      cosTable[theta] = Math.cos(rad);
      sinTable[theta] = Math.sin(rad);
    }

    // Hough uzayını doldur
    for (let y = 10; y < analysisH - 5; y++) { // En alt ve en üst kenarları kırp
      for (let x = 5; x < analysisW - 5; x++) {
        if (edges[y * analysisW + x] === 0) continue;

        for (let thetaIdx = 0; thetaIdx < thetaBins; thetaIdx++) {
          // Çok yatay veya dikey çizgileri filtrele (bize zemin derinliğini veren diagonal çizgiler lazım)
          // 15° - 75° veya 105° - 165° arası diagonaldir
          const deg = thetaIdx * 2;
          if ((deg > 75 && deg < 105) || deg < 15 || deg > 165) continue;

          const rho = Math.round(x * cosTable[thetaIdx] + y * sinTable[thetaIdx]);
          const rhoIdx = rho + rhoMax;
          accumulator[thetaIdx * rhoMax * 2 + rhoIdx]++;
        }
      }
    }

    // En güçlü çizgileri (peaks) bul
    type Line = { theta: number; rho: number; score: number };
    const lines: Line[] = [];
    const minVotes = 15;

    for (let thetaIdx = 0; thetaIdx < thetaBins; thetaIdx++) {
      for (let rhoIdx = 0; rhoIdx < rhoMax * 2; rhoIdx++) {
        const votes = accumulator[thetaIdx * rhoMax * 2 + rhoIdx];
        if (votes >= minVotes) {
          lines.push({
            theta: (thetaIdx * 2 * Math.PI) / 180,
            rho: rhoIdx - rhoMax,
            score: votes
          });
        }
      }
    }

    // Skorlarına göre sırala ve en güçlü ilk 12 çizgiyi al
    lines.sort((a, b) => b.score - a.score);
    const activeLines = lines.slice(0, 12);

    if (activeLines.length < 2) {
      return defaultQuad(); // Yeterli çizgi bulunamazsa varsayılana dön
    }

    // 4. Kaçış Noktası (Vanishing Point) Bulma
    // Tespit edilen çizgilerin çiftler halinde kesişimlerini hesaplayıp ortak yoğunluğu bulalım
    const intersections: Point[] = [];
    for (let i = 0; i < activeLines.length; i++) {
      for (let j = i + 1; j < activeLines.length; j++) {
        const l1 = activeLines[i];
        const l2 = activeLines[j];

        const denom = Math.sin(l1.theta - l2.theta);
        if (Math.abs(denom) < 0.1) continue; // Neredeyse paralel çizgiler kesişmez

        const x = (l2.rho * Math.sin(l1.theta) - l1.rho * Math.sin(l2.theta)) / denom;
        const y = (l1.rho * Math.cos(l2.theta) - l2.rho * Math.cos(l1.theta)) / denom;

        // Kaçış noktası makul bir alanda olmalı (ekranın üst yarısı civarı veya üst dışı)
        if (y < analysisH * 0.7) {
          intersections.push({ x, y });
        }
      }
    }

    if (intersections.length === 0) {
      return defaultQuad();
    }

    // En yoğun kesişim kümesini bulalım (k-means / outlier filtresi)
    let avgX = 0;
    let avgY = 0;
    let validCount = 0;

    intersections.forEach(pt => {
      avgX += pt.x;
      avgY += pt.y;
      validCount++;
    });

    avgX /= validCount;
    avgY /= validCount;

    // Gerçek ölçekteki koordinatlara dönüştür
    const vpX = (avgX / analysisW) * canvasW;
    const vpY = (avgY / analysisH) * canvasH;

    // 5. Kaçış Noktasına Göre Otomatik Perspektif Quad Hesabı
    // Halının ufuk çizgisine (Kaçış noktasına) uzanan açıda olmasını sağlar.
    const cx = canvasW / 2;
    const cy = canvasH * 0.65; // Zeminin başlangıç yüksekliği

    // Halı en/boy oranı
    const rugW = canvasW * 0.52;
    const rugH = rugW / aspectRatio;

    // Kaçış noktasından uzaklaştıkça yayılan açıları hesapla
    const dxLeft = (cx - rugW * 0.5) - vpX;
    const dxRight = (cx + rugW * 0.5) - vpX;
    const dy = cy - vpY;

    // Perspektif çarpanları
    const depthFactor = 0.55;
    const frontY = cy + rugH * (1 - depthFactor);
    const backY = cy - rugH * depthFactor;

    const scaleBack = (backY - vpY) / dy;
    const scaleFront = (frontY - vpY) / dy;

    const tlX = vpX + dxLeft * scaleBack;
    const trX = vpX + dxRight * scaleBack;
    const brX = vpX + dxRight * scaleFront;
    const blX = vpX + dxLeft * scaleFront;

    // Sınır koruması (ekran dışına kontrolsüz taşmayı önle)
    const limit = (val: number, max: number) => Math.max(5, Math.min(max - 5, val));

    const quad: Quad = [
      { x: limit(tlX, canvasW), y: limit(backY, canvasH) },  // Sol-Üst
      { x: limit(trX, canvasW), y: limit(backY, canvasH) },  // Sağ-Üst
      { x: limit(brX, canvasW), y: limit(frontY, canvasH) }, // Sağ-Alt
      { x: limit(blX, canvasW), y: limit(frontY, canvasH) }, // Sol-Alt
    ];

    return quad;
  } catch (err) {
    console.warn("[AI Floor Detection] Auto perspective failed, using default fallback.", err);
    return defaultQuad();
  }
}
