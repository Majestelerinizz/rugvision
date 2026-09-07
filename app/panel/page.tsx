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
type AnalyticsReport = {
  periodDays: number;
  totals: {
    widgetOpened: number;
    arStarted: number;
    view3d: number;
    productViewed: number;
  };
  conversion: {
    widgetToArPercent: number;
    productToView3dPercent: number;
  };
  topRugsByAr: { rugId: string; name: string | null; sku: string | null; arStarted: number }[];
};
type SubscriptionInfo = {
  hasSubscription: boolean;
  snapshot: {
    plan: string;
    status: string;
    productLimit: number;
    rugCount: number;
    usagePercent: number;
    trialDaysLeft: number | null;
    isTrialExpired: boolean;
    canAddRug: boolean;
  } | null;
};
type Rug = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  widthCm: number;
  lengthCm: number;
  price: number;
  colors: string[];
  category: string | null;
  brand: string | null;
  description: string | null;
  coverImage: string | null;
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
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tabs: overview | rugs | integration
  const [activeTab, setActiveTab] = useState<"overview" | "rugs" | "integration">("overview");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [overview, setOverview] = useState<Overview | null>(null);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [rugs, setRugs] = useState<Rug[]>([]);
  const [selectedRugId, setSelectedRugId] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // CRUD Modals & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingRugId, setEditingRugId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formWidth, setFormWidth] = useState(160);
  const [formLength, setFormLength] = useState(230);
  const [formPrice, setFormPrice] = useState(0);
  const [formColors, setFormColors] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCover, setFormCover] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "PASSIVE">("ACTIVE");

  // Calculator Helper
  const [calcSizePreset, setCalcSizePreset] = useState("160x230");
  const [calcUnitPrice, setCalcUnitPrice] = useState("");

  useEffect(() => {
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
      const [ovRes, rugRes, repRes, subRes] = await Promise.all([
        authedFetch(`/api/v1/analytics/overview?merchantId=${merchantId}`),
        authedFetch(`/api/v1/rugs?merchantId=${merchantId}`),
        authedFetch(`/api/v1/analytics/report?merchantId=${merchantId}&days=30`),
        authedFetch(`/api/v1/subscription?merchantId=${merchantId}`),
      ]);
      if (ovRes.ok) setOverview((await ovRes.json()).data);
      if (repRes.ok) setReport((await repRes.json()).data);
      if (subRes.ok) setSubscription((await subRes.json()).data);
      if (rugRes.ok) {
        const list: Rug[] = (await rugRes.json()).data ?? [];
        setRugs(list);
        if (list.length && !selectedRugId) setSelectedRugId(list[0].id);
      }
    } catch {
      setError("Veriler yüklenemedi.");
    }
  }, [token, merchantId, authedFetch, selectedRugId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Size Preset Handler
  useEffect(() => {
    if (calcSizePreset && calcSizePreset !== "custom") {
      const [w, l] = calcSizePreset.split("x").map(Number);
      if (w && l) {
        setFormWidth(w);
        setFormLength(l);
      }
    }
  }, [calcSizePreset]);

  // Unit Price Calculator Handler
  useEffect(() => {
    const unit = parseFloat(calcUnitPrice);
    if (!isNaN(unit) && unit > 0) {
      const m2 = (formWidth * formLength) / 10000;
      const total = Math.round(m2 * unit);
      setFormPrice(total);
    }
  }, [formWidth, formLength, calcUnitPrice]);

  // Auto slug generation helper
  useEffect(() => {
    if (modalMode === "add" && formName) {
      const suggested = formName
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(suggested);
    }
  }, [formName, modalMode]);

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
        setError(json?.error?.message || "Giriş başarısız.");
        return;
      }
      const tokens: Tokens = json.data.tokens;
      const mId: string = json.data.user.merchantId;
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setMerchantId(mId);
      persistSession(tokens.accessToken, tokens.refreshToken, mId);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, companyName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Kayıt başarısız.");
        return;
      }
      const tokens: Tokens = json.data.tokens;
      const mId: string = json.data.user.merchantId;
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setMerchantId(mId);
      persistSession(tokens.accessToken, tokens.refreshToken, mId);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadWithAuth(url: string, filename: string) {
    const res = await authedFetch(url);
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadMsg(null);
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    if (!input?.files?.[0]) {
      setUploadMsg("Lütfen dosya seçin.");
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
      setUploadMsg(json?.error?.message || "Yükleme başarısız.");
      return;
    }
    setUploadMsg(`Yüklendi: ${json.data.modelUrl}`);
    // If we're on Tab Integration, auto-select it
    setFormModel(json.data.modelUrl);
  }

  // Toggle Active/Passive status in table
  async function handleToggleStatus(rugId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "PASSIVE" : "ACTIVE";
    setRugs((prev) =>
      prev.map((r) => (r.id === rugId ? { ...r, status: newStatus } : r))
    );
    try {
      const res = await authedFetch(`/api/v1/rugs/${rugId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setRugs((prev) =>
          prev.map((r) => (r.id === rugId ? { ...r, status: currentStatus } : r))
        );
        const json = await res.json();
        alert(json?.error?.message || "Durum güncellenemedi.");
      }
    } catch {
      setRugs((prev) =>
        prev.map((r) => (r.id === rugId ? { ...r, status: currentStatus } : r))
      );
      alert("Bağlantı hatası.");
    }
  }

  // Delete Rug Action
  async function handleDeleteRug(rugId: string) {
    if (!confirm("Bu halıyı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await authedFetch(`/api/v1/rugs/${rugId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRugs((prev) => prev.filter((r) => r.id !== rugId));
        if (selectedRugId === rugId) {
          setSelectedRugId("");
        }
      } else {
        const json = await res.json();
        alert(json?.error?.message || "Silme işlemi başarısız.");
      }
    } catch {
      alert("Bağlantı hatası.");
    }
  }

  // Open Modals
  function openAddModal() {
    setModalMode("add");
    setEditingRugId(null);
    setFormSku("");
    setFormName("");
    setFormSlug("");
    setFormWidth(160);
    setFormLength(230);
    setFormPrice(0);
    setFormColors("");
    setFormCategory("");
    setFormBrand("");
    setFormDesc("");
    setFormCover("");
    setFormModel("");
    setFormStatus("ACTIVE");
    setCalcSizePreset("160x230");
    setCalcUnitPrice("");
    setModalError(null);
    setIsModalOpen(true);
  }

  function openEditModal(rug: Rug) {
    setModalMode("edit");
    setEditingRugId(rug.id);
    setFormSku(rug.sku || "");
    setFormName(rug.name || "");
    setFormSlug(rug.slug || "");
    setFormWidth(rug.widthCm || 160);
    setFormLength(rug.lengthCm || 230);
    setFormPrice(Number(rug.price) || 0);
    setFormColors(Array.isArray(rug.colors) ? rug.colors.join(", ") : "");
    setFormCategory(rug.category || "");
    setFormBrand(rug.brand || "");
    setFormDesc(rug.description || "");
    setFormCover(rug.coverImage || "");
    setFormModel(rug.model3dUrl || "");
    setFormStatus(rug.status === "PASSIVE" ? "PASSIVE" : "ACTIVE");

    // Match preset size
    const sizeStr = `${rug.widthCm}x${rug.lengthCm}`;
    const presets = ["80x150", "100x200", "120x180", "160x230", "200x290"];
    if (presets.includes(sizeStr)) {
      setCalcSizePreset(sizeStr);
    } else {
      setCalcSizePreset("custom");
    }
    setCalcUnitPrice("");
    setModalError(null);
    setIsModalOpen(true);
  }

  // Submit Modal Form
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    const payload = {
      name: formName,
      sku: formSku,
      slug: formSlug,
      widthCm: Number(formWidth),
      lengthCm: Number(formLength),
      price: Number(formPrice),
      colors: formColors ? formColors.split(",").map((c) => c.trim()).filter(Boolean) : [],
      category: formCategory || undefined,
      brand: formBrand || undefined,
      description: formDesc || undefined,
      coverImage: formCover || undefined,
      model3dUrl: formModel || undefined,
      status: formStatus,
    };

    try {
      let res;
      if (modalMode === "add") {
        res = await authedFetch("/api/v1/rugs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authedFetch(`/api/v1/rugs/${editingRugId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        setModalError(json?.error?.message || "İşlem başarısız.");
        return;
      }

      setIsModalOpen(false);
      await loadData();
    } catch {
      setModalError("Bağlantı hatası.");
    }
  }

  // Search Filter
  const filteredRugs = useMemo(() => {
    return rugs.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rugs, searchQuery]);

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

  // Login View
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200 flex items-center justify-center">
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-300/40">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-700 text-2xl font-bold text-white">
                R
              </div>
              <h1 className="text-2xl font-bold text-stone-900">RugVision Panel</h1>
              <p className="mt-2 text-sm text-stone-500">
                Halılarınızı yönetin, embed kodunu alın
              </p>
            </div>

            <form
              onSubmit={authMode === "login" ? handleLogin : handleRegister}
              className="space-y-5"
            >
              {authMode === "register" && (
                <>
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-stone-700">
                      Ad Soyad
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Ayşe Yılmaz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                      required
                      minLength={2}
                    />
                  </div>
                  <div>
                    <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-stone-700">
                      Mağaza / Firma
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      placeholder="Yılmaz Halı"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                      required
                      minLength={2}
                    />
                  </div>
                </>
              )}
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
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder={authMode === "register" ? "En az 8 karakter, harf + rakam" : "********"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                  required
                  minLength={authMode === "register" ? 8 : undefined}
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
                {loading
                  ? authMode === "login"
                    ? "Giriş yapılıyor..."
                    : "Hesap oluşturuluyor..."
                  : authMode === "login"
                    ? "Panele Gir"
                    : "Ücretsiz hesap aç"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-stone-600">
              {authMode === "login" ? (
                <>
                  Hesabın yok mu?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setError(null);
                    }}
                    className="font-semibold text-amber-800 hover:underline"
                  >
                    Mağaza kaydı oluştur
                  </button>
                </>
              ) : (
                <>
                  Zaten hesabın var mı?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError(null);
                    }}
                    className="font-semibold text-amber-800 hover:underline"
                  >
                    Giriş yap
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            RugVision &mdash; Odamda Gör AR Platformu
          </p>
        </main>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-lg font-bold text-white">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">RugVision Panel</h1>
              <p className="text-xs text-stone-500">Yönetim Paneli & Kontrol Merkezi</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-amber-700 text-amber-700"
                : "border-transparent text-stone-500 hover:text-stone-950"
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab("rugs")}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "rugs"
                ? "border-amber-700 text-amber-700"
                : "border-transparent text-stone-500 hover:text-stone-950"
            }`}
          >
            Halı Yönetimi (Ürünler)
          </button>
          <button
            onClick={() => setActiveTab("integration")}
            className={`py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "integration"
                ? "border-amber-700 text-amber-700"
                : "border-transparent text-stone-500 hover:text-stone-950"
            }`}
          >
            Model Yükleme & Embed
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Merchant Banner */}
        {merchantId && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-3.5 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Merchant ID
              </p>
              <p className="mt-0.5 font-mono text-sm text-amber-900">{merchantId}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                Savaş Doğan Tekstil Pilot
              </span>
            </div>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats Grid */}
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard label="Toplam Halı" value={overview?.totals.rugs ?? 0} accent="stone" />
              <StatCard label="Widget Açılış" value={overview?.totals.widgetOpened ?? 0} accent="blue" />
              <StatCard label="AR Başlatma" value={overview?.totals.arStarted ?? 0} accent="green" />
              <StatCard label="3D Görüntüleme" value={overview?.totals.view3d ?? 0} accent="purple" />
              <StatCard label="Ürün Görüntüleme" value={overview?.totals.productViewed ?? 0} accent="stone" />
            </section>

            {/* Plan + Analytics Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Subscription Card */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-stone-900">Abonelik ve Plan Limitleri</h2>
                {subscription?.snapshot ? (
                  <div className="mt-4 space-y-4 text-sm text-stone-700">
                    <div className="flex justify-between items-center bg-stone-50 p-3 rounded-lg">
                      <span className="font-semibold text-stone-600">Mevcut Plan:</span>
                      <span className="font-bold text-stone-900">
                        {subscription.snapshot.plan} ({subscription.snapshot.status})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Halı Limiti Kullanımı</span>
                        <span>
                          {subscription.snapshot.rugCount} / {subscription.snapshot.productLimit}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-amber-600 transition-all duration-300"
                          style={{ width: `${Math.min(subscription.snapshot.usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {subscription.snapshot.trialDaysLeft != null && (
                      <div className="rounded-lg bg-amber-50 p-3 text-amber-800 text-xs font-medium">
                        Deneme Süresi: {subscription.snapshot.trialDaysLeft} gün kaldı.
                      </div>
                    )}

                    {!subscription.snapshot.canAddRug && (
                      <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg">
                        Limitinize ulaştınız. Yeni ürün eklemek için plan yükseltin.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">Abonelik kaydı bulunamadı.</p>
                )}
              </div>

              {/* Analytics Summary */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-stone-900">Son 30 Günlük Dönüşüm Analizi</h2>
                {report ? (
                  <div className="mt-4 space-y-4 text-sm text-stone-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs font-medium text-blue-600 uppercase">Widget → AR</p>
                        <p className="text-2xl font-bold mt-1 text-blue-900">
                          {report.conversion.widgetToArPercent}%
                        </p>
                      </div>
                      <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                        <p className="text-xs font-medium text-purple-600 uppercase">Ürün → 3D</p>
                        <p className="text-2xl font-bold mt-1 text-purple-900">
                          {report.conversion.productToView3dPercent}%
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        className="flex-1 inline-flex justify-center items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                        onClick={() =>
                          void downloadWithAuth(
                            `/api/v1/analytics/export?merchantId=${merchantId}`,
                            "rugvision-analytics.csv"
                          )
                        }
                      >
                        Analitik Raporunu İndir (CSV)
                      </button>
                      <button
                        className="flex-1 inline-flex justify-center items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                        onClick={() =>
                          void downloadWithAuth(
                            `/api/v1/reports/ar-acceptance?format=csv`,
                            "ar-acceptance-pilot-10.csv"
                          )
                        }
                      >
                        AR Kabul Raporu (CSV)
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">Rapor yükleniyor...</p>
                )}
              </div>
            </div>

            {/* Popular Rugs List */}
            {report && report.topRugsByAr.length > 0 && (
              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-stone-900">En Çok AR Başlatılan Halılar</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-left text-stone-500 font-semibold">
                        <th className="py-2.5 pr-4">SKU</th>
                        <th className="py-2.5 pr-4">Halı Adı</th>
                        <th className="py-2.5 text-right">AR Başlatma Sayısı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {report.topRugsByAr.map((r) => (
                        <tr key={r.rugId} className="hover:bg-stone-50/50 transition">
                          <td className="py-3 pr-4 font-mono text-xs font-bold text-stone-600">
                            {r.sku}
                          </td>
                          <td className="py-3 pr-4 font-medium text-stone-800">{r.name}</td>
                          <td className="py-3 text-right font-bold text-amber-700">{r.arStarted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab 2: Rugs Management */}
        {activeTab === "rugs" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="h-4 w-4 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Halı adı veya SKU ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2 pl-10 pr-4 text-sm text-stone-900 focus:bg-white focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>

              <button
                onClick={openAddModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 text-sm font-semibold shadow transition-all duration-150 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Yeni Halı Ekle
              </button>
            </div>

            {/* Rugs Table */}
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-left font-semibold text-stone-600">
                      <th className="px-6 py-4">Görsel</th>
                      <th className="px-6 py-4">Halı Detayı</th>
                      <th className="px-6 py-4">SKU / Boyut</th>
                      <th className="px-6 py-4">Fiyat</th>
                      <th className="px-6 py-4">Durum (Aktif)</th>
                      <th className="px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRugs.map((r) => (
                      <tr key={r.id} className="transition hover:bg-stone-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {r.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.coverImage}
                              alt={r.name}
                              className="h-12 w-12 rounded-lg border border-stone-200 object-cover bg-stone-100"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-xs text-stone-400">
                              Resim Yok
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-stone-900">{r.name}</div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            {r.category || "Kategorisiz"} &bull; {r.brand || "Markasız"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-700 font-mono font-bold">
                            {r.sku}
                          </code>
                          <div className="text-xs text-stone-500 mt-1">
                            {r.widthCm} x {r.lengthCm} cm
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-stone-950">
                          {r.price ? `${Number(r.price).toLocaleString("tr-TR")} ₺` : "0.00 ₺"}
                        </td>
                        {/* Dynamic Switch/Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={r.status === "ACTIVE"}
                              onChange={() => handleToggleStatus(r.id, r.status)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(r)}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition"
                              title="Düzenle"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRug(r.id)}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-stone-200 bg-white hover:bg-red-50 hover:text-red-600 text-stone-600 transition"
                              title="Sil"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <a
                              href={`/odamda-gor/${r.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold transition"
                            >
                              AR Önizle
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRugs.length === 0 && (
                      <tr>
                        <td className="px-6 py-12 text-center text-stone-400" colSpan={6}>
                          Arama kriterlerine uygun halı bulunamadı. Yeni bir ürün ekleyebilirsiniz.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Integration & Uploads */}
        {activeTab === "integration" && (
          <div className="grid gap-6 lg:grid-cols-2 animate-fadeIn">
            {/* Upload Area */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Model Dosyası Yükleme Merkezi</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Android (.glb) ve iOS (.usdz) formatındaki 3D modellerinizi CDN deposuna yükleyin.
                </p>
                <form onSubmit={handleUpload} className="mt-5 space-y-4">
                  <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center hover:bg-stone-100/50 transition">
                    <input
                      type="file"
                      name="file"
                      accept=".glb,.usdz,.gltf"
                      className="block w-full text-sm text-stone-650 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-800 file:cursor-pointer file:transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-stone-900 hover:bg-stone-850 text-white py-3 text-sm font-semibold shadow transition duration-150"
                  >
                    Dosyayı Güvenle Yükle
                  </button>
                  {uploadMsg && (
                    <div
                      className={`p-3 rounded-lg border text-sm mt-3 font-semibold ${
                        uploadMsg.startsWith("Yüklendi")
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      {uploadMsg}
                    </div>
                  )}
                </form>
              </div>
              <p className="mt-6 text-xs text-stone-400">
                Not: Model dosyaları R2/S3 bulut sunucularına doğrudan aktarılır ve optimize edilmiş CDN bağlantıları ile sunulur.
              </p>
            </div>

            {/* Embed Generator */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-stone-900">Hızlı Widget Entegrasyon Kodu</h2>
              <p className="mt-1 text-sm text-stone-500">
                E-ticaret sitenizdeki "Sepete Ekle" butonunun yanına otomatik "Odanda Gör" butonu eklemek için aşağıdaki kodu kullanın.
              </p>

              <label htmlFor="rug-select" className="mt-5 block text-sm font-semibold text-stone-700">
                Halı / Ürün Seçin
              </label>
              <select
                id="rug-select"
                value={selectedRugId}
                onChange={(e) => setSelectedRugId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Seçiniz</option>
                {rugs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.sku})
                  </option>
                ))}
              </select>

              {embedSnippet ? (
                <>
                  <label htmlFor="embed-code" className="mt-4 block text-sm font-semibold text-stone-700">
                    Kopyalanacak HTML Script Kodu
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
                    className="mt-3 w-full rounded-lg bg-amber-700 hover:bg-amber-800 px-4 py-3 text-sm font-semibold text-white transition active:scale-98 shadow"
                  >
                    {copied ? "Kod Panoya Kopyalandı!" : "HTML Kodunu Kopyala"}
                  </button>
                </>
              ) : (
                <div className="mt-4 rounded-lg bg-stone-50 p-6 text-center text-xs text-stone-400 border border-stone-200">
                  Lütfen yukarıdan entegrasyon kodu üretilecek bir halı seçin.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* CRUD Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
                {modalMode === "add" ? "Yeni Halı Ürünü Ekle" : "Halı Ürününü Düzenle"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-bold line-height-none p-1"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Halı Adı / Başlık
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Örn: Luna Modern Halı"
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Stok Kodu (SKU)
                      </label>
                      <input
                        type="text"
                        required
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="Örn: RV-LUNA-001"
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Slug URL
                      </label>
                      <input
                        type="text"
                        required
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        placeholder="rv-luna-001"
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Kategori
                      </label>
                      <input
                        type="text"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        placeholder="Modern, Klasik..."
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Marka / Koleksiyon
                      </label>
                      <input
                        type="text"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="Savaş Doğan..."
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Renkler (Virgülle Ayırın)
                    </label>
                    <input
                      type="text"
                      value={formColors}
                      onChange={(e) => setFormColors(e.target.value)}
                      placeholder="Mavi, Krem, Kahverengi"
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Açıklama
                    </label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Ürün açıklaması girin..."
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {/* Right Column (Dimensions & Calculator) */}
                <div className="space-y-4 bg-stone-50/50 p-4 rounded-xl border border-stone-200/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 border-b pb-2 mb-2">
                    Boyut & Fiyatlandırma Hesaplayıcı (PHP Tasarımı)
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        En (Genişlik - cm)
                      </label>
                      <input
                        type="number"
                        required
                        value={formWidth}
                        onChange={(e) => setFormWidth(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Boy (Uzunluk - cm)
                      </label>
                      <input
                        type="number"
                        required
                        value={formLength}
                        onChange={(e) => setFormLength(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Ölçü Şablonu
                      </label>
                      <select
                        value={calcSizePreset}
                        onChange={(e) => setCalcSizePreset(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      >
                        <option value="80x150">80 x 150 cm</option>
                        <option value="100x200">100 x 200 cm</option>
                        <option value="120x180">120 x 180 cm</option>
                        <option value="160x230">160 x 230 cm</option>
                        <option value="200x290">200 x 290 cm</option>
                        <option value="custom">Özel Boyut</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-750 uppercase tracking-wider text-amber-700">
                        Birim Fiyat (₺/m²)
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 500"
                        value={calcUnitPrice}
                        onChange={(e) => setCalcUnitPrice(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-amber-50/50 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex justify-between items-center text-amber-900 font-semibold">
                    <span>Hesaplanan Alan (m²):</span>
                    <span>{((formWidth * formLength) / 10000).toFixed(2)} m²</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Sonuç Toplam Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 font-bold focus:border-amber-700 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-stone-200">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Kapak Fotoğrafı URL
                    </label>
                    <input
                      type="text"
                      value={formCover}
                      onChange={(e) => setFormCover(e.target.value)}
                      placeholder="assets/images/products/RV-LUNA-001.png"
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      3D Model GLB/USDZ URL
                    </label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="/models/RV-LUNA-001.glb"
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                        Yayın Durumu
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as "ACTIVE" | "PASSIVE")}
                        className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      >
                        <option value="ACTIVE">Aktif (Sitede Görünür)</option>
                        <option value="PASSIVE">Pasif (Gizli)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-stone-300 bg-white hover:bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-700 transition"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-700 hover:bg-amber-800 px-6 py-2.5 text-sm font-semibold text-white transition shadow"
                >
                  {modalMode === "add" ? "Halıyı Kaydet" : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    stone: "border-stone-250 bg-white text-stone-900 shadow-sm hover:shadow-md",
    blue: "border-blue-200 bg-blue-50/50 text-blue-900 hover:shadow-md",
    green: "border-green-200 bg-green-50/50 text-green-900 hover:shadow-md",
    purple: "border-purple-200 bg-purple-50/50 text-purple-900 hover:shadow-md",
  };
  const labelColors = {
    stone: "text-stone-500",
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-200 ${accents[accent]}`}>
      <p className="text-3xl font-extrabold tracking-tight">{value.toLocaleString("tr-TR")}</p>
      <p className={`mt-1.5 text-xs font-semibold uppercase tracking-wider ${labelColors[accent]}`}>
        {label}
      </p>
    </div>
  );
}
