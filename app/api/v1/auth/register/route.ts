import { NextRequest } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { hashPassword, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { slugify } from "@/lib/slug";

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(8, "Sifre en az 8 karakter olmalidir.")
    .max(100)
    .regex(/[A-Za-z]/, "Sifre en az bir harf icermelidir.")
    .regex(/[0-9]/, "Sifre en az bir rakam icermelidir."),
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(120),
});

export async function POST(request: NextRequest) {
  try {
    // Kayit suistimalini sinirla: IP basina 5 deneme / 10 dk.
    enforceRateLimit(`register:${clientIp(request)}`, 5, 10 * 60 * 1000);

    const { email, password, fullName, companyName } = await parseJsonBody(
      request,
      registerSchema
    );

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError("CONFLICT", "Bu e-posta zaten kayitli.");
    }

    const passwordHash = await hashPassword(password);
    const baseSlug = slugify(companyName) || "magaza";
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
          widgetSettings: { create: {} },
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

    const tokenBase = {
      sub: result.user.id,
      role: result.user.role,
      merchantId: result.user.merchantId ?? undefined,
    };
    const accessToken = await signToken({ ...tokenBase, type: "access" });
    const refreshToken = await signToken({ ...tokenBase, type: "refresh" });

    return apiOk(
      {
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
        tokens: { accessToken, refreshToken },
      },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return toErrorResponse(
        new HttpError("CONFLICT", "Bu e-posta zaten kayitli.")
      );
    }
    return toErrorResponse(error);
  }
}
