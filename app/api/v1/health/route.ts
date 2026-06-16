import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // DB readiness kontrolu: prisma'yi dinamik import ederiz; boylece DATABASE_URL
  // tanimsizsa bile health endpoint'i (liveness) cokmez.
  let db: "up" | "down" = "down";
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }

  return NextResponse.json(
    {
      status: db === "up" ? "ok" : "degraded",
      service: "rugvision-api",
      version: "v1",
      db,
      timestamp: new Date().toISOString(),
    },
    { status: db === "up" ? 200 : 503 }
  );
}
