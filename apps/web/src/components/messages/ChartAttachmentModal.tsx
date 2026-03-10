import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart2,
    Camera,
    ChevronDown,
    Loader2,
    Search,
    X,
} from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { uploadChatBlob } from './mediaUpload';
import type { ComposerAttachment } from './messageTypes';

const POPULAR_SYMBOLS = [
    'AAPL',
    'TSLA',
    'MSFT',
    'AMZN',
    'GOOGL',
    'META',
    'NVDA',
    'NYSE:SPY',
    'BINANCE:BTCUSDT',
    'BINANCE:ETHUSDT',
];

const INTERVALS = [
    { value: '15', label: '15m' },
    { value: '60', label: '1H' },
    { value: '240', label: '4H' },
    { value: 'D', label: '1D' },
    { value: 'W', label: '1S' },
] as const;

const ANALYSIS_TYPES = [
    { value: 'technical', label: 'Analisis tecnico' },
    { value: 'fundamental', label: 'Analisis fundamental' },
    { value: 'sentiment', label: 'Sentimiento' },
];

const RISK_LEVELS = [
    { value: 'low', label: 'Bajo' },
    { value: 'medium', label: 'Medio' },
    { value: 'high', label: 'Alto' },
];

interface EmbeddedChartProps {
    symbol: string;
    interval: string;
    theme: 'dark' | 'light';
    onWidgetReady: (widget: any | null) => void;
}

function EmbeddedChart({ symbol, interval, theme, onWidgetReady }: EmbeddedChartProps) {
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!wrapRef.current) return;
        wrapRef.current.innerHTML = '';

        const containerId = `tv_message_${Math.random().toString(36).slice(2, 9)}`;
        const div = document.createElement('div');
        div.id = containerId;
        wrapRef.current.appendChild(div);

        const mount = () => {
            const TV = (window as any).TradingView;
            if (!TV) return;

            const widget = new TV.widget({
                container_id: containerId,
                width: '100%',
                height: 440,
                symbol,
                interval,
                timezone: 'America/Argentina/Buenos_Aires',
                theme,
                style: '1',
                locale: 'es',
                toolbar_bg: theme === 'dark' ? '#0a0a0a' : '#ffffff',
                enable_publishing: false,
                hide_side_toolbar: false,
                allow_symbol_change: true,
                save_image: true,
                support_host: 'https://www.tradingview.com',
            });

            if (typeof widget?.ready === 'function') {
                widget.ready(() => onWidgetReady(widget));
                return;
            }

            onWidgetReady(widget);
        };

        if ((window as any).TradingView) {
            mount();
        } else {
            const existing = document.getElementById('tv-script');
            if (!existing) {
                const script = document.createElement('script');
                script.id = 'tv-script';
                script.src = 'https://s3.tradingview.com/tv.js';
                script.async = true;
                script.onload = mount;
                document.head.appendChild(script);
            } else {
                const poll = setInterval(() => {
                    if ((window as any).TradingView) {
                        clearInterval(poll);
                        mount();
                    }
                }, 100);

                return () => clearInterval(poll);
            }
        }

        return () => {
            onWidgetReady(null);
            if (wrapRef.current) {
                wrapRef.current.innerHTML = '';
            }
        };
    }, [interval, onWidgetReady, symbol, theme]);

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-border/40" style={{ height: 440 }}>
            <div ref={wrapRef} className="w-full h-full" />
        </div>
    );
}

interface ChartAttachmentModalProps {
    onClose: () => void;
    onSelect: (attachment: ComposerAttachment) => void;
}

