import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signToken, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const parse = refreshSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Gecersiz body", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const payload = await verifyToken(parse.data.refreshToken);
    if (payload.type !== "refresh") {
      return NextResponse.json({ error: "Token tipi gecersiz." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 401 });
    }

    const accessToken = await signToken({
      sub: user.id,
      role: user.role,
      merchantId: user.merchantId ?? undefined,
      type: "access",
    });

    return NextResponse.json({ tokens: { accessToken } }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Refresh token gecersiz." }, { status: 401 });
  }
}
