import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "up" | "down" = "down";
  let migrationStatus = "not-needed";
  let migrationError = null;

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    db = "up";

    // Self-healing migration for new columns
    try {
      const columns: any[] = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='rugs' AND column_name='modelGlbUrl'
      `;

      if (columns.length === 0) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE rugs ADD COLUMN IF NOT EXISTS "modelGlbUrl" text;
          ALTER TABLE rugs ADD COLUMN IF NOT EXISTS "modelUsdzUrl" text;
          ALTER TABLE rugs ADD COLUMN IF NOT EXISTS "modelPosterUrl" text;
          ALTER TABLE rugs ADD COLUMN IF NOT EXISTS "thicknessMm" integer;
          ALTER TABLE rugs ADD COLUMN IF NOT EXISTS "hasARModel" boolean DEFAULT false;
        `);
        migrationStatus = "applied";
      } else {
        migrationStatus = "already-exists";
      }
    } catch (migErr: any) {
      migrationStatus = "failed";
      migrationError = migErr.message || migErr;
    }
  } catch (err: any) {
    db = "down";
    migrationError = err.message || err;
  }

  return NextResponse.json(
    {
      status: db === "up" ? "ok" : "degraded",
      service: "rugvision-api",
      version: "v1",
      db,
      migration: {
        status: migrationStatus,
        error: migrationError,
      },
      timestamp: new Date().toISOString(),
    },
    { status: db === "up" ? 200 : 503 }
  );
}
