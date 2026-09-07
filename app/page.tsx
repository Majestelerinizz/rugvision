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
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <p className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
            RugVision
          </p>
          <div className="flex gap-2">
            <Link
              href="/panel"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
            >
              Giriş
            </Link>
            <Link
              href="/panel"
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Ücretsiz dene
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="space-y-4">
          <p className="text-sm uppercase tracking-wide text-zinc-500">Odamda Gör</p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Halıyı satın almadan önce kendi odanda gör
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-300">
            RugVision, e-ticaret ürün sayfalarına tek satır kodla &quot;Odamda Gör&quot;
            deneyimi ekler. Müşteri halıyı telefon kamerasıyla gerçek boyutta görür;
            AR yoksa oda fotoğrafına yerleştirir.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/panel"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Merchant paneline git
            </Link>
            {latestRug && (
              <Link
                href={`/odamda-gor/${latestRug.id}`}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
              >
                Canlı demoyu aç
              </Link>
            )}
          </div>
        </section>

        {latestRug && (
          <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-xl font-semibold">Canlı Önizleme</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Son eklenen halı: <span className="font-medium">{latestRug.name}</span>
              {" · "}
              {latestRug.widthCm}×{latestRug.lengthCm} cm
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/odamda-gor/${latestRug.id}`}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                3D / AR ile gör
              </Link>
              <Link
                href={`/odamda-gor/${latestRug.id}`}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
              >
                Fotoğrafta Gör
              </Link>
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold">Canlı kamera AR</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              iPhone Quick Look ve Android Scene Viewer ile halı zemine gerçek ölçüde oturur.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold">Fotoğrafta Gör</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              AR desteklemeyen cihazlarda oda fotoğrafına perspektif yerleştirme, indir ve paylaş.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold">Tek satır embed</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              PHP, WooCommerce veya düz HTML fark etmez. Sepete Ekle yanına buton eklenir.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold">Nasıl çalışır?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Halıcı, panelden ücretsiz hesap açar; ürününü ve 3D modelini ekler.</li>
            <li>Ürün sayfasına tek satır embed script yapıştırılır.</li>
            <li>&quot;Sepete Ekle&quot; yanına otomatik &quot;Odamda Gör&quot; butonu eklenir.</li>
            <li>
              Müşteri iOS Quick Look / Android Scene Viewer ile AR açar veya oda
              fotoğrafına halıyı yerleştirir.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
