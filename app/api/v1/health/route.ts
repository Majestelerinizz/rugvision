import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "rugvision-api",
      version: "v1",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
