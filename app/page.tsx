import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
            Odamda Gor deneyimi icin API ve AR demo ortami hazir
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-300">
            Auth, Rugs CRUD ve Widget endpointleri aktif. Asagidaki baglantiyla son olusturulan
            haliyi 3D/AR ekranda test edebilirsin.
          </p>
        </section>

        <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold">Hizli Test</h2>
          {latestRug ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Son hali: <span className="font-medium">{latestRug.name}</span> ({latestRug.id})
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/odamda-gor/${latestRug.id}`}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                >
                  Odamda Gor ekranini ac
                </Link>
                <Link
                  href={`/api/v1/widget/rug/${latestRug.id}`}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
                >
                  Widget JSON gor
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Henuz hali olusturulmadi. Once Postman ile `Rugs Create` istegini calistir.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold">Sonraki Fazlar</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li>Widget script embed + domain dogrulama</li>
            <li>Gercek GLB model yukleme ve validasyon</li>
            <li>Mobilde Scene Viewer / Quick Look derin link entegrasyonu</li>
            <li>AI floor detection ile otomatik zemin yerlestirme</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
