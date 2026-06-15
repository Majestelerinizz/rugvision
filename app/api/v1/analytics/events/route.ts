import { NextRequest } from "next/server";
import { AnalyticsEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";

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
      {
        error: "Gecersiz eventType.",
        allowed: Array.from(VALID_EVENTS),
      },
      { status: 400 }
    );
  }

  try {
    const event = await prisma.analyticsEvent.create({
      data: {
        merchantId,
        rugId: rugId ?? null,
        eventType: eventType as AnalyticsEventType,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
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
