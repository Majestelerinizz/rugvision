import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { hashPassword, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().min(2),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  const parse = registerSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Gecersiz body", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, fullName, companyName } = parse.data;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayitli." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const baseSlug = slugify(companyName);
  const merchantSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

  const result = await prisma.$transaction(async (tx) => {
    const merchant = await tx.merchant.create({
      data: {
        name: companyName,
        slug: merchantSlug,
        subscription: {
          create: {
            plan: "STARTER",
            status: "TRIALING",
            productLimit: 50,
            priceMonthly: 999,
            currentStart: new Date(),
            currentEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
        widgetSettings: {
          create: {},
        },
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: UserRole.MERCHANT,
        merchantId: merchant.id,
      },
    });

    return { merchant, user };
  });

  const accessToken = await signToken({
    sub: result.user.id,
    role: result.user.role,
    merchantId: result.user.merchantId ?? undefined,
    type: "access",
  });

  const refreshToken = await signToken({
    sub: result.user.id,
    role: result.user.role,
    merchantId: result.user.merchantId ?? undefined,
    type: "refresh",
  });

  return NextResponse.json(
    {
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          merchantId: result.user.merchantId,
        },
        merchant: {
          id: result.merchant.id,
          name: result.merchant.name,
          slug: result.merchant.slug,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
    { status: 201 }
  );
}
