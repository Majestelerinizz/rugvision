import { NextRequest } from "next/server";
import { AnalyticsEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";

function parseDays(raw: string | null): number {
  const n = Number(raw || 30);
  if (!Number.isFinite(n) || n < 1) return 30;
  return Math.min(90, Math.floor(n));
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const params = request.nextUrl.searchParams;
    const merchantId = resolveMerchantId(
      ctx,
      params.get("merchantId") ?? undefined
    );
    const days = parseDays(params.get("days"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
      where: { merchantId, occurredAt: { gte: since } },
      select: { eventType: true, occurredAt: true, rugId: true },
      orderBy: { occurredAt: "asc" },
    });

    const counts: Record<string, number> = {};
    for (const t of Object.values(AnalyticsEventType)) counts[t] = 0;
    for (const e of events) counts[e.eventType]++;

    const daily: Record<string, Record<string, number>> = {};
    for (const e of events) {
      const day = e.occurredAt.toISOString().slice(0, 10);
      if (!daily[day]) {
        daily[day] = {};
        for (const t of Object.values(AnalyticsEventType)) daily[day][t] = 0;
      }
      daily[day][e.eventType]++;
    }

    const widgetOpened = counts[AnalyticsEventType.WIDGET_OPENED] || 0;
    const arStarted = counts[AnalyticsEventType.AR_STARTED] || 0;
    const view3d = counts[AnalyticsEventType.VIEW_3D] || 0;
    const productViewed = counts[AnalyticsEventType.PRODUCT_VIEWED] || 0;

    const arConversion =
      widgetOpened > 0 ? Number(((arStarted / widgetOpened) * 100).toFixed(1)) : 0;
    const viewConversion =
      productViewed > 0 ? Number(((view3d / productViewed) * 100).toFixed(1)) : 0;

    const rugAr: Record<string, number> = {};
    for (const e of events) {
      if (e.eventType !== AnalyticsEventType.AR_STARTED || !e.rugId) continue;
      rugAr[e.rugId] = (rugAr[e.rugId] || 0) + 1;
    }
    const topRugIds = Object.entries(rugAr)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);
    const rugs = topRugIds.length
      ? await prisma.rug.findMany({
          where: { id: { in: topRugIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const rugMap = new Map(rugs.map((r) => [r.id, r]));

    return apiOk({
      merchantId,
      periodDays: days,
      since: since.toISOString(),
      totals: {
        events: events.length,
        widgetOpened,
        arStarted,
        view3d,
        productViewed,
      },
      eventsByType: counts,
      conversion: {
        widgetToArPercent: arConversion,
        productToView3dPercent: viewConversion,
      },
      dailySeries: Object.entries(daily)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, types]) => ({ date, ...types })),
      topRugsByAr: topRugIds.map((id) => ({
        rugId: id,
        sku: rugMap.get(id)?.sku ?? null,
        name: rugMap.get(id)?.name ?? null,
        arStarted: rugAr[id],
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
