import React, { useState, useEffect, useRef } from 'react';
import { FinixChartState, ChartAnalysisVersionEntity } from '@/lib/chart/finix-chart-types';
import { getChartVersion, forkChartAnalysis } from '@/lib/chart/finix-chart-api';
import TradingViewChart from '../TradingViewChart';
import { Maximize2, Share2, Loader2, BarChart2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PostChartViewerProps {
    versionId?: string;
    chartState?: FinixChartState;
    symbol?: string;
    authorUsername?: string;
    height?: number;
}

export const PostChartViewer: React.FC<PostChartViewerProps> = ({
    versionId,
    chartState: directChartState,
    symbol: directSymbol,
    authorUsername,
    height = 520,
}) => {
    const [versionData, setVersionData] = useState<ChartAnalysisVersionEntity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!directChartState && !!versionId);
    const [isVisible, setIsVisible] = useState(false);
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const [isForking, setIsForking] = useState(false);
    const [forkSuccess, setForkSuccess] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // 1. Lazy loading via IntersectionObserver
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 2. Fetch version if needed
    useEffect(() => {
        if (!versionId || directChartState || !isVisible) return;

        let isMounted = true;
        setIsLoading(true);
        getChartVersion(versionId)
            .then((data) => {
                if (isMounted) setVersionData(data);
            })
            .catch((err) => {
                console.error('Failed to load chart version snapshot:', err);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [versionId, directChartState, isVisible]);

    const activeState: FinixChartState | null =
        directChartState || (versionData?.chartState as FinixChartState) || null;
    const activeSymbol =
        directSymbol || versionData?.analysis?.symbol || activeState?.symbol || 'AAPL';
    const activeTimeframe = versionData?.analysis?.timeframe || activeState?.timeframe || '1D';

    const handleFork = async () => {
        const analysisId = versionData?.analysisId;
        if (!analysisId) {
            showToast('Este gráfico no tiene un ID de análisis base para clonar.', 'error');
            return;
        }

        setIsForking(true);
        try {
            await forkChartAnalysis(analysisId);
            setForkSuccess(true);
            showToast('¡Análisis copiado con éxito a tu cuenta!', 'success');
            setTimeout(() => setForkSuccess(false), 4000);
        } catch (err: any) {
            showToast(err?.message || 'Inicia sesión para copiar este análisis.', 'error');
        } finally {
            setIsForking(false);
        }
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const resolvedHeight = isMobile ? Math.min(height, 380) : height;

    return (
        <div ref={containerRef} className="w-full shrink-0" style={{ minHeight: `${resolvedHeight}px` }}>
            {!isVisible ? (
                // Placeholder before intersecting
                <div
                    style={{ height: resolvedHeight, minHeight: `${resolvedHeight}px` }}
                    className="w-full rounded-2xl bg-card/40 border border-border/40 flex items-center justify-center animate-pulse"
                >
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <BarChart2 className="w-4 h-4 text-primary" /> Cargando análisis técnico...
                    </div>
                </div>
            ) : isLoading ? (
                <div
                    style={{ height: resolvedHeight, minHeight: `${resolvedHeight}px` }}
                    className="w-full rounded-2xl bg-card/40 border border-border/40 flex items-center justify-center"
                >
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" /> Restaurando gráfico y
                        drawings...
                    </div>
                </div>
            ) : (
                <div className="relative group">
                    <TradingViewChart
                        symbol={activeSymbol}
                        interval={activeTimeframe}
                        height={resolvedHeight}
                    />

                    {/* Quick overlay buttons */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        {versionData?.analysisId && (
                            <button
                                type="button"
                                onClick={handleFork}
                                disabled={isForking || forkSuccess}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-background/80 hover:bg-background text-emerald-400 border border-emerald-500/30 rounded-lg shadow-md backdrop-blur-sm transition-all"
                                title="Copiar este análisis a mis gráficos"
                            >
                                {isForking ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : forkSuccess ? (
                                    <Check className="w-3.5 h-3.5" />
                                ) : (
                                    <Share2 className="w-3.5 h-3.5" />
                                )}
                                {forkSuccess ? 'Copiado' : 'Copiar'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsFullscreenOpen(true)}
                            className="p-1.5 bg-background/80 hover:bg-background text-foreground border border-border/60 rounded-lg shadow-md backdrop-blur-sm transition-all"
                            title="Ver en pantalla completa"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Fullscreen Interactive Modal */}
                    <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                        <DialogContent className="max-w-6xl w-[95vw] h-[88vh] flex flex-col p-4 bg-background border-border/80">
                            <DialogHeader className="pb-2">
                                <DialogTitle className="flex items-center justify-between text-lg font-black">
                                    <div className="flex items-center gap-3">
                                        <span className="text-emerald-400 font-black tracking-wider">
                                            {activeSymbol}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-muted font-bold text-muted-foreground">
                                            {activeTimeframe}
                                        </span>
                                        {authorUsername && (
                                            <span className="text-xs text-muted-foreground font-normal">
                                                Análisis por @{authorUsername}
                                            </span>
                                        )}
                                    </div>
                                    {versionData?.analysisId && (
                                        <button
                                            type="button"
                                            onClick={handleFork}
                                            disabled={isForking || forkSuccess}
                                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
                                        >
                                            <Share2 className="w-3.5 h-3.5" /> Copiar análisis
                                        </button>
                                    )}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 w-full overflow-hidden">
                                <TradingViewChart
                                    symbol={activeSymbol}
                                    interval={activeTimeframe}
                                    height={Math.round(window.innerHeight * 0.72)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Floating Toast Notification */}
                    {toastMessage && (
                        <div
                            className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 ${
                                toastMessage.type === 'error'
                                    ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                                    : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                            }`}
                        >
                            {toastMessage.text}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostChartViewer;
