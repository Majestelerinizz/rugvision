import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { normalizeHost, isPublicHost } from "@/lib/domain";

// MVP dogrulama: https://<host>/.well-known/rugvision.txt icinde merchantId bekleriz.
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    // Dis kaynaga fetch yaptigi icin (SSRF/suistimal) siki sinirla.
    enforceRateLimit(`domain-verify:${clientIp(request)}`, 10, 10 * 60 * 1000);
    const body = (await request.json().catch(() => null)) as
      | { host?: string; merchantId?: string }
      | null;

    if (!body?.host) {
      throw new HttpError("BAD_REQUEST", "`host` zorunludur.");
    }
    const merchantId = resolveMerchantId(ctx, body.merchantId);
    const host = normalizeHost(body.host);

    if (!isPublicHost(host)) {
      throw new HttpError(
        "UNPROCESSABLE",
        "Yalnizca herkese acik alan adlari dogrulanabilir."
      );
    }

    const domain = await prisma.domain.findUnique({
      where: { merchantId_host: { merchantId, host } },
    });
    if (!domain) {
      throw new HttpError("NOT_FOUND", "Alan adi kayitli degil.");
    }

    const url = `https://${host}/.well-known/rugvision.txt`;
    let content = "";
    try {
      // Redirect'i takip etmeyiz: ic aga yonlendiren redirect ile SSRF'i engeller.
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        redirect: "error",
      });
      if (res.ok) content = (await res.text()).trim();
    } catch {
      content = "";
    }

    const verified = content.includes(merchantId);
    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: { verified },
    });

    if (!verified) {
      throw new HttpError(
        "UNPROCESSABLE",
        `Dogrulama basarisiz. ${url} icine "${merchantId}" degerini koyun.`
      );
    }

    return apiOk(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}
