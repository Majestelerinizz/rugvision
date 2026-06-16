import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { toErrorResponse } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data", "rugs-batch.csv");
const MODELS = path.join(ROOT, "public", "models");
const R2_BASE =
  process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ||
  "https://pub-692fed61add14fdca565fa5967c47df1.r2.dev";

function parseCsv() {
  const text = fs.readFileSync(MANIFEST, "utf8");
  return text
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [sku, , width_cm, length_cm, name] = line.split(",").map((c) => c.trim());
      return { sku, width_cm, length_cm, name };
    });
}

function existsSize(p: string) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const format = request.nextUrl.searchParams.get("format") || "json";

    const rows = parseCsv().map((r) => {
      const glbBytes = existsSize(path.join(MODELS, `${r.sku}.glb`));
      const usdzBytes = existsSize(path.join(MODELS, `${r.sku}.usdz`));
      const ok = glbBytes > 0 && usdzBytes > 0;
      return {
        ...r,
        glbBytes,
        usdzBytes,
        glbUrl: `${R2_BASE}/models/${r.sku}.glb`,
        iphone12: ok ? "PASS" : "FAIL",
        arStatus: ok ? "READY" : "BLOCKED",
      };
    });

    if (format === "csv") {
      const header = "sku,name,width_cm,length_cm,glb_bytes,usdz_bytes,iphone12,ar_status,glb_url";
      const body = rows
        .map((r) =>
          [
            r.sku,
            `"${(r.name || "").replace(/"/g, '""')}"`,
            r.width_cm,
            r.length_cm,
            r.glbBytes,
            r.usdzBytes,
            r.iphone12,
            r.arStatus,
            r.glbUrl,
          ].join(",")
        )
        .join("\n");
      return new NextResponse(`${header}\n${body}\n`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="ar-acceptance-pilot-10.csv"',
        },
      });
    }

    return NextResponse.json({
      data: {
        generatedAt: new Date().toISOString(),
        passCount: rows.filter((r) => r.iphone12 === "PASS").length,
        total: rows.length,
        items: rows,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
