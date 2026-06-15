import { NextRequest, NextResponse } from "next/server";
import { Prisma, RugStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UpdateRugBody = {
  name?: string;
  widthCm?: number;
  lengthCm?: number;
  price?: number;
  colors?: string[];
  category?: string | null;
  brand?: string | null;
  description?: string | null;
  coverImage?: string | null;
  model3dUrl?: string | null;
  status?: RugStatus;
};

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rug = await prisma.rug.findUnique({
    where: { id },
  });

  if (!rug) {
    return NextResponse.json({ error: "Rug bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({ data: rug }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as UpdateRugBody;

  try {
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

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Rug bulunamadi." }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Rug guncellenemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.rug.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Rug bulunamadi." }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Rug silinemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
