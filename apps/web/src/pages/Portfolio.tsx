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
    Target,
    Filter,
    Download,
    Bell,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

import { AddTransactionModal } from '@/components/portfolio/AddTransactionModal';

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

    // Asset form state removed - moved to AddTransactionModal

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
                throw new Error(errorData.message || 'Error al cargar portafolios');
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
            setErrorMessage((error as any)?.message || 'Error al cargar portafolios');
        } finally {
            setLoading(false);
        }
    };

    const loadMetrics = async (portfolioId: string) => {
        try {
            const response = await apiFetch(`/portfolios/${portfolioId}/metrics`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar métricas');
            }
            const data = await response.json();
            setMetrics(data);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error loading metrics:', error);
            setErrorMessage((error as any)?.message || 'Error al cargar métricas');
        }
    };

    const loadMovements = async (portfolioId: string) => {
        try {
            const response = await apiFetch(`/portfolios/${portfolioId}/movements`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar movimientos');
            }
            const data = await response.json();
            setMovements(Array.isArray(data) ? data : []);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error loading movements:', error);
            setMovements([]);
            setErrorMessage((error as any)?.message || 'Error al cargar movimientos');
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
                throw new Error(errorData.message || 'Error al crear portafolio');
            }

            const newPortfolio = await response.json();
            setCreatePortfolioOpen(false);
            resetPortfolioForm();
            await loadPortfolios(newPortfolio?.id);
        } catch (error: any) {
            console.error('Error creating portfolio:', error);
            alert(error?.message || 'Error al crear portafolio');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteAsset = async (assetId: string) => {
        if (!selectedPortfolio?.id) return;
        if (!confirm('¿Estás seguro de eliminar este activo?')) return;

        try {
            const response = await apiFetch(`/portfolios/assets/${assetId}?portfolioId=${encodeURIComponent(selectedPortfolio.id)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al eliminar activo');
            }

            await loadPortfolios(selectedPortfolio.id);
        } catch (error: any) {
            console.error('Error deleting asset:', error);
            alert(error?.message || 'Error al eliminar activo');
        }
    };

    const deletePortfolio = async (portfolioId: string) => {
        if (!confirm('¿Eliminar este portafolio? Esta acción no se puede deshacer.')) return;

        try {
            const response = await apiFetch(`/portfolios/${portfolioId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al eliminar portafolio');
            }

            await loadPortfolios();
        } catch (error: any) {
            console.error('Error deleting portfolio:', error);
            alert(error?.message || 'Error al eliminar portafolio');
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
                    <p className="text-muted-foreground">Cargando portafolios...</p>
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
                        <h1 className="text-4xl font-heading font-bold mb-2">Portafolios</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus inversiones de forma profesional
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
                                Eliminar Portafolio
                            </Button>
                        )}

                        <Dialog open={createPortfolioOpen} onOpenChange={setCreatePortfolioOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Crear Portafolio
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Crear Nuevo Portafolio</DialogTitle>
                                    <DialogDescription>
                                        Define los parámetros de tu nuevo portafolio de inversión
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre *</Label>
                                        <Input
                                            id="nombre"
                                            placeholder="Mi Portafolio de Largo Plazo"
                                            value={portfolioForm.nombre}
                                            onChange={(e) => setPortfolioForm({ ...portfolioForm, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="descripcion">Descripción</Label>
                                        <Textarea
                                            id="descripcion"
                                            placeholder="Describe el propósito de este portafolio..."
                                            value={portfolioForm.descripcion}
                                            onChange={(e) => setPortfolioForm({ ...portfolioForm, descripcion: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="objetivo">Objetivo</Label>
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
                                            <Label htmlFor="monedaBase">Moneda Base</Label>
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
                                        <Label htmlFor="nivelRiesgo">Nivel de Riesgo</Label>
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
                                            <Label htmlFor="modoSocial">Modo Social</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Permite que otros usuarios vean este portafolio
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
                                            <Label htmlFor="admiteBienesRaices">Bienes Raíces</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Permite agregar activos inmobiliarios en este portafolio
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
                                            <Label htmlFor="esPrincipal">Portafolio Principal</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Se mostrará por defecto al abrir la sección
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
                                        Cancelar
                                    </Button>
                                    <Button onClick={createPortfolio} disabled={!portfolioForm.nombre || isSubmitting}>
                                        {isSubmitting ? 'Creando...' : 'Crear Portafolio'}
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
                                        <CardTitle className="text-sm font-medium">Capital Total</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(metrics.capitalTotal, selectedPortfolio.monedaBase)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Monto invertido
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
                                        <CardTitle className="text-sm font-medium">Valor Actual</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(metrics.valorActual, selectedPortfolio.monedaBase)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Valor de mercado
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
                                        <CardTitle className="text-sm font-medium">Ganancia/Pérdida</CardTitle>
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
                                        <CardTitle className="text-sm font-medium">Activos</CardTitle>
                                        <PieChart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{metrics.cantidadActivos}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            En portafolio
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <Tabs defaultValue="assets" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                                <TabsTrigger value="assets">Activos</TabsTrigger>
                                <TabsTrigger value="movements">Movimientos</TabsTrigger>
                                <TabsTrigger value="diversification">Diversificación</TabsTrigger>
                                <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                            </TabsList>

                            {/* Assets Tab */}
                            <TabsContent value="assets" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Activos del Portafolio</h2>
                                    <Button className="gap-2" onClick={() => setAddAssetOpen(true)}>
                                        <Plus className="w-4 h-4" />
                                        Agregar Activo
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
                                                    <TableHead>Ticker</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead className="text-right">Cantidad</TableHead>
                                                    <TableHead className="text-right">Monto Invertido</TableHead>
                                                    <TableHead className="text-right">PPC</TableHead>
                                                    <TableHead className="text-right">Precio Actual</TableHead>
                                                    <TableHead className="text-right">Variación</TableHead>
                                                    <TableHead className="text-right">Ganancia</TableHead>
                                                    <TableHead className="text-right">Acciones</TableHead>
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
                                                    No hay activos en este portafolio
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => setAddAssetOpen(true)}
                                                >
                                                    Agregar Primer Activo
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Movements Tab */}
                            <TabsContent value="movements" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Historial de Movimientos</h2>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Filter className="w-4 h-4 mr-2" />
                                            Filtros
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Exportar
                                        </Button>
                                    </div>
                                </div>

                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Activo</TableHead>
                                                    <TableHead>Clase</TableHead>
                                                    <TableHead className="text-right">Cantidad</TableHead>
                                                    <TableHead className="text-right">Precio</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
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
                                                    No hay movimientos registrados
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Diversification Tab */}
                            <TabsContent value="diversification" className="space-y-4">
                                <h2 className="text-2xl font-bold">Análisis de Diversificación</h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Por Clase de Activo</CardTitle>
                                            <CardDescription>
                                                Distribución del portafolio por tipo de activo
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {Object.entries(metrics.diversificacionPorClase).map(([clase, valor]) => {
                                                    const porcentaje = metrics.valorActual > 0 ? (valor / metrics.valorActual) * 100 : 0;
                                                    return (
                                                        <div key={clase}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium capitalize">{clase}</span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {porcentaje.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full transition-all"
                                                                    style={{ width: `${porcentaje}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Por Activo Individual</CardTitle>
                                            <CardDescription>
                                                Top activos por valor en portafolio
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {Object.entries(metrics.diversificacionPorActivo)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 5)
                                                    .map(([ticker, valor]) => {
                                                        const porcentaje = metrics.valorActual > 0 ? (valor / metrics.valorActual) * 100 : 0;
                                                        return (
                                                            <div key={ticker}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-medium">{ticker}</span>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {porcentaje.toFixed(1)}%
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary rounded-full transition-all"
                                                                        style={{ width: `${porcentaje}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Advanced Tab */}
                            <TabsContent value="advanced" className="space-y-4">
                                <h2 className="text-2xl font-bold">Funciones Avanzadas</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="opacity-60">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <RefreshCw className="w-5 h-5" />
                                                Rebalanceo Automático
                                            </CardTitle>
                                            <CardDescription>
                                                Próximamente: Mantén tu portafolio balanceado automáticamente
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button disabled className="w-full">
                                                Configurar Rebalanceo
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="opacity-60">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Bell className="w-5 h-5" />
                                                Alertas de Precio
                                            </CardTitle>
                                            <CardDescription>
                                                Próximamente: Recibe notificaciones cuando tus activos alcancen ciertos precios
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button disabled className="w-full">
                                                Configurar Alertas
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="opacity-60">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Download className="w-5 h-5" />
                                                Exportación de Datos
                                            </CardTitle>
                                            <CardDescription>
                                                Próximamente: Exporta tu portafolio en múltiples formatos
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button disabled className="w-full">
                                                Exportar Datos
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="opacity-60">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Target className="w-5 h-5" />
                                                Objetivos de Inversión
                                            </CardTitle>
                                            <CardDescription>
                                                Próximamente: Define y trackea tus objetivos financieros
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button disabled className="w-full">
                                                Configurar Objetivos
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                )}

                {portfolios.length === 0 && (
                    <Card className="p-12">
                        <div className="text-center">
                            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">No tienes portafolios aún</h2>
                            <p className="text-muted-foreground mb-6">
                                Crea tu primer portafolio para comenzar a gestionar tus inversiones
                            </p>
                            <Button onClick={() => setCreatePortfolioOpen(true)} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Crear Mi Primer Portafolio
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PortfolioPage;
