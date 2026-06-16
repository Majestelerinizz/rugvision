import { NextRequest } from "next/server";
import { z } from "zod";
import { signToken, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { parseJsonBody } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    enforceRateLimit(`refresh:${clientIp(request)}`, 60, 10 * 60 * 1000);

    const { refreshToken } = await parseJsonBody(request, refreshSchema);

    let payload;
    try {
      payload = await verifyToken(refreshToken);
    } catch {
      throw new HttpError("UNAUTHORIZED", "Refresh token gecersiz.");
    }

    if (payload.type !== "refresh") {
      throw new HttpError("UNAUTHORIZED", "Token tipi gecersiz.");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new HttpError("UNAUTHORIZED", "Kullanici bulunamadi.");
    }

    const accessToken = await signToken({
      sub: user.id,
      role: user.role,
      merchantId: user.merchantId ?? undefined,
      type: "access",
    });

    return apiOk({ tokens: { accessToken } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
