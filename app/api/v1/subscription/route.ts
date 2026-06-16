import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";
import { buildSubscriptionSnapshot, PLAN_CONFIG } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const requested =
      request.nextUrl.searchParams.get("merchantId") ?? undefined;
    const merchantId = resolveMerchantId(ctx, requested);

    const [subscription, rugCount] = await Promise.all([
      prisma.subscription.findUnique({ where: { merchantId } }),
      prisma.rug.count({ where: { merchantId } }),
    ]);

    if (!subscription) {
      return apiOk({
        merchantId,
        hasSubscription: false,
        rugCount,
        plans: PLAN_CONFIG,
        snapshot: null,
      });
    }

    const snapshot = buildSubscriptionSnapshot(subscription, rugCount);

    return apiOk({
      merchantId,
      hasSubscription: true,
      rugCount,
      plans: PLAN_CONFIG,
      snapshot,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
