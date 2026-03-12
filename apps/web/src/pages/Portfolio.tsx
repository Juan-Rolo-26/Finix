import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Minus,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  DollarSign,
  Wallet,
  Filter,
  Download,
  RefreshCw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/i18n";

import { AddTransactionModal } from "@/components/portfolio/AddTransactionModal";
import { PortfolioAdvancedMetrics } from "@/components/portfolio/AdvancedDiversification";
import { PortfolioDashboard } from "@/components/portfolio/dashboard/PortfolioDashboard";

// Types
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

const PortfolioPage = () => {
  const t = useTranslation();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(
    null,
  );
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Currency Toggle State
  const [viewCurrency, setViewCurrency] = useState<"ARS" | "USD" | null>(null);
  const [mepRate, setMepRate] = useState<number | null>(null);

  // Dialogs
  const [createPortfolioOpen, setCreatePortfolioOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"BUY" | "SELL">("BUY");
  const [modalInitialSymbol, setModalInitialSymbol] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  // Forms
  const [portfolioForm, setPortfolioForm] = useState(getInitialPortfolioForm);

  // Load portfolios
  useEffect(() => {
    void loadPortfolios();
    apiFetch("/market/dolar/mep")
      .then((res) => res.json())
      .then((data) => setMepRate(data.venta || data.compra || 1000))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load metrics when portfolio changes
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

  const loadPortfolios = async (preferredPortfolioId?: string) => {
    setLoading(true);
    try {
      const response = await apiFetch("/portfolios");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "No se pudieron cargar los portafolios",
        );
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setPortfolios(list);
      setErrorMessage(null);

      if (list.length === 0) {
        setSelectedPortfolio(null);
        setMetrics(null);
        setMovements([]);
        return;
      }

      setSelectedPortfolio((currentSelected) => {
        if (preferredPortfolioId) {
          return (
            list.find((portfolio) => portfolio.id === preferredPortfolioId) ||
            list[0]
          );
        }
        if (currentSelected?.id) {
          return (
            list.find((portfolio) => portfolio.id === currentSelected.id) ||
            list[0]
          );
        }
        return list[0];
      });
    } catch (error) {
      console.error("No se pudieron cargar los portafolios:", error);
      setPortfolios([]);
      setSelectedPortfolio(null);
      setMetrics(null);
      setMovements([]);
      setErrorMessage(
        (error as any)?.message || "No se pudieron cargar los portafolios",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (portfolioId: string) => {
    try {
      const response = await apiFetch(`/portfolios/${portfolioId}/metrics`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "No se pudieron cargar las metricas",
        );
      }
      const data = await response.json();
      setMetrics(data);
      setErrorMessage(null);
    } catch (error) {
      console.error("No se pudieron cargar las metricas:", error);
      setErrorMessage(
        (error as any)?.message || "No se pudieron cargar las metricas",
      );
    }
  };

  const loadMovements = async (portfolioId: string) => {
    try {
      const response = await apiFetch(`/portfolios/${portfolioId}/movements`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "No se pudieron cargar los movimientos",
        );
      }
      const data = await response.json();
      setMovements(Array.isArray(data) ? data : []);
      setErrorMessage(null);
    } catch (error) {
      console.error("No se pudieron cargar los movimientos:", error);
      setMovements([]);
      setErrorMessage(
        (error as any)?.message || "No se pudieron cargar los movimientos",
      );
    }
  };

  const resetPortfolioForm = () => {
    setPortfolioForm(getInitialPortfolioForm());
  };

  const createPortfolio = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiFetch("/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo crear el portafolio");
      }

      const newPortfolio = await response.json();
      setCreatePortfolioOpen(false);
      resetPortfolioForm();
      await loadPortfolios(newPortfolio?.id);
    } catch (error: any) {
      console.error("No se pudo crear el portafolio:", error);
      alert(error?.message || "No se pudo crear el portafolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePortfolioVisibility = async (modoSocial: boolean) => {
    if (!selectedPortfolio) return;

    setIsUpdatingVisibility(true);
    try {
      const response = await apiFetch(`/portfolios/${selectedPortfolio.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modoSocial }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          "No se pudo actualizar la visibilidad del portafolio",
        );
      }

      const updatedPortfolio = await response.json();
      await loadPortfolios(updatedPortfolio?.id || selectedPortfolio.id);
    } catch (error: any) {
      console.error(
        "No se pudo actualizar la visibilidad del portafolio:",
        error,
      );
      alert(
        error?.message || "No se pudo actualizar la visibilidad del portafolio",
      );
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // The deleteAsset function has been removed.

  const deletePortfolio = async (portfolioId: string) => {
    if (!confirm(t.portfolio.deleteConfirm)) return;

    try {
      const response = await apiFetch(`/portfolios/${portfolioId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "No se pudo eliminar el portafolio",
        );
      }

      await loadPortfolios();
    } catch (error: any) {
      console.error("No se pudo eliminar el portafolio:", error);
      alert(error?.message || "No se pudo eliminar el portafolio");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getAssetCurrentValue = (asset: Asset) => {
    if (typeof asset.value === "number" && Number.isFinite(asset.value)) {
      return asset.value;
    }

    const currentPrice = asset.precioActual ?? asset.ppc;
    return asset.cantidad * currentPrice;
  };

  const activeCurrency = viewCurrency || selectedPortfolio?.monedaBase || "USD";
  const isConverting = activeCurrency !== selectedPortfolio?.monedaBase;

  const conversionRate = useMemo(() => {
    if (!mepRate || !selectedPortfolio) return 1;
    if (selectedPortfolio.monedaBase === "ARS" && activeCurrency === "USD")
      return 1 / mepRate;
    if (selectedPortfolio.monedaBase === "USD" && activeCurrency === "ARS")
      return mepRate;
    return 1;
  }, [mepRate, activeCurrency, selectedPortfolio?.monedaBase]);

  const { displayPortfolio, displayMetrics, displayMovements } = useMemo((): { displayPortfolio: Portfolio | null, displayMetrics: PortfolioMetrics | null, displayMovements: Movement[] } => {
    if (!selectedPortfolio || conversionRate === 1) {
      return {
        displayPortfolio: selectedPortfolio,
        displayMetrics: metrics,
        displayMovements: movements,
      };
    }
    const p = { ...selectedPortfolio, monedaBase: activeCurrency };
    p.totalValue = (p.totalValue || 0) * conversionRate;
    p.assetsValue = (p.assetsValue || 0) * conversionRate;
    p.cashBalance = (p.cashBalance || 0) * conversionRate;
    p.cash = (p.cash || 0) * conversionRate;
    p.assets = (p.assets || []).map((a) => ({
      ...a,
      montoInvertido: (a.montoInvertido || 0) * conversionRate,
      ppc: (a.ppc || 0) * conversionRate,
      precioActual: a.precioActual
        ? a.precioActual * conversionRate
        : undefined,
      value: a.value ? a.value * conversionRate : undefined,
    }));

    const m = metrics ? { ...metrics } : null;
    if (m) {
      m.capitalTotal *= conversionRate;
      if (m.capitalInvertido) m.capitalInvertido *= conversionRate;
      if (m.assetsValue) m.assetsValue *= conversionRate;
      if (m.cashBalance) m.cashBalance *= conversionRate;
      m.valorActual *= conversionRate;
      if (m.totalValue) m.totalValue *= conversionRate;
      m.gananciaTotal *= conversionRate;
      const convertDict = (d?: Record<string, number>) =>
        Object.fromEntries(
          Object.entries(d || {}).map(([k, v]) => [k, (v || 0) * conversionRate]),
        );
      m.diversificacionPorClase = convertDict(m.diversificacionPorClase);
      m.diversificacionPorActivo = convertDict(m.diversificacionPorActivo);
    }

    const movs = (movements || []).map((mov) => ({
      ...mov,
      precio: (mov.precio || 0) * conversionRate,
      total: (mov.total || 0) * conversionRate,
    }));

    return {
      displayPortfolio: p as Portfolio,
      displayMetrics: m,
      displayMovements: movs,
    };
  }, [selectedPortfolio, metrics, movements, conversionRate, activeCurrency]);

  const portfolioTotalValue =
    displayMetrics?.totalValue ??
    displayMetrics?.valorActual ??
    displayPortfolio?.totalValue ??
    0;
  const portfolioAssetsValue =
    displayMetrics?.assetsValue ??
    displayPortfolio?.assetsValue ??
    (displayPortfolio?.assets ?? []).reduce(
      (total, asset) => total + getAssetCurrentValue(asset),
      0,
    );
  const portfolioCashBalance =
    displayMetrics?.cashBalance ??
    displayPortfolio?.cashBalance ??
    displayPortfolio?.cash ??
    0;
  const cashAccounts = displayMetrics?.cashByCurrency
    ? Object.entries(displayMetrics.cashByCurrency).map(
      ([currency, balance]) => ({ currency, balance }),
    )
    : (displayPortfolio?.cashAccounts ?? []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          {/* Title + primary action */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-heading font-bold">
                {t.portfolio.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{t.portfolio.subtitle}</p>
            </div>
            <Dialog open={createPortfolioOpen} onOpenChange={setCreatePortfolioOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-9 shrink-0">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.portfolio.createPortfolio}</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t.portfolio.createTitle}</DialogTitle>
                  <DialogDescription>
                    {t.portfolio.createDesc}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">{t.portfolio.form.name} *</Label>
                    <Input
                      id="nombre"
                      placeholder={t.portfolio.form.namePlaceholder}
                      value={portfolioForm.nombre}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          nombre: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">{t.portfolio.form.desc}</Label>
                    <Textarea
                      id="descripcion"
                      placeholder={t.portfolio.form.descPlaceholder}
                      value={portfolioForm.descripcion}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          descripcion: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="objetivo">
                        {t.portfolio.form.objective}
                      </Label>
                      <Select
                        value={portfolioForm.objetivo}
                        onValueChange={(value) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            objetivo: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="largo plazo">
                            Largo Plazo
                          </SelectItem>
                          <SelectItem value="retiro">Retiro</SelectItem>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="ahorro">Ahorro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monedaBase">
                        {t.portfolio.form.baseCurrency}
                      </Label>
                      <Select
                        value={portfolioForm.monedaBase}
                        onValueChange={(value) =>
                          setPortfolioForm({
                            ...portfolioForm,
                            monedaBase: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nivelRiesgo">
                      {t.portfolio.form.riskLevel}
                    </Label>
                    <Select
                      value={portfolioForm.nivelRiesgo}
                      onValueChange={(value) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          nivelRiesgo: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bajo">Bajo</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="modoSocial">
                        {t.portfolio.form.socialMode}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t.portfolio.form.socialModeDesc}
                      </p>
                    </div>
                    <Switch
                      id="modoSocial"
                      checked={portfolioForm.modoSocial}
                      onCheckedChange={(checked) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          modoSocial: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="admiteBienesRaices">
                        {t.portfolio.form.realEstate}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t.portfolio.form.realEstateDesc}
                      </p>
                    </div>
                    <Switch
                      id="admiteBienesRaices"
                      checked={portfolioForm.admiteBienesRaices}
                      onCheckedChange={(checked) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          admiteBienesRaices: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="esPrincipal">
                        {t.portfolio.form.mainPortfolio}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t.portfolio.form.mainPortfolioDesc}
                      </p>
                    </div>
                    <Switch
                      id="esPrincipal"
                      checked={portfolioForm.esPrincipal}
                      onCheckedChange={(checked) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          esPrincipal: checked,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreatePortfolioOpen(false)}
                  >
                    {t.portfolio.form.cancel}
                  </Button>
                  <Button
                    onClick={createPortfolio}
                    disabled={!portfolioForm.nombre || isSubmitting}
                  >
                    {isSubmitting
                      ? t.portfolio.form.creating
                      : t.portfolio.form.create}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Secondary actions row — compact on mobile */}
          {selectedPortfolio && (
            <div className="flex items-center gap-2 flex-wrap">
              {mepRate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 h-8 text-xs"
                  onClick={() => setViewCurrency(activeCurrency === "ARS" ? "USD" : "ARS")}
                  title={`Cotización dólar MEP referencial: $${mepRate.toFixed(2)}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isConverting ? `${activeCurrency}` : `Ver en ${activeCurrency === "ARS" ? "USD" : "ARS"}`}
                </Button>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-1.5">
                <p className="text-xs font-medium">Público</p>
                <Switch
                  checked={selectedPortfolio.modoSocial}
                  onCheckedChange={updatePortfolioVisibility}
                  disabled={isUpdatingVisibility}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs gap-1.5"
                onClick={() => deletePortfolio(selectedPortfolio.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.portfolio.deletePortfolio}</span>
              </Button>
            </div>
          )}
        </div>

        {errorMessage && (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="p-4 text-sm text-red-300">
              {errorMessage}
            </CardContent>
          </Card>
        )}

        {/* Portfolio Selector */}
        {portfolios.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 overflow-x-auto">
                {portfolios.map((portfolio) => (
                  <button
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolio(portfolio)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${selectedPortfolio?.id === portfolio.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      <span className="font-medium">{portfolio.nombre}</span>
                      {portfolio.esPrincipal && (
                        <Badge variant="secondary" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {displayPortfolio && displayMetrics && (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 md:px-6 md:pt-6 md:pb-2">
                    <CardTitle className="text-[11px] md:text-sm font-medium leading-tight">
                      Valor total
                    </CardTitle>
                    <Wallet className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                    <div className="text-base md:text-2xl font-bold truncate">
                      {formatCurrency(portfolioTotalValue, displayPortfolio.monedaBase)}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      Activos + efectivo disponible
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 md:px-6 md:pt-6 md:pb-2">
                    <CardTitle className="text-[11px] md:text-sm font-medium leading-tight">
                      Activos
                    </CardTitle>
                    <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                    <div className="text-base md:text-2xl font-bold truncate">
                      {formatCurrency(portfolioAssetsValue, displayPortfolio.monedaBase)}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      Valor de mercado de posiciones abiertas
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 md:px-6 md:pt-6 md:pb-2">
                    <CardTitle className="text-[11px] md:text-sm font-medium leading-tight">
                      Efectivo
                    </CardTitle>
                    <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                    <div className="text-base md:text-2xl font-bold text-emerald-500 truncate">
                      {formatCurrency(portfolioCashBalance, displayPortfolio.monedaBase)}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      Liquidez disponible para reinvertir
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 md:px-6 md:pt-6 md:pb-2">
                    <CardTitle className="text-[11px] md:text-sm font-medium leading-tight">
                      G/P
                    </CardTitle>
                    {displayMetrics.gananciaTotal >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500 flex-shrink-0" />
                    )}
                  </CardHeader>
                  <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
                    <div className={`text-base md:text-2xl font-bold truncate ${displayMetrics.gananciaTotal >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatCurrency(displayMetrics.gananciaTotal, displayPortfolio.monedaBase)}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                      {formatPercentage(displayMetrics.variacionPorcentual)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="assets" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="assets" className="text-xs sm:text-sm px-1">
                  Activos
                </TabsTrigger>
                <TabsTrigger value="movements" className="text-xs sm:text-sm px-1">
                  Movim.
                </TabsTrigger>
                <TabsTrigger value="diversification" className="text-xs sm:text-sm px-1">
                  Divers.
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs sm:text-sm px-1">
                  Avanz.
                </TabsTrigger>
              </TabsList>

              {/* Assets Tab */}
              <TabsContent value="assets" className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg md:text-2xl font-bold">
                    {t.portfolio.assets.title}
                  </h2>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="gap-1.5 h-9"
                      onClick={() => {
                        setModalMode("BUY");
                        setModalInitialSymbol("");
                        setAddAssetOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Comprar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 h-9 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      onClick={() => {
                        setModalMode("SELL");
                        setModalInitialSymbol("");
                        setAddAssetOpen(true);
                      }}
                      disabled={displayPortfolio.assets.length === 0}
                    >
                      <Minus className="w-4 h-4" />
                      <span className="hidden sm:inline">Vender</span>
                    </Button>
                  </div>
                  <AddTransactionModal
                    open={addAssetOpen}
                    onOpenChange={setAddAssetOpen}
                    portfolioId={displayPortfolio?.id || ""}
                    mode={modalMode}
                    initialSymbol={modalInitialSymbol}
                    portfolioAssets={displayPortfolio?.assets || []}
                    onSuccess={() => {
                      if (displayPortfolio?.id) {
                        void loadPortfolios(displayPortfolio.id);
                      }
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_360px]">
                  <Card className="border-border/70">
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Valor del portafolio
                      </p>
                      <p className="mt-1.5 text-2xl sm:text-4xl font-bold tracking-tight">
                        {formatCurrency(portfolioTotalValue, displayPortfolio.monedaBase)}
                      </p>
                      <div className="mt-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                          Fórmula
                        </p>
                        <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                          Activos {formatCurrency(portfolioAssetsValue, displayPortfolio.monedaBase)}
                          {" "}+ Efectivo {formatCurrency(portfolioCashBalance, displayPortfolio.monedaBase)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Efectivo</p>
                          <p className="text-2xl sm:text-3xl font-bold text-emerald-500 mt-1">
                            {formatCurrency(portfolioCashBalance, displayPortfolio.monedaBase)}
                          </p>
                        </div>
                        <DollarSign className="w-5 h-5 text-emerald-500/50 mt-1" />
                      </div>
                      {cashAccounts.length > 0 ? (
                        <div className="space-y-1.5 mt-3">
                          {cashAccounts.map((account) => (
                            <div
                              key={`cash-account-${account.currency}`}
                              className="flex items-center justify-between rounded-lg border border-emerald-500/15 bg-background/70 px-2.5 py-1.5"
                            >
                              <span className="text-xs font-medium text-foreground/80">{account.currency}</span>
                              <span className="text-xs font-semibold text-emerald-500">
                                {formatCurrency(account.balance, account.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          Todavia no hay saldo de caja disponible.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {displayPortfolio.assets.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">{t.portfolio.assets.empty}</p>
                      <Button variant="outline" size="sm" onClick={() => { setModalMode("BUY"); setModalInitialSymbol(""); setAddAssetOpen(true); }}>
                        {t.portfolio.assets.addFirst}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Mobile: cards */}
                    <div className="sm:hidden space-y-2">
                      {displayPortfolio.assets.map((asset) => {
                        const precioActual = asset.precioActual ?? asset.ppc;
                        const valorActual = asset.cantidad * precioActual;
                        const ganancia = valorActual - asset.montoInvertido;
                        const variacion = asset.montoInvertido > 0 ? (ganancia / asset.montoInvertido) * 100 : 0;
                        const isUp = variacion >= 0;
                        return (
                          <Card key={asset.id} className="border-border/60">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                    {asset.ticker.slice(0, 3)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold leading-tight">{asset.ticker}</p>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1">{asset.tipoActivo}</Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">{formatCurrency(valorActual, displayPortfolio.monedaBase)}</p>
                                  <span className={`text-xs font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
                                    {isUp ? "+" : ""}{formatPercentage(variacion)}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-muted-foreground mb-2">
                                <div>
                                  <p>Invertido</p>
                                  <p className="font-medium text-foreground text-[11px]">{formatCurrency(asset.montoInvertido, displayPortfolio.monedaBase)}</p>
                                </div>
                                <div>
                                  <p>Precio actual</p>
                                  <p className="font-medium text-foreground text-[11px]">{formatCurrency(precioActual, displayPortfolio.monedaBase)}</p>
                                </div>
                                <div>
                                  <p>G/P</p>
                                  <p className={`font-semibold text-[11px] ${isUp ? "text-green-500" : "text-red-500"}`}>{formatCurrency(ganancia, displayPortfolio.monedaBase)}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-7 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => { setModalMode("SELL"); setModalInitialSymbol(asset.ticker); setAddAssetOpen(true); }}
                              >
                                <Minus className="w-3 h-3 mr-1" />
                                Vender
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop: table */}
                    <Card className="hidden sm:block">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t.portfolio.assets.table.ticker}</TableHead>
                                <TableHead>{t.portfolio.assets.table.type}</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.quantity}</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.invested}</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.avgPrice}</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.currentPrice}</TableHead>
                                <TableHead className="text-right">Valor actual</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.variation}</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.gain}</TableHead>
                                <TableHead className="text-right">{t.portfolio.assets.table.actions}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayPortfolio.assets.map((asset) => {
                                const precioActual = asset.precioActual ?? asset.ppc;
                                const valorActual = asset.cantidad * precioActual;
                                const ganancia = valorActual - asset.montoInvertido;
                                const variacion = asset.montoInvertido > 0 ? (ganancia / asset.montoInvertido) * 100 : 0;
                                return (
                                  <TableRow key={asset.id}>
                                    <TableCell className="font-medium">{asset.ticker}</TableCell>
                                    <TableCell><Badge variant="outline">{asset.tipoActivo}</Badge></TableCell>
                                    <TableCell className="text-right">{asset.cantidad.toFixed(4)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(asset.montoInvertido, displayPortfolio.monedaBase)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(asset.ppc, displayPortfolio.monedaBase)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(precioActual, displayPortfolio.monedaBase)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(valorActual, displayPortfolio.monedaBase)}</TableCell>
                                    <TableCell className={`text-right ${variacion >= 0 ? "text-green-500" : "text-red-500"}`}>{formatPercentage(variacion)}</TableCell>
                                    <TableCell className={`text-right ${ganancia >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(ganancia, displayPortfolio.monedaBase)}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 font-medium px-2"
                                        onClick={() => { setModalMode("SELL"); setModalInitialSymbol(asset.ticker); setAddAssetOpen(true); }}>
                                        Vender
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Movements Tab */}
              <TabsContent value="movements" className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg md:text-2xl font-bold">{t.portfolio.movements.title}</h2>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1.5">{t.portfolio.movements.filters}</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline ml-1.5">{t.portfolio.movements.export}</span>
                    </Button>
                  </div>
                </div>

                {displayMovements.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-10">
                      <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{t.portfolio.movements.empty}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Mobile: cards */}
                    <div className="sm:hidden space-y-2">
                      {displayMovements.map((movement: any) => {
                        const isCompra = movement.tipoMovimiento === "compra";
                        const isVenta = movement.tipoMovimiento === "venta";
                        return (
                          <Card key={movement.id} className="border-border/60">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <Badge variant={isCompra ? "default" : isVenta ? "destructive" : "secondary"} className="text-[10px] h-5">
                                    {movement.tipoMovimiento}
                                  </Badge>
                                  <span className="font-bold text-sm">{movement.ticker}</span>
                                </div>
                                <span className={`text-sm font-bold ${isVenta ? "text-red-500" : "text-emerald-500"}`}>
                                  {formatCurrency(movement.total, displayPortfolio.monedaBase)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>{new Date(movement.fecha).toLocaleDateString("es-AR")}</span>
                                <span>{movement.cantidad.toFixed(4)} × {formatCurrency(movement.precio, displayPortfolio.monedaBase)}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop: table */}
                    <Card className="hidden sm:block">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t.portfolio.movements.table.date}</TableHead>
                                <TableHead>{t.portfolio.movements.table.type}</TableHead>
                                <TableHead>{t.portfolio.movements.table.asset}</TableHead>
                                <TableHead>{t.portfolio.movements.table.class}</TableHead>
                                <TableHead className="text-right">{t.portfolio.movements.table.quantity}</TableHead>
                                <TableHead className="text-right">{t.portfolio.movements.table.price}</TableHead>
                                <TableHead className="text-right">{t.portfolio.movements.table.total}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayMovements.map((movement: any) => (
                                <TableRow key={movement.id}>
                                  <TableCell>{new Date(movement.fecha).toLocaleString("es-AR")}</TableCell>
                                  <TableCell>
                                    <Badge variant={movement.tipoMovimiento === "compra" ? "default" : movement.tipoMovimiento === "venta" ? "destructive" : "secondary"}>
                                      {movement.tipoMovimiento}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">{movement.ticker}</TableCell>
                                  <TableCell>{movement.claseActivo}</TableCell>
                                  <TableCell className="text-right">{movement.cantidad.toFixed(4)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(movement.precio, displayPortfolio.monedaBase)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(movement.total, displayPortfolio.monedaBase)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Diversification Tab */}
              <TabsContent value="diversification" className="space-y-6">
                <PortfolioAdvancedMetrics
                  metrics={displayMetrics}
                  assets={displayPortfolio.assets}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <PortfolioDashboard
                  portfolioName={displayPortfolio.nombre}
                  currency={displayPortfolio.monedaBase}
                  metrics={displayMetrics}
                  assets={displayPortfolio.assets}
                  movements={movements}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
