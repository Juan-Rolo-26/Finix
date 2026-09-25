import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Mail, Send, Eye, ImagePlus, Trash2, RefreshCw, Bell, AlertTriangle,
    CheckCircle2, Clock, Search,
    TrendingUp, Smartphone, Monitor, Shield, FileText, ChevronRight,
    RotateCcw, Sliders, X, Sparkles, Building2, BarChart2
} from 'lucide-react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import { TradingViewChartWidget } from '../components/TradingViewChartWidget';
import { uploadEmailImage } from '../components/EmailChart';

// --- Tipos de Datos ---
export interface MarketAlertItem {
    id: string;
    userId: string;
    assetId?: string | null;
    ticker: string;
    name?: string | null;
    alertType: 'PRICE_TARGET' | 'PERCENT_CHANGE' | '52W_HIGH' | '52W_LOW';
    targetValue: number;
    condition: 'GREATER_THAN' | 'LESS_THAN' | 'CHANGE_PCT_UP' | 'CHANGE_PCT_DOWN';
    status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED' | 'CANCELLED';
    notificationChannel: 'EMAIL' | 'PUSH' | 'ALL';
    destinationEmail?: string | null;
    triggerPrice?: number | null;
    lastCheckedAt?: string | null;
    triggeredAt?: string | null;
    activatedAt?: string | null;
    createdAt: string;
    asset?: {
        id: string;
        symbol: string;
        name: string;
        type?: string;
        tradingViewSymbol?: string;
        logo?: string;
    } | null;
    user?: {
        id: string;
        email: string;
        username?: string;
    } | null;
}

export interface CampaignItem {
    id: string;
    subject: string;
    status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
    sentCount: number;
    recipientCount: number;
    failedCount: number;
    createdAt: string;
    sentAt?: string | null;
    scheduledAt?: string | null;
    recipients?: Array<{
        id: string;
        email: string;
        status: string;
        error?: string | null;
        sentAt?: string | null;
    }>;
}

export interface AnalysisSummary {
    id: string;
    companyName: string;
    ticker: string;
    symbol: string;
    status: string;
    slug?: string;
    createdAt: string;
    currentPrice?: number | null;
    targetPrice?: number | null;
    recommendation?: string;
    summary?: string;
    thesis?: string;
    logoUrl?: string;
}

const inputClass = 'w-full min-w-0 rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const labelClass = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block';
const toEmailMediaUrl = (value?: string | null) => {
    if (!value) return '';
    try {
        return new URL(value, 'https://finixarg.com').toString();
    } catch {
        return value;
    }
};

