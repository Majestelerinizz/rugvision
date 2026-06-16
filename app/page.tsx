import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Bu sayfa veritabanindan son haliyi okur; build sirasinda prerender edilmesin
// (production build'in DB baglantisi olmadan calismasini saglar).
export const dynamic = "force-dynamic";

export default async function Home() {
  const latestRug = await prisma.rug.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-zinc-500">RugVision</p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Halıyı satın almadan önce kendi odanda gör
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-300">
            RugVision, e-ticaret ürün sayfalarına tek satır kodla &quot;Odamda Gör&quot;
            artırılmış gerçeklik deneyimi ekler. Müşteri, halıyı telefon kamerasıyla
            kendi odasının zemininde gerçek boyutta görür.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/panel"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Merchant paneline git
            </Link>
          </div>
        </section>

        {latestRug && (
          <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold">Canlı Önizleme</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Son eklenen halı: <span className="font-medium">{latestRug.name}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/odamda-gor/${latestRug.id}`}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Odamda Gör ekranını aç
              </Link>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold">Nasıl çalışır?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Halıcı, panelden ürününü ve 3D modelini (GLB/USDZ) ekler.</li>
            <li>Ürün sayfasına tek satır embed script yapıştırılır.</li>
            <li>&quot;Sepete Ekle&quot; yanına otomatik &quot;Odamda Gör&quot; butonu eklenir.</li>
            <li>Müşteri butona basar; iOS Quick Look / Android Scene Viewer ile AR açılır.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
