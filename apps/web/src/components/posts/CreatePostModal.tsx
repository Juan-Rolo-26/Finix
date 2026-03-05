import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Post } from '@/pages/Explore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferencesStore } from '@/stores/preferencesStore';
import {
    X, BarChart2, PenSquare,
    Upload, Loader2, Trash2, Camera, Search, ChevronDown,
    CheckCircle2, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = 'post' | 'image' | 'reel' | 'chart';
type CaptureStatus = 'idle' | 'waiting' | 'processing' | 'captured' | 'error';

interface MediaFile {
    file: File;
    preview: string;
    mediaType: 'image' | 'video';
    uploading: boolean;
    url?: string;
    error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_MB = 10;

const TYPE_OPTIONS: { key: PostType; label: string; icon: any; desc: string }[] = [
    { key: 'post', label: 'Texto', icon: PenSquare, desc: 'Publicación de texto' },
    { key: 'chart', label: 'TradingView', icon: BarChart2, desc: 'Gráfico con análisis técnico' },
];

const ANALYSIS_TYPES = [
    { value: 'technical', label: 'Análisis Técnico' },
    { value: 'fundamental', label: 'Análisis Fundamental' },
    { value: 'sentiment', label: 'Sentimiento de mercado' },
];

const RISK_LEVELS = [
    { value: 'low', label: 'Bajo' },
    { value: 'medium', label: 'Medio' },
    { value: 'high', label: 'Alto' },
];

const POPULAR_SYMBOLS = [
    'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NVDA', 'SPY',
    'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT',
];

const INTERVALS = [
    { v: '1', label: '1m' }, { v: '5', label: '5m' }, { v: '15', label: '15m' },
    { v: '30', label: '30m' }, { v: '60', label: '1h' }, { v: '240', label: '4h' },
    { v: 'D', label: '1D' }, { v: 'W', label: '1S' }, { v: 'M', label: '1M' },
];

// ─── TradingView Embedded Chart ───────────────────────────────────────────────

interface EmbeddedChartProps {
    symbol: string;
    interval: string;
    theme: 'dark' | 'light';
}

function EmbeddedChart({ symbol, interval, theme }: EmbeddedChartProps) {
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!wrapRef.current) return;
        wrapRef.current.innerHTML = '';

        const containerId = `tv_post_${Math.random().toString(36).slice(2, 9)}`;
        const div = document.createElement('div');
        div.id = containerId;
        wrapRef.current.appendChild(div);

        const mount = () => {
            const TV = (window as any).TradingView;
            if (!TV) return;
            new TV.widget({
                container_id: containerId,
                width: '100%',
                height: 480,
                symbol,
                interval,
                timezone: 'America/Argentina/Buenos_Aires',
                theme,
                style: '1',
                locale: 'es',
                toolbar_bg: theme === 'dark' ? '#0a0a0a' : '#ffffff',
                enable_publishing: false,
                hide_side_toolbar: false,   // barra de herramientas de dibujo
                allow_symbol_change: true,
                save_image: true,            // 📷 botón de captura nativo
                support_host: 'https://www.tradingview.com',
            });
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
                    if ((window as any).TradingView) { clearInterval(poll); mount(); }
                }, 100);
                return () => clearInterval(poll);
            }
        }

        return () => { if (wrapRef.current) wrapRef.current.innerHTML = ''; };
    }, [symbol, interval, theme]);

    return (
        <div className="w-full rounded-xl overflow-hidden" style={{ height: 480 }}>
            <div ref={wrapRef} className="w-full h-full" />
        </div>
    );
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('files', file);
    const res = await apiFetch('/posts/upload-media', { method: 'POST', body: formData });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.message || 'Error al subir'); }
    const uploaded = await res.json();
    return uploaded[0]?.url;
}

