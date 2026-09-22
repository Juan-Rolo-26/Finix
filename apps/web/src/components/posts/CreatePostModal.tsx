import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Post } from '@/pages/Explore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import {
    X, BarChart2, PenSquare,
    Upload, Loader2, Trash2, Search, ChevronDown, Camera, Check,
    Move, PenTool, Maximize2, ArrowLeft
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

import TradingViewChart from '@/components/TradingViewChart';
import { createChartAnalysis } from '@/lib/chart/finix-chart-api';

async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('files', file);

    const res = await apiFetch('/posts/upload-media', {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        let msg = 'Error al subir el archivo';
        try {
            const err = await res.json();
            msg = err.message || msg;
        } catch { }
        throw new Error(msg);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].url) {
        return data[0].url;
    }
    throw new Error('Respuesta inválida del servidor');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreatePostModalProps {
    onClose: () => void;
    onCreated: (post: Post) => void;
}

export default function CreatePostModal({ onClose, onCreated }: CreatePostModalProps) {
    const { user } = useAuthStore();

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
    const [isScrollMode, setIsScrollMode] = useState(true);
    const [isFullscreenChart, setIsFullscreenChart] = useState(false);
    const [activeStudies, setActiveStudies] = useState<string[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const tvWidgetRef = useRef<any>(null);

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

    const removeMedia = (idx: number) => setMediaFiles((prev) => {
        const copy = [...prev]; URL.revokeObjectURL(copy[idx].preview); copy.splice(idx, 1); return copy;
    });

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };

    // ── Apply symbol ──────────────────────────────────────────────────────────

    const applySymbol = () => {
        const sym = symbolInput.trim().toUpperCase();
        if (sym) { setAssetSymbol(sym); }
    };

    const toggleStudy = (studyName: string) => {
        setActiveStudies(prev =>
            prev.includes(studyName) ? prev.filter(s => s !== studyName) : [...prev, studyName]
        );
    };

    const captureCurrentChart = async (): Promise<string | null> => {
        if (tvWidgetRef.current && typeof tvWidgetRef.current.imageCanvas === 'function') {
            try {
                const canvasPromise = tvWidgetRef.current.imageCanvas();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
                const canvas: any = await Promise.race([canvasPromise, timeoutPromise]);
                if (canvas && typeof canvas.toDataURL === 'function') {
                    // Check if canvas actually has content and is not empty/transparent
                    try {
                        const ctx = canvas.getContext ? canvas.getContext('2d') : null;
                        if (ctx && canvas.width > 0 && canvas.height > 0) {
                            const sampleW = Math.min(canvas.width, 100);
                            const sampleH = Math.min(canvas.height, 100);
                            const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
                            let hasVisiblePixel = false;
                            for (let i = 3; i < imgData.data.length; i += 4) {
                                if (imgData.data[i] > 30) {
                                    hasVisiblePixel = true;
                                    break;
                                }
                            }
                            if (!hasVisiblePixel) {
                                console.warn('Canvas capture is transparent/empty, skipping upload.');
                                return null;
                            }
                        }
                    } catch {
                        // ignore cross-origin error on getImageData
                    }

                    const dataUrl = canvas.toDataURL('image/png');
                    const resp = await fetch(dataUrl);
                    const blob = await resp.blob();
                    const file = new File([blob], `chart_${assetSymbol}_${Date.now()}.png`, { type: 'image/png' });
                    const uploadedUrl = await uploadFile(file);
                    return uploadedUrl || null;
                }
            } catch (canvasErr) {
                console.debug('widget.imageCanvas() capture error:', canvasErr);
            }
        }
        return null;
    };

    const handleManualCapture = async () => {
        setIsCapturing(true);
        try {
            const url = await captureCurrentChart();
            if (url) {
                setMediaFiles([{
                    file: new File([], `chart_${assetSymbol}.png`),
                    preview: url,
                    url: url,
                    mediaType: 'image',
                    uploading: false,
                }]);
            }
        } finally {
            setIsCapturing(false);
        }
    };

    // ── Publish ───────────────────────────────────────────────────────────────

    const handlePublish = async () => {
        setError('');

        // For charts: create persistent ChartAnalysis and link to post
        if (type === 'chart') {
            setIsPublishing(true);
            try {
                const tickerList = tickers.split(/[\s,]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
                let finalContent = content.trim();
                if (!finalContent) finalContent = `Análisis técnico de ${assetSymbol}`;

                const stateToSave = {
                    symbol: assetSymbol,
                    timeframe: tvInterval,
                    drawings: [],
                    theme: 'dark' as const,
                };

                // Crear entidad ChartAnalysis en backend si corresponde
                let chartAnalysisId: string | undefined;
                try {
                    const analysis = await createChartAnalysis({
                        symbol: assetSymbol,
                        timeframe: tvInterval,
                        title: finalContent.slice(0, 60),
                        chartState: stateToSave as any,
                        isPublic: true,
                    });
                    chartAnalysisId = analysis?.id;
                } catch (err) {
                    console.warn('Chart analysis metadata creation fallback:', err);
                }

                const finalMediaUrls: { url: string; mediaType: string }[] = [];
                for (const m of mediaFiles) {
                    if (m.url) finalMediaUrls.push({ url: m.url, mediaType: m.mediaType });
                }

                // 1. Captura 100% autónoma directa desde el widget de TradingView si no hay captura manual previa
                if (finalMediaUrls.length === 0) {
                    const capturedUrl = await captureCurrentChart();
                    if (capturedUrl) {
                        finalMediaUrls.push({ url: capturedUrl, mediaType: 'image' });
                    }
                }

                // 2. Fallback: capturar desde portapapeles si el usuario usó la camarita de TradingView
                if (finalMediaUrls.length === 0 && typeof navigator !== 'undefined' && navigator.clipboard?.read) {
                    try {
                        const items = await navigator.clipboard.read().catch(() => []);
                        for (const item of items) {
                            const imgType = item.types.find((t) => t.startsWith('image/'));
                            if (imgType) {
                                const blob = await item.getType(imgType);
                                const file = new File([blob], `chart_${assetSymbol}_${Date.now()}.png`, { type: imgType });
                                const uploadedUrl = await uploadFile(file);
                                if (uploadedUrl) {
                                    finalMediaUrls.push({ url: uploadedUrl, mediaType: 'image' });
                                    break;
                                }
                            }
                        }
                    } catch {
                        // ignore
                    }
                }

                // If user copied TradingView link to clipboard, attach it
                if (finalMediaUrls.length === 0 && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
                    try {
                        const text = await navigator.clipboard.readText().catch(() => '');
                        if (text && text.includes('tradingview.com/x/')) {
                            const match = text.match(/https?:\/\/(?:www\.)?tradingview\.com\/x\/[a-zA-Z0-9_-]+\/?/);
                            if (match && !finalContent.includes(match[0])) {
                                finalContent = `${finalContent}\n\n${match[0]}`;
                            }
                        }
                    } catch {
                        // ignore
                    }
                }

                const res = await apiFetch('/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: finalContent,
                        type: 'chart',
                        assetSymbol,
                        analysisType,
                        riskLevel,
                        tickers: tickerList.length ? tickerList : [assetSymbol],
                        chartAnalysisId: chartAnalysisId || undefined,
                        mediaUrls: finalMediaUrls,
                    }),
                });

                if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d?.message || 'Error al publicar');
                }
                const newPost = await res.json();
                onCreated(newPost);
                return;
            } catch (e: any) {
                setError(e.message || 'Error al publicar');
                setIsPublishing(false);
                return;
            }
        }

        if (!content.trim() && mediaFiles.length === 0) {
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

            const res = await apiFetch('/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: finalContent,
                    type,
                    tickers: tickerList.length ? tickerList : undefined,
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
                                {/* Search and Intervals */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
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
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${tvInterval === v ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                                            >{label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Popular symbols & Studies */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
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

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleStudy('RSI@tv-basicstudies')}
                                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                                                activeStudies.includes('RSI@tv-basicstudies')
                                                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-400'
                                                    : 'border-border/40 text-muted-foreground hover:bg-secondary'
                                            }`}
                                        >
                                            {activeStudies.includes('RSI@tv-basicstudies') ? '✓ RSI' : '+ RSI'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleStudy('MACD@tv-basicstudies')}
                                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                                                activeStudies.includes('MACD@tv-basicstudies')
                                                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                                                    : 'border-border/40 text-muted-foreground hover:bg-secondary'
                                            }`}
                                        >
                                            {activeStudies.includes('MACD@tv-basicstudies') ? '✓ MACD' : '+ MACD'}
                                        </button>
                                    </div>
                                </div>

                                {/* Touch & Scroll Control Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 rounded-xl bg-secondary/30 border border-border/40">
                                    <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/50 text-xs w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => setIsScrollMode(true)}
                                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                                                isScrollMode
                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                            title="Modo desplazamiento: permite scrollear la publicación sin interferencia"
                                        >
                                            <Move className="w-3.5 h-3.5" />
                                            <span>Modo Scroll</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsScrollMode(false)}
                                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                                                !isScrollMode
                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                            title="Modo trazado: interactúa directamente con el gráfico para colocar líneas"
                                        >
                                            <PenTool className="w-3.5 h-3.5" />
                                            <span>Trazar Líneas</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={isCapturing}
                                            onClick={handleManualCapture}
                                            className="h-8 text-xs gap-1.5 border-border/60 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                        >
                                            {isCapturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                            <span>Capturar</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                setIsScrollMode(false);
                                                setIsFullscreenChart(true);
                                            }}
                                            className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                            <span>Pantalla Completa</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Official TradingView Advanced Chart with Scroll Shield */}
                                <div className="relative w-full h-[380px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden border border-border/60">
                                    <TradingViewChart
                                        symbol={assetSymbol}
                                        interval={tvInterval}
                                        studies={activeStudies}
                                        height="100%"
                                        onWidgetReady={(w) => { tvWidgetRef.current = w; }}
                                    />

                                    {/* Scroll Shield when isScrollMode is true */}
                                    {isScrollMode && (
                                        <div
                                            className="absolute inset-0 z-20 bg-background/25 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center transition-all hover:bg-background/15"
                                            onClick={() => setIsScrollMode(false)}
                                        >
                                            <div className="max-w-xs p-3.5 rounded-2xl bg-card/95 border border-border/70 shadow-xl space-y-2 pointer-events-auto">
                                                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-foreground">
                                                    <Move className="w-4 h-4 text-primary" />
                                                    <span>Modo Scroll Activo</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-snug">
                                                    Podés deslizar la pantalla libremente. Tocá abajo para trazar líneas o dibujar.
                                                </p>
                                                <div className="flex items-center justify-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsScrollMode(false);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                                                    >
                                                        Trazar Líneas
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsScrollMode(false);
                                                            setIsFullscreenChart(true);
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 transition-all"
                                                    >
                                                        <Maximize2 className="w-3.5 h-3.5" />
                                                        <span>Expandir</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Banner autónomo de captura de líneas */}
                                {mediaFiles.length > 0 ? (
                                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-3">
                                            <img src={mediaFiles[0].preview} alt="Captura" className="w-16 h-10 object-cover rounded-lg border border-border/50 shadow-xs" />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    Captura del gráfico lista
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">Tus líneas y análisis se verán exactamente congelados en el post.</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => removeMedia(0)} className="text-xs h-8 text-muted-foreground hover:text-rose-400">Cambiar</Button>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between gap-3 shadow-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                                <Camera className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">Captura y trazados 100% autónomos</p>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                    Al tocar <strong>Publicar análisis</strong>, Finix captura automáticamente el gráfico con todas tus líneas, temporalidad y zoom para que la comunidad lo vea tal cual en el feed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

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

            {/* ── FULLSCREEN DRAWING STUDIO ── */}
            {isFullscreenChart && (
                <div className="fixed inset-0 z-[250] bg-background flex flex-col animate-in fade-in duration-200">
                    {/* Fullscreen Header */}
                    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-card border-b border-border/60 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsFullscreenChart(false)}
                                className="p-1.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Volver al post"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm sm:text-base text-foreground">{assetSymbol}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/15 text-primary font-bold">{tvInterval}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-1 pl-2">
                                {INTERVALS.slice(0, 7).map(({ v, label }) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setTvInterval(v)}
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${tvInterval === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isCapturing}
                                onClick={handleManualCapture}
                                className="h-8 text-xs gap-1.5 border-border/60 hover:border-primary/50 text-muted-foreground hover:text-foreground"
                            >
                                {isCapturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                <span className="hidden xs:inline">Capturar</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={async () => {
                                    await handleManualCapture();
                                    setIsFullscreenChart(false);
                                }}
                                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                <Check className="w-4 h-4" />
                                <span>Listo / Guardar Líneas</span>
                            </Button>
                        </div>
                    </div>

                    {/* Fullscreen Chart Body */}
                    <div className="flex-1 w-full h-full relative overflow-hidden">
                        <TradingViewChart
                            symbol={assetSymbol}
                            interval={tvInterval}
                            studies={activeStudies}
                            height="100%"
                            onWidgetReady={(w) => { tvWidgetRef.current = w; }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
}
