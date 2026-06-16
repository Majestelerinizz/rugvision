import { NextRequest } from "next/server";

// Reverse-proxy (Vercel/Nginx) arkasinda gercek istemci IP'sini cozer.
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Istegin Origin/Referer host'unu (varsa) dondurur. CORS dogrulamasi icin.
export function requestOriginHost(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  const source = origin || request.headers.get("referer");
  if (!source) return null;
  try {
    return new URL(source).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}
