import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const parse = loginSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Gecersiz body", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Gecersiz kimlik bilgileri." }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Gecersiz kimlik bilgileri." }, { status: 401 });
  }

  const accessToken = await signToken({
    sub: user.id,
    role: user.role,
    merchantId: user.merchantId ?? undefined,
    type: "access",
  });

  const refreshToken = await signToken({
    sub: user.id,
    role: user.role,
    merchantId: user.merchantId ?? undefined,
    type: "refresh",
  });

  return NextResponse.json(
    {
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          merchantId: user.merchantId,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
    { status: 200 }
  );
}
