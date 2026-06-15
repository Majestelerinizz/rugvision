import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal by forcing a plain basename.
  const safeFileName = path.basename(filename);
  const filePath = path.join(process.cwd(), "public", "models", safeFileName);

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "model/vnd.usdz+zip",
        "Content-Disposition": `inline; filename="${safeFileName}"`,
        "Cache-Control": "public, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "USDZ dosyasi bulunamadi." }, { status: 404 });
  }
}
