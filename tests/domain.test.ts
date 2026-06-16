import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHost, isPublicHost } from "../lib/domain";

test("normalizeHost: protokol, path ve www temizlenir", () => {
  assert.equal(normalizeHost("https://www.Example.com/urun/1"), "example.com");
  assert.equal(normalizeHost("HTTP://Example.COM"), "example.com");
  assert.equal(normalizeHost("  example.com  "), "example.com");
});

test("isPublicHost: gecerli herkese acik alan adlari kabul edilir", () => {
  assert.equal(isPublicHost("example.com"), true);
  assert.equal(isPublicHost("shop.tarzhaliconcept.com"), true);
});

test("isPublicHost: SSRF hedefleri reddedilir", () => {
  assert.equal(isPublicHost("localhost"), false);
  assert.equal(isPublicHost("foo.local"), false);
  assert.equal(isPublicHost("nodot"), false);
  assert.equal(isPublicHost("127.0.0.1"), false);
  assert.equal(isPublicHost("10.1.2.3"), false);
  assert.equal(isPublicHost("192.168.1.1"), false);
  assert.equal(isPublicHost("172.16.0.1"), false);
  assert.equal(isPublicHost("169.254.169.254"), false); // cloud metadata
  assert.equal(isPublicHost("::1"), false);
});

test("isPublicHost: herkese acik IPv4 kabul edilir", () => {
  assert.equal(isPublicHost("8.8.8.8"), true);
});