export default function EmailMarketing() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Tabs principales
    const [tab, setTab] = useState<'overview' | 'alerts' | 'create' | 'history' | 'templates' | 'config'>(() => {
        const urlTab = searchParams.get('tab');
        if (urlTab === 'alerts' || urlTab === 'create' || urlTab === 'history' || urlTab === 'config') {
            return urlTab;
        }
        if (searchParams.get('analysisId') || searchParams.get('ticker')) {
            return 'create';
        }
        return 'overview';
    });

    // Estados generales
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sendEnabled, setSendEnabled] = useState(true);

    // Dashboard metrics
    const [metrics, setMetrics] = useState<Record<string, any>>({});
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

    // Formulario de Email
    const [form, setForm] = useState({
        subject: '',
        title: '',
        message: '',
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        imageUrl: '',
        chartUrl: '',
        analysisId: '',
        ctaLabel: 'Ver Análisis Completo en Finix',
        ctaUrl: 'https://finixarg.com',
        audience: 'PRO',
        scheduledAt: '',
    });

    const [htmlPreview, setHtmlPreview] = useState('');
    const [mobilePreview, setMobilePreview] = useState(false);
    const [testEmail, setTestEmail] = useState('juan@finixarg.com');

    // Alertas
    const [alerts, setAlerts] = useState<MarketAlertItem[]>([]);
    const [alertsFilter, setAlertsFilter] = useState<'ALL' | 'ACTIVE' | 'TRIGGERED' | 'DISABLED'>('ALL');
    const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
    const [alertForm, setAlertForm] = useState({
        ticker: 'AAPL',
        name: 'Apple Inc.',
        alertType: 'PRICE_TARGET' as MarketAlertItem['alertType'],
        condition: 'GREATER_THAN' as MarketAlertItem['condition'],
        targetValue: 250,
        notificationChannel: 'EMAIL' as MarketAlertItem['notificationChannel'],
        destinationEmail: '',
    });

    // Selector de activos / búsqueda
    const [assetQuery, setAssetQuery] = useState('');
    const [assetResults, setAssetResults] = useState<any[]>([]);
    const [searchingAssets, setSearchingAssets] = useState(false);

    // Modal de Análisis para vincular
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysesList, setAnalysesList] = useState<AnalysisSummary[]>([]);
    const [analysisSearch, setAnalysisSearch] = useState('');
    const [loadingAnalyses, setLoadingAnalyses] = useState(false);

    // Modal de Detalle de Campaña
    const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<CampaignItem | null>(null);

    // Cargar datos al montar
    useEffect(() => {
        loadDashboard();
        loadAlerts();
    }, []);

    // Detectar query params iniciales (por ej. si viene redirigido desde Análisis)
    useEffect(() => {
        const analysisId = searchParams.get('analysisId');
        const ticker = searchParams.get('ticker');
        if (analysisId) {
            attachAnalysisById(analysisId, ticker || undefined);
            setTab('create');
        } else if (ticker) {
            setForm(f => ({ ...f, ticker: ticker.toUpperCase() }));
            setAlertForm(a => ({ ...a, ticker: ticker.toUpperCase() }));
        }
    }, [searchParams]);

    // Helpers de API
    const runAsync = async (fn: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            await fn();
        } catch (err: any) {
            setError(err?.message || 'Ocurrió un error inesperado');
        } finally {
            setBusy(false);
        }
    };

    const loadDashboard = async () => {
        try {
            const res = await adminFetch('/admin/email-marketing/dashboard');
            if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al cargar métricas'));
            const data = await res.json();
            setMetrics(data.metrics || {});
            setCampaigns(data.campaigns || []);
            setSendEnabled(data.sendEnabled ?? true);
        } catch (err: any) {
            console.error('Error al cargar dashboard de email:', err);
        }
    };

    const loadAlerts = async () => {
        try {
            const res = await adminFetch('/alerts');
            if (res.ok) {
                const data = await res.json();
                setAlerts(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error al cargar alertas:', err);
        }
    };

    // Búsqueda de activos en tiempo real
    const searchAssets = async (query: string) => {
        setAssetQuery(query);
        if (!query || query.trim().length < 2) {
            setAssetResults([]);
            return;
        }
        setSearchingAssets(true);
        try {
            const res = await adminFetch(`/market/search?q=${encodeURIComponent(query.trim())}`);
            if (res.ok) {
                const data = await res.json();
                setAssetResults(Array.isArray(data) ? data.slice(0, 8) : []);
            }
        } catch (err) {
            console.error('Error buscando activo:', err);
        } finally {
            setSearchingAssets(false);
        }
    };

    const selectAssetForEmail = (asset: any) => {
        const sym = (asset.symbol || asset.ticker || '').toUpperCase();
        const nm = asset.name || sym;
        setForm(f => ({
            ...f,
            ticker: sym,
            companyName: nm,
            subject: f.subject ? f.subject : `Actualización Financiera: ${nm} (${sym})`,
            title: f.title ? f.title : `Análisis Institucional: ${nm}`,
        }));
        setAssetQuery('');
        setAssetResults([]);
        setHtmlPreview('');
    };

    const selectAssetForAlert = (asset: any) => {
        const sym = (asset.symbol || asset.ticker || '').toUpperCase();
        const nm = asset.name || sym;
        setAlertForm(a => ({
            ...a,
            ticker: sym,
            name: nm,
            targetValue: asset.price || asset.close || a.targetValue || 100,
        }));
        setAssetQuery('');
        setAssetResults([]);
    };

    // Vincular Análisis existente
    const openAnalysisSelector = async () => {
        setIsAnalysisModalOpen(true);
        if (!analysesList.length) {
            setLoadingAnalyses(true);
            try {
                const res = await adminFetch('/admin/analysis?limit=100');
                if (res.ok) {
                    const data = await res.json();
                    const list = (data.data || data || []).map((x: any) => ({
                        id: x.id,
                        companyName: x.companyName || x.name || x.symbol,
                        ticker: x.ticker || x.symbol,
                        symbol: x.symbol || x.ticker,
                        status: x.status,
                        slug: x.slug,
                        createdAt: x.createdAt,
                        currentPrice: x.currentPrice,
                        targetPrice: x.targetPrice,
                        recommendation: x.recommendation,
                        summary: x.thesis || x.summary || x.description,
                        logoUrl: x.logoUrl || x.logo,
                    }));
                    setAnalysesList(list);
                }
            } catch (err) {
                console.error('Error cargando análisis:', err);
            } finally {
                setLoadingAnalyses(false);
            }
        }
    };

    const attachAnalysisById = async (id: string, fallbackTicker?: string) => {
        try {
            const res = await adminFetch(`/admin/email-marketing/analysis-details/${id}`);
            if (res.ok) {
                const data = await res.json();
                const analysis = data.analysis;
                const ticker = analysis.ticker || analysis.symbol || fallbackTicker || 'AAPL';
                const name = analysis.companyName || ticker;
                const publicUrl = `https://finixarg.com/analysis/${encodeURIComponent(analysis.slug || analysis.id)}`;
                let technicalData: Record<string, any> = {};
                try {
                    technicalData = typeof analysis.technicalData === 'string'
                        ? JSON.parse(analysis.technicalData)
                        : (analysis.technicalData || {});
                } catch {
                    technicalData = {};
                }

                setForm(f => ({
                    ...f,
                    analysisId: analysis.id,
                    ticker: ticker.toUpperCase(),
                    companyName: name,
                    subject: `Análisis PRO: ${name} (${ticker.toUpperCase()}) — Tesis y Métricas Clave`,
                    title: `Tesis Institucional: ${name} (${ticker.toUpperCase()})`,
                    message: analysis.thesis || analysis.summary || `Te presentamos el análisis fundamental y técnico completo de ${name}. Evaluamos métricas de valoración, perspectivas de crecimiento y riesgos principales.`,
                    ctaLabel: 'Ver Análisis Completo en Finix PRO',
                    ctaUrl: publicUrl,
                    imageUrl: analysis.logoUrl || f.imageUrl,
                    chartUrl: toEmailMediaUrl(technicalData.chartSnapshotUrl) || f.chartUrl,
                }));
                setNotice(`Análisis de ${name} adjuntado exitosamente.`);
                setHtmlPreview('');
            }
        } catch (err: any) {
            console.error('Error al precargar análisis:', err);
        }
    };

    const attachAnalysis = (item: AnalysisSummary) => {
        setIsAnalysisModalOpen(false);
        attachAnalysisById(item.id, item.ticker);
    };

    // Vista previa de email
    const generatePreview = () => runAsync(async () => {
        const payload = {
            ...form,
            scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        };
        const res = await adminFetch('/admin/email-marketing/preview', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'No se pudo generar la vista previa'));
        const data = await res.json();
        setHtmlPreview(data.html || '');
        setNotice('Vista previa actualizada');
    });

    // Enviar campaña a PRO
    const handleSendCampaign = (e: React.FormEvent) => {
        e.preventDefault();
        const recipientCount = metrics.recipientCount || 0;
        const confirmMsg = form.scheduledAt
            ? `¿Deseas programar el envío para el ${new Date(form.scheduledAt).toLocaleString()} a ${recipientCount} usuarios PRO elegibles?`
            : `¿Confirmas el envío inmediato a ${recipientCount} usuarios PRO activos con consentimiento?`;

        if (!window.confirm(confirmMsg)) return;

        runAsync(async () => {
            const payload = {
                ...form,
                scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
            };
            const res = await adminFetch('/admin/email-marketing/campaigns', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al enviar o programar campaña'));
            setNotice(form.scheduledAt ? 'Campaña programada exitosamente.' : 'Campaña enviada a la cola de procesamiento.');
            await loadDashboard();
            setTab('history');
        });
    };

    // Enviar email de prueba
    const handleSendTestEmail = () => runAsync(async () => {
        if (!testEmail || !testEmail.includes('@')) {
            throw new Error('Ingresa un email de destino válido');
        }
        const payload = {
            campaign: {
                ...form,
                scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
            },
            email: testEmail.trim(),
        };
        const res = await adminFetch('/admin/email-marketing/test', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al enviar email de prueba'));
        setNotice(`Email de prueba enviado exitosamente a ${testEmail}.`);
    });

    // Subir imagen para email
    const handleUploadImage = (file?: File) => {
        if (!file) return;
        runAsync(async () => {
            const url = await uploadEmailImage(file);
            setForm(f => ({ ...f, imageUrl: url }));
            setHtmlPreview('');
            setNotice('Imagen cargada con éxito');
        });
    };

    const handleUploadChartImage = (file?: File) => {
        if (!file) return;
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('La captura del gráfico debe ser JPG, PNG, WEBP o GIF.');
            return;
        }
        setBusy(true);
        setError(null);
        setNotice(null);
        void (async () => {
            try {
                const url = await uploadEmailImage(file);
                setForm({ ...form, chartUrl: url });
                setHtmlPreview('');
                setNotice('Captura del gráfico cargada. Actualizá la vista previa para verla en el email.');
            } catch (err: any) {
                setError(err?.message || 'No se pudo cargar la captura del gráfico.');
            } finally {
                setBusy(false);
            }
        })();
    };

    // Gestión de Alertas
    const handleCreateAlert = (e: React.FormEvent) => {
        e.preventDefault();
        runAsync(async () => {
            const res = await adminFetch('/alerts', {
                method: 'POST',
                body: JSON.stringify({
                    ticker: alertForm.ticker.trim().toUpperCase(),
                    name: alertForm.name,
                    alertType: alertForm.alertType,
                    condition: alertForm.condition,
                    targetValue: Number(alertForm.targetValue),
                    notificationChannel: alertForm.notificationChannel,
                    destinationEmail: alertForm.destinationEmail || undefined,
                }),
            });
            if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'No se pudo crear la alerta'));
            setNotice(`Alerta para ${alertForm.ticker.toUpperCase()} creada exitosamente.`);
            setIsCreateAlertOpen(false);
            await loadAlerts();
            await loadDashboard();
        });
    };

    const handleToggleAlert = (id: string) => runAsync(async () => {
        const res = await adminFetch(`/alerts/${id}/toggle`, { method: 'PATCH' });
        if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al cambiar estado de la alerta'));
        await loadAlerts();
        await loadDashboard();
    });

    const handleDeleteAlert = (id: string, ticker: string) => {
        if (!window.confirm(`¿Seguro que deseas eliminar la alerta para ${ticker}?`)) return;
        runAsync(async () => {
            const res = await adminFetch(`/alerts/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al eliminar alerta'));
            setNotice(`Alerta para ${ticker} eliminada.`);
            await loadAlerts();
            await loadDashboard();
        });
    };

    const handleCheckAlertsNow = () => runAsync(async () => {
        const res = await adminFetch('/alerts/check', { method: 'POST' });
        if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al ejecutar comprobación'));
        const result = await res.json();
        setNotice(`Comprobación completada: ${result.checked} verificadas, ${result.triggered} disparadas.`);
        await loadAlerts();
        await loadDashboard();
    });

    // Detalle de Campaña e Historial
    const openCampaignDetail = (id: string) => runAsync(async () => {
        const res = await adminFetch(`/admin/email-marketing/campaigns/${id}`);
        if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'No se pudo cargar el detalle'));
        const data = await res.json();
        setSelectedCampaignDetail(data.campaign);
    });

    const handleRetryCampaign = (id: string) => runAsync(async () => {
        const res = await adminFetch(`/admin/email-marketing/campaigns/${id}/retry`, { method: 'POST' });
        if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al reintentar envíos'));
        const data = await res.json();
        setNotice(`Reintento iniciado para ${data.retriedCount} destinatarios.`);
        if (selectedCampaignDetail?.id === id) {
            await openCampaignDetail(id);
        }
        await loadDashboard();
    });

    // Filtrado de alertas
    const filteredAlerts = useMemo(() => {
        if (alertsFilter === 'ALL') return alerts;
        return alerts.filter(a => a.status === alertsFilter);
    }, [alerts, alertsFilter]);

    // Filtrado de análisis para el modal selector
    const filteredAnalyses = useMemo(() => {
        if (!analysisSearch.trim()) return analysesList;
        const q = analysisSearch.toLowerCase();
        return analysesList.filter(a =>
            a.companyName.toLowerCase().includes(q) ||
            a.ticker.toLowerCase().includes(q) ||
            (a.slug && a.slug.toLowerCase().includes(q))
        );
    }, [analysesList, analysisSearch]);

    return (
        <div className="space-y-6 text-foreground max-w-7xl mx-auto pb-16">
            {/* Header principal */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                Emails & Alertas de Finix
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    PRO Suite
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Centro institucional de alertas de mercado, análisis vinculados y despachos automatizados por correo.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            setTab('alerts');
                            setIsCreateAlertOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground transition-all shadow-sm"
                    >
                        <Bell className="w-4 h-4 text-amber-400" />
                        Nueva Alerta
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('create')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        <Send className="w-4 h-4" />
                        Redactar Email PRO
                    </button>
                </div>
            </header>

            {/* Mensajes de feedback */}
            {error && (
                <div role="alert" className="flex items-start gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm animate-in fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                    <button onClick={() => setError(null)} className="text-rose-400/60 hover:text-rose-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {notice && (
                <div role="status" className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">{notice}</div>
                    <button onClick={() => setNotice(null)} className="text-emerald-400/60 hover:text-emerald-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {!sendEnabled && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Los envíos reales se encuentran en pausa en este entorno. Las campañas y alertas creadas se conservarán registradas en la cola.</span>
                </div>
            )}

            {/* Navegación por pestañas */}
            <nav className="flex items-center gap-2 border-b border-border/60 overflow-x-auto pb-1 text-sm scrollbar-none">
                {[
                    { id: 'overview', label: 'Resumen & KPIs', icon: BarChart2 },
                    { id: 'alerts', label: 'Alertas de Mercado', icon: Bell, badge: alerts.filter(a => a.status === 'ACTIVE').length },
                    { id: 'create', label: 'Editor & TradingView', icon: Mail },
                    { id: 'history', label: 'Historial de Envíos', icon: Clock, badge: campaigns.length },
                    { id: 'config', label: 'Configuración', icon: Sliders },
                ].map(item => {
                    const Icon = item.icon;
                    const isActive = tab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setTab(item.id as any);
                                setSearchParams({ tab: item.id });
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    isActive ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* TAB 1: RESUMEN & KPIs */}
            {tab === 'overview' && (
                <section className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                        {[
                            { label: 'Destinatarios PRO', value: metrics.recipientCount ?? 0, icon: Shield, color: 'text-blue-400' },
                            { label: 'Emails Enviados', value: metrics.sent ?? 0, icon: CheckCircle2, color: 'text-emerald-400' },
                            { label: 'Envíos Fallidos', value: metrics.failed ?? 0, icon: AlertTriangle, color: 'text-rose-400' },
                            { label: 'Campañas Totales', value: campaigns.length, icon: Mail, color: 'text-amber-400' },
                            { label: 'Alertas Activas', value: alerts.filter(a => a.status === 'ACTIVE').length, icon: Bell, color: 'text-purple-400' },
                            { label: 'Alertas Disparadas', value: alerts.filter(a => a.status === 'TRIGGERED').length, icon: TrendingUp, color: 'text-cyan-400' },
                        ].map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm space-y-2">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="text-[11px] font-medium">{stat.label}</span>
                                        <Icon className={`w-4 h-4 ${stat.color}`} />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight text-foreground">
                                        {stat.value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Bloque Alertas */}
                        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Bell className="w-5 h-5 text-amber-400" />
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground">Alertas Activas de Mercado</h3>
                                        <p className="text-xs text-muted-foreground">Monitoreo continuo cada 30 segundos</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckAlertsNow}
                                    disabled={busy}
                                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                                    title="Evaluar mercado ahora"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                                    Verificar
                                </button>
                            </div>

                            <div className="space-y-2">
                                {alerts.filter(a => a.status === 'ACTIVE').slice(0, 4).map(alert => (
                                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-foreground px-2 py-0.5 rounded bg-muted/50">
                                                {alert.ticker}
                                            </span>
                                            <span className="text-muted-foreground">{alert.name || 'Activo'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-emerald-400">
                                                {alert.condition === 'GREATER_THAN' ? '≥' : alert.condition === 'LESS_THAN' ? '≤' : 'Δ'} ${alert.targetValue}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {alert.notificationChannel}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {!alerts.filter(a => a.status === 'ACTIVE').length && (
                                    <div className="text-center py-6 text-xs text-muted-foreground">
                                        No hay alertas activas en este momento.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setTab('alerts')}
                                className="w-full py-2 text-xs font-semibold text-primary hover:underline text-center flex items-center justify-center gap-1"
                            >
                                Administrar todas las alertas <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Bloque Envíos Recientes */}
                        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Mail className="w-5 h-5 text-primary" />
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground">Campañas de Email Recientes</h3>
                                        <p className="text-xs text-muted-foreground">Despachos institucionales a usuarios PRO</p>
                                    </div>
                                </div>
                                <button
                                    onClick={loadDashboard}
                                    disabled={busy}
                                    className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                                    title="Actualizar listado"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {campaigns.slice(0, 4).map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40 text-xs">
                                        <div className="truncate max-w-[240px]">
                                            <p className="font-medium text-foreground truncate">{c.subject}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(c.createdAt).toLocaleDateString()} · {c.sentCount}/{c.recipientCount} entregados
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            c.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            c.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            c.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                ))}
                                {!campaigns.length && (
                                    <div className="text-center py-6 text-xs text-muted-foreground">
                                        No hay campañas registradas aún.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setTab('history')}
                                className="w-full py-2 text-xs font-semibold text-primary hover:underline text-center flex items-center justify-center gap-1"
                            >
                                Ver historial completo <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* TAB 2: ALERTAS DE MERCADO */}
            {tab === 'alerts' && (
                <section className="space-y-6">
                    {/* Toolbar de alertas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/60">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">Filtrar:</span>
                            {(['ALL', 'ACTIVE', 'TRIGGERED', 'DISABLED'] as const).map(flt => (
                                <button
                                    key={flt}
                                    onClick={() => setAlertsFilter(flt)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        alertsFilter === flt
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {flt === 'ALL' ? 'Todas' : flt === 'ACTIVE' ? 'Activas' : flt === 'TRIGGERED' ? 'Disparadas' : 'Inactivas'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCheckAlertsNow}
                                disabled={busy}
                                className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                                Comprobar Mercado en Vivo
                            </button>
                            <button
                                onClick={() => setIsCreateAlertOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                Crear Alerta
                            </button>
                        </div>
                    </div>

                    {/* Modal o Panel de Creación de Alerta */}
                    {isCreateAlertOpen && (
                        <div className="p-6 rounded-3xl border border-primary/30 bg-card shadow-lg space-y-5 animate-in fade-in">
                            <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-base text-foreground">Crear Nueva Alerta de Mercado</h3>
                                </div>
                                <button
                                    onClick={() => setIsCreateAlertOpen(false)}
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateAlert} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Buscador de Activo */}
                                    <div className="space-y-1 relative">
                                        <label className={labelClass}>Activo Financiero (Ticker o Empresa)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Ej. AAPL, NVDA, SPY, BTC, GGAL..."
                                                value={alertForm.ticker}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setAlertForm(a => ({ ...a, ticker: val }));
                                                    searchAssets(val);
                                                }}
                                                className={inputClass}
                                                required
                                            />
                                            {searchingAssets && (
                                                <div className="absolute right-3 top-3">
                                                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Dropdown de sugerencias */}
                                        {assetResults.length > 0 && (
                                            <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                                {assetResults.map((item, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => selectAssetForAlert(item)}
                                                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center justify-between border-b border-border/30 last:border-b-0"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-foreground mr-2 font-mono">
                                                                {item.symbol || item.ticker}
                                                            </span>
                                                            <span className="text-muted-foreground">{item.name}</span>
                                                        </div>
                                                        <span className="text-[10px] uppercase font-semibold text-primary">
                                                            {item.exchange || item.type || 'STK'}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Nombre del activo */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>Nombre / Descripción</label>
                                        <input
                                            type="text"
                                            value={alertForm.name}
                                            onChange={e => setAlertForm(a => ({ ...a, name: e.target.value }))}
                                            className={inputClass}
                                            placeholder="Nombre del activo o nota"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-3 gap-4">
                                    {/* Tipo de Alerta */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>Tipo de Alerta</label>
                                        <select
                                            value={alertForm.alertType}
                                            onChange={e => setAlertForm(a => ({ ...a, alertType: e.target.value as any }))}
                                            className={inputClass}
                                        >
                                            <option value="PRICE_TARGET">Precio Objetivo</option>
                                            <option value="PERCENT_CHANGE">Variación Diaria %</option>
                                            <option value="52W_HIGH">Máximo 52 Semanas</option>
                                            <option value="52W_LOW">Mínimo 52 Semanas</option>
                                        </select>
                                    </div>

                                    {/* Condición */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>Condición de Disparo</label>
                                        <select
                                            value={alertForm.condition}
                                            onChange={e => setAlertForm(a => ({ ...a, condition: e.target.value as any }))}
                                            className={inputClass}
                                        >
                                            <option value="GREATER_THAN">Supera o igual a (≥)</option>
                                            <option value="LESS_THAN">Cae por debajo de (≤)</option>
                                            <option value="CHANGE_PCT_UP">Sube más de % diario</option>
                                            <option value="CHANGE_PCT_DOWN">Cae más de % diario</option>
                                        </select>
                                    </div>

                                    {/* Valor Objetivo */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>Valor Objetivo (USD / %)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={alertForm.targetValue}
                                            onChange={e => setAlertForm(a => ({ ...a, targetValue: parseFloat(e.target.value) || 0 }))}
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Canal */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>Canal de Notificación</label>
                                        <select
                                            value={alertForm.notificationChannel}
                                            onChange={e => setAlertForm(a => ({ ...a, notificationChannel: e.target.value as any }))}
                                            className={inputClass}
                                        >
                                            <option value="EMAIL">Email Únicamente</option>
                                            <option value="PUSH">Notificación en Plataforma (In-App)</option>
                                            <option value="ALL">Email + Notificación In-App</option>
                                        </select>
                                    </div>

                                    {/* Destino */}
                                    <div className="space-y-1">
                                        <label className={labelClass}>Email Destino (Opcional si es usuario actual)</label>
                                        <input
                                            type="email"
                                            value={alertForm.destinationEmail}
                                            onChange={e => setAlertForm(a => ({ ...a, destinationEmail: e.target.value }))}
                                            className={inputClass}
                                            placeholder="juan@finixarg.com"
                                        />
                                    </div>
                                </div>

                                {/* Mini Gráfico de referencia */}
                                {alertForm.ticker && (
                                    <div className="pt-2">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                                            Gráfico en tiempo real de {alertForm.ticker}
                                        </span>
                                        <TradingViewChartWidget
                                            symbol={alertForm.ticker}
                                            height={340}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateAlertOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                                    >
                                        Guardar y Activar Alerta
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tabla de Alertas */}
                    <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="p-3.5">Activo / Ticker</th>
                                        <th className="p-3.5">Tipo & Condición</th>
                                        <th className="p-3.5">Objetivo</th>
                                        <th className="p-3.5">Disparo / Última Verif.</th>
                                        <th className="p-3.5">Canal</th>
                                        <th className="p-3.5">Estado</th>
                                        <th className="p-3.5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredAlerts.map(alert => (
                                        <tr key={alert.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="font-mono font-bold text-foreground text-sm">
                                                        {alert.ticker}
                                                    </span>
                                                    <span className="text-muted-foreground truncate max-w-[140px]">
                                                        {alert.name || alert.asset?.name || ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className="font-medium text-foreground">
                                                    {alert.condition === 'GREATER_THAN' ? 'Sube sobre' :
                                                     alert.condition === 'LESS_THAN' ? 'Cae bajo' :
                                                     alert.condition === 'CHANGE_PCT_UP' ? 'Variación +' : 'Variación -'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                    {alert.alertType}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-bold text-emerald-400 font-mono text-sm">
                                                ${alert.targetValue}
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {alert.triggeredAt ? (
                                                    <span className="text-amber-400 font-medium">
                                                        Disparada: ${alert.triggerPrice ?? '—'} ({new Date(alert.triggeredAt).toLocaleDateString()})
                                                    </span>
                                                ) : alert.lastCheckedAt ? (
                                                    `Verif: ${new Date(alert.lastCheckedAt).toLocaleTimeString()}`
                                                ) : (
                                                    'Pendiente de 1ra comprobación'
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                <span className="px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-mono text-[10px]">
                                                    {alert.notificationChannel}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    alert.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    alert.status === 'TRIGGERED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                    {alert.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleAlert(alert.id)}
                                                        title={alert.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                                                        className="p-1.5 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                                                    >
                                                        {alert.status === 'ACTIVE' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        ) : (
                                                            <RotateCcw className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAlert(alert.id, alert.ticker)}
                                                        title="Eliminar alerta"
                                                        className="p-1.5 rounded-lg border border-border/60 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!filteredAlerts.length && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No se encontraron alertas en este estado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* TAB 3: EDITOR DE EMAILS & TRADINGVIEW */}
            {tab === 'create' && (
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* Columna Izquierda: Formulario y Gráfico TradingView (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Selector y Gráfico de Activo */}
                        <div className="p-5 rounded-3xl border border-border/60 bg-card space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-primary" />
                                        Activo Financiero Vinculado
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        El email y el gráfico de TradingView se sincronizan con este activo.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={openAnalysisSelector}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Adjuntar Análisis de Finix
                                    </button>
                                </div>
                            </div>

                            {/* Búsqueda de Activo */}
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Buscar por Ticker o Empresa (ej. AAPL, NVDA, SPY)..."
                                            value={assetQuery}
                                            onChange={e => searchAssets(e.target.value)}
                                            className={inputClass}
                                        />
                                        {searchingAssets && (
                                            <div className="absolute right-3 top-3">
                                                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs font-mono font-bold text-foreground">
                                        {form.ticker}
                                    </div>
                                </div>

                                {/* Sugerencias */}
                                {assetResults.length > 0 && (
                                    <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {assetResults.map((item, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => selectAssetForEmail(item)}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center justify-between border-b border-border/30 last:border-b-0"
                                            >
                                                <div>
                                                    <span className="font-bold text-foreground mr-2 font-mono">
                                                        {item.symbol || item.ticker}
                                                    </span>
                                                    <span className="text-muted-foreground">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] uppercase font-semibold text-primary">
                                                    {item.exchange || item.type || 'STK'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Captura exacta que se enviará en el email */}
                            <div className="pt-2 rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                            <ImagePlus className="w-4 h-4 text-primary" />
                                            Captura del gráfico para el email
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                                            Dibujá en el gráfico, descargá la captura con el ícono de cámara y subila acá. El email mostrará la imagen completa, con todas tus líneas y anotaciones.
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border self-start">
                                        {form.chartUrl ? 'Captura cargada' : 'Sin captura'}
                                    </span>
                                </div>

                                {form.chartUrl ? (
                                    <div className="rounded-xl border border-border/70 bg-background/70 p-2 overflow-hidden">
                                        <img
                                            src={form.chartUrl}
                                            alt={`Captura del análisis de ${form.ticker || 'activo'}`}
                                            className="w-full max-h-[520px] object-contain rounded-lg bg-white"
                                        />
                                    </div>
                                ) : (
                                    <div className="min-h-[130px] rounded-xl border border-dashed border-border bg-background/50 flex items-center justify-center text-center px-5">
                                        <p className="text-xs text-muted-foreground">Todavía no hay una captura. El email no enviará un gráfico vacío.</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <label className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold cursor-pointer transition-colors">
                                        <ImagePlus className="w-4 h-4" />
                                        {form.chartUrl ? 'Reemplazar captura' : 'Subir captura del gráfico'}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            className="hidden"
                                            onChange={e => handleUploadChartImage(e.target.files?.[0])}
                                        />
                                    </label>
                                    {form.chartUrl && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm(f => ({ ...f, chartUrl: '' }));
                                                setHtmlPreview('');
                                            }}
                                            className="px-3.5 py-2.5 rounded-xl border border-rose-500/25 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-colors"
                                        >
                                            Quitar captura
                                        </button>
                                    )}
                                </div>

                                <details className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
                                    <summary className="px-3.5 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground">
                                        Abrir gráfico en vivo para dibujar o tomar una nueva captura
                                    </summary>
                                    <div className="p-3 border-t border-border/50">
                                        <TradingViewChartWidget
                                            symbol={form.ticker}
                                            height={420}
                                        />
                                        <p className="text-[11px] text-muted-foreground mt-2">
                                            Usá el botón de cámara de TradingView para descargar la imagen y después subila arriba.
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* Formulario de Contenido del Email */}
                        <form onSubmit={handleSendCampaign} className="p-6 rounded-3xl border border-border/60 bg-card space-y-4">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                                <FileText className="w-4 h-4 text-primary" />
                                Redacción del Email Institucional
                            </h3>

                            {/* Asunto */}
                            <div className="space-y-1">
                                <label className={labelClass}>Asunto del Email</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={160}
                                    value={form.subject}
                                    onChange={e => {
                                        setForm(f => ({ ...f, subject: e.target.value }));
                                        setHtmlPreview('');
                                    }}
                                    className={inputClass}
                                    placeholder="Ej. Análisis PRO: Apple Inc. (AAPL) — Tesis y Métricas Clave"
                                />
                            </div>

                            {/* Encabezado / Título */}
                            <div className="space-y-1">
                                <label className={labelClass}>Título Principal (Header)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={160}
                                    value={form.title}
                                    onChange={e => {
                                        setForm(f => ({ ...f, title: e.target.value }));
                                        setHtmlPreview('');
                                    }}
                                    className={inputClass}
                                    placeholder="Ej. Tesis Institucional y Valoración Fundamental"
                                />
                            </div>

                            {/* Mensaje / Introducción */}
                            <div className="space-y-1">
                                <label className={labelClass}>Introducción / Tesis del Análisis</label>
                                <textarea
                                    required
                                    rows={5}
                                    maxLength={10000}
                                    value={form.message}
                                    onChange={e => {
                                        setForm(f => ({ ...f, message: e.target.value }));
                                        setHtmlPreview('');
                                    }}
                                    className={inputClass}
                                    placeholder="Compartimos los detalles del análisis, valuación con descuento de flujos y perspectivas de crecimiento..."
                                />
                            </div>

                            {/* Imagen adjunta */}
                            <div className="grid sm:grid-cols-2 gap-3 items-end">
                                <div className="space-y-1">
                                    <label className={labelClass}>URL de Imagen o Logo Adjunto</label>
                                    <input
                                        type="url"
                                        value={form.imageUrl}
                                        onChange={e => {
                                            setForm(f => ({ ...f, imageUrl: e.target.value }));
                                            setHtmlPreview('');
                                        }}
                                        className={inputClass}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-xs font-semibold cursor-pointer transition-all">
                                        <ImagePlus className="w-4 h-4 text-primary" />
                                        Subir Imagen Local
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={e => handleUploadImage(e.target.files?.[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Call to action */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className={labelClass}>Texto del Botón (CTA)</label>
                                    <input
                                        type="text"
                                        value={form.ctaLabel}
                                        onChange={e => {
                                            setForm(f => ({ ...f, ctaLabel: e.target.value }));
                                            setHtmlPreview('');
                                        }}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={labelClass}>URL de Destino</label>
                                    <input
                                        type="url"
                                        value={form.ctaUrl}
                                        onChange={e => {
                                            setForm(f => ({ ...f, ctaUrl: e.target.value }));
                                            setHtmlPreview('');
                                        }}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Programación */}
                            <div className="space-y-1">
                                <label className={labelClass}>
                                    Programar Envío (Opcional · {Intl.DateTimeFormat().resolvedOptions().timeZone})
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.scheduledAt}
                                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>

                            {/* Acciones principales */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={generatePreview}
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all"
                                >
                                    <Eye className="w-4 h-4 text-primary" />
                                    Actualizar Vista Previa
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="submit"
                                        disabled={busy || !sendEnabled}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-40"
                                    >
                                        <Send className="w-4 h-4" />
                                        {form.scheduledAt ? 'Programar Despacho' : `Enviar a ${metrics.recipientCount || 0} Usuarios PRO`}
                                    </button>
                                </div>
                            </div>

                            {/* Prueba rápida */}
                            <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative flex-1 w-full">
                                    <input
                                        type="email"
                                        value={testEmail}
                                        onChange={e => setTestEmail(e.target.value)}
                                        className={inputClass}
                                        placeholder="Email para envío de prueba"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendTestEmail}
                                    disabled={busy || !sendEnabled || !testEmail}
                                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-all disabled:opacity-40 whitespace-nowrap"
                                >
                                    Enviar Prueba Individual
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Columna Derecha: Vista Previa Real (5 cols) */}
                    <div className="lg:col-span-5 sticky top-4 space-y-3">
                        <div className="p-4 rounded-3xl border border-border/60 bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-primary" />
                                    <h4 className="font-bold text-xs text-foreground">Vista Previa del Email</h4>
                                </div>

                                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setMobilePreview(false)}
                                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                                            !mobilePreview ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                                        }`}
                                        title="Vista Desktop"
                                    >
                                        <Monitor className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMobilePreview(true)}
                                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                                            mobilePreview ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                                        }`}
                                        title="Vista Móvil (375px)"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Render de iframe */}
                            <div className="w-full flex justify-center bg-muted/10 rounded-2xl p-2 border border-border/40 overflow-hidden">
                                {htmlPreview ? (
                                    <iframe
                                        title="Vista previa del email"
                                        sandbox="allow-same-origin"
                                        srcDoc={htmlPreview}
                                        style={{ height: '700px' }}
                                        className={`rounded-xl border border-border bg-white transition-all duration-300 ${
                                            mobilePreview ? 'w-[375px]' : 'w-full'
                                        }`}
                                    />
                                ) : (
                                    <div className="h-[500px] w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-3">
                                        <Eye className="w-10 h-10 opacity-30" />
                                        <p className="text-xs">
                                            Hacé clic en <strong>"Actualizar Vista Previa"</strong> para renderizar el email con los estilos institucionales de Finix.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={generatePreview}
                                            className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all"
                                        >
                                            Generar Vista Previa Ahora
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: HISTORIAL DE ENVÍOS */}
            {tab === 'history' && (
                <section className="space-y-6">
                    <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border/60 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Campañas y Despachos Registrados
                            </h3>
                            <button
                                onClick={loadDashboard}
                                disabled={busy}
                                className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground text-xs"
                                title="Actualizar historial"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                                    <tr>
                                        <th className="p-3.5">Asunto de Campaña</th>
                                        <th className="p-3.5">Fecha / Programación</th>
                                        <th className="p-3.5">Destinatarios</th>
                                        <th className="p-3.5">Entregados</th>
                                        <th className="p-3.5">Fallidos</th>
                                        <th className="p-3.5">Estado</th>
                                        <th className="p-3.5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {campaigns.map(camp => (
                                        <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3.5">
                                                <p className="font-bold text-foreground max-w-sm truncate">{camp.subject}</p>
                                                <span className="text-[10px] text-muted-foreground font-mono">ID: {camp.id.slice(0, 8)}...</span>
                                            </td>
                                            <td className="p-3.5 text-muted-foreground">
                                                {camp.sentAt
                                                    ? new Date(camp.sentAt).toLocaleString()
                                                    : camp.scheduledAt
                                                    ? `Programado: ${new Date(camp.scheduledAt).toLocaleString()}`
                                                    : new Date(camp.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3.5 font-medium">{camp.recipientCount}</td>
                                            <td className="p-3.5 text-emerald-400 font-bold">{camp.sentCount}</td>
                                            <td className="p-3.5 font-bold">
                                                {camp.failedCount > 0 ? (
                                                    <span className="text-rose-400">{camp.failedCount}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">0</span>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    camp.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    camp.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    camp.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                    {camp.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {camp.failedCount > 0 && (
                                                        <button
                                                            onClick={() => handleRetryCampaign(camp.id)}
                                                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-semibold text-[11px] inline-flex items-center gap-1"
                                                            title="Reintentar destinatarios con error"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Reintentar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openCampaignDetail(camp.id)}
                                                        className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-foreground font-medium text-[11px]"
                                                    >
                                                        Detalle
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!campaigns.length && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No hay campañas registradas todavía.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* TAB 5: CONFIGURACIÓN */}
            {tab === 'config' && (
                <section className="space-y-6 max-w-3xl">
                    <div className="p-6 rounded-3xl border border-border/60 bg-card space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                            <Sliders className="w-5 h-5 text-primary" />
                            <div>
                                <h3 className="font-bold text-base text-foreground">Configuración de Envío & Notificaciones</h3>
                                <p className="text-xs text-muted-foreground">Parámetros globales de entrega de correo y alertas en tiempo real.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Estado de Despacho</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Controla si el worker procesa los envíos a los buzones reales.</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    sendEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                    {sendEnabled ? 'Envío Habilitado' : 'Cola Pausada'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Frecuencia del Cron de Alertas</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Intervalo de evaluación de activos contra TradingView.</p>
                                </div>
                                <span className="font-mono text-xs font-bold text-foreground px-3 py-1 rounded-lg bg-card border border-border">
                                    Cada 30 segundos
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground">Audiencia Elegible</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Usuarios suscritos a Finix PRO con consentimiento activo.</p>
                                </div>
                                <span className="font-mono text-xs font-bold text-primary px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                    {metrics.recipientCount ?? 0} usuarios
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* MODAL: SELECTOR DE ANÁLISIS EXISTENTES */}
            {isAnalysisModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-base text-foreground">Adjuntar Análisis Existente a Email</h3>
                            </div>
                            <button onClick={() => setIsAnalysisModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Buscador */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filtrar por Empresa, Ticker o Título..."
                                value={analysisSearch}
                                onChange={e => setAnalysisSearch(e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>

                        {/* Listado */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-border/30">
                            {filteredAnalyses.map(analysis => (
                                <div
                                    key={analysis.id}
                                    onClick={() => attachAnalysis(analysis)}
                                    className="pt-2 pb-2 first:pt-0 flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 cursor-pointer transition-all border border-transparent hover:border-border/60"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-foreground text-sm px-2 py-0.5 rounded bg-muted/60">
                                                {analysis.ticker || analysis.symbol}
                                            </span>
                                            <h4 className="font-bold text-sm text-foreground">{analysis.companyName}</h4>
                                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                {analysis.status}
                                            </span>
                                        </div>
                                        {analysis.summary && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                                {analysis.summary}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shrink-0 ml-3"
                                    >
                                        Adjuntar
                                    </button>
                                </div>
                            ))}

                            {!filteredAnalyses.length && (
                                <div className="text-center py-12 text-xs text-muted-foreground">
                                    {loadingAnalyses ? 'Cargando análisis institucionales...' : 'No se encontraron análisis que coincidan con la búsqueda.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DETALLE DE CAMPAÑA */}
            {selectedCampaignDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div>
                                <h3 className="font-bold text-base text-foreground">{selectedCampaignDetail.subject}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    ID: {selectedCampaignDetail.id} · Estado: {selectedCampaignDetail.status}
                                </p>
                            </div>
                            <button onClick={() => setSelectedCampaignDetail(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-muted/20 border border-border/40 text-center text-xs">
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Total Destinatarios</span>
                                <span className="font-bold text-foreground text-sm">{selectedCampaignDetail.recipientCount}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Entregados</span>
                                <span className="font-bold text-emerald-400 text-sm">{selectedCampaignDetail.sentCount}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[10px]">Fallidos</span>
                                <span className="font-bold text-rose-400 text-sm">{selectedCampaignDetail.failedCount}</span>
                            </div>
                        </div>

                        {/* Listado de destinatarios */}
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                                Detalle de Destinatarios ({selectedCampaignDetail.recipients?.length || 0})
                            </span>
                            {selectedCampaignDetail.recipients?.map((rec, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/30">
                                    <div className="truncate max-w-[320px]">
                                        <p className="font-mono text-foreground truncate">{rec.email}</p>
                                        {rec.error && <p className="text-[10px] text-rose-400 truncate">{rec.error}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        rec.status === 'SENT' ? 'text-emerald-400 bg-emerald-500/10' :
                                        rec.status === 'FAILED' ? 'text-rose-400 bg-rose-500/10' : 'text-muted-foreground'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
                            {selectedCampaignDetail.failedCount > 0 && (
                                <button
                                    onClick={() => handleRetryCampaign(selectedCampaignDetail.id)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                                >
                                    Reintentar Destinatarios Fallidos
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedCampaignDetail(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
