import { NextRequest } from "next/server";
import { Prisma, RugStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, toErrorResponse, HttpError } from "@/lib/api";
import {
  requireAuth,
  assertMerchantAccess,
  type AuthContext,
} from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/validation";
import { invalidateRugPublicCache } from "@/lib/invalidate-rug-cache";

const updateRugSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  widthCm: z.number().int().positive().max(2000).optional(),
  lengthCm: z.number().int().positive().max(2000).optional(),
  price: z.number().positive().max(10_000_000).optional(),
  colors: z.array(z.string().max(40)).max(50).optional(),
  category: z.string().max(120).nullable().optional(),
  brand: z.string().max(120).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  coverImage: z.string().max(2000).nullable().optional(),
  model3dUrl: z.string().max(2000).nullable().optional(),
  status: z.nativeEnum(RugStatus).optional(),
});

// Halinin var oldugunu ve istek sahibinin o magazaya yetkili oldugunu dogrular.
async function loadOwnedRug(ctx: AuthContext, id: string) {
  const rug = await prisma.rug.findUnique({ where: { id } });
  if (!rug) {
    throw new HttpError("NOT_FOUND", "Hali bulunamadi.");
  }
  assertMerchantAccess(ctx, rug.merchantId);
  return rug;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(request);
    const { id } = await params;
    const rug = await loadOwnedRug(ctx, id);
    return apiOk(rug);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(request);
    const { id } = await params;
    await loadOwnedRug(ctx, id);
    const body = await parseJsonBody(request, updateRugSchema);

    const updated = await prisma.rug.update({
      where: { id },
      data: {
        name: body.name,
        widthCm: body.widthCm,
        lengthCm: body.lengthCm,
        price: body.price,
        colors: body.colors,
        category: body.category,
        brand: body.brand,
        description: body.description,
        coverImage: body.coverImage,
        model3dUrl: body.model3dUrl,
        status: body.status,
      },
    });

    invalidateRugPublicCache();

    return apiOk(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return toErrorResponse(
        new HttpError("CONFLICT", "Bu SKU veya slug zaten kullaniliyor.")
      );
    }
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(request);
    const { id } = await params;
    await loadOwnedRug(ctx, id);

    await prisma.rug.delete({ where: { id } });
    invalidateRugPublicCache();
    return apiOk({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
