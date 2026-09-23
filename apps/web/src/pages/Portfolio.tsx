import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, isProUser } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { ProGate } from "@/components/ProGate";
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
  Trophy,
  PieChart,
  Wallet,
  X,
  Check,
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
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AssetRowInfo } from "@/components/AssetBadge";

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
  isCedear?: boolean;
  cedearRatio?: number | null;
  underlyingTicker?: string | null;
  underlyingExchange?: string | null;
  variacionDiaria?: number | null;
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
  const safe = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

function fmtPct(value: number) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${safe >= 0 ? "+" : ""}${safe.toFixed(2)}%`;
}

function fmtCompact(value: number, currency = "USD") {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${currency} ${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${currency} ${(abs / 1_000).toFixed(1)}K`;
  return fmtCurrency(safe, currency);
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

function StatCard({
  label,
  value,
  delta,
  positive,
  currency,
  icon: Icon,
  hideValues,
}: {
  label: string;
  value: number;
  delta?: number;
  positive?: boolean;
  currency: string;
  icon?: any;
  hideValues?: boolean;
}) {
  const isPos = positive ?? (delta !== undefined ? delta >= 0 : true);
  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-3.5 shadow-xs transition-all hover:border-border/80">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/60" />}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className="text-xl sm:text-2xl font-black tracking-tight tabular-nums text-foreground">
          {hideValues ? "••••••" : fmtCompact(value, currency)}
        </p>
        {delta !== undefined && (
          <span className={cn("text-xs font-bold flex items-center gap-0.5", isPos ? "text-emerald-500" : "text-red-500")}>
            {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {fmtPct(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function normalizeTickerSymbol(ticker: string): string {
  let t = ticker.toUpperCase();
  if (t.startsWith('MOCK:')) {
    const symbolOnly = t.split(':')[1] || '';
    const argentineAssets = ['AL30', 'GD30', 'GGAL', 'YPFD', 'PAMP', 'CEPU', 'BMA', 'EDN', 'LOMA', 'TGS', 'YPF'];
    const exchange = argentineAssets.includes(symbolOnly) ? 'BCBA' : 'NASDAQ';
    return `${exchange}:${symbolOnly}`;
  }
  // If no exchange prefix, try to infer
  if (!t.includes(':') && t.length >= 2) {
    const argentineAssets = ['AL30', 'GD30', 'GGAL', 'YPFD', 'PAMP', 'CEPU', 'BMA', 'EDN', 'LOMA', 'TGS'];
    return argentineAssets.includes(t) ? `BCBA:${t}` : `NASDAQ:${t}`;
  }
  return t;
}

function AssetRow({
  asset,
  totalPortfolioValue,
  currency,
  onSell,
  onBuy,
  hideValues,
}: {
  asset: Asset;
  totalPortfolioValue: number;
  currency: string;
  onSell: () => void;
  onBuy: () => void;
  hideValues?: boolean;
}) {
  const price = asset.precioActual ?? asset.ppc;
  const currentValue = asset.value ?? asset.cantidad * price;
  const pnl = currentValue - asset.montoInvertido;
  const pct = asset.montoInvertido > 0 ? (pnl / asset.montoInvertido) * 100 : 0;
  const weight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
  const isUp = pct >= 0;
  const symbol = normalizeTickerSymbol(asset.ticker);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col md:grid md:grid-cols-[1fr_80px_100px_110px_90px] items-start md:items-center gap-3 rounded-2xl border border-border/40 hover:border-border/80 bg-card/40 hover:bg-card/90 px-4 py-3.5 transition-all shadow-2xs hover:shadow-xs"
    >
      {/* 1: Logo + Exchange + Name */}
      <div className="w-full md:w-auto min-w-0 flex items-center justify-between md:justify-start">
        <AssetRowInfo
          symbol={symbol}
          subtext={`${asset.cantidad.toFixed(4)} unid. · PPC ${fmtCurrency(asset.ppc, currency)}${
            asset.cedearRatio ? ` · Ratio ${asset.cedearRatio}:1 (${asset.underlyingTicker || ''})` : ''
          }`}
          size="md"
          showLivePrice={false}
          className="flex-1 min-w-0"
        />
        {/* Mobile-only value preview */}
        <div className="flex md:hidden flex-col items-end shrink-0 pl-2">
          <p className="text-sm font-bold tabular-nums">
            {hideValues ? "••••••" : fmtCompact(currentValue, currency)}
          </p>
          <span className={cn("text-xs font-bold flex items-center gap-0.5", isUp ? "text-emerald-500" : "text-red-500")}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {fmtPct(pct)}
          </span>
        </div>
      </div>

      {/* 2: Weight bar */}
      <div className="hidden md:flex flex-col items-end gap-1 w-full">
        <span className="text-[11px] text-muted-foreground font-semibold tabular-nums">{weight.toFixed(1)}%</span>
        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
            style={{ width: `${Math.min(weight, 100)}%` }}
          />
        </div>
      </div>

      {/* 3: Price */}
      <div className="hidden md:block text-right w-full">
        <p className="text-[13px] font-semibold tabular-nums text-foreground">{fmtCurrency(price, currency)}</p>
        <p className="text-[10px] text-muted-foreground font-medium">cotización</p>
      </div>

      {/* 4: Value & PnL */}
      <div className="hidden md:block text-right w-full">
        <p className="text-[14px] font-bold tabular-nums text-foreground">
          {hideValues ? "••••••" : fmtCompact(currentValue, currency)}
        </p>
        <p className={cn("text-[11px] font-bold flex items-center justify-end gap-0.5", isUp ? "text-emerald-500" : "text-red-500")}>
          {isUp ? <ArrowUpRight className="inline w-3 h-3" /> : <ArrowDownRight className="inline w-3 h-3" />}
          {fmtPct(pct)}
        </p>
      </div>

      {/* 5: Quick actions (Mobile & Desktop) */}
      <div className="w-full md:w-auto flex items-center justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-border/30 shrink-0">
        <button
          onClick={onBuy}
          title={`Comprar más ${asset.ticker}`}
          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" /> <span className="md:hidden">Comprar</span>
        </button>
        <button
          onClick={onSell}
          title={`Vender ${asset.ticker}`}
          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold transition-all cursor-pointer"
        >
          <Minus className="w-3 h-3" /> <span className="md:hidden">Vender</span>
        </button>
      </div>
    </motion.div>
  );
}

function MovementRow({ movement, currency }: { movement: Movement; currency: string }) {
  const isCompra = movement.tipoMovimiento === "compra";
  const isVenta = movement.tipoMovimiento === "venta";
  const typeColor = isCompra ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : isVenta ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
      : "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20";

  const symbol = normalizeTickerSymbol(movement.ticker);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/20 transition-colors">
      {/* Type icon */}
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", typeColor)}>
        {isCompra ? <TrendingUp className="w-3.5 h-3.5" /> : isVenta ? <TrendingDown className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
      </div>

      {/* Asset info with logo + exchange + name */}
      <AssetRowInfo
        symbol={symbol}
        subtext={`${new Date(movement.fecha).toLocaleDateString("es-AR")} · ${movement.cantidad.toFixed(4)} × ${fmtCurrency(movement.precio, currency)}`}
        size="sm"
        className="flex-1 min-w-0"
      />

      {/* Values */}
      <div className="text-right shrink-0">
        <p className={cn("text-[13px] font-bold tabular-nums", isVenta ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isPro = isProUser(user);

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
  const [assetClassFilter, setAssetClassFilter] = useState<string>("all");
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Currency
  const [viewCurrency, setViewCurrency] = useState<"ARS" | "USD" | null>(null);
  const [mepRate, setMepRate] = useState<number | null>(null);
  const [cclRate, setCclRate] = useState<number | null>(null);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);

  // Forms
  const [portfolioForm, setPortfolioForm] = useState(getInitialPortfolioForm);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadPortfolios = useCallback(async (preferredId?: string) => {
    if (!isPro) {
      setLoading(false);
      return;
    }
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

  const loadRates = useCallback(async () => {
    if (!isPro) return;
    try {
      const r = await apiFetch("/market/dolar/rates");
      if (r.ok) {
        const rates = await r.json();
        if (Array.isArray(rates)) {
          const mep = rates.find((rateItem: any) => rateItem.id === 'mep')?.sell;
          const ccl = rates.find((rateItem: any) => rateItem.id === 'ccl')?.sell;
          if (mep) setMepRate(mep);
          if (ccl) setCclRate(ccl);
          if (rates[0]?.updatedAt) setRateUpdatedAt(rates[0].updatedAt);
        }
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (!isPro) {
      setLoading(false);
      return;
    }
    void loadPortfolios();
    void loadRates();

    const handleFocus = () => {
      void loadPortfolios();
      void loadRates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isPro, loadPortfolios, loadRates]);

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
    const fx = cclRate || mepRate;
    if (!fx || !selectedPortfolio) return 1;
    if (selectedPortfolio.monedaBase === "ARS" && activeCurrency === "USD") return 1 / fx;
    if (selectedPortfolio.monedaBase === "USD" && activeCurrency === "ARS") return fx;
    return 1;
  }, [cclRate, mepRate, activeCurrency, selectedPortfolio?.monedaBase]);

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

  // ── Asset filters & counts ───────────────────────────────────────────────────
  const ASSET_CLASS_FILTERS = [
    { id: "all", label: "Todos" },
    { id: "acciones", label: "Acciones & CEDEARs" },
    { id: "cripto", label: "Criptomonedas" },
    { id: "bonos", label: "Bonos / Renta Fija" },
    { id: "etf", label: "ETFs" },
  ];

  const assetClassCounts = useMemo(() => {
    const assets = displayPortfolio?.assets ?? [];
    const counts: Record<string, number> = { all: assets.length, acciones: 0, cripto: 0, bonos: 0, etf: 0 };
    for (const a of assets) {
      const t = (a.tipoActivo || "").toLowerCase();
      if (t.includes("accion") || t.includes("cedear") || t.includes("stock") || t.includes("equity")) counts.acciones++;
      else if (t.includes("cripto") || t.includes("crypto")) counts.cripto++;
      else if (t.includes("bono") || t.includes("bond") || t.includes("fij")) counts.bonos++;
      else if (t.includes("etf")) counts.etf++;
    }
    return counts;
  }, [displayPortfolio?.assets]);

  // ── Asset processing ─────────────────────────────────────────────────────────
  const sortedAssets = useMemo(() => {
    const assets = displayPortfolio?.assets ?? [];
    let filtered = assetSearch.trim()
      ? assets.filter((a) => a.ticker.toLowerCase().includes(assetSearch.trim().toLowerCase()))
      : assets;

    if (assetClassFilter !== "all") {
      filtered = filtered.filter((a) => {
        const t = (a.tipoActivo || "").toLowerCase();
        if (assetClassFilter === "acciones") return t.includes("accion") || t.includes("cedear") || t.includes("stock") || t.includes("equity");
        if (assetClassFilter === "cripto") return t.includes("cripto") || t.includes("crypto");
        if (assetClassFilter === "bonos") return t.includes("bono") || t.includes("bond") || t.includes("fij");
        if (assetClassFilter === "etf") return t.includes("etf");
        return true;
      });
    }

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
  }, [displayPortfolio?.assets, assetSearch, assetClassFilter, sortKey]);

  // ── Activity filter & CSV export ─────────────────────────────────────────────
  const filteredMovements = useMemo(() =>
    activityFilter === "all" ? displayMovements : displayMovements.filter((m) => m.tipoMovimiento === activityFilter),
    [displayMovements, activityFilter]
  );

  const exportMovementsCSV = () => {
    if (!filteredMovements.length) return;
    const headers = ["Fecha", "Tipo", "Ticker", "Clase", "Cantidad", "Precio", "Total", "Moneda"];
    const rows = filteredMovements.map(m => [
      `"${new Date(m.fecha).toLocaleDateString("es-AR")}"`,
      `"${m.tipoMovimiento}"`,
      `"${m.ticker}"`,
      `"${m.claseActivo || ''}"`,
      m.cantidad,
      m.precio.toFixed(2),
      m.total.toFixed(2),
      `"${currency}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finix-movimientos-${selectedPortfolio?.nombre || 'portfolio'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (selectedPortfolio) {
      navigator.clipboard.writeText(`${window.location.origin}/portfolio?id=${selectedPortfolio.id}`);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const mask = (v: string) => hideValues ? "••••••" : v;

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!isPro) {
      return (
          <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
              <ProGate
                  section="portfolio"
                  buttonText="Activar Finix PRO"
                  onUpgrade={() => navigate('/pricing')}
              />
          </div>
      );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PortfolioSkeleton /></div>;

  return (
    <div className="min-h-screen pb-24 w-full">
      <ErrorBoundary
        fallbackTitle="Error al cargar el portafolio"
        fallbackMessage="Ocurrió un problema al procesar los datos del portafolio. Podés reintentar recargar la vista."
        onReset={() => window.location.reload()}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6 py-6">

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
                        pnl >= 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400")}>
                        {pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {mask(fmtCompact(pnl, currency))} ({fmtPct(pnlPct)})
                      </div>
                    )}
                  </div>
                </div>

                {displayPortfolio && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <StatCard
                      label="Total en Activos"
                      value={assetsValue}
                      positive={true}
                      currency={currency}
                      icon={BarChart3}
                      hideValues={hideValues}
                    />
                    <StatCard
                      label="Efectivo Disponible"
                      value={cashBalance}
                      positive={true}
                      currency={currency}
                      icon={Wallet}
                      hideValues={hideValues}
                    />
                    <StatCard
                      label="G/P Total"
                      value={pnl}
                      delta={pnlPct}
                      positive={pnl >= 0}
                      currency={currency}
                      icon={pnl >= 0 ? TrendingUp : TrendingDown}
                      hideValues={hideValues}
                    />
                  </div>
                )}
              </div>

              {/* Right: actions toolbar */}
              <div className="flex flex-col sm:items-end gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Hide values */}
                  <button
                    onClick={() => setHideValues(!hideValues)}
                    className={cn(
                      "h-9 px-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer",
                      hideValues
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                    title={hideValues ? "Mostrar saldos" : "Ocultar saldos"}
                  >
                    {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden sm:inline">{hideValues ? "Oculto" : "Visible"}</span>
                  </button>

                  {/* Currency toggle */}
                  {(cclRate || mepRate) && displayPortfolio && (
                    <button
                      onClick={() => setViewCurrency(activeCurrency === "ARS" ? "USD" : "ARS")}
                      className="h-9 rounded-xl border border-border/60 bg-card/60 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                      title={`CCL: $${cclRate ?? mepRate} · MEP: $${mepRate ?? 'N/A'}${rateUpdatedAt ? ` · Cotización al día` : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>{activeCurrency === "ARS" ? "USD" : "ARS"}</span>
                      <RefreshCw className="w-3 h-3 opacity-70" />
                    </button>
                  )}

                  {/* Privacy toggle */}
                  {selectedPortfolio && (
                    <button
                      onClick={() => updateVisibility(!selectedPortfolio.modoSocial)}
                      disabled={isUpdatingVisibility}
                      className="h-9 rounded-xl border border-border/60 bg-card/60 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors gap-1.5 flex items-center cursor-pointer shadow-2xs"
                    >
                      {selectedPortfolio.modoSocial ? <Globe className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
                      <span className="hidden sm:inline">{selectedPortfolio.modoSocial ? "Público" : "Privado"}</span>
                    </button>
                  )}

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    title="Compartir enlace al portfolio"
                    className="h-9 px-3 rounded-xl border border-border/60 bg-card/60 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors cursor-pointer shadow-2xs"
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copyFeedback ? "¡Copiado!" : "Compartir"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Add asset CTA */}
                  {displayPortfolio && (
                    <button
                      type="button"
                      className="group inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 shadow-[0_2px_12px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_18px_rgba(16,185,129,0.5)] border border-emerald-400/30 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none"
                      onClick={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }}
                    >
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white group-hover:rotate-90 transition-transform duration-200">
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Agregar transacción</span>
                    </button>
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
            <ErrorBoundary fallbackTitle="Panel de rendimiento temporalmente inaccesible">
              <PortfolioDashboard
                portfolioId={displayPortfolio.id}
                portfolioName={displayPortfolio.nombre}
                currency={currency}
                metrics={displayMetrics}
                assets={displayPortfolio.assets}
                movements={movements}
              />
            </ErrorBoundary>

            {/* ── HOLDINGS ─────────────────────────────────────────────────────── */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold">Mis activos</CardTitle>
                    <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {displayPortfolio.assets.length} {displayPortfolio.assets.length === 1 ? 'posición' : 'posiciones'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por ticker..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="w-36 sm:w-48 pl-8.5 pr-7 h-9 text-xs rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-foreground/60 shadow-xs"
                      />
                      {assetSearch && (
                        <button
                          onClick={() => setAssetSearch("")}
                          className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer rounded-md transition-colors"
                          title="Limpiar búsqueda"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {/* Sort */}
                    <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                      <SelectTrigger className="h-9 text-xs w-32 rounded-xl border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-colors cursor-pointer shadow-xs">
                        <SortAsc className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value">Por valor</SelectItem>
                        <SelectItem value="return">Por retorno</SelectItem>
                        <SelectItem value="weight">Por peso</SelectItem>
                        <SelectItem value="name">Por nombre</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Buy */}
                    <button
                      type="button"
                      className="group inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 shadow-[0_2px_10px_rgba(16,185,129,0.32)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.48)] border border-emerald-400/30 active:scale-[0.97] transition-all duration-200 cursor-pointer select-none"
                      onClick={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }}
                    >
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white group-hover:rotate-90 transition-transform duration-200">
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Comprar</span>
                    </button>
                  </div>
                </div>

                {/* Asset Class Filter Pills */}
                {displayPortfolio.assets.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-3 scrollbar-hide">
                    {ASSET_CLASS_FILTERS.filter(f => f.id === "all" || (assetClassCounts[f.id] ?? 0) > 0).map(f => {
                      const isSelected = assetClassFilter === f.id;
                      const count = assetClassCounts[f.id] ?? 0;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setAssetClassFilter(f.id)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer select-none",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                              : "bg-background/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/60 hover:border-border"
                          )}
                        >
                          {f.label}
                          <span className={cn("text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full font-bold", isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-2">
                {sortedAssets.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No se encontraron activos</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      {assetSearch ? `No hay resultados para "${assetSearch}" con el filtro seleccionado.` : "No hay activos en esta categoría."}
                    </p>
                    {(assetSearch || assetClassFilter !== "all") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setAssetSearch(""); setAssetClassFilter("all"); }}
                        className="text-xs rounded-xl"
                      >
                        Restablecer filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid md:grid-cols-[1fr_80px_100px_110px_90px] items-center gap-3 px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40 mb-1">
                      <span>Activo</span>
                      <span className="text-right">Peso</span>
                      <span className="text-right">Cotización</span>
                      <span className="text-right">Valor & PnL</span>
                      <span className="text-center">Operar</span>
                    </div>

                    {sortedAssets.map((asset) => (
                      <AssetRow
                        key={asset.id}
                        asset={asset}
                        totalPortfolioValue={totalValue}
                        currency={currency}
                        hideValues={hideValues}
                        onBuy={() => { setModalMode("BUY"); setModalInitialSymbol(asset.ticker); setAddAssetOpen(true); }}
                        onSell={() => { setModalMode("SELL"); setModalInitialSymbol(asset.ticker); setAddAssetOpen(true); }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── ACTIVITY + DIVERSIFICATION Grid ─────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              {/* Activity */}
              <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base font-bold">Actividad</CardTitle>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["all", "compra", "venta"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setActivityFilter(f)}
                          className={cn(
                            "text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer",
                            activityFilter === f
                              ? "bg-primary/15 text-primary font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          )}
                        >
                          {f === "all" ? "Todo" : f === "compra" ? "Compras" : "Ventas"}
                        </button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportMovementsCSV}
                        title="Descargar historial de movimientos en CSV"
                        className="h-7.5 px-2.5 text-xs gap-1.5 rounded-lg ml-1 border-border/60 hover:border-primary/40 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden sm:inline font-semibold">CSV</span>
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
                        <button className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          Ver más <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick insights & Cash */}
              <div className="space-y-4">
                {/* Cash Card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] p-5 shadow-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                  
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                        <Wallet className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                          Efectivo disponible
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] text-muted-foreground font-medium">Liquidez en cuenta</span>
                        </div>
                      </div>
                    </div>

                    {totalValue > 0 && (
                      <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                        {((cashBalance / totalValue) * 100).toFixed(1)}% cartera
                      </Badge>
                    )}
                  </div>

                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
                      {mask(fmtCurrency(cashBalance, currency))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Capital disponible para operar o reinvertir en nuevos activos
                    </p>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-border/50 mt-3">
                    <span className="text-[11px] font-medium text-muted-foreground">¿Listo para operar?</span>
                    <Button
                      size="sm"
                      onClick={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }}
                      className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Invertir
                    </Button>
                  </div>
                </div>

                {/* Insights */}
                {displayPortfolio.assets.length > 0 && (
                  <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
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
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <Trophy className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-foreground">{best.ticker}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium">Mejor rendimiento</p>
                                </div>
                                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtPct(bestR)}</span>
                              </div>
                            )}
                            {worst && worst.id !== best?.id && (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/8 border border-rose-500/20">
                                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                  <TrendingDown className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-foreground">{worst.ticker}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium">Mayor drawdown</p>
                                </div>
                                <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400 tabular-nums">{fmtPct(worstR)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/50">
                              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                                <PieChart className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground">{displayPortfolio.assets.length} activos</p>
                                <p className="text-[10px] text-muted-foreground font-medium">en cartera diversificada</p>
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
                  <ErrorBoundary fallbackTitle="Análisis de diversificación temporalmente inaccesible">
                    <PortfolioAdvancedMetrics metrics={displayMetrics} assets={displayPortfolio.assets} />
                  </ErrorBoundary>
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
      </ErrorBoundary>
    </div>
  );
};

export default PortfolioPage;
