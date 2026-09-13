import { useState, useEffect } from 'react';
import { 
    BarChart2, Plus, Loader2, Trash2, Edit, Eye, Sparkles, 
    Smartphone, Tablet, Monitor, X, TrendingUp, DollarSign, Target, 
    Briefcase, Activity, Users, ShieldAlert
} from 'lucide-react';
import { adminFetch } from '../lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/tabs';
import { Input } from '../components/input';
import { Textarea } from '../components/textarea';
import { Button } from '../components/button';
import { Switch } from '../components/switch';
import { Label } from '../components/label';

// Componente para preview responsivo integrado
function AnalysisLivePreview({ analysis, onClose }: { analysis: any; onClose: () => void }) {
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const visibility = analysis.sectionVisibility || {};
    const summary = analysis.executiveSummary || {};
    const businessModel = analysis.businessModel || [];
    const competitors = analysis.competitorsData || [];
    const risks = analysis.risksData || [];

    const containerWidth = 
        deviceMode === 'mobile' ? 'w-[375px] max-w-[375px] border-2 border-zinc-700 rounded-[40px] p-4 shadow-2xl bg-zinc-950' : 
        deviceMode === 'tablet' ? 'w-[768px] max-w-[768px] border border-zinc-800 rounded-3xl p-6 shadow-2xl bg-zinc-950' : 
        'w-full max-w-5xl bg-transparent';

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6">
            {/* Barra superior de control */}
            <div className="w-full max-w-5xl flex items-center justify-between pb-4 border-b border-zinc-800 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                        Vista Previa Finix Pro
                    </span>
                    <span className="text-sm font-semibold text-zinc-300">
                        {analysis.companyName || analysis.symbol} ({analysis.ticker || 'N/A'})
                    </span>
                </div>

                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                    <button
                        onClick={() => setDeviceMode('desktop')}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${deviceMode === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button
                        onClick={() => setDeviceMode('tablet')}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${deviceMode === 'tablet' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Tablet className="w-3.5 h-3.5" /> Tablet
                    </button>
                    <button
                        onClick={() => setDeviceMode('mobile')}
                        className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${deviceMode === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                </div>

                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Canvas de Previsualización */}
            <div className={`transition-all duration-300 ${containerWidth} space-y-8 pb-20`}>
                {/* 1. Header */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {analysis.logoUrl ? (
                                <img src={analysis.logoUrl} alt={analysis.companyName} className="w-16 h-16 rounded-2xl object-contain bg-white/5 border border-zinc-800 p-2" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-2xl">
                                    {analysis.ticker || 'STK'}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{analysis.companyName || analysis.symbol}</h1>
                                    <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">{analysis.ticker}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                                    {analysis.exchange && <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-300 font-semibold">{analysis.exchange}</span>}
                                    {analysis.sector && <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-300">{analysis.sector}</span>}
                                    {analysis.industry && <span>• {analysis.industry}</span>}
                                    {analysis.country && <span>• {analysis.country}</span>}
                                </div>
                            </div>
                        </div>

                        {analysis.currentPrice && (
                            <div className="sm:text-right bg-zinc-950/60 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-zinc-800/60 sm:border-none">
                                <div className="text-3xl font-black text-white">${Number(analysis.currentPrice).toFixed(2)}</div>
                                <div className={`text-sm font-bold flex items-center sm:justify-end gap-1 ${Number(analysis.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {Number(analysis.dailyChange) >= 0 ? '+' : ''}{Number(analysis.dailyChange || 0).toFixed(2)}% hoy
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Snapshot Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
                        {analysis.marketCap && (
                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Market Cap</span>
                                <span className="text-sm font-bold text-zinc-200">
                                    ${(Number(analysis.marketCap) / 1e9).toFixed(1)}B
                                </span>
                            </div>
                        )}
                        {analysis.high52w && (
                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">52W High</span>
                                <span className="text-sm font-bold text-zinc-200">${Number(analysis.high52w).toFixed(2)}</span>
                            </div>
                        )}
                        {analysis.low52w && (
                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">52W Low</span>
                                <span className="text-sm font-bold text-zinc-200">${Number(analysis.low52w).toFixed(2)}</span>
                            </div>
                        )}
                        {analysis.peRatio && (
                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">P/E Ratio</span>
                                <span className="text-sm font-bold text-emerald-400">{Number(analysis.peRatio).toFixed(1)}x</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Resumen Ejecutivo */}
                {visibility.showSummary !== false && summary.title && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-center gap-2.5 text-emerald-400">
                            <Sparkles className="w-5 h-5" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Resumen Ejecutivo</h2>
                        </div>
                        <h3 className="text-base font-bold text-zinc-200">{summary.title}</h3>
                        {summary.summary && <p className="text-sm text-zinc-300 leading-relaxed">{summary.summary}</p>}

                        {(summary.positivePoints?.length > 0 || summary.negativePoints?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                                {summary.positivePoints?.length > 0 && (
                                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4 space-y-2">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Puntos Positivos</span>
                                        <ul className="space-y-1.5 text-xs text-zinc-300">
                                            {summary.positivePoints.map((pt: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-emerald-400 font-bold">•</span>
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {summary.negativePoints?.length > 0 && (
                                    <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 space-y-2">
                                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Puntos de Cautela</span>
                                        <ul className="space-y-1.5 text-xs text-zinc-300">
                                            {summary.negativePoints.map((pt: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-rose-400 font-bold">•</span>
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Fair Value Highlight */}
                {visibility.showFairValue !== false && analysis.estimatedFairValue && (
                    <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-zinc-900/60 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Target className="w-4 h-4" /> Fair Value & Valoración Intrínseca
                            </span>
                            <div className="text-2xl font-black text-white">
                                Objetivo: ${Number(analysis.estimatedFairValue).toFixed(2)}
                            </div>
                            <p className="text-xs text-zinc-400 max-w-xl">
                                Valuación calculada por el equipo de análisis financiero de Finix según modelo de flujos y múltiplos.
                            </p>
                        </div>
                        {analysis.currentPrice && (
                            <div className="bg-zinc-950/80 border border-zinc-800 px-6 py-4 rounded-2xl text-center shrink-0">
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Potencial (Upside)</span>
                                <span className={`text-2xl font-black ${Number(analysis.estimatedFairValue) >= Number(analysis.currentPrice) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {((Number(analysis.estimatedFairValue) / Number(analysis.currentPrice) - 1) * 100).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Modelo de Negocio */}
                {visibility.showBusinessModel !== false && businessModel.length > 0 && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-center gap-2.5 text-blue-400">
                            <Briefcase className="w-5 h-5" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Modelo de Negocio y Segmentos</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {businessModel.map((item: any, idx: number) => (
                                <div key={idx} className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-sm">{item.product}</span>
                                        {item.revenuePct && (
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded-full">
                                                {item.revenuePct}% ingresos
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-850">
                                        {item.growth && <span>Crec: <strong className="text-zinc-300">{item.growth}%</strong></span>}
                                        {item.margin && <span>Margen: <strong className="text-zinc-300">{item.margin}%</strong></span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Métricas Financieras Clave */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {analysis.revenue && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-emerald-400" /> Revenue TTM
                            </span>
                            <div className="text-xl font-bold text-white">${(Number(analysis.revenue) / 1e9).toFixed(1)}B</div>
                            {analysis.revenueGrowthYoY && <div className="text-xs text-emerald-400">+{analysis.revenueGrowthYoY}% YoY</div>}
                        </div>
                    )}
                    {analysis.grossMargin && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-blue-400" /> Margen Bruto
                            </span>
                            <div className="text-xl font-bold text-white">{Number(analysis.grossMargin).toFixed(1)}%</div>
                            {analysis.operatingMargin && <div className="text-xs text-zinc-400">Operativo: {analysis.operatingMargin}%</div>}
                        </div>
                    )}
                    {analysis.freeCashFlow && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-amber-400" /> Free Cash Flow
                            </span>
                            <div className="text-xl font-bold text-white">${(Number(analysis.freeCashFlow) / 1e9).toFixed(1)}B</div>
                            {analysis.fcfYield && <div className="text-xs text-amber-400">FCF Yield: {analysis.fcfYield}%</div>}
                        </div>
                    )}
                </div>

                {/* 6. Competidores */}
                {visibility.showCompetitors !== false && competitors.length > 0 && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-center gap-2.5 text-purple-400">
                            <Users className="w-5 h-5" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Comparativa con Competidores</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-950/60 text-zinc-400 uppercase border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3">Empresa</th>
                                        <th className="px-4 py-3">Ticker</th>
                                        <th className="px-4 py-3">P/E</th>
                                        <th className="px-4 py-3">ROIC</th>
                                        <th className="px-4 py-3">Margen Neto</th>
                                        <th className="px-4 py-3">Market Cap</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {competitors.map((c: any, idx: number) => (
                                        <tr key={idx} className={c.ticker === analysis.ticker ? 'bg-emerald-950/20 font-bold text-emerald-400' : 'text-zinc-300'}>
                                            <td className="px-4 py-3 font-semibold">{c.name}</td>
                                            <td className="px-4 py-3">{c.ticker}</td>
                                            <td className="px-4 py-3">{c.pe ? `${c.pe}x` : '-'}</td>
                                            <td className="px-4 py-3">{c.roic ? `${c.roic}%` : '-'}</td>
                                            <td className="px-4 py-3">{c.netMargin ? `${c.netMargin}%` : '-'}</td>
                                            <td className="px-4 py-3">{c.marketCap ? `$${c.marketCap}B` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 7. Riesgos */}
                {visibility.showRisks !== false && risks.length > 0 && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-center gap-2.5 text-rose-400">
                            <ShieldAlert className="w-5 h-5" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Principales Factores de Riesgo</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {risks.map((r: any, idx: number) => (
                                <div key={idx} className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-sm">{r.title}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            r.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            r.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                            r.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                            {r.severity || 'LOW'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed">{r.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 8. Disclaimer & Fuentes */}
                <div className="text-center text-xs text-zinc-500 pt-6 border-t border-zinc-800/60 space-y-2">
                    {analysis.sources && <p>Fuentes: {analysis.sources}</p>}
                    <p>{analysis.legalDisclaimer || 'Este informe tiene fines exclusivamente educativos e informativos y no constituye asesoramiento financiero.'}</p>
                </div>
            </div>
        </div>
    );
}

export default function AnalysisManagement() {
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');

    // Estado del formulario completo
    const [formData, setFormData] = useState<any>({
        symbol: '',
        ticker: '',
        slug: '',
        companyName: '',
        status: 'DRAFT',
        sectionVisibility: {
            showHeader: true,
            showSummary: true,
            showCompany: true,
            showBusinessModel: true,
            showGrowth: true,
            showProfitability: true,
            showCashFlow: true,
            showBalance: true,
            showValuation: true,
            showFairValue: true,
            showOwnership: true,
            showCompetitors: true,
            showTechnical: true,
            showRisks: true,
            showCatalysts: true,
            showScenarios: true,
            showConclusion: true,
        },
        executiveSummary: { title: '', summary: '', positivePoints: [], negativePoints: [], conclusion: '' },
        businessModel: [],
        competitorsData: [],
        risksData: [],
        catalystsData: [],
        scenariosData: { bull: {}, base: {}, bear: {} },
        swotData: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        historicalSeries: { revenue: [], eps: [], margins: [], cashFlow: [], debt: [], pe: [] },
        technicalData: { supports: [], resistances: [], technicalSignal: 'NEUTRAL', technicalScore: 50 },
        valuationMethodology: { method: '', assumptions: '', result: '', notes: '' },
    });

    useEffect(() => {
        fetchAnalyses();
    }, []);

    const fetchAnalyses = async () => {
        try {
            setLoading(true);
            const res = await adminFetch('/admin/analysis');
            const data = await res.json();
            setAnalyses(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (item: any) => {
        try {
            const res = await adminFetch(`/admin/analysis/${item.id}`);
            const data = await res.json();
            setFormData(data.data || item);
            setIsFormOpen(true);
            setActiveTab('overview');
        } catch (e) {
            console.error(e);
            setFormData(item);
            setIsFormOpen(true);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = formData.id ? `/admin/analysis/${formData.id}` : '/admin/analysis';
            const method = formData.id ? 'PATCH' : 'POST';

            const res = await adminFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsFormOpen(false);
                fetchAnalyses();
            } else {
                const err = await res.json();
                alert(`Error guardando: ${err.message || 'Verifica los datos'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error guardando análisis');
        } finally {
            setSaving(false);
        }
    };

    const handleQuickStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await adminFetch(`/admin/analysis/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setAnalyses(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este análisis definitivamente?')) return;
        try {
            const res = await adminFetch(`/admin/analysis/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setAnalyses(prev => prev.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSeedApple = async () => {
        try {
            setLoading(true);
            const res = await adminFetch('/admin/analysis/seed-sample', { method: 'POST' });
            if (res.ok) {
                alert('¡Análisis modelo de Apple Inc. (AAPL) cargado con éxito!');
                fetchAnalyses();
            }
        } catch (e) {
            console.error(e);
            alert('Error sembrando ejemplo');
        } finally {
            setLoading(false);
        }
    };

    const filteredAnalyses = analyses.filter(a => {
        const matchesSearch = 
            (a.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.ticker || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.symbol || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header del Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <BarChart2 className="w-7 h-7 text-emerald-500" />
                        Finix Pro — CMS de Análisis de Acciones
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Crea, edita, configura la visibilidad y publica reportes financieros profundos para suscriptores Pro.
                    </p>
                </div>

                {!isFormOpen && (
                    <div className="flex items-center gap-2.5">
                        <Button variant="outline" onClick={handleSeedApple} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Cargar Ejemplo AAPL
                        </Button>
                        <Button onClick={() => {
                            setFormData({
                                symbol: '',
                                ticker: '',
                                slug: '',
                                companyName: '',
                                status: 'DRAFT',
                                sectionVisibility: {
                                    showHeader: true,
                                    showSummary: true,
                                    showCompany: true,
                                    showBusinessModel: true,
                                    showGrowth: true,
                                    showProfitability: true,
                                    showCashFlow: true,
                                    showBalance: true,
                                    showValuation: true,
                                    showFairValue: true,
                                    showOwnership: true,
                                    showCompetitors: true,
                                    showTechnical: true,
                                    showRisks: true,
                                    showCatalysts: true,
                                    showScenarios: true,
                                    showConclusion: true,
                                },
                                executiveSummary: { title: '', summary: '', positivePoints: [], negativePoints: [] },
                                businessModel: [],
                                competitorsData: [],
                                risksData: [],
                                catalystsData: [],
                                scenariosData: { bull: {}, base: {}, bear: {} },
                                swotData: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                                historicalSeries: { revenue: [], eps: [], margins: [], cashFlow: [], debt: [], pe: [] },
                                technicalData: { supports: [], resistances: [], technicalSignal: 'NEUTRAL', technicalScore: 50 },
                                valuationMethodology: { method: '', assumptions: '', result: '', notes: '' },
                            });
                            setIsFormOpen(true);
                            setActiveTab('overview');
                        }} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Análisis
                        </Button>
                    </div>
                )}
            </div>

            {/* Vista Previa Modal */}
            {previewItem && (
                <AnalysisLivePreview 
                    analysis={previewItem} 
                    onClose={() => setPreviewItem(null)} 
                />
            )}

            {/* Vista Lista o Formulario */}
            {!isFormOpen ? (
                <div className="space-y-4">
                    {/* Barra de Búsqueda y Filtros */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/50 p-4 rounded-2xl shadow-sm">
                        <Input 
                            placeholder="Buscar por Ticker (ej: AAPL) o Empresa..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                            {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                        statusFilter === st ? 'bg-emerald-500 text-white shadow-sm' : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {st === 'ALL' ? 'Todos' : st === 'PUBLISHED' ? 'Publicados' : st === 'DRAFT' ? 'Borradores' : 'Archivados'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tabla de Análisis */}
                    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                        ) : filteredAnalyses.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground space-y-3">
                                <p>No se encontraron análisis cargados.</p>
                                <Button variant="outline" size="sm" onClick={handleSeedApple}>
                                    <Sparkles className="w-4 h-4 mr-2 text-emerald-500" /> Cargar muestra de Apple (AAPL)
                                </Button>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/40 text-muted-foreground uppercase text-xs border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Empresa / Ticker</th>
                                        <th className="px-6 py-4 font-semibold">Sector</th>
                                        <th className="px-6 py-4 font-semibold">Precio / Var</th>
                                        <th className="px-6 py-4 font-semibold">Fair Value</th>
                                        <th className="px-6 py-4 font-semibold">Estado</th>
                                        <th className="px-6 py-4 font-semibold">Actualizado</th>
                                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredAnalyses.map(item => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-bold flex items-center gap-3">
                                                {item.logoUrl ? (
                                                    <img src={item.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-muted p-1" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                                                        {item.ticker || 'STK'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-foreground">{item.companyName || item.symbol}</div>
                                                    <span className="text-xs text-muted-foreground">{item.ticker || item.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{item.sector || '-'}</td>
                                            <td className="px-6 py-4">
                                                {item.currentPrice ? (
                                                    <div>
                                                        <span className="font-semibold text-foreground">${Number(item.currentPrice).toFixed(2)}</span>
                                                        <span className={`text-xs ml-1.5 ${Number(item.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {Number(item.dailyChange) >= 0 ? '+' : ''}{Number(item.dailyChange || 0).toFixed(2)}%
                                                        </span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.estimatedFairValue ? (
                                                    <span className="font-bold text-emerald-400">${Number(item.estimatedFairValue).toFixed(2)}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.status || 'DRAFT'}
                                                    onChange={(e) => handleQuickStatusChange(item.id, e.target.value)}
                                                    className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                                                        item.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                        item.status === 'ARCHIVED' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' :
                                                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                    }`}
                                                >
                                                    <option value="DRAFT" className="bg-zinc-900 text-zinc-200">Borrador (Draft)</option>
                                                    <option value="PUBLISHED" className="bg-zinc-900 text-zinc-200">Publicado (Pro)</option>
                                                    <option value="ARCHIVED" className="bg-zinc-900 text-zinc-200">Archivado</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground text-xs">
                                                {new Date(item.updatedAt || Date.now()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="ghost" size="icon" onClick={() => setPreviewItem(item)} title="Vista Previa">
                                                        <Eye className="w-4 h-4 text-emerald-400" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Editar">
                                                        <Edit className="w-4 h-4 text-blue-400" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} title="Eliminar">
                                                        <Trash2 className="w-4 h-4 text-rose-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                /* Formulario Editor de Análisis por Pestañas */
                <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    {/* Barra Superior del Editor */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl">
                                ← Volver al listado
                            </Button>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">
                                    {formData.id ? `Editar: ${formData.companyName || formData.symbol}` : 'Nuevo Análisis de Acción'}
                                </h2>
                                <span className="text-xs text-muted-foreground">Todos los campos son opcionales. Los campos vacíos se ocultan automáticamente en Finix Pro.</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button variant="outline" onClick={() => setPreviewItem(formData)} className="border-border/60">
                                <Eye className="w-4 h-4 mr-2 text-emerald-400" /> Vista Previa
                            </Button>
                            <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Guardar Análisis
                            </Button>
                        </div>
                    </div>

                    {/* Selector de Pestañas de Secciones */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-6 flex-wrap h-auto bg-muted/40 p-1.5 rounded-2xl w-full justify-start gap-1">
                            <TabsTrigger value="overview">1. Identidad</TabsTrigger>
                            <TabsTrigger value="summary">2. Resumen</TabsTrigger>
                            <TabsTrigger value="company">3. Empresa</TabsTrigger>
                            <TabsTrigger value="model">4. Modelo Negocio</TabsTrigger>
                            <TabsTrigger value="growth">5. Ingresos & Crec.</TabsTrigger>
                            <TabsTrigger value="profitability">6. Rentabilidad</TabsTrigger>
                            <TabsTrigger value="cashflow">7. Cash Flow</TabsTrigger>
                            <TabsTrigger value="balance">8. Balance</TabsTrigger>
                            <TabsTrigger value="valuation">9. Valuación & Fair Value</TabsTrigger>
                            <TabsTrigger value="ownership">10. Accionistas</TabsTrigger>
                            <TabsTrigger value="competitors">11. Competidores</TabsTrigger>
                            <TabsTrigger value="technical">12. Técnico</TabsTrigger>
                            <TabsTrigger value="risks">13. Riesgos & Cat.</TabsTrigger>
                            <TabsTrigger value="scenarios">14. Escenarios & DAFO</TabsTrigger>
                        </TabsList>

                        {/* 1. IDENTIDAD / OVERVIEW */}
                        <TabsContent value="overview" className="space-y-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <Label>Nombre de la Empresa</Label>
                                    <Input 
                                        placeholder="Ej: Apple Inc." 
                                        value={formData.companyName || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, companyName: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Ticker / Símbolo</Label>
                                    <Input 
                                        placeholder="Ej: AAPL" 
                                        value={formData.ticker || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, ticker: e.target.value, symbol: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Slug URL (ej: apple o aapl)</Label>
                                    <Input 
                                        placeholder="apple" 
                                        value={formData.slug || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, slug: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Exchange (Bolsa)</Label>
                                    <Input 
                                        placeholder="NASDAQ, NYSE, etc." 
                                        value={formData.exchange || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, exchange: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Sector</Label>
                                    <Input 
                                        placeholder="Technology, Finance, etc." 
                                        value={formData.sector || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, sector: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Industria</Label>
                                    <Input 
                                        placeholder="Consumer Electronics, etc." 
                                        value={formData.industry || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, industry: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Precio Actual ($)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="228.50" 
                                        value={formData.currentPrice ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, currentPrice: e.target.value ? Number(e.target.value) : null }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Variación Diaria (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="1.45" 
                                        value={formData.dailyChange ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, dailyChange: e.target.value ? Number(e.target.value) : null }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Market Cap ($ USD)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="3450000000000" 
                                        value={formData.marketCap ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, marketCap: e.target.value ? Number(e.target.value) : null }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>52W High ($)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="237.23" 
                                        value={formData.high52w ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, high52w: e.target.value ? Number(e.target.value) : null }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>52W Low ($)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="164.08" 
                                        value={formData.low52w ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, low52w: e.target.value ? Number(e.target.value) : null }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>URL del Logo (PNG / WebP)</Label>
                                    <Input 
                                        placeholder="https://.../logo.png" 
                                        value={formData.logoUrl || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, logoUrl: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                <div>
                                    <Label>Estado de Publicación</Label>
                                    <p className="text-xs text-muted-foreground">Solo los análisis con estado 'Publicado' serán visibles para usuarios Finix Pro.</p>
                                </div>
                                <select 
                                    value={formData.status || 'DRAFT'} 
                                    onChange={(e) => setFormData((p: any) => ({ ...p, status: e.target.value }))}
                                    className="px-4 py-2 rounded-xl bg-muted border border-border text-sm font-bold"
                                >
                                    <option value="DRAFT">Borrador (Draft)</option>
                                    <option value="PUBLISHED">Publicado (Finix Pro)</option>
                                    <option value="ARCHIVED">Archivado</option>
                                </select>
                            </div>
                        </TabsContent>

                        {/* 2. RESUMEN EJECUTIVO */}
                        <TabsContent value="summary" className="space-y-6 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Visibilidad de la Sección</h3>
                                    <span className="text-xs text-muted-foreground">¿Mostrar Resumen Ejecutivo en el frontend?</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showSummary !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showSummary: c }
                                    }))}
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Título del Resumen</Label>
                                    <Input 
                                        placeholder="Ej: Nuestra visión sobre Apple..." 
                                        value={formData.executiveSummary?.title || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            executiveSummary: { ...(p.executiveSummary || {}), title: e.target.value }
                                        }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Cuerpo del Resumen</Label>
                                    <Textarea 
                                        placeholder="Escribe el resumen ejecutivo..." 
                                        value={formData.executiveSummary?.summary || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            executiveSummary: { ...(p.executiveSummary || {}), summary: e.target.value }
                                        }))}
                                        className="mt-1.5 h-32"
                                    />
                                </div>
                                <div>
                                    <Label>Puntos Positivos (uno por línea)</Label>
                                    <Textarea 
                                        placeholder="Punto positivo 1&#10;Punto positivo 2" 
                                        value={(formData.executiveSummary?.positivePoints || []).join('\n')} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            executiveSummary: { 
                                                ...(p.executiveSummary || {}), 
                                                positivePoints: e.target.value.split('\n').filter(Boolean) 
                                            }
                                        }))}
                                        className="mt-1.5 h-24"
                                    />
                                </div>
                                <div>
                                    <Label>Puntos Negativos / Cautela (uno por línea)</Label>
                                    <Textarea 
                                        placeholder="Punto de cautela 1&#10;Punto de cautela 2" 
                                        value={(formData.executiveSummary?.negativePoints || []).join('\n')} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            executiveSummary: { 
                                                ...(p.executiveSummary || {}), 
                                                negativePoints: e.target.value.split('\n').filter(Boolean) 
                                            }
                                        }))}
                                        className="mt-1.5 h-24"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 3. EMPRESA */}
                        <TabsContent value="company" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Información Corporativa</h3>
                                    <span className="text-xs text-muted-foreground">Descripción detallada y ventajas competitivas.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showCompany !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showCompany: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <Label>CEO</Label>
                                    <Input 
                                        value={formData.ceo || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, ceo: e.target.value }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Año de Fundación</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.foundedYear ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, foundedYear: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Cantidad de Empleados</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.employeesCount ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, employeesCount: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Descripción del Negocio</Label>
                                    <Textarea 
                                        value={formData.businessDescription || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, businessDescription: e.target.value }))} 
                                        className="mt-1.5 h-24"
                                    />
                                </div>
                                <div>
                                    <Label>Ventajas Competitivas / Foso Defensivo (Moat)</Label>
                                    <Textarea 
                                        value={formData.competitiveAdvantage || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, competitiveAdvantage: e.target.value }))} 
                                        className="mt-1.5 h-24"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <Label>Cómo Genera Ingresos</Label>
                                        <Textarea 
                                            value={formData.revenueGeneration || ''} 
                                            onChange={(e) => setFormData((p: any) => ({ ...p, revenueGeneration: e.target.value }))} 
                                            className="mt-1.5 h-20"
                                        />
                                    </div>
                                    <div>
                                        <Label>Distribución Geográfica</Label>
                                        <Textarea 
                                            value={formData.geographicRevenue || ''} 
                                            onChange={(e) => setFormData((p: any) => ({ ...p, geographicRevenue: e.target.value }))} 
                                            className="mt-1.5 h-20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* 4. MODELO DE NEGOCIO */}
                        <TabsContent value="model" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Bloques de Productos y Servicios</h3>
                                    <span className="text-xs text-muted-foreground">Estructura de cómo gana dinero por cada línea de producto.</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Switch 
                                        checked={formData.sectionVisibility?.showBusinessModel !== false} 
                                        onCheckedChange={(c) => setFormData((p: any) => ({
                                            ...p,
                                            sectionVisibility: { ...(p.sectionVisibility || {}), showBusinessModel: c }
                                        }))}
                                    />
                                    <Button size="sm" onClick={() => {
                                        setFormData((p: any) => ({
                                            ...p,
                                            businessModel: [...(p.businessModel || []), { product: '', description: '', revenuePct: 0, growth: 0, margin: 0 }]
                                        }));
                                    }}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Producto
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(formData.businessModel || []).map((bm: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-muted/30 border border-border/50 rounded-2xl space-y-3 relative">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const updated = [...formData.businessModel];
                                                updated.splice(idx, 1);
                                                setFormData((p: any) => ({ ...p, businessModel: updated }));
                                            }}
                                            className="absolute top-4 right-4 text-rose-400 hover:text-rose-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                                            <div>
                                                <Label className="text-xs">Producto / Segmento</Label>
                                                <Input 
                                                    value={bm.product || ''} 
                                                    onChange={(e) => {
                                                        const updated = [...formData.businessModel];
                                                        updated[idx].product = e.target.value;
                                                        setFormData((p: any) => ({ ...p, businessModel: updated }));
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">% de Ingresos</Label>
                                                <Input 
                                                    type="number" 
                                                    value={bm.revenuePct ?? ''} 
                                                    onChange={(e) => {
                                                        const updated = [...formData.businessModel];
                                                        updated[idx].revenuePct = Number(e.target.value);
                                                        setFormData((p: any) => ({ ...p, businessModel: updated }));
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Crecimiento (%)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={bm.growth ?? ''} 
                                                    onChange={(e) => {
                                                        const updated = [...formData.businessModel];
                                                        updated[idx].growth = Number(e.target.value);
                                                        setFormData((p: any) => ({ ...p, businessModel: updated }));
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Margen (%)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={bm.margin ?? ''} 
                                                    onChange={(e) => {
                                                        const updated = [...formData.businessModel];
                                                        updated[idx].margin = Number(e.target.value);
                                                        setFormData((p: any) => ({ ...p, businessModel: updated }));
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Descripción</Label>
                                            <Input 
                                                value={bm.description || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.businessModel];
                                                    updated[idx].description = e.target.value;
                                                    setFormData((p: any) => ({ ...p, businessModel: updated }));
                                                }}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* 5. INGRESOS Y CRECIMIENTO */}
                        <TabsContent value="growth" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Ingresos y Crecimiento</h3>
                                    <span className="text-xs text-muted-foreground">Métricas de facturación actual y proyecciones.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showGrowth !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showGrowth: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <Label>Revenue ($ USD)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.revenue ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, revenue: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Crecimiento YoY (%)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.revenueGrowthYoY ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, revenueGrowthYoY: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>CAGR 3 Años (%)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.revenueCagr3y ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, revenueCagr3y: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>ARR ($ USD)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.arr ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, arr: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>MRR ($ USD)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.mrr ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, mrr: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Revenue Estimado ($ USD)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.estimatedRevenue ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, estimatedRevenue: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Guidance de la Gerencia</Label>
                                <Textarea 
                                    value={formData.revenueGuidance || ''} 
                                    onChange={(e) => setFormData((p: any) => ({ ...p, revenueGuidance: e.target.value }))} 
                                    className="mt-1.5 h-20"
                                />
                            </div>
                        </TabsContent>

                        {/* 6. RENTABILIDAD */}
                        <TabsContent value="profitability" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Rentabilidad y Márgenes</h3>
                                    <span className="text-xs text-muted-foreground">Márgenes brutos, operativos, netos y retornos sobre capital.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showProfitability !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showProfitability: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div>
                                    <Label>EPS ($)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.eps ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, eps: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Margen Bruto (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.grossMargin ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, grossMargin: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Margen Operativo (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.operatingMargin ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, operatingMargin: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Margen Neto (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.netMargin ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, netMargin: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>ROIC (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.roic ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, roic: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>ROE (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.roe ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, roe: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>ROA (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.roa ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, roa: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>EBITDA ($ USD)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.ebitda ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, ebitda: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 7. CASH FLOW & 8. BALANCE */}
                        <TabsContent value="cashflow" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Cash Flow</h3>
                                    <span className="text-xs text-muted-foreground">Flujos de caja operativo, CapEx y Free Cash Flow.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showCashFlow !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showCashFlow: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <Label>Operating Cash Flow ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.operatingCashFlow ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, operatingCashFlow: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>CapEx ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.capEx ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, capEx: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Free Cash Flow ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.freeCashFlow ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, freeCashFlow: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="balance" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Balance Financiero</h3>
                                    <span className="text-xs text-muted-foreground">Posición de caja, endeudamiento y ratios de solvencia.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showBalance !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showBalance: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div>
                                    <Label>Efectivo y Equivalentes ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.cash ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, cash: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Deuda Total ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.totalDebt ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, totalDebt: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Deuda Neta ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.netDebt ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, netDebt: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Net Debt / EBITDA</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.netDebtToEbitda ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, netDebtToEbitda: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Current Ratio</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.currentRatio ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, currentRatio: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Quick Ratio</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.quickRatio ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, quickRatio: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Activos Totales ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.totalAssets ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, totalAssets: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Pasivos Totales ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.totalLiabilities ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, totalLiabilities: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 9. VALUACIÓN & FAIR VALUE */}
                        <TabsContent value="valuation" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Valuación y Fair Value</h3>
                                    <span className="text-xs text-muted-foreground">Múltiplos de mercado y precio intrínseco estimado con metodología.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showValuation !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showValuation: c, showFairValue: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div>
                                    <Label>Fair Value Estimado ($)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.estimatedFairValue ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, estimatedFairValue: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5 border-emerald-500/40 text-emerald-400 font-bold"
                                    />
                                </div>
                                <div>
                                    <Label>P/E Ratio Actual</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.peRatio ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, peRatio: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>P/E Promedio Histórico</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.historicalAvgPe ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, historicalAvgPe: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Forward P/E</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.forwardPe ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, forwardPe: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>EV / EBITDA</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.evToEbitda ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, evToEbitda: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Price / FCF</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.priceToFcf ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, priceToFcf: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Dividend Yield (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.dividendYield ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, dividendYield: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>P/E Sector</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.sectorPe ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, sectorPe: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-3">
                                <div>
                                    <Label>Metodología de Fair Value</Label>
                                    <Input 
                                        placeholder="Ej: Descuento de Flujos de Caja (DCF) + Múltiplo de Salida" 
                                        value={formData.valuationMethodology?.method || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            valuationMethodology: { ...(p.valuationMethodology || {}), method: e.target.value }
                                        }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Supuestos del Modelo (WACC, Crecimiento Terminal, etc.)</Label>
                                    <Textarea 
                                        value={formData.valuationMethodology?.assumptions || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            valuationMethodology: { ...(p.valuationMethodology || {}), assumptions: e.target.value }
                                        }))}
                                        className="mt-1.5 h-20"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 10. ACCIONISTAS */}
                        <TabsContent value="ownership" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Estructura de Capital y Accionistas</h3>
                                    <span className="text-xs text-muted-foreground">Acciones en circulación, recompras y porcentaje institucional.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showOwnership !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showOwnership: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <Label>Shares Outstanding (Acciones)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.sharesOutstanding ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, sharesOutstanding: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Dilución / Reducción Anual (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        placeholder="-2.8 (negativo = recompra)" 
                                        value={formData.shareDilution ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, shareDilution: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Institutional Ownership (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.institutionalOwnership ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, institutionalOwnership: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Insider Ownership (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.insiderOwnership ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, insiderOwnership: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Short Float (%)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.shortFloat ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, shortFloat: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Beta</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={formData.beta ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, beta: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Programa de Recompras (Buybacks)</Label>
                                <Textarea 
                                    value={formData.buybacks || ''} 
                                    onChange={(e) => setFormData((p: any) => ({ ...p, buybacks: e.target.value }))} 
                                    className="mt-1.5 h-20"
                                />
                            </div>
                        </TabsContent>

                        {/* 11. COMPETIDORES */}
                        <TabsContent value="competitors" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Tabla y Gráficos de Competidores</h3>
                                    <span className="text-xs text-muted-foreground">Compara las métricas financieras con sus pares del sector.</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Switch 
                                        checked={formData.sectionVisibility?.showCompetitors !== false} 
                                        onCheckedChange={(c) => setFormData((p: any) => ({
                                            ...p,
                                            sectionVisibility: { ...(p.sectionVisibility || {}), showCompetitors: c }
                                        }))}
                                    />
                                    <Button size="sm" onClick={() => {
                                        setFormData((p: any) => ({
                                            ...p,
                                            competitorsData: [...(p.competitorsData || []), { name: '', ticker: '', pe: 0, roic: 0, netMargin: 0, marketCap: 0 }]
                                        }));
                                    }}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Competidor
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(formData.competitorsData || []).map((c: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-muted/30 border border-border/50 rounded-2xl flex flex-wrap items-center gap-3">
                                        <Input 
                                            placeholder="Empresa" 
                                            value={c.name || ''} 
                                            onChange={(e) => {
                                                const updated = [...formData.competitorsData];
                                                updated[idx].name = e.target.value;
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="w-36"
                                        />
                                        <Input 
                                            placeholder="Ticker" 
                                            value={c.ticker || ''} 
                                            onChange={(e) => {
                                                const updated = [...formData.competitorsData];
                                                updated[idx].ticker = e.target.value;
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="w-24"
                                        />
                                        <Input 
                                            type="number" 
                                            placeholder="P/E" 
                                            value={c.pe ?? ''} 
                                            onChange={(e) => {
                                                const updated = [...formData.competitorsData];
                                                updated[idx].pe = Number(e.target.value);
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="w-24"
                                        />
                                        <Input 
                                            type="number" 
                                            placeholder="ROIC %" 
                                            value={c.roic ?? ''} 
                                            onChange={(e) => {
                                                const updated = [...formData.competitorsData];
                                                updated[idx].roic = Number(e.target.value);
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="w-24"
                                        />
                                        <Input 
                                            type="number" 
                                            placeholder="Margen %" 
                                            value={c.netMargin ?? ''} 
                                            onChange={(e) => {
                                                const updated = [...formData.competitorsData];
                                                updated[idx].netMargin = Number(e.target.value);
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="w-28"
                                        />
                                        <Input 
                                            type="number" 
                                            placeholder="Market Cap ($B)" 
                                            value={c.marketCap ?? ''} 
                                            onChange={(e) => {
                                                const updated = [...formData.competitorsData];
                                                updated[idx].marketCap = Number(e.target.value);
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="w-32"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => {
                                                const updated = [...formData.competitorsData];
                                                updated.splice(idx, 1);
                                                setFormData((p: any) => ({ ...p, competitorsData: updated }));
                                            }}
                                            className="text-rose-400 hover:text-rose-500 ml-auto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* 12. TÉCNICO */}
                        <TabsContent value="technical" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Análisis Técnico</h3>
                                    <span className="text-xs text-muted-foreground">Indicadores cuantitativos, medias móviles y niveles clave.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showTechnical !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showTechnical: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div>
                                    <Label>Señal Técnica General</Label>
                                    <select
                                        value={formData.technicalData?.technicalSignal || 'NEUTRAL'}
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            technicalData: { ...(p.technicalData || {}), technicalSignal: e.target.value }
                                        }))}
                                        className="w-full mt-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-semibold"
                                    >
                                        <option value="STRONG_BUY">Compra Fuerte (Strong Buy)</option>
                                        <option value="BUY">Compra (Buy)</option>
                                        <option value="NEUTRAL">Neutral</option>
                                        <option value="SELL">Venta (Sell)</option>
                                        <option value="STRONG_SELL">Venta Fuerte (Strong Sell)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Technical Score (0 - 100)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.technicalData?.technicalScore ?? 50} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            technicalData: { ...(p.technicalData || {}), technicalScore: Number(e.target.value) }
                                        }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>RSI (14 períodos)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={formData.rsi ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, rsi: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Tendencia</Label>
                                    <Input 
                                        placeholder="Alcista, Bajista, Lateral" 
                                        value={formData.trend || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, trend: e.target.value }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>SMA 20 ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.sma20 ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, sma20: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>SMA 50 ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.sma50 ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, sma50: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>SMA 200 ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.sma200 ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, sma200: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>ATR ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.atr ?? ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, atr: e.target.value ? Number(e.target.value) : null }))} 
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <Label>Soportes Clave</Label>
                                    <Textarea 
                                        placeholder="S1: $220.00, S2: $212.50..." 
                                        value={formData.supports || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, supports: e.target.value }))} 
                                        className="mt-1.5 h-20"
                                    />
                                </div>
                                <div>
                                    <Label>Resistencias Clave</Label>
                                    <Textarea 
                                        placeholder="R1: $235.00, R2: $237.23..." 
                                        value={formData.resistances || ''} 
                                        onChange={(e) => setFormData((p: any) => ({ ...p, resistances: e.target.value }))} 
                                        className="mt-1.5 h-20"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* 13. RIESGOS Y CATALIZADORES */}
                        <TabsContent value="risks" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Riesgos y Catalizadores</h3>
                                    <span className="text-xs text-muted-foreground">Tarjetas estructuradas con severidad y horizonte temporal.</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Switch 
                                        checked={formData.sectionVisibility?.showRisks !== false} 
                                        onCheckedChange={(c) => setFormData((p: any) => ({
                                            ...p,
                                            sectionVisibility: { ...(p.sectionVisibility || {}), showRisks: c, showCatalysts: c }
                                        }))}
                                    />
                                    <Button size="sm" onClick={() => {
                                        setFormData((p: any) => ({
                                            ...p,
                                            risksData: [...(p.risksData || []), { title: '', description: '', severity: 'MEDIUM' }]
                                        }));
                                    }}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar Riesgo
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(formData.risksData || []).map((r: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-muted/30 border border-border/50 rounded-2xl space-y-3 relative">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const updated = [...formData.risksData];
                                                updated.splice(idx, 1);
                                                setFormData((p: any) => ({ ...p, risksData: updated }));
                                            }}
                                            className="absolute top-4 right-4 text-rose-400 hover:text-rose-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8">
                                            <div className="md:col-span-2">
                                                <Label className="text-xs">Título del Riesgo</Label>
                                                <Input 
                                                    value={r.title || ''} 
                                                    onChange={(e) => {
                                                        const updated = [...formData.risksData];
                                                        updated[idx].title = e.target.value;
                                                        setFormData((p: any) => ({ ...p, risksData: updated }));
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Severidad</Label>
                                                <select
                                                    value={r.severity || 'MEDIUM'}
                                                    onChange={(e) => {
                                                        const updated = [...formData.risksData];
                                                        updated[idx].severity = e.target.value;
                                                        setFormData((p: any) => ({ ...p, risksData: updated }));
                                                    }}
                                                    className="w-full mt-1 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-bold"
                                                >
                                                    <option value="LOW">Baja (Low)</option>
                                                    <option value="MEDIUM">Media (Medium)</option>
                                                    <option value="HIGH">Alta (High)</option>
                                                    <option value="CRITICAL">Crítica (Critical)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Descripción</Label>
                                            <Textarea 
                                                value={r.description || ''} 
                                                onChange={(e) => {
                                                    const updated = [...formData.risksData];
                                                    updated[idx].description = e.target.value;
                                                    setFormData((p: any) => ({ ...p, risksData: updated }));
                                                }}
                                                className="mt-1 h-16"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* 14. ESCENARIOS & DAFO */}
                        <TabsContent value="scenarios" className="space-y-5 pt-2">
                            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                <div>
                                    <h3 className="font-bold text-base">Escenarios y Matriz DAFO</h3>
                                    <span className="text-xs text-muted-foreground">Proyecciones Bull / Base / Bear Case y análisis FODA.</span>
                                </div>
                                <Switch 
                                    checked={formData.sectionVisibility?.showScenarios !== false} 
                                    onCheckedChange={(c) => setFormData((p: any) => ({
                                        ...p,
                                        sectionVisibility: { ...(p.sectionVisibility || {}), showScenarios: c, showConclusion: c }
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Bull */}
                                <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-3">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Bull Case (Alcista)</span>
                                    <Input 
                                        placeholder="Fair Value Bull (ej: $287)" 
                                        value={formData.scenariosData?.bull?.fairValue || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            scenariosData: { 
                                                ...(p.scenariosData || {}), 
                                                bull: { ...(p.scenariosData?.bull || {}), fairValue: e.target.value } 
                                            }
                                        }))}
                                    />
                                    <Textarea 
                                        placeholder="Supuestos alcistas..." 
                                        value={formData.scenariosData?.bull?.assumptions || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            scenariosData: { 
                                                ...(p.scenariosData || {}), 
                                                bull: { ...(p.scenariosData?.bull || {}), assumptions: e.target.value } 
                                            }
                                        }))}
                                        className="h-20"
                                    />
                                </div>

                                {/* Base */}
                                <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-2xl space-y-3">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Base Case (Base)</span>
                                    <Input 
                                        placeholder="Fair Value Base (ej: $245)" 
                                        value={formData.scenariosData?.base?.fairValue || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            scenariosData: { 
                                                ...(p.scenariosData || {}), 
                                                base: { ...(p.scenariosData?.base || {}), fairValue: e.target.value } 
                                            }
                                        }))}
                                    />
                                    <Textarea 
                                        placeholder="Supuestos base..." 
                                        value={formData.scenariosData?.base?.assumptions || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            scenariosData: { 
                                                ...(p.scenariosData || {}), 
                                                base: { ...(p.scenariosData?.base || {}), assumptions: e.target.value } 
                                            }
                                        }))}
                                        className="h-20"
                                    />
                                </div>

                                {/* Bear */}
                                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-3">
                                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Bear Case (Bajista)</span>
                                    <Input 
                                        placeholder="Fair Value Bear (ej: $180)" 
                                        value={formData.scenariosData?.bear?.fairValue || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            scenariosData: { 
                                                ...(p.scenariosData || {}), 
                                                bear: { ...(p.scenariosData?.bear || {}), fairValue: e.target.value } 
                                            }
                                        }))}
                                    />
                                    <Textarea 
                                        placeholder="Supuestos bajistas..." 
                                        value={formData.scenariosData?.bear?.assumptions || ''} 
                                        onChange={(e) => setFormData((p: any) => ({
                                            ...p,
                                            scenariosData: { 
                                                ...(p.scenariosData || {}), 
                                                bear: { ...(p.scenariosData?.bear || {}), assumptions: e.target.value } 
                                            }
                                        }))}
                                        className="h-20"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50 space-y-4">
                                <Label>Fuentes del Análisis</Label>
                                <Input 
                                    placeholder="Ej: SEC Form 10-K, Bloomberg Terminal, FactSet" 
                                    value={formData.sources || ''} 
                                    onChange={(e) => setFormData((p: any) => ({ ...p, sources: e.target.value }))}
                                />
                                <Label>Aviso Legal / Disclaimer</Label>
                                <Textarea 
                                    placeholder="Este contenido tiene fines informativos y educativos..." 
                                    value={formData.legalDisclaimer || ''} 
                                    onChange={(e) => setFormData((p: any) => ({ ...p, legalDisclaimer: e.target.value }))}
                                    className="h-16"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
