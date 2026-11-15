import { NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

/** Acil şifre set — sadece Vercel env PASSWORD_BOOTSTRAP_KEY ile. */
const schema = z.object({
  email: z.string().email().max(254),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
  bootstrapKey: z.string().min(16).max(200),
});

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(`set-pass:${clientIp(request)}`, 3, 10 * 60 * 1000);
    const expected = process.env.PASSWORD_BOOTSTRAP_KEY || "";
    if (!expected || expected.length < 16) {
      throw new HttpError("FORBIDDEN", "Sifre bootstrap kapali.");
    }

    const { email, newPassword, bootstrapKey } = await parseJsonBody(request, schema);
    if (bootstrapKey !== expected) {
      throw new HttpError("UNAUTHORIZED", "Gecersiz bootstrap anahtari.");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new HttpError("NOT_FOUND", "Kullanici bulunamadi.");
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return apiOk({
      ok: true,
      email: user.email,
      message: "Sifre guncellendi. Bootstrap anahtarini Vercel env'den silin.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
