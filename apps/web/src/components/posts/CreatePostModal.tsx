import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Post } from '@/pages/Explore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
    X, BarChart2, PenSquare,
    Upload, Loader2, Trash2, Camera, Search, ChevronDown, CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = 'post' | 'image' | 'reel' | 'chart';

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

interface EmbeddedChartHandle {
    captureImage: () => Promise<Blob | null>;
    triggerSaveImage: () => void;
    getWidget: () => any;
}

interface EmbeddedChartProps {
    symbol: string;
    interval: string;
    theme: 'dark' | 'light';
    onWidgetReady?: (widget: any | null) => void;
    onSnapshotUrl?: (url: string) => void;
}

const EmbeddedChart = forwardRef<EmbeddedChartHandle, EmbeddedChartProps>(
    function EmbeddedChart({ symbol, interval, theme, onWidgetReady, onSnapshotUrl }, ref) {
        const wrapRef = useRef<HTMLDivElement>(null);
        const widgetRef = useRef<any>(null);

        // Expose captureImage and triggerSaveImage to parent
        useImperativeHandle(ref, () => ({
            getWidget: () => widgetRef.current,
            captureImage: async (): Promise<Blob | null> => {
                const w = widgetRef.current;
                if (!w) return null;
                try {
                    if (typeof w.imageCanvas === 'function') {
                        const canvas = await Promise.race([
                            w.imageCanvas(),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout al capturar gráfico')), 4000)
                            ),
                        ]);
                        if (canvas && typeof canvas.toBlob === 'function') {
                            return new Promise<Blob | null>((resolve) =>
                                canvas.toBlob((b: Blob | null) => resolve(b), 'image/png')
                            );
                        }
                    }
                } catch (err) {
                    console.warn('TradingView imageCanvas error:', err);
                }
                return null;
            },
            triggerSaveImage: () => {
                // Find the TV iframe and click its save-image button
                const iframe = wrapRef.current?.querySelector('iframe');
                if (iframe) {
                    iframe.contentWindow?.postMessage(
                        JSON.stringify({ name: 'tv-widget-save-image' }),
                        'https://www.tradingview.com'
                    );
                }
            },
        }));

        // Listen for TradingView snapshot URLs from the widget popup
        useEffect(() => {
            const handler = (e: MessageEvent) => {
                if (!e.origin.includes('tradingview.com')) return;
                try {
                    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                    // TV sends something like { name: 'widgetReady' } etc.
                    // When save_image is triggered the resulting URL appears in the window as a download
                    // We check if it's a snapshot URL message
                    if (data?.name === 'saveImage' || data?.snapshotUrl || data?.url?.includes('tradingview.com/x/')) {
                        const url = data.snapshotUrl || data.url;
                        if (url) onSnapshotUrl?.(url);
                    }
                } catch { /* not JSON */ }
            };
            window.addEventListener('message', handler);
            return () => window.removeEventListener('message', handler);
        }, [onSnapshotUrl]);

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
                const widget = new TV.widget({
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
                    hide_side_toolbar: false,
                    allow_symbol_change: true,
                    save_image: true,
                    support_host: 'https://www.tradingview.com',
                });

                widgetRef.current = widget;

                if (typeof widget?.ready === 'function') {
                    widget.ready(() => onWidgetReady?.(widget));
                } else {
                    onWidgetReady?.(widget);
                }
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

            return () => {
                widgetRef.current = null;
                onWidgetReady?.(null);
                if (wrapRef.current) wrapRef.current.innerHTML = '';
            };
        }, [symbol, interval, theme, onWidgetReady]);

        return (
            <div className="w-full rounded-xl overflow-hidden" style={{ height: 480 }}>
                <div ref={wrapRef} className="w-full h-full" />
            </div>
        );
    }
);

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const fileName = `post_${crypto.randomUUID()}.${ext}`;
    const path = `posts/${fileName}`;
    const { error } = await supabase.storage.from('public-media').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('public-media').getPublicUrl(path).data.publicUrl;
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
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chartRef = useRef<EmbeddedChartHandle>(null);

    const maxFiles = 10;
    const acceptedTypes = ALLOWED_IMAGE.join(',');

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

    // ── Paste handler (Ctrl+V / Cmd+V) ─────────────────────────────────────────
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (items) {
                const imageFiles: File[] = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                            const namedFile = new File([file], `chart_clipboard_${Date.now()}.png`, { type: file.type || 'image/png' });
                            imageFiles.push(namedFile);
                        }
                    }
                }
                if (imageFiles.length > 0) {
                    e.preventDefault();
                    addFiles(imageFiles);
                    return;
                }
            }

            const text = e.clipboardData?.getData('text');
            if (text && text.includes('tradingview.com/x/')) {
                const match = text.match(/https?:\/\/(?:www\.)?tradingview\.com\/x\/[a-zA-Z0-9_-]+\/?/);
                if (match) {
                    const tvSnapshotUrl = match[0].endsWith('/') ? `${match[0].slice(0, -1)}.png` : `${match[0]}.png`;
                    try {
                        const resp = await fetch(tvSnapshotUrl);
                        if (resp.ok) {
                            const blob = await resp.blob();
                            const file = new File([blob], `chart_tv_${Date.now()}.png`, { type: 'image/png' });
                            addFiles([file]);
                        }
                    } catch {
                        // ignore
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addFiles]);

    // ── Snapshot handler ──────────────────────────────────────────────────────
    const handleSnapshotUrl = useCallback(async (url: string) => {
        if (!url) return;
        try {
            const pngUrl = url.includes('/x/') && !url.endsWith('.png') ? `${url.replace(/\/$/, '')}.png` : url;
            const res = await fetch(pngUrl);
            if (res.ok) {
                const blob = await res.blob();
                const file = new File([blob], `chart_${assetSymbol}_${Date.now()}.png`, { type: 'image/png' });
                addFiles([file]);
            }
        } catch {
            // ignore
        }
    }, [assetSymbol, addFiles]);

    // ── Chart capture button action ───────────────────────────────────────────
    const handleCaptureChart = async () => {
        setIsCapturing(true);
        setError('');
        try {
            const blob = await chartRef.current?.captureImage();
            if (blob) {
                const file = new File([blob], `chart_${assetSymbol}_${Date.now()}.png`, { type: 'image/png' });
                await addFiles([file]);
            } else {
                chartRef.current?.triggerSaveImage();
                setError('💡 Hacé clic en la cámara 📷 de TradingView (arriba a la derecha del gráfico) → "Copiar imagen" y presioná Ctrl+V para pegar tus dibujos.');
            }
        } catch (err: any) {
            chartRef.current?.triggerSaveImage();
            setError('💡 Hacé clic en la cámara 📷 de TradingView → "Copiar imagen" y presioná Ctrl+V para pegar tus dibujos.');
        } finally {
            setIsCapturing(false);
        }
    };

    const removeMedia = (idx: number) => setMediaFiles((prev) => {
        const copy = [...prev]; URL.revokeObjectURL(copy[idx].preview); copy.splice(idx, 1); return copy;
    });

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };

    // ── Apply symbol ──────────────────────────────────────────────────────────

    const applySymbol = () => {
        const sym = symbolInput.trim().toUpperCase();
        if (sym) { setAssetSymbol(sym); }
    };

    // ── Publish ───────────────────────────────────────────────────────────────

    const handlePublish = async () => {
        setError('');

        // For charts: if no media uploaded yet, attempt automatic capture!
        if (type === 'chart' && mediaFiles.length === 0) {
            setIsCapturing(true);
            let capturedBlob: Blob | null = null;
            try {
                const res = await chartRef.current?.captureImage();
                capturedBlob = res || null;
            } catch (err) {
                console.warn('Auto-capture error:', err);
            }
            setIsCapturing(false);

            if (capturedBlob) {
                try {
                    setIsPublishing(true);
                    const file = new File([capturedBlob], `chart_${assetSymbol}_${Date.now()}.png`, { type: 'image/png' });
                    const url = await uploadFile(file);

                    const tickerList = tickers.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
                    let finalContent = content.trim();
                    if (!finalContent) finalContent = `Análisis de ${assetSymbol}`;

                    const res = await apiFetch('/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            content: finalContent,
                            type,
                            assetSymbol,
                            analysisType,
                            riskLevel,
                            tickers: tickerList.length ? tickerList : [assetSymbol],
                            mediaUrls: [{ url, mediaType: 'image' }],
                        }),
                    });

                    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.message || 'Error al publicar'); }
                    const newPost = await res.json();
                    onCreated(newPost);
                    return;
                } catch (e: any) {
                    setError(e.message || 'Error al publicar');
                    setIsPublishing(false);
                    return;
                }
            } else {
                setError('⚠️ Para que tus dibujos y anotaciones aparezcan en la publicación, capturá el gráfico con el botón "📸 Capturar gráfico con mis anotaciones" o usá la cámara de TradingView para copiar y pegar con Ctrl+V.');
                return;
            }
        }

        if (type !== 'chart' && !content.trim() && mediaFiles.length === 0) {
            setError('Escribí algo o subí una imagen.'); return;
        }
        if (mediaFiles.some((m) => m.uploading)) { setError('Esperá a que terminen de subirse los archivos'); return; }
        if (mediaFiles.some((m) => m.error)) { setError('Hay archivos con errores. Eliminá los que fallaron.'); return; }

        setIsPublishing(true);
        setError('');

        try {
            let allMediaUrls = [...mediaFiles.filter((m) => m.url).map((m) => ({ url: m.url!, mediaType: m.mediaType }))];

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
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-4xl max-h-[95vh] overflow-y-auto pb-6 sm:pb-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div className="flex items-center gap-3">
                        {user?.avatarUrl
                            ? <img src={resolveMediaUrl(user.avatarUrl)} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
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
                                onClick={() => { setType(key); setMediaFiles([]); setError(''); }}
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
                                            <button key={v} onClick={() => { setTvInterval(v); }}
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
                                            <button key={s} onClick={() => { setSymbolInput(s); setAssetSymbol(s); }}
                                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${assetSymbol === s ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground'}`}
                                            >{short}</button>
                                        );
                                    })}
                                </div>

                                {/* Embedded chart */}
                                <div className="rounded-xl overflow-hidden border border-border/40">
                                    <EmbeddedChart
                                        ref={chartRef}
                                        symbol={assetSymbol}
                                        interval={tvInterval}
                                        theme={tvTheme}
                                        onSnapshotUrl={handleSnapshotUrl}
                                    />
                                </div>

                                {/* Chart capture action & feedback */}
                                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 text-primary">
                                                {mediaFiles.length > 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Camera className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">
                                                    {mediaFiles.length > 0 ? '✓ Gráfico con tus anotaciones capturado' : 'Guardar gráfico con tus anotaciones'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {mediaFiles.length > 0
                                                        ? `${mediaFiles.length} imagen lista para publicar en el feed`
                                                        : 'Presioná el botón para guardar tus dibujos y líneas'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleCaptureChart}
                                            disabled={isCapturing || isPublishing}
                                            className="font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 shrink-0"
                                        >
                                            {isCapturing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                                    Capturando...
                                                </>
                                            ) : (
                                                <>
                                                    <Camera className="w-4 h-4 mr-1.5" />
                                                    {mediaFiles.length > 0 ? 'Volver a capturar' : 'Capturar gráfico ahora'}
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {mediaFiles.length === 0 && (
                                        <p className="text-[11px] text-muted-foreground border-t border-border/30 pt-2 leading-relaxed">
                                            💡 <strong>Otras formas:</strong> En el gráfico de arriba hacé clic en la cámara 📷 de TradingView → <strong>"Copiar imagen"</strong> y presioná <strong>Ctrl+V</strong> para pegarla aquí directamente, o descargala y subila abajo.
                                        </p>
                                    )}
                                </div>

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
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            fileInputRef.current?.click();
                                        }
                                    }}
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
                                        <div key={m.url || m.preview || `${m.file.name}-${m.file.lastModified}-${i}`} className="relative group rounded-xl overflow-hidden bg-black/20 aspect-square">
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
                            disabled={isPublishing || mediaFiles.some((m) => m.uploading)}
                            className="flex-1 bg-gradient-to-r from-primary to-emerald-400 text-black font-bold shadow-glow"
                        >
                            {isPublishing
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Publicando...</>
                                : type === 'chart'
                                    ? '📊 Publicar análisis'
                                    : 'Crear en feed'
                            }
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
