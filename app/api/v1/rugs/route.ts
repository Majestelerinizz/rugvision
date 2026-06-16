import { NextRequest } from "next/server";
import { Prisma, RugStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, toErrorResponse, HttpError } from "@/lib/api";
import { requireAuth, resolveMerchantId } from "@/lib/auth-guard";
import { parseJsonBody } from "@/lib/validation";
import {
  buildSubscriptionSnapshot,
  assertCanCreateRug,
} from "@/lib/subscription";
import { invalidateRugPublicCache } from "@/lib/invalidate-rug-cache";

async function assertWithinPlanLimit(merchantId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { merchantId },
  });
  if (!subscription) return;

  const rugCount = await prisma.rug.count({ where: { merchantId } });
  const snapshot = buildSubscriptionSnapshot(subscription, rugCount);
  assertCanCreateRug(snapshot);
}

const createRugSchema = z.object({
  merchantId: z.string().min(1).optional(),
  sku: z.string().trim().min(1).max(64),
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  widthCm: z.number().int().positive().max(2000),
  lengthCm: z.number().int().positive().max(2000),
  price: z.number().positive().max(10_000_000),
  colors: z.array(z.string().max(40)).max(50).optional(),
  category: z.string().max(120).optional(),
  brand: z.string().max(120).optional(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().max(2000).optional(),
  model3dUrl: z.string().max(2000).optional(),
  status: z.nativeEnum(RugStatus).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const requested =
      request.nextUrl.searchParams.get("merchantId") ?? undefined;
    const merchantId = resolveMerchantId(ctx, requested);

    const rugs = await prisma.rug.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return apiOk(rugs);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const body = await parseJsonBody(request, createRugSchema);
    const merchantId = resolveMerchantId(ctx, body.merchantId);

    await assertWithinPlanLimit(merchantId);

    const created = await prisma.rug.create({
      data: {
        merchantId,
        sku: body.sku,
        slug: body.slug,
        name: body.name,
        widthCm: body.widthCm,
        lengthCm: body.lengthCm,
        price: body.price,
        colors: body.colors ?? [],
        category: body.category,
        brand: body.brand,
        description: body.description,
        coverImage: body.coverImage,
        model3dUrl: body.model3dUrl,
        status: body.status ?? RugStatus.ACTIVE,
      },
    });

    invalidateRugPublicCache();

    return apiOk(created, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("CONFLICT", "Bu SKU veya slug bu magazada zaten kayitli.");
    }
    return toErrorResponse(error);
  }
}
