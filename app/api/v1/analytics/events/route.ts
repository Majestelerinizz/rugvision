import { NextRequest } from "next/server";
import { AnalyticsEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

const VALID_EVENTS = new Set<string>(Object.values(AnalyticsEventType));

type EventBody = {
  merchantId?: string;
  rugId?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
};

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: NextRequest) {
  // Public (widget) endpoint oldugu icin IP basina sert sinirlama uygulariz.
  const limit = rateLimit(`analytics:${clientIp(request)}`, 120, 60 * 1000);
  if (!limit.ok) {
    return withCors({ error: "Cok fazla istek." }, { status: 429 });
  }

  let body: EventBody;
  try {
    body = (await request.json()) as EventBody;
  } catch {
    return withCors({ error: "Gecersiz JSON govdesi." }, { status: 400 });
  }

  const { merchantId, rugId, eventType, metadata } = body;

  if (!merchantId) {
    return withCors({ error: "merchantId zorunludur." }, { status: 400 });
  }
  if (!eventType || !VALID_EVENTS.has(eventType)) {
    return withCors(
      { error: "Gecersiz eventType.", allowed: Array.from(VALID_EVENTS) },
      { status: 400 }
    );
  }

  // metadata'yi makul bir boyutla sinirla (kotuye kullanim/sismeyi onle).
  let safeMetadata: Prisma.InputJsonValue | undefined;
  if (metadata !== undefined && metadata !== null) {
    try {
      const serialized = JSON.stringify(metadata);
      if (serialized.length > 4000) {
        return withCors({ error: "metadata cok buyuk." }, { status: 422 });
      }
      safeMetadata = metadata as Prisma.InputJsonValue;
    } catch {
      return withCors({ error: "metadata gecersiz." }, { status: 422 });
    }
  }

  try {
    // Sahtecilik korumasi: rugId verildiyse, gercekten bu merchant'a ait olmali.
    if (rugId) {
      const owned = await prisma.rug.findFirst({
        where: { id: rugId, merchantId },
        select: { id: true },
      });
      if (!owned) {
        return withCors(
          { error: "rugId bu merchant'a ait degil." },
          { status: 422 }
        );
      }
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        merchantId,
        rugId: rugId ?? null,
        eventType: eventType as AnalyticsEventType,
        metadata: safeMetadata,
      },
      select: { id: true, eventType: true, occurredAt: true },
    });

    return withCors({ data: event }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return withCors(
        { error: "Gecersiz merchantId veya rugId." },
        { status: 422 }
      );
    }
    return withCors({ error: "Event kaydedilemedi." }, { status: 500 });
  }
}
