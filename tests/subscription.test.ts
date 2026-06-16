import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSubscriptionSnapshot,
  assertCanCreateRug,
  isTrialExpired,
  PLAN_CONFIG,
} from "../lib/subscription";
import { HttpError } from "../lib/errors";

describe("subscription", () => {
  const base = {
    plan: "STARTER" as const,
    status: "ACTIVE" as const,
    productLimit: 50,
    priceMonthly: 999,
    currentStart: new Date("2026-01-01"),
    currentEnd: new Date("2026-12-31"),
  };

  it("PLAN_CONFIG has limits for all tiers", () => {
    assert.equal(PLAN_CONFIG.STARTER.productLimit, 50);
    assert.equal(PLAN_CONFIG.PRO.productLimit, 200);
    assert.equal(PLAN_CONFIG.ENTERPRISE.productLimit, 10_000);
  });

  it("detects expired trial", () => {
    const expired = isTrialExpired(
      "TRIALING",
      new Date("2020-01-01"),
      new Date("2026-06-01")
    );
    assert.equal(expired, true);
  });

  it("blocks create when at limit", () => {
    const snap = buildSubscriptionSnapshot(base, 50);
    assert.throws(() => assertCanCreateRug(snap), HttpError);
  });

  it("allows create under limit", () => {
    const snap = buildSubscriptionSnapshot(base, 10);
    assert.equal(snap.canAddRug, true);
    assert.doesNotThrow(() => assertCanCreateRug(snap));
  });
});
