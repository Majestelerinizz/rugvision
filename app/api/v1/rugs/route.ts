import { NextRequest, NextResponse } from "next/server";
import { RugStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateRugBody = {
  merchantId?: string;
  sku?: string;
  slug?: string;
  name?: string;
  widthCm?: number;
  lengthCm?: number;
  price?: number;
  colors?: string[];
  category?: string;
  brand?: string;
  description?: string;
  coverImage?: string;
  model3dUrl?: string;
  status?: RugStatus;
};

function validateCreateBody(body: CreateRugBody): string | null {
  if (!body.merchantId) return "merchantId zorunludur.";
  if (!body.sku) return "sku zorunludur.";
  if (!body.slug) return "slug zorunludur.";
  if (!body.name) return "name zorunludur.";
  if (!body.widthCm || body.widthCm <= 0) return "widthCm pozitif olmalidir.";
  if (!body.lengthCm || body.lengthCm <= 0) return "lengthCm pozitif olmalidir.";
  if (typeof body.price !== "number" || body.price <= 0) {
    return "price pozitif sayi olmalidir.";
  }
  if (body.colors && !Array.isArray(body.colors)) return "colors dizi olmalidir.";
  return null;
}

export async function GET(request: NextRequest) {
  const merchantId = request.nextUrl.searchParams.get("merchantId");

  if (!merchantId) {
    return NextResponse.json(
      { error: "merchantId query parametresi zorunludur." },
      { status: 400 }
    );
  }

  const rugs = await prisma.rug.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: rugs }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateRugBody;
  const validationError = validateCreateBody(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const created = await prisma.rug.create({
      data: {
        merchantId: body.merchantId!,
        sku: body.sku!,
        slug: body.slug!,
        name: body.name!,
        widthCm: body.widthCm!,
        lengthCm: body.lengthCm!,
        price: body.price!,
        colors: body.colors ?? [],
        category: body.category,
        brand: body.brand,
        description: body.description,
        coverImage: body.coverImage,
        model3dUrl: body.model3dUrl,
        status: body.status ?? RugStatus.ACTIVE,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Rug olusturulamadi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
