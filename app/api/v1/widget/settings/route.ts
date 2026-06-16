import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/validation";

const updateSettingsSchema = z.object({
  merchantId: z.string().min(1).optional(),
  buttonColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Gecerli bir HEX renk giriniz.")
    .optional(),
  buttonText: z.string().trim().min(1).max(40).optional(),
  borderRadius: z.number().int().min(0).max(9999).optional(),
  logoUrl: z.string().max(2000).nullable().optional(),
  darkMode: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const requested =
      request.nextUrl.searchParams.get("merchantId") ?? undefined;
    const merchantId = resolveMerchantId(ctx, requested);

    const settings = await prisma.widgetSettings.findUnique({
      where: { merchantId },
    });

    if (!settings) {
      throw new HttpError("NOT_FOUND", "Widget ayari bulunamadi.");
    }

    return apiOk(settings);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const body = await parseJsonBody(request, updateSettingsSchema);
    const merchantId = resolveMerchantId(ctx, body.merchantId);

    const updated = await prisma.widgetSettings.update({
      where: { merchantId },
      data: {
        buttonColor: body.buttonColor,
        buttonText: body.buttonText,
        borderRadius: body.borderRadius,
        logoUrl: body.logoUrl,
        darkMode: body.darkMode,
      },
    });

    return apiOk(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return toErrorResponse(
        new HttpError("NOT_FOUND", "Widget ayari bulunamadi.")
      );
    }
    return toErrorResponse(error);
  }
}
