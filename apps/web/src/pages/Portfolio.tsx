import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  DollarSign,
  Download,
  RefreshCw,
  Globe,
  Lock,
  Users,
  Share2,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  Search,
  SortAsc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

import { AddTransactionModal } from "@/components/portfolio/AddTransactionModal";
import { PortfolioAdvancedMetrics } from "@/components/portfolio/AdvancedDiversification";
import { PortfolioDashboard } from "@/components/portfolio/dashboard/PortfolioDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Portfolio {
  id: string;
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  monedaBase: string;
  nivelRiesgo: string;
  modoSocial: boolean;
  esPrincipal: boolean;
  admiteBienesRaices: boolean;
  assets: Asset[];
  cash?: number;
  cashBalance?: number;
  cashByCurrency?: Record<string, number>;
  cashAccounts?: CashAccount[];
  assetsValue?: number;
  totalValue?: number;
  createdAt: string;
}

interface Asset {
  id: string;
  ticker: string;
  tipoActivo: string;
  montoInvertido: number;
  ppc: number;
  cantidad: number;
  precioActual?: number;
  createdAt: string;
  value?: number;
}

interface CashAccount {
  currency: string;
  balance: number;
}

interface Movement {
  id: string;
  fecha: string;
  tipoMovimiento: string;
  ticker: string;
  claseActivo: string;
  cantidad: number;
  precio: number;
  total: number;
}

interface PortfolioMetrics {
  capitalTotal: number;
  capitalInvertido?: number;
  assetsValue?: number;
  cashBalance?: number;
  cashByCurrency?: Record<string, number>;
  valorActual: number;
  totalValue?: number;
  gananciaTotal: number;
  variacionPorcentual: number;
  diversificacionPorClase: Record<string, number>;
  diversificacionPorActivo: Record<string, number>;
  cantidadActivos: number;
}

type SortKey = "value" | "return" | "weight" | "name";
type PrivacyMode = "private" | "followers" | "public";

const getInitialPortfolioForm = () => ({
  nombre: "",
  descripcion: "",
  objetivo: "largo plazo",
  monedaBase: "USD",
  nivelRiesgo: "medio",
  modoSocial: false,
  esPrincipal: false,
  admiteBienesRaices: false,
});

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function fmtCompact(value: number, currency = "USD") {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency} ${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${currency} ${(abs / 1_000).toFixed(1)}K`;
  return fmtCurrency(value, currency);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PrivacyBadge({ mode }: { mode: PrivacyMode }) {
  const map = {
    private: { label: "Privado", Icon: Lock, cls: "border-zinc-700 text-zinc-400" },
    followers: { label: "Seguidores", Icon: Users, cls: "border-blue-500/40 text-blue-400" },
    public: { label: "Público", Icon: Globe, cls: "border-emerald-500/40 text-emerald-400" },
  };
  const { label, Icon, cls } = map[mode];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function StatPill({ label, value, delta, positive, currency }: {
  label: string; value: number; delta?: number; positive: boolean; currency: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-extrabold tracking-tight tabular-nums", positive ? "text-emerald-400" : "text-red-400")}>
        {fmtCompact(value, currency)}
      </p>
      {delta !== undefined && (
        <span className={cn("text-[11px] font-bold", positive ? "text-emerald-500" : "text-red-500")}>
          {fmtPct(delta)}
        </span>
      )}
    </div>
  );
}

function AssetRow({ asset, totalPortfolioValue, currency, onSell }: {
  asset: Asset; totalPortfolioValue: number; currency: string; onSell: () => void;
}) {
  const price = asset.precioActual ?? asset.ppc;
  const currentValue = asset.value ?? asset.cantidad * price;
  const pnl = currentValue - asset.montoInvertido;
  const pct = asset.montoInvertido > 0 ? (pnl / asset.montoInvertido) * 100 : 0;
  const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
  const isUp = pct >= 0;
  const ticker = asset.ticker.toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 transition-all hover:border-border/60 hover:bg-card/50"
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-black"
        style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
        {ticker.slice(0, 3)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14px] leading-tight truncate">{ticker}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {asset.cantidad.toFixed(4)} unid. · PPC {fmtCurrency(asset.ppc, currency)}
        </p>
      </div>

      {/* Weight bar */}
      <div className="hidden sm:flex flex-col items-end gap-1 w-20">
        <span className="text-[10px] text-muted-foreground font-medium">{weight.toFixed(1)}%</span>
        <div className="w-full h-1 rounded-full bg-border/50">
          <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(weight, 100)}%` }} />
        </div>
      </div>

      {/* Price */}
      <div className="hidden md:block text-right min-w-[80px]">
        <p className="text-[13px] font-semibold tabular-nums">{fmtCurrency(price, currency)}</p>
        <p className="text-[10px] text-muted-foreground">precio actual</p>
      </div>

      {/* Value */}
      <div className="text-right min-w-[90px]">
        <p className="text-[14px] font-bold tabular-nums">{fmtCompact(currentValue, currency)}</p>
        <p className={cn("text-[11px] font-semibold", isUp ? "text-emerald-500" : "text-red-500")}>
          {isUp ? <ArrowUpRight className="inline w-3 h-3" /> : <ArrowDownRight className="inline w-3 h-3" />}
          {fmtPct(pct)}
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={onSell}
        className="hidden group-hover:flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/20 shrink-0"
      >
        <Minus className="w-3 h-3" /> Vender
      </button>
    </motion.div>
  );
}

