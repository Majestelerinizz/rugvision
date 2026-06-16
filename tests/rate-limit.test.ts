import test from "node:test";
import assert from "node:assert/strict";
import { rateLimit, enforceRateLimit } from "../lib/rate-limit";
import { HttpError } from "../lib/errors";

test("rateLimit: limit asilinca ok=false doner", () => {
  const key = `t-${Math.random()}`;
  assert.equal(rateLimit(key, 3, 60_000).ok, true);
  assert.equal(rateLimit(key, 3, 60_000).ok, true);
  assert.equal(rateLimit(key, 3, 60_000).ok, true);
  assert.equal(rateLimit(key, 3, 60_000).ok, false);
});

test("rateLimit: ayri keyler birbirini etkilemez", () => {
  const a = `a-${Math.random()}`;
  const b = `b-${Math.random()}`;
  assert.equal(rateLimit(a, 1, 60_000).ok, true);
  assert.equal(rateLimit(a, 1, 60_000).ok, false);
  assert.equal(rateLimit(b, 1, 60_000).ok, true);
});

test("enforceRateLimit: limit asilinca RATE_LIMITED firlatir", () => {
  const key = `e-${Math.random()}`;
  enforceRateLimit(key, 1, 60_000);
  assert.throws(
    () => enforceRateLimit(key, 1, 60_000),
    (err: unknown) => err instanceof HttpError && err.code === "RATE_LIMITED"
  );
});
