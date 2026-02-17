import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/i18n';
import {
    TrendingUp,
    Activity,
    ShieldCheck,
    AlertTriangle,
    Brain,
    RefreshCw,
    Search,
    ExternalLink
} from 'lucide-react';
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip
} from 'recharts';

interface AnalysisData {
    ticker: string;

    // Valuation
    pe: number;
    forwardPe: number;
    ps: number;
    pb: number;
    evEbitda: number;
    dividendYield: number;

    // Profitability
    roe: number;
    roa: number;
    netMargin: number;
    operatingMargin: number;
    grossMargin: number;

    // Growth
    revenueGrowth3Y: number;
    revenueGrowth5Y: number;
    epsGrowth: number;

    // Solidity
    debtEquity: number;
    currentRatio: number;
    quickRatio: number;
    freeCashFlow: number;

    // Risk
    beta: number;
    volatility: number;
    maxDrawdown: number;

    // Finix Score
    finixScore: number;
    scoreDetails: {
        valuation: number;
        profitability: number;
        growth: number;
        solidity: number;
        risk: number;
    };

    lastUpdated: string;
    sectorComparison?: string;
}

interface Props {
    embeddedTicker?: string;
}

export default function FundamentalAnalysis({ embeddedTicker }: Props = {}) {
    const { ticker: paramTicker } = useParams<{ ticker: string }>();
    const ticker = embeddedTicker || paramTicker;
    const navigate = useNavigate();
    const t = useTranslation();

    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            navigate(`/analysis/${searchInput.trim().toUpperCase()}`);
        }
    };

    const fetchAnalysis = async (forceRefresh = false) => {
        if (!ticker) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const cleanTicker = ticker.includes(':') ? ticker.split(':')[1] : ticker;

            const url = forceRefresh ? `/analysis/${cleanTicker}/refresh` : `/analysis/${cleanTicker}`;
            const method = forceRefresh ? 'POST' : 'GET';
            const res = await apiFetch(url, { method });

            if (!res.ok) throw new Error('Error fetching analysis');

            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
            setError(t.analysis.errors.fetchError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticker) {
            fetchAnalysis();
        } else {
            setLoading(false);
        }
    }, [ticker]);

    // Generate localized insights on the client side
    const insights = useMemo(() => {
        if (!data) return null;

        const strengths = [];
        const risks = [];
        let summary = '';

        // Logic replicated from backend but localized
        if (data.roe > 15) strengths.push(`High ROE (${data.roe.toFixed(2)}%) indicates efficiency`);
        if (data.netMargin > 20) strengths.push(`Strong Net Margin (${data.netMargin.toFixed(2)}%) shows profitability`);
        if (data.revenueGrowth3Y > 10) strengths.push(`Solid 3Y Revenue Growth (${data.revenueGrowth3Y.toFixed(2)}%)`);
        if (data.debtEquity < 0.5) strengths.push(`Low Debt/Equity (${data.debtEquity.toFixed(2)}) implies financial health`);

        if (data.pe > 40) risks.push(`High P/E Ratio (${data.pe.toFixed(2)}) suggests overvaluation`);
        if (data.beta > 1.5) risks.push(`High Beta (${data.beta.toFixed(2)}) indicates high volatility`);
        if (data.currentRatio < 1.0) risks.push(`Low Current Ratio (${data.currentRatio.toFixed(2)}) may indicate liquidity issues`);
        if (data.revenueGrowth3Y < 0) risks.push(`Negative Revenue Growth in last 3 years`);

        // Simple summary generation
        if (data.finixScore >= 80) summary = `${data.ticker} presents a very strong profile with excellent fundamentals across the board.`;
        else if (data.finixScore >= 60) summary = `${data.ticker} shows a solid financial position with some areas for improvement.`;
        else if (data.finixScore >= 40) summary = `${data.ticker} has mixed fundamentals, balancing some strengths with notable risks.`;
        else summary = `${data.ticker} indicates weak fundamentals and high risk factors at current valuation.`;

        // Translate specific phrases if needed or keep dynamic English for now if complex.
        // Ideally I'd map these to translation keys, but for brevity I will leave dynamic parts in English mixed with Spanish UI, 
        // or attempt simple mapping.
        // Given user requirement "todo en español", I should try to translate these conditions.

        // Re-doing strengths in Spanish or Portuguese if language is selected
        const isEs = t.lang.startsWith('es');
        const isPt = t.lang.startsWith('pt');

        if (isEs) {
            const esStrengths = [];
            if (data.roe > 15) esStrengths.push(`Alto ROE (${data.roe.toFixed(2)}%) indica eficiencia`);
            if (data.netMargin > 20) esStrengths.push(`Fuerte Margen Neto (${data.netMargin.toFixed(2)}%) muestra rentabilidad`);
            if (data.revenueGrowth3Y > 10) esStrengths.push(`Sólido Crecimiento de Ingresos 3A (${data.revenueGrowth3Y.toFixed(2)}%)`);
            if (data.debtEquity < 0.5) esStrengths.push(`Baja Deuda/Capital (${data.debtEquity.toFixed(2)}) implica salud financiera`);

            const esRisks = [];
            if (data.pe > 40) esRisks.push(`Alto Ratio P/E (${data.pe.toFixed(2)}) sugiere sobrevaluación`);
            if (data.beta > 1.5) esRisks.push(`Beta alto (${data.beta.toFixed(2)}) indica alta volatilidad`);
            if (data.currentRatio < 1.0) esRisks.push(`Ratio Corriente bajo (${data.currentRatio.toFixed(2)}) puede indicar problemas de liquidez`);
            if (data.revenueGrowth3Y < 0) esRisks.push(`Crecimiento de ingresos negativo en los últimos 3 años`);

            let esSummary = '';
            if (data.finixScore >= 80) esSummary = `${data.ticker} presenta un perfil muy fuerte con excelentes fundamentos generales.`;
            else if (data.finixScore >= 60) esSummary = `${data.ticker} muestra una posición financiera sólida con algunas áreas de mejora.`;
            else if (data.finixScore >= 40) esSummary = `${data.ticker} tiene fundamentos mixtos, equilibrando algunas fortalezas con riesgos notables.`;
            else esSummary = `${data.ticker} indica fundamentos débiles y factores de alto riesgo en la valoración actual.`;

            return { strengths: esStrengths, risks: esRisks, summary: esSummary, conclusion: esSummary };
        }

        if (isPt) {
            const ptStrengths = [];
            if (data.roe > 15) ptStrengths.push(`Alto ROE (${data.roe.toFixed(2)}%) indica eficiência`);
            if (data.netMargin > 20) ptStrengths.push(`Forte Margem Líquida (${data.netMargin.toFixed(2)}%) mostra rentabilidade`);
            if (data.revenueGrowth3Y > 10) ptStrengths.push(`Sólido Cresc. Receita 3A (${data.revenueGrowth3Y.toFixed(2)}%)`);
            if (data.debtEquity < 0.5) ptStrengths.push(`Baixa Dívida/Capital (${data.debtEquity.toFixed(2)}) implica saúde financeira`);

            const ptRisks = [];
            if (data.pe > 40) ptRisks.push(`Alto P/L (${data.pe.toFixed(2)}) sugere supervalorização`);
            if (data.beta > 1.5) ptRisks.push(`Beta alto (${data.beta.toFixed(2)}) indica alta volatilidade`);
            if (data.currentRatio < 1.0) ptRisks.push(`Liquidez Corrente baixa (${data.currentRatio.toFixed(2)}) pode indicar problemas`);
            if (data.revenueGrowth3Y < 0) ptRisks.push(`Crescimento de receita negativo nos últimos 3 anos`);

            let ptSummary = '';
            if (data.finixScore >= 80) ptSummary = `${data.ticker} apresenta um perfil muito forte com excelentes fundamentos.`;
            else if (data.finixScore >= 60) ptSummary = `${data.ticker} mostra uma posição financeira sólida com algumas áreas para melhoria.`;
            else if (data.finixScore >= 40) ptSummary = `${data.ticker} tem fundamentos mistos, equilibrando pontos fortes com riscos.`;
            else ptSummary = `${data.ticker} indica fundamentos fracos e fatores de alto risco.`;

            return { strengths: ptStrengths, risks: ptRisks, summary: ptSummary, conclusion: ptSummary };
        }

        return { strengths, risks, summary, conclusion: summary };

    }, [data, t]);

    if (!ticker) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto p-6 text-center space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-background shadow-xl">
                        <Activity className="w-12 h-12 text-primary" />
                        <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-background rounded-full flex items-center justify-center border shadow-sm">
                            <Brain className="w-6 h-6 text-indigo-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {t.analysis.title}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t.analysis.subtitle}
                    </p>
                </div>

                <Card className="w-full max-w-md p-2 bg-background/50 backdrop-blur border-primary/20 shadow-2xl">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t.analysis.searchPlaceholder}
                                className="pl-9 h-12 text-lg bg-transparent border-transparent focus-visible:ring-0"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <Button size="lg" type="submit" className="h-12 px-8 font-bold">
                            {t.analysis.analyzeBtn}
                        </Button>
                    </form>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-8">
                    {['AAPL', 'MSFT', 'NVDA', 'TSLA'].map(tick => (
                        <Button
                            key={tick}
                            variant="outline"
                            className="h-auto py-4 flex flex-col gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all"
                            onClick={() => navigate(`/analysis/${tick}`)}
                        >
                            <span className="font-bold text-lg">{tick}</span>
                            <span className="text-xs text-muted-foreground">{t.analysis.analyzeNow}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
                <h2 className="text-xl font-bold mb-2">{t.analysis.errors.unavailable}</h2>
                <p className="mb-6">{error}</p>
                <Button onClick={() => fetchAnalysis(true)}>{t.common.tryAgain}</Button>
            </div>
        );
    }

    if (!data || !insights) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 border-emerald-500/50 bg-emerald-500/10';
        if (score >= 60) return 'text-blue-500 border-blue-500/50 bg-blue-500/10';
        if (score >= 40) return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
        return 'text-red-500 border-red-500/50 bg-red-500/10';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return t.analysis.scores.verySolid;
        if (score >= 60) return t.analysis.scores.solid;
        if (score >= 40) return t.analysis.scores.neutral;
        return t.analysis.scores.weak;
    };

    const formatPercent = (val: number) => val !== null ? `${val.toFixed(2)}%` : 'N/A';
    const formatNumber = (val: number) => val !== null ? val.toFixed(2) : 'N/A';

    const radarData = [
        { subject: t.analysis.valuation, A: (data.scoreDetails.valuation / 20) * 100, fullMark: 100 },
        { subject: t.analysis.profitability, A: (data.scoreDetails.profitability / 25) * 100, fullMark: 100 },
        { subject: t.analysis.growth, A: (data.scoreDetails.growth / 25) * 100, fullMark: 100 },
        { subject: t.analysis.solidity, A: (data.scoreDetails.solidity / 20) * 100, fullMark: 100 },
        { subject: t.analysis.risk, A: (data.scoreDetails.risk / 10) * 100, fullMark: 100 },
    ];

    return (
        <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        {data.ticker} <span className="text-muted-foreground font-light px-2 border-l border-border">{t.analysis.title}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t.analysis.lastUpdated}: {new Date(data.lastUpdated).toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`https://www.investing.com/search/?q=${data.ticker}`, '_blank')} className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        {t.analysis.viewOnInvesting}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchAnalysis(true)} disabled={loading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t.analysis.refreshResults}
                    </Button>
                </div>
            </div>

            {/* Top Section: Score & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Finix Score Card */}
                <Card className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-background to-secondary/10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-4 uppercase tracking-wider">{t.analysis.finixScore}</h3>
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 text-5xl font-black mb-4 ${getScoreColor(data.finixScore)}`}>
                        {data.finixScore}
                    </div>
                    <div className="space-y-1">
                        <Badge variant="outline" className={`px-3 py-1 text-sm font-bold ${getScoreColor(data.finixScore)} border`}>
                            {getScoreLabel(data.finixScore)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t.analysis.quantAlgorithm}
                        </p>
                    </div>
                </Card>

                {/* Radar Chart Breakdown */}
                <Card className="p-4 min-h-[300px] flex items-center justify-center">
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Score"
                                    dataKey="A"
                                    stroke="var(--primary)"
                                    fill="var(--primary)"
                                    fillOpacity={0.3}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* AI Executive Summary */}
                <Card className="p-6 lg:col-span-1 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-4 text-indigo-400">
                        <Brain className="w-5 h-5" />
                        <h3 className="font-bold">{t.analysis.aiInterpretation}</h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                            {insights.summary}
                        </p>
                        <div className="space-y-2">
                            <div className="flex gap-2 items-start">
                                <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">{insights.strengths[0] || t.common.analyzing}</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">{insights.risks[0] || t.common.analyzing}</p>
                            </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-indigo-500/20">
                            <p className="text-xs italic text-indigo-400/80">
                                "{insights.conclusion}"
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-background border border-border/50 p-1">
                    <TabsTrigger value="overview">{t.analysis.overview}</TabsTrigger>
                    <TabsTrigger value="valuation">{t.analysis.valuation}</TabsTrigger>
                    <TabsTrigger value="profitability">{t.analysis.profitability}</TabsTrigger>
                    <TabsTrigger value="growth">{t.analysis.growth}</TabsTrigger>
                    <TabsTrigger value="solidity">{t.analysis.solidity}</TabsTrigger>
                    <TabsTrigger value="ai-report" className="gap-2"><Brain className="w-3 h-3" /> {t.analysis.fullReport}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard label={t.analysis.metrics.pe} value={formatNumber(data.pe)} sublabel={t.analysis.metrics.descriptions.vsSector} trend="neutral" />
                        <MetricCard label={t.analysis.metrics.roe} value={formatPercent(data.roe)} sublabel={t.analysis.profitability} trend={data.roe > 15 ? 'up' : 'neutral'} />
                        <MetricCard label={t.analysis.metrics.revGrowth3Y} value={formatPercent(data.revenueGrowth3Y)} sublabel={t.analysis.metrics.descriptions.annualized} trend={data.revenueGrowth3Y > 10 ? 'up' : 'down'} />
                        <MetricCard label={t.analysis.metrics.beta} value={formatNumber(data.beta)} sublabel={t.analysis.metrics.descriptions.volatility} trend={data.beta > 1.2 ? 'down' : 'neutral'} inverse />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Card className="p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> {t.analysis.keyStrengths}</h3>
                            <ul className="space-y-3">
                                {insights.strengths.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-foreground/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                        <Card className="p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> {t.analysis.keyRisks}</h3>
                            <ul className="space-y-3">
                                {insights.risks.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-foreground/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="valuation">
                    <Card className="p-6">
                        <h3 className="font-bold mb-6 text-lg">{t.analysis.valuation}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                            <MetricDetail label={t.analysis.metrics.pe} value={data.pe} desc={t.analysis.metrics.descriptions.priceToEarnings} />
                            <MetricDetail label={t.analysis.metrics.forwardPe} value={data.forwardPe} desc={t.analysis.metrics.descriptions.estFuturePe} />
                            <MetricDetail label={t.analysis.metrics.ps} value={data.ps} desc={t.analysis.metrics.descriptions.priceToSales} />
                            <MetricDetail label={t.analysis.metrics.pb} value={data.pb} desc={t.analysis.metrics.descriptions.priceToBook} />
                            <MetricDetail label={t.analysis.metrics.evEbitda} value={data.evEbitda} desc={t.analysis.metrics.descriptions.enterpriseValue} />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="profitability">
                    <Card className="p-6">
                        <h3 className="font-bold mb-6 text-lg">{t.analysis.profitability}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                            <MetricDetail label={t.analysis.metrics.roe} value={data.roe} suffix="%" desc={t.analysis.metrics.descriptions.returnOnEquity} />
                            <MetricDetail label={t.analysis.metrics.roa} value={data.roa} suffix="%" desc={t.analysis.metrics.descriptions.returnOnAssets} />
                            <MetricDetail label={t.analysis.metrics.netMargin} value={data.netMargin} suffix="%" desc={t.analysis.metrics.descriptions.netProfitMargin} />
                            <MetricDetail label={t.analysis.metrics.opMargin} value={data.operatingMargin} suffix="%" desc={t.analysis.metrics.descriptions.operatingMargin} />
                            <MetricDetail label={t.analysis.metrics.grossMargin} value={data.grossMargin} suffix="%" desc={t.analysis.metrics.descriptions.grossProfitMargin} />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="growth">
                    <Card className="p-6">
                        <h3 className="font-bold mb-6 text-lg">{t.analysis.metrics.revGrowth3Y}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                            <MetricDetail label={t.analysis.metrics.revGrowth3Y} value={data.revenueGrowth3Y} suffix="%" desc={t.analysis.metrics.descriptions.cagr3y} />
                            <MetricDetail label={t.analysis.metrics.revGrowth5Y} value={data.revenueGrowth5Y} suffix="%" desc={t.analysis.metrics.descriptions.cagr5y} />
                            <MetricDetail label={t.analysis.metrics.epsGrowth} value={data.epsGrowth} suffix="%" desc={t.analysis.metrics.descriptions.earningsGrowth} />
                        </div>
                        <div className="h-64 mt-4 bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-sm">
                            {t.analysis.chartPlaceholder}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="solidity">
                    <Card className="p-6">
                        <h3 className="font-bold mb-6 text-lg">{t.analysis.solidity}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <MetricDetail label={t.analysis.metrics.debtEquity} value={data.debtEquity} desc={t.analysis.metrics.descriptions.leverage} ideal="< 0.5" />
                            <MetricDetail label={t.analysis.metrics.currentRatio} value={data.currentRatio} desc={t.analysis.metrics.descriptions.liquidity} ideal="> 1.5" />
                            <MetricDetail label={t.analysis.metrics.quickRatio} value={data.quickRatio} desc={t.analysis.metrics.descriptions.acidTest} ideal="> 1.0" />
                            <MetricDetail label={t.analysis.metrics.freeCashFlow} value={data.freeCashFlow} desc={t.analysis.metrics.descriptions.cashGen} isCurrency />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="ai-report">
                    <Card className="p-8 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Brain className="w-6 h-6 text-primary" /> {t.analysis.fullReport}
                            </h2>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-lg leading-relaxed">{insights.summary}</p>

                                <h3 className="text-xl font-bold mt-6 mb-3 text-emerald-400">{t.analysis.competitiveAdvantages}</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    {insights.strengths.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>

                                <h3 className="text-xl font-bold mt-6 mb-3 text-amber-400">{t.analysis.mainRisks}</h3>
                                <ul className="list-disc pl-5 space-y-2">
                                    {insights.risks.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>

                                <h3 className="text-xl font-bold mt-6 mb-3 text-blue-400">{t.analysis.sectorContext}</h3>
                                {/* Simple hardcoded sector context logic if not in data */}
                                <p>{data.sectorComparison || t.analysis.noSectorData}</p>

                                <div className="mt-8 p-6 bg-secondary/20 rounded-xl border-l-4 border-primary">
                                    <h4 className="font-bold text-lg mb-2">{t.analysis.finalVerdict}</h4>
                                    <p className="italic text-foreground/90 text-lg">"{insights.conclusion}"</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MetricCard({ label, value, sublabel, trend, inverse }: any) {
    const isUp = trend === 'up';
    const isDown = trend === 'down';

    let color = 'text-muted-foreground';
    if (trend !== 'neutral') {
        if (inverse) {
            color = isUp ? 'text-red-500' : (isDown ? 'text-emerald-500' : 'text-muted-foreground');
        } else {
            color = isUp ? 'text-emerald-500' : (isDown ? 'text-red-500' : 'text-muted-foreground');
        }
    }

    return (
        <Card className="p-4 border border-border/40 bg-card/50 hover:bg-card transition-colors">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold tracking-tight">{value}</span>
                {trend !== 'neutral' && (
                    <span className={`text-xs mb-1 ${color} flex items-center`}>
                        {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5 rotate-180" />}
                    </span>
                )}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">{sublabel}</p>
        </Card>
    );
}

function MetricDetail({ label, value, suffix = '', desc, ideal, isCurrency }: any) {
    const t = useTranslation();
    const formatted = value === null ? 'N/A' : (
        isCurrency
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)
            : Number(value).toFixed(2) + suffix
    );

    return (
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground font-medium mb-1">{label}</span>
            <span className="text-xl font-bold">{formatted}</span>
            <span className="text-xs text-muted-foreground/60 mt-1">{desc}</span>
            {ideal && <span className="text-[10px] text-emerald-500/80 mt-0.5 font-medium">{t.analysis.metrics.descriptions.target}: {ideal}</span>}
        </div>
    );
}
