import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArViewerClient from "./ar-viewer-client";

const FALLBACK_MODEL_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

function buildIosSrc(modelUrl: string) {
  const lower = modelUrl.toLowerCase();
  if (!lower.endsWith(".glb")) return undefined;

  // Local model URLs like /models/Modern_rug.glb -> /api/v1/ar/usdz/Modern_rug.usdz
  if (modelUrl.startsWith("/models/")) {
    const fileName = modelUrl.split("/").pop();
    if (!fileName) return undefined;
    return `/api/v1/ar/usdz/${fileName.replace(/\.glb$/i, ".usdz")}`;
  }

  return modelUrl.replace(/\.glb$/i, ".usdz");
}

export default async function OdamdaGorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { id } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1" || embed === "true";

  const rug = await prisma.rug.findUnique({
    where: { id },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          widgetSettings: true,
        },
      },
    },
  });

  if (!rug) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Hali bulunamadi</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">
          Bu urun silinmis veya gecersiz bir baglanti olabilir.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          Ana sayfaya don
        </Link>
      </main>
    );
  }

  const modelUrl = rug.model3dUrl || FALLBACK_MODEL_URL;
  const iosSrc = buildIosSrc(modelUrl);
  const isFallbackModel = !rug.model3dUrl;
  const buttonText = rug.merchant.widgetSettings?.buttonText || "Odamda Gor";
  const buttonColor = rug.merchant.widgetSettings?.buttonColor || "#111827";
  const borderRadius = rug.merchant.widgetSettings?.borderRadius ?? 9999;

  const viewer = (
    <ArViewerClient
      modelUrl={modelUrl}
      iosSrc={iosSrc}
      name={rug.name}
      merchantId={rug.merchant.id}
      merchantName={rug.merchant.name}
      rugId={rug.id}
      sku={rug.sku}
      slug={rug.slug}
      buttonText={buttonText}
      buttonColor={buttonColor}
      borderRadius={borderRadius}
      embed={isEmbed}
    />
  );

  if (isEmbed) {
    return <main className="min-h-screen p-3">{viewer}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">RugVision AR Demo</p>
        <h1 className="text-3xl font-semibold">{rug.name}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          {rug.widthCm} x {rug.lengthCm} cm • {rug.price.toString()} TL
        </p>
        {isFallbackModel && (
          <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Bu urunde `model3dUrl` olmadigi icin demo modeli (astronot) gosteriliyor. Gercek
            haliyi gormek icin urune bir GLB/GLTF model URL&apos;i eklemelisin.
          </p>
        )}
      </div>

      {viewer}
    </main>
  );
}
