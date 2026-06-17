import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { MODEL_OBJECT_CACHE_CONTROL } from "@/lib/cache-tags";

async function loadGlbBytes(safeFileName: string): Promise<Buffer | null> {
  const fromStorage = await storage.readModel(safeFileName);
  if (fromStorage) return fromStorage;

  const publicBase = (
    process.env.R2_PUBLIC_URL ||
    process.env.S3_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");
  if (!publicBase) return null;

  const prefix = (process.env.S3_PREFIX || "models").replace(/\/$/, "");
  const url = `${publicBase}/${prefix}/${safeFileName}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  return Buffer.from(await res.arrayBuffer());
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeFileName = path.basename(filename);

  if (!/\.glb$/i.test(safeFileName)) {
    return NextResponse.json({ error: "Gecersiz GLB dosyasi." }, { status: 400 });
  }

  const file = await loadGlbBytes(safeFileName);
  if (!file) {
    return NextResponse.json({ error: "GLB dosyasi bulunamadi." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Content-Disposition": `inline; filename="${safeFileName}"`,
      "Cache-Control": MODEL_OBJECT_CACHE_CONTROL,
    },
  });
}
