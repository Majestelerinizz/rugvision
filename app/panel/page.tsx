"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tokens = { accessToken: string; refreshToken: string };
type Overview = {
  totals: {
    events: number;
    rugs: number;
    widgetOpened: number;
    arStarted: number;
    view3d: number;
    productViewed: number;
  };
  topRugsByAr: { rugId: string; name: string | null; sku: string | null; arStarted: number }[];
};
type Rug = {
  id: string;
  name: string;
  sku: string;
  model3dUrl: string | null;
  status: string;
};

const STORAGE_KEY = "rugvision.panel";

export default function PanelPage() {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [rugs, setRugs] = useState<Rug[]>([]);
  const [selectedRugId, setSelectedRugId] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setToken(parsed.token ?? null);
        setRefreshToken(parsed.refreshToken ?? null);
        setMerchantId(parsed.merchantId ?? null);
      }
    } catch {
      /* ignore */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persistSession = useCallback(
    (t: string | null, rt: string | null, mId: string | null) => {
      if (t && mId) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: t, refreshToken: rt, merchantId: mId })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setMerchantId(null);
    setOverview(null);
    setRugs([]);
    persistSession(null, null, null);
  }, [persistSession]);

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}): Promise<Response> => {
      const withAuth = (t: string | null): RequestInit => ({
        ...init,
        headers: {
          ...(init.headers as Record<string, string> | undefined),
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
      });

      let res = await fetch(input, withAuth(token));
      if (res.status === 401 && refreshToken) {
        const r = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (r.ok) {
          const newToken: string = (await r.json()).data.tokens.accessToken;
          setToken(newToken);
          persistSession(newToken, refreshToken, merchantId);
          res = await fetch(input, withAuth(newToken));
        } else {
          logout();
        }
      }
      return res;
    },
    [token, refreshToken, merchantId, persistSession, logout]
  );

  const loadData = useCallback(async () => {
    if (!token || !merchantId) return;
    try {
      const [ovRes, rugRes] = await Promise.all([
        authedFetch(`/api/v1/analytics/overview?merchantId=${merchantId}`),
        authedFetch(`/api/v1/rugs?merchantId=${merchantId}`),
      ]);
      if (ovRes.ok) setOverview((await ovRes.json()).data);
      if (rugRes.ok) {
        const list: Rug[] = (await rugRes.json()).data ?? [];
        setRugs(list);
        if (list.length && !selectedRugId) setSelectedRugId(list[0].id);
      }
    } catch {
      setError("Veri yuklenemedi.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, merchantId, authedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Giris basarisiz.");
        return;
      }
      const tokens: Tokens = json.data.tokens;
      const mId: string = json.data.user.merchantId;
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setMerchantId(mId);
      persistSession(tokens.accessToken, tokens.refreshToken, mId);
    } catch {
      setError("Sunucuya ulasilamadi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadMsg(null);
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    if (!input?.files?.[0]) {
      setUploadMsg("Dosya secin.");
      return;
    }
    const fd = new FormData();
    fd.append("file", input.files[0]);
    const res = await authedFetch("/api/v1/uploads/model", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) {
      setUploadMsg(json?.error?.message || "Yukleme basarisiz.");
      return;
    }
    setUploadMsg(`Yuklendi: ${json.data.modelUrl}`);
  }

  const selectedRug = rugs.find((r) => r.id === selectedRugId);

  const embedSnippet = useMemo(() => {
    if (typeof window === "undefined" || !selectedRugId) return "";
    const origin = window.location.origin;
    if (selectedRug?.sku && merchantId) {
      return `<script src="${origin}/widget.js"\n  data-merchant-id="${merchantId}"\n  data-sku="${selectedRug.sku}"\n  data-target=".add-to-cart"\n  defer></script>`;
    }
    return `<script src="${origin}/widget.js"\n  data-rug-id="${selectedRugId}"\n  data-target=".add-to-cart"\n  defer></script>`;
  }, [selectedRugId, selectedRug, merchantId]);

  async function copyEmbed() {
    if (!embedSnippet) return;
    await navigator.clipboard?.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200">
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-300/40">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-2xl font-bold text-white">
                R
              </div>
              <h1 className="text-2xl font-bold text-stone-900">RugVision Panel</h1>
              <p className="mt-2 text-sm text-stone-500">
                Halilarinizi yonetin, embed kodunu alin
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ornek@magaza.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
                  Sifre
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Giris yapiliyor..." : "Panele gir"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            RugVision &mdash; Odamda Gor AR platformu
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-lg font-bold text-white">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">RugVision Panel</h1>
              <p className="text-xs text-stone-500">Merchant yonetim paneli</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
          >
            Cikis yap
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Merchant ID */}
        {merchantId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
              Merchant ID (embed kodunda kullanilir)
            </p>
            <p className="mt-1 font-mono text-sm text-amber-900">{merchantId}</p>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Toplam Hali" value={overview?.totals.rugs ?? 0} accent="stone" />
          <StatCard label="Widget Acilis" value={overview?.totals.widgetOpened ?? 0} accent="blue" />
          <StatCard label="AR Baslatma" value={overview?.totals.arStarted ?? 0} accent="green" />
          <StatCard label="3D Goruntuleme" value={overview?.totals.view3d ?? 0} accent="purple" />
        </section>

        {/* Rugs table */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Halilariniz</h2>
            <span className="text-sm text-stone-500">{rugs.length} urun</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-left">
                    <th className="px-5 py-3 font-semibold text-stone-600">Ad</th>
                    <th className="px-5 py-3 font-semibold text-stone-600">SKU</th>
                    <th className="px-5 py-3 font-semibold text-stone-600">Model</th>
                    <th className="px-5 py-3 font-semibold text-stone-600">Durum</th>
                    <th className="px-5 py-3 font-semibold text-stone-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rugs.map((r) => (
                    <tr key={r.id} className="transition hover:bg-stone-50">
                      <td className="px-5 py-4 font-medium text-stone-900">{r.name}</td>
                      <td className="px-5 py-4">
                        <code className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                          {r.sku}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        {r.model3dUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Var
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
                            Yok
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 capitalize text-stone-600">{r.status}</td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={`/odamda-gor/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-700"
                        >
                          AR Onizle
                        </a>
                      </td>
                    </tr>
                  ))}
                  {rugs.length === 0 && (
                    <tr>
                      <td className="px-5 py-12 text-center text-stone-400" colSpan={5}>
                        Henuz hali eklenmemis. API veya panel uzerinden urun ekleyin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Upload + Embed */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Upload */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Model Yukle</h2>
            <p className="mt-1 text-sm text-stone-500">GLB veya USDZ dosyasi yukleyin</p>
            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              <div className="rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                <input
                  type="file"
                  name="file"
                  accept=".glb,.usdz,.gltf"
                  className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-amber-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                Dosyayi Yukle
              </button>
              {uploadMsg && (
                <p
                  className={`text-sm ${uploadMsg.startsWith("Yuklendi") ? "text-green-700" : "text-red-600"}`}
                >
                  {uploadMsg}
                </p>
              )}
            </form>
            <p className="mt-4 text-xs text-stone-400">
              Not: Production ortaminda kalici depolama icin R2/S3 yapilandirmasi gerekir.
            </p>
          </div>

          {/* Embed */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-900">Embed Kodu</h2>
            <p className="mt-1 text-sm text-stone-500">
              Bu kodu urun sayfaniza yapistirin; &quot;Odamda Gor&quot; butonu otomatik eklenir
            </p>

            <label htmlFor="rug-select" className="mt-5 block text-sm font-medium text-stone-700">
              Hali secin
            </label>
            <select
              id="rug-select"
              value={selectedRugId}
              onChange={(e) => setSelectedRugId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            >
              {rugs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.sku})
                </option>
              ))}
            </select>

            <label htmlFor="embed-code" className="mt-4 block text-sm font-medium text-stone-700">
              Kod
            </label>
            <textarea
              id="embed-code"
              readOnly
              value={embedSnippet}
              rows={6}
              className="mt-1.5 w-full rounded-lg border border-stone-300 bg-stone-50 p-4 font-mono text-xs leading-relaxed text-stone-800"
            />

            <button
              onClick={copyEmbed}
              disabled={!embedSnippet}
              className="mt-3 w-full rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Kopyalandi!" : "Kodu Kopyala"}
            </button>

            <div className="mt-4 rounded-lg bg-stone-50 p-4 text-xs text-stone-600">
              <p className="font-semibold text-stone-700">Kurulum:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Kodu urun sayfa sablonuna yapistirin</li>
                <li>
                  <code className="text-stone-800">data-target</code> degerini sitenizdeki
                  &quot;Sepete Ekle&quot; butonunun CSS sinifi ile eslestirin
                </li>
                <li>Mobil cihazda test edin (iPhone Quick Look / Android Scene Viewer)</li>
              </ol>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "stone" | "blue" | "green" | "purple";
}) {
  const accents = {
    stone: "border-stone-200 bg-white text-stone-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    green: "border-green-200 bg-green-50 text-green-900",
    purple: "border-purple-200 bg-purple-50 text-purple-900",
  };
  const labelColors = {
    stone: "text-stone-500",
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${accents[accent]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className={`mt-1 text-sm font-medium ${labelColors[accent]}`}>{label}</p>
    </div>
  );
}
