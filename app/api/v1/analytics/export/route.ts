import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const merchantId = resolveMerchantId(
      ctx,
      request.nextUrl.searchParams.get("merchantId") ?? undefined
    );

    const events = await prisma.analyticsEvent.findMany({
      where: { merchantId },
      include: {
        rug: { select: { sku: true, name: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: 5000,
    });

    const header = "occurredAt,eventType,sku,rugName,rugId";
    const rows = events.map((e) => {
      const cols = [
        e.occurredAt.toISOString(),
        e.eventType,
        e.rug?.sku ?? "",
        (e.rug?.name ?? "").replace(/"/g, '""'),
        e.rugId ?? "",
      ];
      return cols.map((c) => `"${c}"`).join(",");
    });

    const csv = [header, ...rows].join("\n");
    const filename = `rugvision-analytics-${merchantId.slice(0, 8)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