function MovementRow({ movement, currency }: { movement: Movement; currency: string }) {
  const isCompra = movement.tipoMovimiento === "compra";
  const isVenta = movement.tipoMovimiento === "venta";
  const typeColor = isCompra ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : isVenta ? "text-red-400 bg-red-500/10 border-red-500/20"
      : "text-blue-400 bg-blue-500/10 border-blue-500/20";

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/20 transition-colors">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", typeColor)}>
        {isCompra ? <TrendingUp className="w-3.5 h-3.5" /> : isVenta ? <TrendingDown className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold">{movement.ticker}</p>
        <p className="text-[11px] text-muted-foreground">
          {new Date(movement.fecha).toLocaleDateString("es-AR")} · {movement.cantidad.toFixed(4)} × {fmtCurrency(movement.precio, currency)}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-[13px] font-bold tabular-nums", isVenta ? "text-red-400" : "text-emerald-400")}>
          {isVenta ? "-" : "+"}{fmtCompact(movement.total, currency)}
        </p>
        <span className={cn("text-[10px] font-semibold border rounded-full px-2 py-0.5", typeColor)}>
          {movement.tipoMovimiento}
        </span>
      </div>
    </div>
  );
}

function EmptyPortfolio({ onAdd, isFirstCreation }: { onAdd: () => void, isFirstCreation?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
        style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
        <BarChart3 className="w-10 h-10" style={{ color: "hsl(var(--primary))" }} />
      </div>
      <h2 className="text-2xl font-bold mb-2">
        {isFirstCreation ? "Creá tu portfolio" : "Tu portfolio está vacío"}
      </h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        {isFirstCreation
          ? "Configurá tu portfolio principal para empezar a organizar y medir tus inversiones."
          : "Empezá agregando tu primera inversión y seguí el rendimiento de tus activos en tiempo real."}
      </p>
      <Button onClick={onAdd} className="gap-2 h-12 px-6 text-sm font-bold rounded-2xl shadow-glow">
        <Plus className="w-4 h-4" />
        {isFirstCreation ? "Crear perfil de inversión" : "Agregar primer activo"}
      </Button>
      <p className="mt-4 text-[11px] text-muted-foreground">
        La información mostrada tiene fines informativos y no constituye asesoramiento financiero.
      </p>
    </motion.div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 rounded-3xl bg-muted/30" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted/20" />)}
      </div>
      <div className="h-80 rounded-3xl bg-muted/20" />
      <div className="h-64 rounded-3xl bg-muted/20" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PortfolioPage = () => {
  const t = useTranslation();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI state
  const [hideValues, setHideValues] = useState(false);
  const [createPortfolioOpen, setCreatePortfolioOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"BUY" | "SELL">("BUY");
  const [modalInitialSymbol, setModalInitialSymbol] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // Currency
  const [viewCurrency, setViewCurrency] = useState<"ARS" | "USD" | null>(null);
  const [mepRate, setMepRate] = useState<number | null>(null);

  // Forms
  const [portfolioForm, setPortfolioForm] = useState(getInitialPortfolioForm);

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    void loadPortfolios();
    apiFetch("/market/dolar/mep")
      .then((r) => r.json())
      .then((d) => setMepRate(d.venta || d.compra || null))
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPortfolio?.id) {
      void loadMetrics(selectedPortfolio.id);
      void loadMovements(selectedPortfolio.id);
      return;
    }
    setMetrics(null);
    setMovements([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPortfolio?.id]);

  const loadPortfolios = useCallback(async (preferredId?: string) => {
    setLoading(true);
    try {
      const res = await apiFetch("/portfolios");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudieron cargar los portafolios (Error del servidor)");
      }
      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Respuesta inválida del servidor");

      const list: Portfolio[] = Array.isArray(data) ? data : [];
      setPortfolios(list);
      setErrorMessage(null);
      if (!list.length) { setSelectedPortfolio(null); return; }
      setSelectedPortfolio((cur) => {
        if (preferredId) return list.find((p) => p.id === preferredId) || list[0];
        if (cur?.id) return list.find((p) => p.id === cur.id) || list[0];
        return list[0];
      });
    } catch (e: any) {
      setPortfolios([]);
      setSelectedPortfolio(null);
      setErrorMessage(e?.message || "No se pudieron cargar los portafolios");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = async (id: string) => {
    try {
      const res = await apiFetch(`/portfolios/${id}/metrics`);
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => null);
      setMetrics(data || null);
    } catch {
      setMetrics(null);
    }
  };

  const loadMovements = async (id: string) => {
    try {
      const res = await apiFetch(`/portfolios/${id}/movements`);
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => null);
      setMovements(Array.isArray(data) ? data : []);
    } catch {
      setMovements([]);
    }
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createPortfolio = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch("/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioForm),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Error");
      const newP = await res.json();
      setCreatePortfolioOpen(false);
      setPortfolioForm(getInitialPortfolioForm());
      await loadPortfolios(newP?.id);
    } catch (e: any) {
      alert(e?.message || "No se pudo crear el portafolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateVisibility = async (modoSocial: boolean) => {
    if (!selectedPortfolio) return;
    setIsUpdatingVisibility(true);
    try {
      const res = await apiFetch(`/portfolios/${selectedPortfolio.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modoSocial }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      await loadPortfolios(updated?.id || selectedPortfolio.id);
    } catch {
      /* silent */
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const deletePortfolio = async (id: string) => {
    if (!confirm(t.portfolio.deleteConfirm)) return;
    try {
      await apiFetch(`/portfolios/${id}`, { method: "DELETE" });
      await loadPortfolios();
    } catch {/* silent */ }
  };

  // ── Conversion ───────────────────────────────────────────────────────────────
  const activeCurrency = viewCurrency || selectedPortfolio?.monedaBase || "USD";
  const conversionRate = useMemo(() => {
    if (!mepRate || !selectedPortfolio) return 1;
    if (selectedPortfolio.monedaBase === "ARS" && activeCurrency === "USD") return 1 / mepRate;
    if (selectedPortfolio.monedaBase === "USD" && activeCurrency === "ARS") return mepRate;
    return 1;
  }, [mepRate, activeCurrency, selectedPortfolio?.monedaBase]);

  const { displayPortfolio, displayMetrics, displayMovements } = useMemo((): {
    displayPortfolio: Portfolio | null;
    displayMetrics: PortfolioMetrics | null;
    displayMovements: Movement[];
  } => {
    if (!selectedPortfolio || conversionRate === 1) {
      return { displayPortfolio: selectedPortfolio, displayMetrics: metrics, displayMovements: movements };
    }
    const p = { ...selectedPortfolio, monedaBase: activeCurrency };
    p.totalValue = (p.totalValue || 0) * conversionRate;
    p.assetsValue = (p.assetsValue || 0) * conversionRate;
    p.cashBalance = (p.cashBalance || 0) * conversionRate;
    p.cash = (p.cash || 0) * conversionRate;
    p.assets = (p.assets || []).map((a) => ({
      ...a,
      montoInvertido: a.montoInvertido * conversionRate,
      ppc: a.ppc * conversionRate,
      precioActual: a.precioActual ? a.precioActual * conversionRate : undefined,
      value: a.value ? a.value * conversionRate : undefined,
    }));
    const m = metrics ? {
      ...metrics,
      capitalTotal: metrics.capitalTotal * conversionRate,
      capitalInvertido: (metrics.capitalInvertido || 0) * conversionRate,
      assetsValue: (metrics.assetsValue || 0) * conversionRate,
      cashBalance: (metrics.cashBalance || 0) * conversionRate,
      valorActual: metrics.valorActual * conversionRate,
      totalValue: (metrics.totalValue || 0) * conversionRate,
      gananciaTotal: metrics.gananciaTotal * conversionRate,
    } : null;
    return {
      displayPortfolio: p as Portfolio,
      displayMetrics: m,
      displayMovements: movements.map((mv) => ({ ...mv, precio: mv.precio * conversionRate, total: mv.total * conversionRate })),
    };
  }, [selectedPortfolio, metrics, movements, conversionRate, activeCurrency]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const totalValue = displayMetrics?.totalValue ?? displayMetrics?.valorActual ?? displayPortfolio?.totalValue ?? 0;
  const assetsValue = displayMetrics?.assetsValue ?? displayPortfolio?.assetsValue ?? 0;
  const cashBalance = displayMetrics?.cashBalance ?? displayPortfolio?.cashBalance ?? displayPortfolio?.cash ?? 0;
  const pnl = displayMetrics?.gananciaTotal ?? 0;
  const pnlPct = displayMetrics?.variacionPorcentual ?? 0;
  const currency = displayPortfolio?.monedaBase ?? "USD";
  const privacyMode: PrivacyMode = selectedPortfolio?.modoSocial ? "public" : "private";

  // ── Asset processing ─────────────────────────────────────────────────────────
  const sortedAssets = useMemo(() => {
    const assets = displayPortfolio?.assets ?? [];
    const filtered = assetSearch
      ? assets.filter((a) => a.ticker.toLowerCase().includes(assetSearch.toLowerCase()))
      : assets;
    return [...filtered].sort((a, b) => {
      const aPrice = a.precioActual ?? a.ppc;
      const bPrice = b.precioActual ?? b.ppc;
      const aVal = a.value ?? a.cantidad * aPrice;
      const bVal = b.value ?? b.cantidad * bPrice;
      if (sortKey === "value") return bVal - aVal;
      if (sortKey === "name") return a.ticker.localeCompare(b.ticker);
      if (sortKey === "return") {
        const aR = a.montoInvertido > 0 ? (aVal - a.montoInvertido) / a.montoInvertido : 0;
        const bR = b.montoInvertido > 0 ? (bVal - b.montoInvertido) / b.montoInvertido : 0;
        return bR - aR;
      }
      if (sortKey === "weight") return bVal - aVal;
      return 0;
    });
  }, [displayPortfolio?.assets, assetSearch, sortKey]);

  // ── Activity filter ──────────────────────────────────────────────────────────
  const filteredMovements = useMemo(() =>
    activityFilter === "all" ? displayMovements : displayMovements.filter((m) => m.tipoMovimiento === activityFilter),
    [displayMovements, activityFilter]
  );

  const mask = (v: string) => hideValues ? "••••••" : v;

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen flex items-center justify-center"><PortfolioSkeleton /></div>;

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 xl:px-8 space-y-6 py-6">

        {/* ── HERO HEADER ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-border/60"
          style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.6) 100%)" }}>
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 opacity-40"
            style={{ background: "radial-gradient(ellipse 60% 50% at 20% 30%, hsl(var(--primary) / 0.18), transparent), radial-gradient(ellipse 40% 60% at 80% 70%, hsl(159 84% 42% / 0.12), transparent)" }} />

          <div className="relative px-6 py-8 md:px-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Left: title + value */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {selectedPortfolio && (
                    <>
                      <h1 className="text-lg font-bold text-muted-foreground">{selectedPortfolio.nombre}</h1>
                      <PrivacyBadge mode={privacyMode} />
                      {selectedPortfolio.esPrincipal && (
                        <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">Principal</Badge>
                      )}
                    </>
                  )}
                  {!selectedPortfolio && <h1 className="text-2xl font-bold">Mi Portfolio</h1>}
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-2">Valor total</p>
                  <div className="flex items-end gap-4 flex-wrap">
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums">
                      {mask(fmtCurrency(totalValue, currency))}
                    </span>
                    {displayPortfolio && (
                      <div className={cn("flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-bold",
                        pnl >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                        {pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {mask(fmtCompact(pnl, currency))} ({fmtPct(pnlPct)})
                      </div>
                    )}
                  </div>
                </div>

                {displayPortfolio && (
                  <div className="flex flex-wrap gap-4 pt-1">
                    <StatPill label="Activos" value={assetsValue} positive={true} currency={currency} />
                    <div className="w-px h-10 bg-border/40 self-center" />
                    <StatPill label="Efectivo" value={cashBalance} positive={true} currency={currency} />
                    <div className="w-px h-10 bg-border/40 self-center" />
                    <StatPill label="G/P Total" value={pnl} delta={pnlPct} positive={pnl >= 0} currency={currency} />
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Hide values */}
                  <button onClick={() => setHideValues(!hideValues)}
                    className="w-9 h-9 rounded-xl border border-border/60 bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    title={hideValues ? "Mostrar valores" : "Ocultar valores"}>
                    {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Currency toggle */}
                  {mepRate && displayPortfolio && (
                    <button onClick={() => setViewCurrency(activeCurrency === "ARS" ? "USD" : "ARS")}
                      className="h-9 rounded-xl border border-border/60 bg-card/60 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                      title={`MEP ref: $${mepRate.toFixed(0)}`}>
                      {activeCurrency === "ARS" ? "USD" : "ARS"} <RefreshCw className="inline w-3 h-3 ml-1" />
                    </button>
                  )}

                  {/* Privacy toggle */}
                  {selectedPortfolio && (
                    <button onClick={() => updateVisibility(!selectedPortfolio.modoSocial)}
                      disabled={isUpdatingVisibility}
                      className="h-9 rounded-xl border border-border/60 bg-card/60 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors gap-2 flex items-center">
                      {selectedPortfolio.modoSocial ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {selectedPortfolio.modoSocial ? "Público" : "Privado"}
                    </button>
                  )}

                  {/* Share */}
                  <button className="w-9 h-9 rounded-xl border border-border/60 bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Add asset */}
                  {displayPortfolio && (
                    <Button size="sm" className="gap-1.5 h-9 rounded-xl font-semibold"
                      onClick={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }}>
                      <Plus className="w-4 h-4" /> Agregar activo
                    </Button>
                  )}

                  {/* Create portfolio */}
                  {portfolios.length === 0 && (
                    <Dialog open={createPortfolioOpen} onOpenChange={setCreatePortfolioOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl border-primary/40 text-primary hover:bg-primary/10">
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Crear Portfolio</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                          <DialogTitle>{t.portfolio.createTitle}</DialogTitle>
                          <DialogDescription>{t.portfolio.createDesc}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>{t.portfolio.form.name} *</Label>
                            <Input placeholder={t.portfolio.form.namePlaceholder} value={portfolioForm.nombre}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, nombre: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>{t.portfolio.form.desc}</Label>
                            <Textarea placeholder={t.portfolio.form.descPlaceholder} value={portfolioForm.descripcion}
                              onChange={(e) => setPortfolioForm({ ...portfolioForm, descripcion: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t.portfolio.form.baseCurrency}</Label>
                              <Select value={portfolioForm.monedaBase} onValueChange={(v) => setPortfolioForm({ ...portfolioForm, monedaBase: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="ARS">ARS</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t.portfolio.form.riskLevel}</Label>
                              <Select value={portfolioForm.nivelRiesgo} onValueChange={(v) => setPortfolioForm({ ...portfolioForm, nivelRiesgo: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bajo">Bajo</SelectItem>
                                  <SelectItem value="medio">Medio</SelectItem>
                                  <SelectItem value="alto">Alto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div><Label>Modo social</Label><p className="text-xs text-muted-foreground">Visible para tus seguidores</p></div>
                            <Switch checked={portfolioForm.modoSocial} onCheckedChange={(v) => setPortfolioForm({ ...portfolioForm, modoSocial: v })} />
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div><Label>Portfolio principal</Label><p className="text-xs text-muted-foreground">Se muestra en tu perfil</p></div>
                            <Switch checked={portfolioForm.esPrincipal} onCheckedChange={(v) => setPortfolioForm({ ...portfolioForm, esPrincipal: v })} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreatePortfolioOpen(false)}>Cancelar</Button>
                          <Button onClick={createPortfolio} disabled={!portfolioForm.nombre || isSubmitting}>
                            {isSubmitting ? "Creando..." : "Crear portfolio"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Delete */}
                  {selectedPortfolio && (
                    <button onClick={() => deletePortfolio(selectedPortfolio.id)}
                      className="w-9 h-9 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Eliminar Portfolio">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── ERROR ────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-red-500/40 bg-red-500/5">
                <CardContent className="p-4 text-sm text-red-300 flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => loadPortfolios()}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reintentar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PORTFOLIO SELECTOR (Hidden for single-portfolio enforcement) ────────────────── */}

        {/* ── EMPTY STATE ──────────────────────────────────────────────────────── */}
        {!displayPortfolio && !loading && (
          <EmptyPortfolio
            isFirstCreation={portfolios.length === 0}
            onAdd={() => {
              if (portfolios.length > 0) { setModalMode("BUY"); setAddAssetOpen(true); }
              else {
                // Pre-set as principal
                setPortfolioForm(prev => ({ ...prev, esPrincipal: true, nombre: "Mi Portfolio Principal" }));
                setCreatePortfolioOpen(true);
              }
            }}
          />
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
        {displayPortfolio && (
          <div className="space-y-6">
            {/* ── Dashboard charts (Performance + Allocation) */}
            <PortfolioDashboard
              portfolioName={displayPortfolio.nombre}
              currency={currency}
              metrics={displayMetrics}
              assets={displayPortfolio.assets}
              movements={movements}
            />

            {/* ── HOLDINGS ─────────────────────────────────────────────────────── */}
            <Card className="border-border/60 bg-card/80">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold">Mis activos</CardTitle>
                    <Badge variant="secondary" className="text-xs">{displayPortfolio.assets.length} posiciones</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="AAPL, BTC..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="w-32 pl-8 pr-3 h-8 text-[12px] rounded-xl border border-border/60 bg-background outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    {/* Sort */}
                    <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                      <SelectTrigger className="h-8 text-xs w-32 rounded-xl border-border/60">
                        <SortAsc className="w-3.5 h-3.5 mr-1" /><SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value">Por valor</SelectItem>
                        <SelectItem value="return">Por retorno</SelectItem>
                        <SelectItem value="weight">Por peso</SelectItem>
                        <SelectItem value="name">Por nombre</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Buy */}
                    <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs"
                      onClick={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }}>
                      <Plus className="w-3.5 h-3.5" /> Comprar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {sortedAssets.length === 0 ? (
                  <EmptyPortfolio onAdd={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }} isFirstCreation={false} />
                ) : (
                  <div className="space-y-1">
                    {sortedAssets.map((asset) => (
                      <AssetRow key={asset.id} asset={asset} totalPortfolioValue={totalValue} currency={currency}
                        onSell={() => { setModalMode("SELL"); setModalInitialSymbol(asset.ticker); setAddAssetOpen(true); }} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── ACTIVITY + DIVERSIFICATION Grid ─────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              {/* Activity */}
              <Card className="border-border/60 bg-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base font-bold">Actividad</CardTitle>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["all", "compra", "venta"].map((f) => (
                        <button key={f} onClick={() => setActivityFilter(f)}
                          className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors",
                            activityFilter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                          {f === "all" ? "Todo" : f === "compra" ? "Compras" : "Ventas"}
                        </button>
                      ))}
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 rounded-lg ml-1">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {filteredMovements.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center gap-2">
                      <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Sin movimientos en este período</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredMovements.slice(0, 12).map((mv) => (
                        <MovementRow key={mv.id} movement={mv} currency={currency} />
                      ))}
                      {filteredMovements.length > 12 && (
                        <button className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                          Ver más <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick insights */}
              <div className="space-y-4">
                {/* Cash Card */}
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Efectivo disponible</p>
                        <p className="mt-1 text-2xl font-extrabold text-emerald-400 tabular-nums">{mask(fmtCurrency(cashBalance, currency))}</p>
                      </div>
                      <DollarSign className="w-5 h-5 text-emerald-500/50 mt-1" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Listo para reinvertir</p>
                  </CardContent>
                </Card>

                {/* Insights */}
                {displayPortfolio.assets.length > 0 && (
                  <Card className="border-border/60 bg-card/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Top winner */}
                      {(() => {
                        const top = [...(displayPortfolio.assets)].sort((a, b) => {
                          const aP = a.precioActual ?? a.ppc;
                          const bP = b.precioActual ?? b.ppc;
                          const aR = a.montoInvertido > 0 ? ((a.cantidad * aP - a.montoInvertido) / a.montoInvertido) : 0;
                          const bR = b.montoInvertido > 0 ? ((b.cantidad * bP - b.montoInvertido) / b.montoInvertido) : 0;
                          return bR - aR;
                        });
                        const best = top[0];
                        const worst = top[top.length - 1];
                        const bestPrice = best?.precioActual ?? best?.ppc ?? 0;
                        const bestR = best && best.montoInvertido > 0 ? ((best.cantidad * bestPrice - best.montoInvertido) / best.montoInvertido) * 100 : 0;
                        const worstPrice = worst?.precioActual ?? worst?.ppc ?? 0;
                        const worstR = worst && worst.montoInvertido > 0 ? ((worst.cantidad * worstPrice - worst.montoInvertido) / worst.montoInvertido) * 100 : 0;
                        return (
                          <>
                            {best && (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                                <span className="text-lg">🥇</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold">{best.ticker}</p>
                                  <p className="text-[10px] text-muted-foreground">Mejor rendimiento</p>
                                </div>
                                <span className="text-[13px] font-bold text-emerald-400">{fmtPct(bestR)}</span>
                              </div>
                            )}
                            {worst && worst.id !== best?.id && (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
                                <span className="text-lg">📉</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold">{worst.ticker}</p>
                                  <p className="text-[10px] text-muted-foreground">Mayor drawdown</p>
                                </div>
                                <span className="text-[13px] font-bold text-red-400">{fmtPct(worstR)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                              <span className="text-lg">📊</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold">{displayPortfolio.assets.length} activos</p>
                                <p className="text-[10px] text-muted-foreground">en el portfolio</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </>
                        );
                      })()}
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1">
                        Información con fines educativos. No constituye asesoramiento financiero.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* ── ADVANCED METRICS (collapsible) ───────────────────────────────── */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-border/60 bg-card/50 hover:bg-card/80 transition-colors text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Análisis avanzado de diversificación
              </span>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showAdvanced && displayMetrics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <PortfolioAdvancedMetrics metrics={displayMetrics} assets={displayPortfolio.assets} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── AddTransaction Modal ─────────────────────────────────────────────── */}
        {displayPortfolio && (
          <AddTransactionModal
            open={addAssetOpen}
            onOpenChange={setAddAssetOpen}
            portfolioId={displayPortfolio.id}
            mode={modalMode}
            initialSymbol={modalInitialSymbol}
            portfolioAssets={displayPortfolio.assets}
            onSuccess={() => void loadPortfolios(displayPortfolio.id)}
          />
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
