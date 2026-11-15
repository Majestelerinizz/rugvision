import { NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

/**
 * Acil şifre set.
 * 1) PASSWORD_BOOTSTRAP_KEY env (kalıcı yöntem), veya
 * 2) Kısa süreli tek-email kurtarma (savas@, 2026-11-17’ye kadar)
 */
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

const RECOVERY_UNTIL = Date.parse("2026-11-17T23:59:59Z");
const RECOVERY_EMAIL = "savas@rugvision.com";
const RECOVERY_KEY = "RvSavasReset-2026-11-15-Panel";

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(`set-pass:${clientIp(request)}`, 3, 10 * 60 * 1000);
    const { email, newPassword, bootstrapKey } = await parseJsonBody(request, schema);
    const normalized = email.toLowerCase();

    const envKey = process.env.PASSWORD_BOOTSTRAP_KEY || "";
    const envOk = envKey.length >= 16 && bootstrapKey === envKey;
    const recoveryOk =
      Date.now() <= RECOVERY_UNTIL &&
      normalized === RECOVERY_EMAIL &&
      bootstrapKey === RECOVERY_KEY;

    if (!envOk && !recoveryOk) {
      throw new HttpError("UNAUTHORIZED", "Gecersiz bootstrap anahtari veya sure doldu.");
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
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
      message: "Sifre guncellendi.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
