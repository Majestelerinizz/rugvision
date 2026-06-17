// model-viewer ayni origin'den GLB ister (R2 cross-origin CORS sorununu onler).
export function buildViewerGlbSrc(modelUrl: string) {
  const lower = modelUrl.toLowerCase();
  if (!lower.endsWith(".glb")) return modelUrl;

  const fileName = modelUrl.split("/").pop();
  if (!fileName) return modelUrl;

  if (modelUrl.startsWith("/models/") || modelUrl.includes("r2.dev/")) {
    return `/api/v1/ar/glb/${fileName}`;
  }

  return modelUrl;
}

export function buildIosSrc(modelUrl: string) {
  const lower = modelUrl.toLowerCase();
  if (!lower.endsWith(".glb")) return undefined;

  if (modelUrl.startsWith("/models/")) {
    const fileName = modelUrl.split("/").pop();
    if (!fileName) return undefined;
    return `/api/v1/ar/usdz/${fileName.replace(/\.glb$/i, ".usdz")}`;
  }

  return modelUrl.replace(/\.glb$/i, ".usdz");
}
