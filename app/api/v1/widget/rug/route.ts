import { NextRequest } from "next/server";
import { corsPreflight, withCorsCached } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { findWidgetRugBySku } from "@/lib/widget-rug";

export function OPTIONS() {
  return corsPreflight();
}

// SKU eslemesi ile cozumleme: /api/v1/widget/rug?merchantId=...&sku=...
// (Embed'de data-rug-id yerine data-merchant-id + data-sku kullanildiginda.)
export async function GET(request: NextRequest) {
  const limit = rateLimit(`widget-rug:${clientIp(request)}`, 240, 60 * 1000);
  if (!limit.ok) {
    return withCorsCached(
      { error: "Cok fazla istek." },
      { status: 429 }
    );
  }

  const merchantId = request.nextUrl.searchParams.get("merchantId");
  const sku = request.nextUrl.searchParams.get("sku");

  if (!merchantId || !sku) {
    return withCorsCached(
      { error: "merchantId ve sku query parametreleri zorunludur." },
      { status: 400 }
    );
  }

  const data = await findWidgetRugBySku(merchantId, sku);
  if (!data) {
    return withCorsCached({ error: "Rug bulunamadi." }, { status: 404 });
  }

  return withCorsCached({ data }, { status: 200 });
}
