import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    TrendingUp,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Trash2,
    DollarSign,
    Wallet,
    Filter,
    Download,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/i18n';

import { AddTransactionModal } from '@/components/portfolio/AddTransactionModal';
import { AllocationChart, TopAssetsChart, CapitalEvolutionChart } from '@/components/portfolio/PortfolioCharts';

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
    valorActual: number;
    gananciaTotal: number;
    variacionPorcentual: number;
    diversificacionPorClase: Record<string, number>;
    diversificacionPorActivo: Record<string, number>;
    cantidadActivos: number;
}

const getInitialPortfolioForm = () => ({
    nombre: '',
    descripcion: '',
    objetivo: 'largo plazo',
    monedaBase: 'USD',
    nivelRiesgo: 'medio',
    modoSocial: false,
    esPrincipal: false,
    admiteBienesRaices: false,
});

const PortfolioPage = () => {
    const t = useTranslation();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
    const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Dialogs
    const [createPortfolioOpen, setCreatePortfolioOpen] = useState(false);
    const [addAssetOpen, setAddAssetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms
    const [portfolioForm, setPortfolioForm] = useState(getInitialPortfolioForm);

    // Load portfolios
    useEffect(() => {
        void loadPortfolios();
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
            const response = await apiFetch('/portfolios');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error loading portfolios');
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
                    return list.find((portfolio) => portfolio.id === preferredPortfolioId) || list[0];
                }
                if (currentSelected?.id) {
                    return list.find((portfolio) => portfolio.id === currentSelected.id) || list[0];
                }
                return list[0];
            });
        } catch (error) {
            console.error('Error loading portfolios:', error);
            setPortfolios([]);
            setSelectedPortfolio(null);
            setMetrics(null);
            setMovements([]);
            setErrorMessage((error as any)?.message || 'Error loading portfolios');
        } finally {
            setLoading(false);
        }
    };

    const loadMetrics = async (portfolioId: string) => {
        try {
            const response = await apiFetch(`/portfolios/${portfolioId}/metrics`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error loading metrics');
            }
            const data = await response.json();
            setMetrics(data);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error loading metrics:', error);
            setErrorMessage((error as any)?.message || 'Error loading metrics');
        }
    };

    const loadMovements = async (portfolioId: string) => {
        try {
            const response = await apiFetch(`/portfolios/${portfolioId}/movements`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error loading movements');
            }
            const data = await response.json();
            setMovements(Array.isArray(data) ? data : []);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error loading movements:', error);
            setMovements([]);
            setErrorMessage((error as any)?.message || 'Error loading movements');
        }
    };

    const resetPortfolioForm = () => {
        setPortfolioForm(getInitialPortfolioForm());
    };

    const createPortfolio = async () => {
        setIsSubmitting(true);
        try {
            const response = await apiFetch('/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(portfolioForm),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error creating portfolio');
            }

            const newPortfolio = await response.json();
            setCreatePortfolioOpen(false);
            resetPortfolioForm();
            await loadPortfolios(newPortfolio?.id);
        } catch (error: any) {
            console.error('Error creating portfolio:', error);
            alert(error?.message || 'Error creating portfolio');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteAsset = async (assetId: string) => {
        if (!selectedPortfolio?.id) return;
        if (!confirm(t.portfolio.assets.deleteConfirm)) return;

        try {
            const response = await apiFetch(`/portfolios/assets/${assetId}?portfolioId=${encodeURIComponent(selectedPortfolio.id)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error deleting asset');
            }

            await loadPortfolios(selectedPortfolio.id);
        } catch (error: any) {
            console.error('Error deleting asset:', error);
            alert(error?.message || 'Error deleting asset');
        }
    };

    const deletePortfolio = async (portfolioId: string) => {
        if (!confirm(t.portfolio.deleteConfirm)) return;

        try {
            const response = await apiFetch(`/portfolios/${portfolioId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error deleting portfolio');
            }

            await loadPortfolios();
        } catch (error: any) {
            console.error('Error deleting portfolio:', error);
            alert(error?.message || 'Error deleting portfolio');
        }
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-heading font-bold mb-2">{t.portfolio.title}</h1>
                        <p className="text-muted-foreground">
                            {t.portfolio.subtitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedPortfolio && (
                            <Button
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => deletePortfolio(selectedPortfolio.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t.portfolio.deletePortfolio}
                            </Button>
                        )}

                        <Dialog open={createPortfolioOpen} onOpenChange={setCreatePortfolioOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    {t.portfolio.createPortfolio}
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
                                            onChange={(e) => setPortfolioForm({ ...portfolioForm, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="descripcion">{t.portfolio.form.desc}</Label>
                                        <Textarea
                                            id="descripcion"
                                            placeholder={t.portfolio.form.descPlaceholder}
                                            value={portfolioForm.descripcion}
                                            onChange={(e) => setPortfolioForm({ ...portfolioForm, descripcion: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="objetivo">{t.portfolio.form.objective}</Label>
                                            <Select
                                                value={portfolioForm.objetivo}
                                                onValueChange={(value) => setPortfolioForm({ ...portfolioForm, objetivo: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="largo plazo">Largo Plazo</SelectItem>
                                                    <SelectItem value="retiro">Retiro</SelectItem>
                                                    <SelectItem value="trading">Trading</SelectItem>
                                                    <SelectItem value="ahorro">Ahorro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="monedaBase">{t.portfolio.form.baseCurrency}</Label>
                                            <Select
                                                value={portfolioForm.monedaBase}
                                                onValueChange={(value) => setPortfolioForm({ ...portfolioForm, monedaBase: value })}
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
                                        <Label htmlFor="nivelRiesgo">{t.portfolio.form.riskLevel}</Label>
                                        <Select
                                            value={portfolioForm.nivelRiesgo}
                                            onValueChange={(value) => setPortfolioForm({ ...portfolioForm, nivelRiesgo: value })}
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
                                            <Label htmlFor="modoSocial">{t.portfolio.form.socialMode}</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {t.portfolio.form.socialModeDesc}
                                            </p>
                                        </div>
                                        <Switch
                                            id="modoSocial"
                                            checked={portfolioForm.modoSocial}
                                            onCheckedChange={(checked) => setPortfolioForm({ ...portfolioForm, modoSocial: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="admiteBienesRaices">{t.portfolio.form.realEstate}</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {t.portfolio.form.realEstateDesc}
                                            </p>
                                        </div>
                                        <Switch
                                            id="admiteBienesRaices"
                                            checked={portfolioForm.admiteBienesRaices}
                                            onCheckedChange={(checked) => setPortfolioForm({ ...portfolioForm, admiteBienesRaices: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="esPrincipal">{t.portfolio.form.mainPortfolio}</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {t.portfolio.form.mainPortfolioDesc}
                                            </p>
                                        </div>
                                        <Switch
                                            id="esPrincipal"
                                            checked={portfolioForm.esPrincipal}
                                            onCheckedChange={(checked) => setPortfolioForm({ ...portfolioForm, esPrincipal: checked })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setCreatePortfolioOpen(false)}>
                                        {t.portfolio.form.cancel}
                                    </Button>
                                    <Button onClick={createPortfolio} disabled={!portfolioForm.nombre || isSubmitting}>
                                        {isSubmitting ? t.portfolio.form.creating : t.portfolio.form.create}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
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
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4" />
                                            <span className="font-medium">{portfolio.nombre}</span>
                                            {portfolio.esPrincipal && (
                                                <Badge variant="secondary" className="text-xs">Principal</Badge>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {selectedPortfolio && metrics && (
                    <>
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{t.portfolio.metrics.totalCapital}</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(metrics.capitalTotal, selectedPortfolio.monedaBase)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t.portfolio.metrics.investedAmount}
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
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{t.portfolio.metrics.currentValue}</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(metrics.valorActual, selectedPortfolio.monedaBase)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t.portfolio.metrics.marketValue}
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
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{t.portfolio.metrics.gainLoss}</CardTitle>
                                        {metrics.gananciaTotal >= 0 ? (
                                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${metrics.gananciaTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {formatCurrency(metrics.gananciaTotal, selectedPortfolio.monedaBase)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatPercentage(metrics.variacionPorcentual)}
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
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{t.portfolio.metrics.assets}</CardTitle>
                                        <PieChart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{metrics.cantidadActivos}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t.portfolio.metrics.inPortfolio}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <Tabs defaultValue="assets" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                                <TabsTrigger value="assets">{t.portfolio.tabs.assets}</TabsTrigger>
                                <TabsTrigger value="movements">{t.portfolio.tabs.movements}</TabsTrigger>
                                <TabsTrigger value="diversification">{t.portfolio.tabs.diversification}</TabsTrigger>
                                <TabsTrigger value="advanced">{t.portfolio.tabs.advanced}</TabsTrigger>
                            </TabsList>

                            {/* Assets Tab */}
                            <TabsContent value="assets" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">{t.portfolio.assets.title}</h2>
                                    <Button className="gap-2" onClick={() => setAddAssetOpen(true)}>
                                        <Plus className="w-4 h-4" />
                                        {t.portfolio.assets.add}
                                    </Button>
                                    <AddTransactionModal
                                        open={addAssetOpen}
                                        onOpenChange={setAddAssetOpen}
                                        portfolioId={selectedPortfolio?.id || ''}
                                        onSuccess={() => {
                                            if (selectedPortfolio?.id) {
                                                void loadPortfolios(selectedPortfolio.id);
                                            }
                                        }}
                                    />
                                </div>

                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t.portfolio.assets.table.ticker}</TableHead>
                                                    <TableHead>{t.portfolio.assets.table.type}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.quantity}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.invested}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.avgPrice}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.currentPrice}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.variation}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.gain}</TableHead>
                                                    <TableHead className="text-right">{t.portfolio.assets.table.actions}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPortfolio.assets.map((asset) => {
                                                    const precioActual = asset.precioActual ?? asset.ppc;
                                                    const valorActual = asset.cantidad * precioActual;
                                                    const ganancia = valorActual - asset.montoInvertido;
                                                    const variacion = asset.montoInvertido > 0
                                                        ? (ganancia / asset.montoInvertido) * 100
                                                        : 0;

                                                    return (
                                                        <TableRow key={asset.id}>
                                                            <TableCell className="font-medium">{asset.ticker}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{asset.tipoActivo}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">{asset.cantidad.toFixed(4)}</TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(asset.montoInvertido, selectedPortfolio.monedaBase)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(asset.ppc, selectedPortfolio.monedaBase)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {formatCurrency(precioActual, selectedPortfolio.monedaBase)}
                                                            </TableCell>
                                                            <TableCell className={`text-right ${variacion >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                {formatPercentage(variacion)}
                                                            </TableCell>
                                                            <TableCell className={`text-right ${ganancia >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                {formatCurrency(ganancia, selectedPortfolio.monedaBase)}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteAsset(asset.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>

                                        {selectedPortfolio.assets.length === 0 && (
                                            <div className="text-center py-12">
                                                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">
                                                    {t.portfolio.assets.empty}
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => setAddAssetOpen(true)}
                                                >
                                                    {t.portfolio.assets.addFirst}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Movements Tab */}
                            <TabsContent value="movements" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">{t.portfolio.movements.title}</h2>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Filter className="w-4 h-4 mr-2" />
                                            {t.portfolio.movements.filters}
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            {t.portfolio.movements.export}
                                        </Button>
                                    </div>
                                </div>

                                <Card>
                                    <CardContent className="p-0">
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
                                                {movements.map((movement) => (
                                                    <TableRow key={movement.id}>
                                                        <TableCell>
                                                            {new Date(movement.fecha).toLocaleString('es-AR')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={
                                                                    movement.tipoMovimiento === 'compra'
                                                                        ? 'default'
                                                                        : movement.tipoMovimiento === 'venta'
                                                                            ? 'destructive'
                                                                            : 'secondary'
                                                                }
                                                            >
                                                                {movement.tipoMovimiento}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{movement.ticker}</TableCell>
                                                        <TableCell>{movement.claseActivo}</TableCell>
                                                        <TableCell className="text-right">{movement.cantidad.toFixed(4)}</TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(movement.precio, selectedPortfolio.monedaBase)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(movement.total, selectedPortfolio.monedaBase)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {movements.length === 0 && (
                                            <div className="text-center py-12">
                                                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                <p className="text-muted-foreground">
                                                    {t.portfolio.movements.empty}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Diversification Tab */}
                            <TabsContent value="diversification" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Por Clase de Activo</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {metrics.diversificacionPorClase && (
                                                <div className="h-[300px]">
                                                    <AllocationChart data={metrics.diversificacionPorClase} totalValue={metrics.valorActual} />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Por Activo Individual</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {metrics.diversificacionPorActivo && (
                                                <div className="h-[300px]">
                                                    <TopAssetsChart data={metrics.diversificacionPorActivo} totalValue={metrics.valorActual} />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="advanced">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Análisis y Proyección</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px]">
                                            <CapitalEvolutionChart movements={movements} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </div>
    );
};

export default PortfolioPage;
