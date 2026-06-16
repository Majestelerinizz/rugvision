import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, toErrorResponse, HttpError } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";
import { normalizeHost } from "@/lib/domain";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const requested = request.nextUrl.searchParams.get("merchantId") ?? undefined;
    const merchantId = resolveMerchantId(ctx, requested);

    const domains = await prisma.domain.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });
    return apiOk(domains);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const body = (await request.json().catch(() => null)) as
      | { host?: string; merchantId?: string }
      | null;

    if (!body?.host) {
      throw new HttpError("BAD_REQUEST", "`host` zorunludur.");
    }
    const merchantId = resolveMerchantId(ctx, body.merchantId);
    const host = normalizeHost(body.host);
    if (!host || !host.includes(".")) {
      throw new HttpError("UNPROCESSABLE", "Gecerli bir alan adi giriniz.");
    }

    const domain = await prisma.domain.create({
      data: { merchantId, host, verified: false },
    });

    return apiOk(
      {
        ...domain,
        // Dogrulama icin merchant'in bu icerigi host'a koymasi gerekir.
        verification: {
          method: "file",
          path: "/.well-known/rugvision.txt",
          token: merchantId,
        },
      },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("CONFLICT", "Bu alan adi zaten kayitli.");
    }
    return toErrorResponse(error);
  }
}
