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

  const [overview, setOverview] = useState<Overview | null>(null);
  const [rugs, setRugs] = useState<Rug[]>([]);
  const [selectedRugId, setSelectedRugId] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    // localStorage yalnizca istemcide var; SSR uyumu icin hidrasyon effect'te yapilir.
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

  // Tum korumali istekleri tek noktadan yapar; access token (15 dk) dolduysa
  // refresh token ile sessizce yeniler ve istegi bir kez tekrarlar.
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
    // Veri cekme effect'i; setState'ler await sonrasi asenkron yapilir.
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

  const embedSnippet = useMemo(() => {
    if (typeof window === "undefined" || !selectedRugId) return "";
    const origin = window.location.origin;
    return `<script src="${origin}/widget.js" data-rug-id="${selectedRugId}" data-target=".add-to-cart" defer></script>`;
  }, [selectedRugId]);

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">RugVision Panel</h1>
        <p className="mt-1 text-sm text-zinc-500">Merchant girisi</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Sifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Giris yapiliyor..." : "Giris yap"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">RugVision Panel</h1>
        <button onClick={logout} className="text-sm text-zinc-500 underline">
          Cikis
        </button>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Toplam Hali" value={overview?.totals.rugs ?? 0} />
        <Stat label="Widget Acilis" value={overview?.totals.widgetOpened ?? 0} />
        <Stat label="AR Baslatma" value={overview?.totals.arStarted ?? 0} />
        <Stat label="3D Goruntuleme" value={overview?.totals.view3d ?? 0} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Halilar</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-2">Ad</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Model</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rugs.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.sku}</td>
                  <td className="px-4 py-2">{r.model3dUrl ? "\u2713" : "\u2014"}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={`/odamda-gor/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Onizle
                    </a>
                  </td>
                </tr>
              ))}
              {rugs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-400" colSpan={5}>
                    Hali bulunamadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Model Yukle (GLB/USDZ)</h2>
          <form onSubmit={handleUpload} className="mt-3 space-y-3">
            <input
              type="file"
              name="file"
              accept=".glb,.usdz,.gltf"
              className="block w-full text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              Yukle
            </button>
            {uploadMsg && <p className="text-sm text-zinc-600">{uploadMsg}</p>}
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Embed Kodu</h2>
          <select
            value={selectedRugId}
            onChange={(e) => setSelectedRugId(e.target.value)}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {rugs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.sku})
              </option>
            ))}
          </select>
          <textarea
            readOnly
            value={embedSnippet}
            rows={4}
            className="mt-3 w-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs"
          />
          <button
            onClick={() => navigator.clipboard?.writeText(embedSnippet)}
            className="mt-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Kopyala
          </button>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
