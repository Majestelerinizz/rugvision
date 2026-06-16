import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const safeFileName = path.basename(filename);

  const file = await storage.readModel(safeFileName);
  if (!file) {
    return NextResponse.json(
      { error: "USDZ dosyasi bulunamadi." },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "model/vnd.usdz+zip",
      "Content-Disposition": `inline; filename="${safeFileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
