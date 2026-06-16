import { NextResponse } from "next/server";

// Widget runs on merchant domains, so widget-facing endpoints must allow cross-origin access.
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function withCors<T>(data: T, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

// Widget rug verisi nadiren degisir; CDN/edge cache ile TTFB duser.
export function withCorsCached<T>(
  data: T,
  init?: ResponseInit,
  maxAgeSec = 300
) {
  const res = withCors(data, init);
  res.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 2}`
  );
  return res;
}

export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
