import { NextRequest } from "next/server";
import { z } from "zod";
import { signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(100),
});

// Gecerli formatli ama hicbir sifreyle eslesmeyen sabit bcrypt hash'i.
// Kullanici bulunamasa da karsilastirma yaparak zamanlama/enumeration sizintisini azaltir.
const DUMMY_HASH =
  "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await parseJsonBody(request, loginSchema);

    // Brute-force korumasi: hem IP hem hedef hesap bazinda sinirlama.
    const ip = clientIp(request);
    enforceRateLimit(`login:ip:${ip}`, 20, 10 * 60 * 1000);
    enforceRateLimit(`login:acc:${email.toLowerCase()}`, 8, 10 * 60 * 1000);

    const user = await prisma.user.findUnique({ where: { email } });

    // Kullanici yoksa da sifreyi karsilastirir gibi davranarak zamanlama
    // sizintisini ve kullanici sayimini (enumeration) azaltiriz.
    const isValid = await verifyPassword(
      password,
      user ? user.passwordHash : DUMMY_HASH
    );

    if (!user || !isValid) {
      throw new HttpError("UNAUTHORIZED", "Gecersiz kimlik bilgileri.");
    }

    const tokenBase = {
      sub: user.id,
      role: user.role,
      merchantId: user.merchantId ?? undefined,
    };
    const accessToken = await signToken({ ...tokenBase, type: "access" });
    const refreshToken = await signToken({ ...tokenBase, type: "refresh" });

    return apiOk({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        merchantId: user.merchantId,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
