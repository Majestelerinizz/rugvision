import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rug = await prisma.rug.findUnique({
    where: { id },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          slug: true,
          widgetSettings: true,
        },
      },
    },
  });

  if (!rug) {
    return withCors({ error: "Rug bulunamadi." }, { status: 404 });
  }

  return withCors(
    {
      data: {
        id: rug.id,
        name: rug.name,
        slug: rug.slug,
        dimensions: {
          widthCm: rug.widthCm,
          lengthCm: rug.lengthCm,
        },
        price: rug.price.toString(),
        colors: rug.colors,
        coverImage: rug.coverImage,
        model3dUrl: rug.model3dUrl,
        merchant: rug.merchant,
      },
    },
    { status: 200 }
  );
}
