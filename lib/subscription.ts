import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { HttpError } from "./errors";

export const PLAN_CONFIG: Record<
  SubscriptionPlan,
  { productLimit: number; priceMonthly: number; label: string }
> = {
  STARTER: { productLimit: 50, priceMonthly: 999, label: "Starter" },
  PRO: { productLimit: 200, priceMonthly: 2999, label: "Pro" },
  ENTERPRISE: { productLimit: 10_000, priceMonthly: 9999, label: "Enterprise" },
};

const TERMINATED = new Set<SubscriptionStatus>(["CANCELED", "PAST_DUE"]);

export type SubscriptionSnapshot = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  productLimit: number;
  priceMonthly: number;
  currentStart: Date;
  currentEnd: Date;
  rugCount: number;
  usagePercent: number;
  trialDaysLeft: number | null;
  isTrialExpired: boolean;
  canAddRug: boolean;
};

export function isTrialExpired(
  status: SubscriptionStatus,
  currentEnd: Date,
  now = new Date()
): boolean {
  return status === "TRIALING" && currentEnd.getTime() < now.getTime();
}

export function buildSubscriptionSnapshot(
  sub: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    productLimit: number;
    priceMonthly: number;
    currentStart: Date;
    currentEnd: Date;
  },
  rugCount: number,
  now = new Date()
): SubscriptionSnapshot {
  const trialExpired = isTrialExpired(sub.status, sub.currentEnd, now);
  const effectiveStatus = trialExpired ? "PAST_DUE" : sub.status;
  const limit = sub.productLimit;
  const usagePercent =
    limit > 0 ? Math.min(100, Math.round((rugCount / limit) * 100)) : 0;
  const trialDaysLeft =
    sub.status === "TRIALING" && !trialExpired
      ? Math.max(
          0,
          Math.ceil(
            (sub.currentEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          )
        )
      : null;

  const canAddRug =
    !TERMINATED.has(effectiveStatus) &&
    !trialExpired &&
    rugCount < limit;

  return {
    plan: sub.plan,
    status: effectiveStatus,
    productLimit: limit,
    priceMonthly: sub.priceMonthly,
    currentStart: sub.currentStart,
    currentEnd: sub.currentEnd,
    rugCount,
    usagePercent,
    trialDaysLeft,
    isTrialExpired: trialExpired,
    canAddRug,
  };
}

export function assertCanCreateRug(snapshot: SubscriptionSnapshot): void {
  if (TERMINATED.has(snapshot.status)) {
    throw new HttpError(
      "FORBIDDEN",
      "Aboneliginiz aktif degil. Lutfen planinizi yenileyin."
    );
  }
  if (snapshot.isTrialExpired) {
    throw new HttpError(
      "FORBIDDEN",
      "Deneme suresi doldu. Devam etmek icin planinizi aktiflestirin."
    );
  }
  if (snapshot.rugCount >= snapshot.productLimit) {
    throw new HttpError(
      "FORBIDDEN",
      `Plan limitinize ulastiniz (${snapshot.productLimit} urun). Daha fazlasi icin planinizi yukseltin.`
    );
  }
}
