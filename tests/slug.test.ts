import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../lib/slug";

test("slugify: bosluk ve buyuk harfleri normalize eder", () => {
  assert.equal(slugify("Demo Magaza"), "demo-magaza");
  assert.equal(slugify("  Cift   Bosluk  "), "cift-bosluk");
});

test("slugify: Turkce karakterleri ASCII'ye dusurur", () => {
  assert.equal(slugify("Mağaza Şirket"), "magaza-sirket");
});

test("slugify: gecersiz karakterleri temizler ve bas/son tireyi atar", () => {
  assert.equal(slugify("--A!@#B--"), "ab");
});
