import test from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken } from "../lib/auth";

test("JWT: imzala-dogrula round-trip", async () => {
  process.env.JWT_SECRET = "x".repeat(40);
  const token = await signToken({
    sub: "u1",
    role: "MERCHANT",
    merchantId: "m1",
    type: "access",
  });
  const payload = await verifyToken(token);
  assert.equal(payload.sub, "u1");
  assert.equal(payload.role, "MERCHANT");
  assert.equal(payload.merchantId, "m1");
  assert.equal(payload.type, "access");
});

test("JWT: 32 karakterden kisa secret reddedilir", async () => {
  process.env.JWT_SECRET = "short";
  await assert.rejects(() =>
    signToken({ sub: "u", role: "MERCHANT", type: "access" })
  );
});

test("JWT: yanlis secret ile dogrulama basarisiz olur", async () => {
  process.env.JWT_SECRET = "a".repeat(40);
  const token = await signToken({ sub: "u", role: "MERCHANT", type: "access" });
  process.env.JWT_SECRET = "b".repeat(40);
  await assert.rejects(() => verifyToken(token));
});