async function uploadBlob(blob: Blob, filename: string): Promise<string> {
    const file = new File([blob], filename, { type: blob.type });
    return uploadFile(file);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreatePostModalProps {
    onClose: () => void;
    onCreated: (post: Post) => void;
}

export default function CreatePostModal({ onClose, onCreated }: CreatePostModalProps) {
    const { user } = useAuthStore();
    const { theme: appTheme } = usePreferencesStore();
    const tvTheme: 'dark' | 'light' = appTheme === 'light' ? 'light' : 'dark';

    const [type, setType] = useState<PostType>('post');
    const [content, setContent] = useState('');
    const [assetSymbol, setAssetSymbol] = useState('AAPL');
    const [symbolInput, setSymbolInput] = useState('AAPL');
    const [tvInterval, setTvInterval] = useState('D');
    const [analysisType, setAnalysisType] = useState('technical');
    const [riskLevel, setRiskLevel] = useState('medium');
    const [tickers, setTickers] = useState('');
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Capture
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle');
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
    const [capturedUploadedUrl, setCapturedUploadedUrl] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxFiles = 10;
    const acceptedTypes = ALLOWED_IMAGE.join(',');

    // Cleanup window.open override on unmount
    useEffect(() => {
        return () => { cleanupRef.current?.(); };
    }, []);

    // ── File handling ─────────────────────────────────────────────────────────

    const addFiles = useCallback(async (files: FileList | File[]) => {
        const arr = Array.from(files).slice(0, maxFiles - mediaFiles.length);
        const newMedia: MediaFile[] = arr.map((file) => {
            const maxMB = MAX_IMAGE_MB;
            if (!ALLOWED_IMAGE.includes(file.type))
                return { file, preview: '', mediaType: 'image', uploading: false, error: 'Tipo no permitido' };
            if (file.size > maxMB * 1024 * 1024)
                return { file, preview: '', mediaType: 'image', uploading: false, error: `Muy grande (máx ${maxMB} MB)` };
            return { file, preview: URL.createObjectURL(file), mediaType: 'image', uploading: false };
        });

        setMediaFiles((prev) => [...prev, ...newMedia]);

        for (const m of newMedia) {
            if (m.error) continue;
            setMediaFiles((prev) => prev.map((x) => x.file === m.file ? { ...x, uploading: true } : x));
            try {
                const url = await uploadFile(m.file);
                setMediaFiles((prev) => prev.map((x) => x.file === m.file ? { ...x, uploading: false, url } : x));
            } catch (e: any) {
                setMediaFiles((prev) => prev.map((x) => x.file === m.file ? { ...x, uploading: false, error: e.message } : x));
            }
        }
    }, [mediaFiles.length, maxFiles]);

    const removeMedia = (idx: number) => setMediaFiles((prev) => {
        const copy = [...prev]; URL.revokeObjectURL(copy[idx].preview); copy.splice(idx, 1); return copy;
    });

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };

    // ── Chart capture via TradingView native camera button ────────────────────

    const clearCapture = useCallback(() => {
        cleanupRef.current?.();
        cleanupRef.current = null;
        setCapturedPreview(null);
        setCapturedUploadedUrl(null);
        setCaptureStatus('idle');
    }, []);

    const startCapture = useCallback(() => {
        // Clean up any previous override
        cleanupRef.current?.();

        const origOpen = window.open.bind(window);
        let done = false;

        const restore = () => {
            window.open = origOpen;
        };
        cleanupRef.current = restore;

        // Auto-cancel after 120s
        const timeoutId = setTimeout(() => {
            if (!done) { restore(); setCaptureStatus('idle'); }
        }, 120_000);

        window.open = function (urlArg?: string | URL, target?: string, features?: string) {
            const urlStr = String(urlArg ?? '');

            // TradingView snapshot page URL: https://www.tradingview.com/x/HASH/
            if (urlStr.match(/tradingview\.com\/x\/[A-Za-z0-9]+/)) {
                done = true;
                clearTimeout(timeoutId);
                restore();
                setCaptureStatus('processing');

                // Extract hash from URL
                const match = urlStr.match(/tradingview\.com\/x\/([A-Za-z0-9]+)/);
                if (!match) { setCaptureStatus('error'); return null; }
                const hash = match[1];

                // TradingView stores snapshots at this S3 path
                const imageUrl = `https://s3.tradingview.com/snapshots/${hash}.png`;

                // Fetch via proxy to avoid CORS, then upload
                (async () => {
                    try {
                        // Try fetching through our backend proxy
                        const res = await apiFetch(`/posts/proxy-image?url=${encodeURIComponent(imageUrl)}`);
                        if (res.ok) {
                            const blob = await res.blob();
                            const preview = URL.createObjectURL(blob);
                            setCapturedPreview(preview);
                            const uploaded = await uploadBlob(blob, `chart_${hash}.png`);
                            setCapturedUploadedUrl(uploaded);
                            setCaptureStatus('captured');
                        } else {
                            // Fallback: try direct fetch (might work if CORS allows)
                            const direct = await fetch(imageUrl);
                            if (direct.ok) {
                                const blob = await direct.blob();
                                const preview = URL.createObjectURL(blob);
                                setCapturedPreview(preview);
                                const uploaded = await uploadBlob(blob, `chart_${hash}.png`);
                                setCapturedUploadedUrl(uploaded);
                                setCaptureStatus('captured');
                            } else {
                                // Last resort: use the S3 URL directly as image URL (publicly accessible)
                                setCapturedPreview(imageUrl);
                                setCapturedUploadedUrl(imageUrl);
                                setCaptureStatus('captured');
                            }
                        }
                    } catch {
                        // Use URL directly as fallback
                        setCapturedPreview(imageUrl);
                        setCapturedUploadedUrl(imageUrl);
                        setCaptureStatus('captured');
                    }
                })();

                return null;
            }

            return origOpen(urlArg as any, target, features);
        } as typeof window.open;

        setCaptureStatus('waiting');
    }, [clearCapture]);

    // ── Apply symbol ──────────────────────────────────────────────────────────

    const applySymbol = () => {
        const sym = symbolInput.trim().toUpperCase();
        if (sym) { setAssetSymbol(sym); clearCapture(); }
    };

    // ── Publish ───────────────────────────────────────────────────────────────

    const handlePublish = async () => {
        if (type === 'chart' && !content.trim() && !capturedUploadedUrl && mediaFiles.length === 0) {
            setError('Capturá el gráfico (hacé clic en 📷 en el gráfico) o escribí tu análisis.');
            return;
        }
        if (type !== 'chart' && !content.trim() && mediaFiles.length === 0) {
            setError('Escribí algo o subí una imagen.'); return;
        }
        if (mediaFiles.some((m) => m.uploading)) { setError('Esperá a que terminen de subirse los archivos'); return; }
        if (mediaFiles.some((m) => m.error)) { setError('Hay archivos con errores. Eliminá los que fallaron.'); return; }

        setIsPublishing(true);
        setError('');

        try {
            let allMediaUrls: { url: string; mediaType: string }[] = [];

            // Chart capture goes first
            if (type === 'chart' && capturedUploadedUrl) {
                allMediaUrls.push({ url: capturedUploadedUrl, mediaType: 'image' });
            }
            allMediaUrls = [...allMediaUrls, ...mediaFiles.filter((m) => m.url).map((m) => ({ url: m.url!, mediaType: m.mediaType }))];

            const tickerList = tickers.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
            let finalContent = content.trim();
            if (type === 'chart' && !finalContent) finalContent = `Análisis de ${assetSymbol}`;

            const res = await apiFetch('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: finalContent,
                    type,
                    assetSymbol: type === 'chart' ? assetSymbol : undefined,
                    analysisType: type === 'chart' ? analysisType : undefined,
                    riskLevel: type === 'chart' ? riskLevel : undefined,
                    tickers: tickerList.length ? tickerList : (type === 'chart' ? [assetSymbol] : undefined),
                    mediaUrls: allMediaUrls.length ? allMediaUrls : undefined,
                }),
            });

            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.message || 'Error al publicar'); }
            const newPost = await res.json();
            onCreated(newPost);
        } catch (e: any) {
            setError(e.message || 'Error al publicar');
        } finally {
            setIsPublishing(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-4xl max-h-[97vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div className="flex items-center gap-3">
                        {user?.avatarUrl
                            ? <img src={user.avatarUrl} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
                            : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-black font-bold text-sm">{user?.username?.[0]?.toUpperCase()}</div>
                        }
                        <div>
                            <p className="font-semibold text-sm">{user?.username}</p>
                            <p className="text-xs text-muted-foreground">Crear para el feed principal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Type selector */}
                    <div className="grid grid-cols-2 max-w-md w-full mx-auto gap-3">
                        {TYPE_OPTIONS.map(({ key, label, desc, icon: Icon }) => (
                            <button key={key}
                                onClick={() => { setType(key); setMediaFiles([]); setError(''); clearCapture(); }}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${type === key ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'}`}
                                title={desc}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── TRADINGVIEW TAB ── */}
                    <AnimatePresence mode="wait">
                        {type === 'chart' && (
                            <motion.div key="chart-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className="space-y-4">
                                {/* Toolbar */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                            <input type="text" placeholder="Símbolo: AAPL, BTCUSDT..." value={symbolInput}
                                                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                                                onKeyDown={(e) => e.key === 'Enter' && applySymbol()}
                                                className="w-full h-9 pl-8 pr-3 rounded-lg border border-border/50 bg-secondary/30 text-sm font-mono uppercase outline-none focus:border-primary/50 transition-colors"
                                            />
                                        </div>
                                        <Button size="sm" variant="outline" onClick={applySymbol} className="h-9 px-3 text-xs border-border/50 hover:border-primary/40">Cargar</Button>
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {INTERVALS.map(({ v, label }) => (
                                            <button key={v} onClick={() => { setTvInterval(v); clearCapture(); }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${tvInterval === v ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                                            >{label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Popular symbols */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Rápido:</span>
                                    {POPULAR_SYMBOLS.map((s) => {
                                        const short = s.includes(':') ? s.split(':')[1].replace('USDT', '') : s;
                                        return (
                                            <button key={s} onClick={() => { setSymbolInput(s); setAssetSymbol(s); clearCapture(); }}
                                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${assetSymbol === s ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground'}`}
                                            >{short}</button>
                                        );
                                    })}
                                </div>

                                {/* Embedded chart */}
                                <div className="rounded-xl overflow-hidden border border-border/40">
                                    <EmbeddedChart symbol={assetSymbol} interval={tvInterval} theme={tvTheme} />
                                </div>

                                {/* ── CAPTURE SECTION ── */}
                                <AnimatePresence mode="wait">
                                    {captureStatus === 'idle' && (
                                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <button onClick={startCapture}
                                                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/70 transition-all font-semibold text-sm"
                                            >
                                                <Camera className="w-4 h-4" />
                                                Activar captura — luego hacé clic en 📷 en el gráfico
                                            </button>
                                        </motion.div>
                                    )}

                                    {captureStatus === 'waiting' && (
                                        <motion.div key="waiting" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                            className="rounded-xl border border-primary/40 bg-primary/8 p-4 space-y-3"
                                        >
                                            {/* Animated instruction */}
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    animate={{ scale: [1, 1.15, 1] }}
                                                    transition={{ duration: 1.2, repeat: Infinity }}
                                                    className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"
                                                >
                                                    <Camera className="w-5 h-5 text-primary" />
                                                </motion.div>
                                                <div>
                                                    <p className="font-bold text-sm text-primary">Captura lista — hacé clic en el ícono 📷</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Está en la esquina superior derecha del gráfico. TradingView tomará la foto del gráfico con todos tus dibujos.</p>
                                                </div>
                                            </div>

                                            {/* Arrow pointing up toward chart */}
                                            <div className="flex justify-center">
                                                <motion.div
                                                    animate={{ y: [0, -6, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                    className="flex flex-col items-center text-primary/60"
                                                >
                                                    <div className="text-xl">↑</div>
                                                    <span className="text-[10px] font-semibold">Botón 📷 arriba</span>
                                                </motion.div>
                                            </div>

                                            <button onClick={clearCapture} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center underline">
                                                Cancelar captura
                                            </button>
                                        </motion.div>
                                    )}

                                    {captureStatus === 'processing' && (
                                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-2.5 py-4 rounded-xl bg-primary/5 border border-primary/20"
                                        >
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-sm font-medium text-primary">Procesando captura del gráfico...</span>
                                        </motion.div>
                                    )}

                                    {captureStatus === 'captured' && capturedPreview && (
                                        <motion.div key="captured" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-500">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    ¡Gráfico capturado! Se publicará esta imagen
                                                </span>
                                                <button onClick={clearCapture} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                                                    Volver a capturar
                                                </button>
                                            </div>
                                            <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                                                <img src={capturedPreview} alt="Captura del gráfico" className="w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                                                    ✓ Lista para publicar
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {captureStatus === 'error' && (
                                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2.5"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            No se pudo procesar la captura. Subí la imagen manualmente abajo o intentá nuevamente.
                                            <button onClick={startCapture} className="ml-auto font-bold underline whitespace-nowrap">Reintentar</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Analysis metadata */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Tipo de análisis</Label>
                                        <div className="relative">
                                            <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)} className="w-full h-9 rounded-lg border border-border/50 bg-secondary/30 px-3 pr-8 text-sm appearance-none outline-none focus:border-primary/50 transition-colors">
                                                {ANALYSIS_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Riesgo estimado</Label>
                                        <div className="relative">
                                            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="w-full h-9 rounded-lg border border-border/50 bg-secondary/30 px-3 pr-8 text-sm appearance-none outline-none focus:border-primary/50 transition-colors">
                                                {RISK_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── TEXT AREA ── */}
                    <div className="space-y-1">
                        <Textarea
                            placeholder={type === 'chart' ? 'Describí tu análisis: zonas clave, stop loss, target, bias...' : '¿Qué estás pensando sobre el mercado?'}
                            value={content} onChange={(e) => setContent(e.target.value)}
                            className="bg-secondary/30 resize-none text-base border-none focus-visible:ring-0 min-h-[100px]" maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground text-right">{content.length}/2000</p>
                    </div>

                    {/* ── TICKERS ── */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tickers relacionados (opcional)</Label>
                        <Input placeholder="AAPL BTC SPY (separados por espacio o coma)" value={tickers} onChange={(e) => setTickers(e.target.value)} className="bg-secondary/30 h-9 text-sm" />
                    </div>

                    {/* ── MEDIA UPLOAD ── chart: upload extra screenshots */}
                    {type === 'chart' && (
                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground">
                                Captura adicional o manual (opcional)
                            </Label>
                            {mediaFiles.length < maxFiles && (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border hover:bg-secondary/20'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                >
                                    <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm font-medium">Subir imagen</p>
                                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP · Máx {MAX_IMAGE_MB} MB</p>
                                    <p className="text-xs text-primary mt-1">Hacé clic o arrastrá aquí</p>
                                </div>
                            )}

                            <input ref={fileInputRef} type="file" accept={acceptedTypes} multiple
                                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} className="hidden" />

                            {mediaFiles.length > 0 && (
                                <div className={`grid gap-2 ${mediaFiles.length > 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                                    {mediaFiles.map((m, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden bg-black/20 aspect-square">
                                            {m.mediaType === 'video' ? <video src={m.preview} className="w-full h-full object-cover" muted /> : <img src={m.preview} alt="" className="w-full h-full object-cover" />}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => removeMedia(i)} className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"><Trash2 className="w-4 h-4 text-white" /></button>
                                            </div>
                                            {m.uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                                            {m.error && <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-xs p-1 text-center">{m.error}</div>}
                                            {m.url && !m.uploading && !m.error && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

                    {/* Publish */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing || mediaFiles.some((m) => m.uploading) || captureStatus === 'processing'}
                            className="flex-1 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold shadow-glow"
                        >
                            {isPublishing
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Publicando...</>
                                : type === 'chart'
                                    ? captureStatus === 'captured' ? '📊 Publicar análisis con gráfico' : '📊 Publicar análisis'
                                    : 'Crear en feed'
                            }
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
