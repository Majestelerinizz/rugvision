import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { HttpError } from "@/lib/api";

export type AuthContext = {
  userId: string;
  role: string;
  merchantId?: string;
};

// Authorization: Bearer <accessToken> dogrular ve context dondurur.
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError("UNAUTHORIZED", "Yetkilendirme tokeni eksik.");
  }

  let payload;
  try {
    payload = await verifyToken(match[1]);
  } catch {
    throw new HttpError("UNAUTHORIZED", "Token gecersiz veya suresi dolmus.");
  }

  if (payload.type !== "access") {
    throw new HttpError("UNAUTHORIZED", "Gecersiz token tipi.");
  }

  return {
    userId: payload.sub,
    role: payload.role,
    merchantId: payload.merchantId,
  };
}

// Belirli bir merchant'a erisim yetkisi var mi?
export function assertMerchantAccess(ctx: AuthContext, merchantId: string) {
  if (ctx.role === "SUPER_ADMIN") return;
  if (ctx.merchantId && ctx.merchantId === merchantId) return;
  throw new HttpError("FORBIDDEN", "Bu magaza icin yetkiniz yok.");
}

// Token'dan etkin merchant'i cozer (yoksa hata).
export function resolveMerchantId(ctx: AuthContext, requested?: string) {
  if (ctx.role === "SUPER_ADMIN") {
    if (!requested) {
      throw new HttpError("BAD_REQUEST", "merchantId zorunludur.");
    }
    return requested;
  }
  if (!ctx.merchantId) {
    throw new HttpError("FORBIDDEN", "Hesabiniza bagli magaza yok.");
  }
  if (requested && requested !== ctx.merchantId) {
    throw new HttpError("FORBIDDEN", "Bu magaza icin yetkiniz yok.");
  }
  return ctx.merchantId;
}
