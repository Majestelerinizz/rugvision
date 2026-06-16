import path from "node:path";
import { NextRequest } from "next/server";
import { apiOk, apiError, toErrorResponse, HttpError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { storage } from "@/lib/storage";

const ALLOWED_EXT = [".glb", ".usdz", ".gltf"];
const MAX_BYTES = 40 * 1024 * 1024; // 40 MB

function slugifyBase(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const form = await request.formData().catch(() => null);
    if (!form) {
      throw new HttpError("BAD_REQUEST", "multipart/form-data govdesi bekleniyor.");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new HttpError("BAD_REQUEST", "`file` alani zorunludur.");
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      throw new HttpError(
        "UNPROCESSABLE",
        "Desteklenmeyen dosya turu. Izinli: " + ALLOWED_EXT.join(", ")
      );
    }
    if (file.size === 0) {
      throw new HttpError("UNPROCESSABLE", "Dosya bos.");
    }
    if (file.size > MAX_BYTES) {
      throw new HttpError("UNPROCESSABLE", "Dosya 40 MB sinirini asiyor.");
    }

    const base = slugifyBase(path.basename(file.name, ext)) || "model";
    const fileName = `${base}-${Date.now()}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType =
      ext === ".glb"
        ? "model/gltf-binary"
        : ext === ".usdz"
        ? "model/vnd.usdz+zip"
        : "model/gltf+json";
    const saved = await storage.saveModel(fileName, buffer, contentType);

    const modelUrl = saved.url;
    // GLB icin iOS Quick Look yolu (USDZ ayni isimle yuklendiyse calisir).
    const iosUrl =
      ext === ".glb"
        ? `/api/v1/ar/usdz/${fileName.replace(/\.glb$/i, ".usdz")}`
        : ext === ".usdz"
        ? `/api/v1/ar/usdz/${fileName}`
        : null;

    return apiOk(
      {
        fileName,
        modelUrl,
        iosUrl,
        sizeBytes: file.size,
      },
      201
    );
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.code, error.message);
    return toErrorResponse(error);
  }
}