export default function ChartAttachmentModal({ onClose, onSelect }: ChartAttachmentModalProps) {
    const { theme: appTheme } = usePreferencesStore();
    const tvTheme: 'dark' | 'light' = appTheme === 'light' ? 'light' : 'dark';

    const [symbolInput, setSymbolInput] = useState('AAPL');
    const [assetSymbol, setAssetSymbol] = useState('AAPL');
    const [interval, setInterval] = useState('D');
    const [analysisType, setAnalysisType] = useState('technical');
    const [riskLevel, setRiskLevel] = useState('medium');
    const [chartWidget, setChartWidget] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const applySymbol = () => {
        const next = symbolInput.trim().toUpperCase();
        if (next) {
            setAssetSymbol(next);
        }
    };

    const handleAttach = async () => {
        if (!chartWidget || typeof chartWidget.imageCanvas !== 'function') {
            setError('El grafico todavia no esta listo. Espera unos segundos e intenta de nuevo.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const canvas = await chartWidget.imageCanvas();
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((nextBlob: Blob | null) => {
                    if (nextBlob) {
                        resolve(nextBlob);
                        return;
                    }
                    reject(new Error('No se pudo generar la imagen del grafico.'));
                }, 'image/png');
            });

            const uploaded = await uploadChatBlob(
                blob,
                `chat_chart_${assetSymbol.replace(/[^A-Z0-9:_-]/gi, '_')}_${Date.now()}.png`,
            );

            onSelect({
                type: 'chart',
                url: uploaded.url,
                meta: {
                    symbol: assetSymbol,
                    interval,
                    title: `Grafico ${assetSymbol}`,
                    analysisType,
                    riskLevel,
                },
            });
        } catch (nextError: any) {
            setError(nextError?.message || 'No se pudo adjuntar el grafico');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border/40 bg-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border/30 bg-card/95 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black">Adjuntar grafico</h2>
                            <p className="text-xs text-muted-foreground">Captura el grafico actual y envialo al chat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={symbolInput}
                                onChange={(event) => setSymbolInput(event.target.value.toUpperCase())}
                                onKeyDown={(event) => event.key === 'Enter' && applySymbol()}
                                placeholder="Simbolo: AAPL, BTCUSDT..."
                                className="w-full h-11 pl-9 pr-3 rounded-2xl border border-border/40 bg-secondary/30 text-sm font-mono uppercase outline-none focus:border-primary/40 transition-colors"
                            />
                        </div>
                        <button
                            onClick={applySymbol}
                            className="h-11 px-4 rounded-2xl border border-border/40 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                        >
                            Cargar
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {POPULAR_SYMBOLS.map((symbol) => (
                            <button
                                key={symbol}
                                onClick={() => {
                                    setSymbolInput(symbol);
                                    setAssetSymbol(symbol);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                    assetSymbol === symbol
                                        ? 'border-primary/50 bg-primary/10 text-primary'
                                        : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                                }`}
                            >
                                {symbol.includes(':') ? symbol.split(':')[1] : symbol}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {INTERVALS.map((item) => (
                            <button
                                key={item.value}
                                onClick={() => setInterval(item.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                    interval === item.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <EmbeddedChart
                        symbol={assetSymbol}
                        interval={interval}
                        theme={tvTheme}
                        onWidgetReady={setChartWidget}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Tipo de analisis</label>
                            <div className="relative">
                                <select
                                    value={analysisType}
                                    onChange={(event) => setAnalysisType(event.target.value)}
                                    className="w-full h-11 rounded-2xl border border-border/40 bg-secondary/30 px-3 pr-9 text-sm appearance-none outline-none focus:border-primary/40 transition-colors"
                                >
                                    {ANALYSIS_TYPES.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Riesgo estimado</label>
                            <div className="relative">
                                <select
                                    value={riskLevel}
                                    onChange={(event) => setRiskLevel(event.target.value)}
                                    className="w-full h-11 rounded-2xl border border-border/40 bg-secondary/30 px-3 pr-9 text-sm appearance-none outline-none focus:border-primary/40 transition-colors"
                                >
                                    {RISK_LEVELS.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary">Captura automatica</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Finix genera una imagen del grafico con el estado actual para que la otra persona la vea tal como la preparaste.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 rounded-2xl border border-border/40 text-sm font-semibold hover:border-border transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAttach}
                            disabled={isSubmitting || !chartWidget}
                            className="flex-1 h-11 rounded-2xl text-sm font-bold text-black bg-gradient-to-r from-primary to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Adjuntando...
                                </span>
                            ) : (
                                'Adjuntar grafico'
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
