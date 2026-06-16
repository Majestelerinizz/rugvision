import { prisma } from "@/lib/prisma";

// Widget'in ihtiyaci olan minimal/public hali verisini sekillendirir.
function shapeWidgetRug(rug: {
  id: string;
  name: string;
  slug: string;
  widthCm: number;
  lengthCm: number;
  price: { toString(): string };
  colors: string[];
  coverImage: string | null;
  model3dUrl: string | null;
  merchant: {
    id: string;
    name: string;
    slug: string;
    widgetSettings: unknown;
  };
}) {
  return {
    id: rug.id,
    name: rug.name,
    slug: rug.slug,
    dimensions: { widthCm: rug.widthCm, lengthCm: rug.lengthCm },
    price: rug.price.toString(),
    colors: rug.colors,
    coverImage: rug.coverImage,
    model3dUrl: rug.model3dUrl,
    merchant: rug.merchant,
  };
}

const merchantInclude = {
  merchant: {
    select: { id: true, name: true, slug: true, widgetSettings: true },
  },
} as const;

// Hali kimligine gore (panelden uretilen embed: data-rug-id).
export async function findWidgetRugById(id: string) {
  const rug = await prisma.rug.findUnique({
    where: { id },
    include: merchantInclude,
  });
  return rug ? shapeWidgetRug(rug) : null;
}

// Merchant + SKU eslemesine gore (data-merchant-id + data-sku).
export async function findWidgetRugBySku(merchantId: string, sku: string) {
  const rug = await prisma.rug.findUnique({
    where: { merchantId_sku: { merchantId, sku } },
    include: merchantInclude,
  });
  return rug ? shapeWidgetRug(rug) : null;
}
