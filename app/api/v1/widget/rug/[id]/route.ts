import { NextRequest } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { findWidgetRugById } from "@/lib/widget-rug";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = rateLimit(`widget-rug:${clientIp(request)}`, 240, 60 * 1000);
  if (!limit.ok) {
    return withCors({ error: "Cok fazla istek." }, { status: 429 });
  }

  const { id } = await params;
  const data = await findWidgetRugById(id);

  if (!data) {
    return withCors({ error: "Rug bulunamadi." }, { status: 404 });
  }

  return withCors({ data }, { status: 200 });
}
