import { HttpError } from "./errors";

// Basit, bellek-ici sabit pencere rate limiter.
// NOT: Tek surec icin uygundur (lokal/tek instance). Production'da cok instance
// kullanilirsa Redis/Upstash gibi paylasimli bir store'a tasinmalidir.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 50_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    // Sinirsiz buyumeyi onlemek icin kaba temizlik.
    if (buckets.size > MAX_TRACKED_KEYS) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
    }
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfterSec: 0 };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

// Limit asilirsa standart RATE_LIMITED hatasi firlatir.
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): void {
  const result = rateLimit(key, limit, windowMs);
  if (!result.ok) {
    throw new HttpError(
      "RATE_LIMITED",
      `Cok fazla istek. Lutfen ${result.retryAfterSec} sn sonra tekrar deneyin.`
    );
  }
}
