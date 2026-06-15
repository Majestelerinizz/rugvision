import { NextRequest } from "next/server";
import { AnalyticsEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const requested =
      request.nextUrl.searchParams.get("merchantId") ?? undefined;
    const merchantId = resolveMerchantId(ctx, requested);

    const [byType, totalEvents, totalRugs, topRugs] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        where: { merchantId },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.count({ where: { merchantId } }),
      prisma.rug.count({ where: { merchantId } }),
      prisma.analyticsEvent.groupBy({
        by: ["rugId"],
        where: { merchantId, eventType: AnalyticsEventType.AR_STARTED },
        _count: { _all: true },
        orderBy: { _count: { rugId: "desc" } },
        take: 5,
      }),
    ]);

    const counts: Record<string, number> = {};
    for (const type of Object.values(AnalyticsEventType)) {
      counts[type] = 0;
    }
    for (const row of byType) {
      counts[row.eventType] = row._count._all;
    }

    const rugIds = topRugs
      .map((r) => r.rugId)
      .filter((id): id is string => Boolean(id));
    const rugs = rugIds.length
      ? await prisma.rug.findMany({
          where: { id: { in: rugIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const rugMap = new Map(rugs.map((r) => [r.id, r]));

    return apiOk({
      merchantId,
      totals: {
        events: totalEvents,
        rugs: totalRugs,
        widgetOpened: counts[AnalyticsEventType.WIDGET_OPENED],
        arStarted: counts[AnalyticsEventType.AR_STARTED],
        view3d: counts[AnalyticsEventType.VIEW_3D],
        productViewed: counts[AnalyticsEventType.PRODUCT_VIEWED],
      },
      eventsByType: counts,
      topRugsByAr: topRugs
        .filter((r) => r.rugId)
        .map((r) => ({
          rugId: r.rugId,
          name: rugMap.get(r.rugId as string)?.name ?? null,
          sku: rugMap.get(r.rugId as string)?.sku ?? null,
          arStarted: r._count._all,
        })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
