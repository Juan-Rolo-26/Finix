import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface ImportWatchlistModalProps {
    watchlistId: string;
    existingSymbols: string[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportWatchlistModal({
    watchlistId,
    existingSymbols,
    isOpen,
    onClose,
    onSuccess,
}: ImportWatchlistModalProps) {
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [rawInput, setRawInput] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado del análisis de símbolos
    const [resolvedItems, setResolvedItems] = useState<any[]>([]);
    const [selectedMarkets, setSelectedMarkets] = useState<Record<string, string>>({});

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                // Parse CSV rows or lines
                const lines = content
                    .split(/[\r\n]+/)
                    .map((l) => l.trim())
                    .filter(Boolean);
                // Extract first column or comma-separated tokens
                const tokens: string[] = [];
                lines.forEach((line) => {
                    const parts = line.split(/[,;\t]/).map((p) => p.replace(/"/g, '').trim());
                    if (parts[0] && parts[0].toUpperCase() !== 'TICKER' && parts[0].toUpperCase() !== 'SIMBOLO') {
                        tokens.push(parts[0]);
                    }
                });
                setRawInput(tokens.join(', '));
            }
        };
        reader.readAsText(file);
    };

    const handleAnalyze = async () => {
        if (!rawInput.trim()) {
            setError('Ingresá al menos un ticker o subí un archivo.');
            return;
        }

        setAnalyzing(true);
        setError(null);

        // Split by commas, spaces, newlines
        const symbols = Array.from(
            new Set(
                rawInput
                    .split(/[\s,;\n\t]+/)
                    .map((s) => s.trim().toUpperCase())
                    .filter((s) => s.length > 0 && !s.includes('http'))
            )
        );

        if (symbols.length === 0) {
            setError('No se encontraron símbolos válidos.');
            setAnalyzing(false);
            return;
        }

        try {
            const res = await apiFetch('/watchlist/resolve-symbols', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols }),
            });

            if (!res.ok) throw new Error('Error al resolver símbolos.');

            const data = await res.json();
            const items = data.items || [];

            // Inicializar opciones de mercado por defecto
            const defaultMarkets: Record<string, string> = {};
            items.forEach((item: any) => {
                // Por defecto seleccionamos el primer candidato
                if (item.candidates?.length > 0) {
                    defaultMarkets[item.clean] = item.candidates[0].symbol;
                }
            });

            setResolvedItems(items);
            setSelectedMarkets(defaultMarkets);
            setStep('review');
        } catch (err: any) {
            setError(err.message || 'Error al analizar los símbolos.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirmImport = async () => {
        setSaving(true);
        setError(null);

        try {
            const itemsToImport = resolvedItems
                .map((item) => {
                    const chosenSymbol = selectedMarkets[item.clean] || item.clean;
                    const candidate = item.candidates?.find((c: any) => c.symbol === chosenSymbol) || item.candidates?.[0];
                    return {
                        symbol: chosenSymbol,
                        name: candidate?.name,
                        market: candidate?.market,
                    };
                })
                .filter((item) => !existingSymbols.map((s) => s.toUpperCase()).includes(item.symbol.toUpperCase()));

            if (itemsToImport.length === 0) {
                setError('Todos los símbolos seleccionados ya existen en esta lista.');
                setSaving(false);
                return;
            }

            const res = await apiFetch(`/watchlist/${watchlistId}/batch-import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsToImport }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Error al importar los activos.');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar los activos importados.');
        } finally {
            setSaving(false);
        }
    };

    // Resumen de la revisión
    const existingSet = new Set(existingSymbols.map((s) => s.toUpperCase()));
    const duplicates = resolvedItems.filter((i) => {
        const chosen = selectedMarkets[i.clean] || i.clean;
        return existingSet.has(chosen.toUpperCase());
    });
    const ambiguous = resolvedItems.filter((i) => i.hasAmbiguity);
    const validCount = resolvedItems.length - duplicates.length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl rounded-3xl border-border/60 bg-card/95 backdrop-blur-xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="space-y-2 shrink-0">
                    <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-emerald-500" />
                        Importar activos a la lista
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {step === 'input'
                            ? 'Pegá una lista de símbolos o subí un archivo CSV con una columna de tickers.'
                            : 'Revisá las coincidencias y resolvé símbolos ambiguos antes de guardar.'}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold shrink-0">
                        {error}
                    </div>
                )}

                {step === 'input' ? (
                    <div className="space-y-4 py-2 flex-1 overflow-y-auto">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Pegar símbolos</label>
                            <textarea
                                rows={4}
                                placeholder="AAPL, MSFT, NVDA, BCBA:GGAL, MELI, TSLA..."
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                className="w-full rounded-2xl border border-border/60 bg-background/80 p-3 text-xs text-foreground outline-none focus:border-emerald-500 transition-colors resize-none font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Podés separar tickers por comas, espacios o saltos de línea.
                            </p>
                        </div>

                        <div className="relative flex items-center justify-center my-2">
                            <div className="border-t border-border/60 w-full" />
                            <span className="bg-card px-3 text-[11px] uppercase font-bold text-muted-foreground absolute">
                                o también
                            </span>
                        </div>

                        <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center hover:bg-secondary/20 transition-colors">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                            <label className="cursor-pointer">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                                    Hacé clic para subir un archivo CSV
                                </span>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Archivo con una columna de tickers (ej: Ticker, Symbol).
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-2 flex-1 overflow-y-auto">
                        {/* Resumen de análisis */}
                        <div className="grid grid-cols-3 gap-2 text-center shrink-0">
                            <div className="rounded-xl bg-background/80 p-2.5 border border-border/40">
                                <span className="block text-base font-black text-emerald-600 dark:text-emerald-400">
                                    {validCount}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">A agregar</span>
                            </div>
                            <div className="rounded-xl bg-background/80 p-2.5 border border-border/40">
                                <span className="block text-base font-black text-amber-500">
                                    {ambiguous.length}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Ambiguos</span>
                            </div>
                            <div className="rounded-xl bg-background/80 p-2.5 border border-border/40">
                                <span className="block text-base font-black text-muted-foreground">
                                    {duplicates.length}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Duplicados</span>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {resolvedItems.map((item) => {
                                const chosen = selectedMarkets[item.clean] || item.clean;
                                const isDupe = existingSet.has(chosen.toUpperCase());

                                return (
                                    <div
                                        key={item.clean}
                                        className={`p-3 rounded-2xl border text-xs flex flex-col gap-2 ${isDupe
                                                ? 'border-border/40 bg-muted/20 opacity-60'
                                                : item.hasAmbiguity
                                                    ? 'border-amber-500/40 bg-amber-500/5'
                                                    : 'border-border/60 bg-background/60'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-foreground font-mono">{item.clean}</span>
                                                {isDupe && (
                                                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-bold">
                                                        Ya en la lista
                                                    </span>
                                                )}
                                                {!isDupe && item.hasAmbiguity && (
                                                    <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                                        Elegir mercado
                                                    </span>
                                                )}
                                            </div>
                                            {!isDupe && (
                                                <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Listo
                                                </span>
                                            )}
                                        </div>

                                        {/* Selector de mercado si es ambiguo */}
                                        {item.hasAmbiguity && !isDupe && (
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                {item.candidates.map((cand: any) => (
                                                    <button
                                                        key={cand.symbol}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedMarkets((prev) => ({
                                                                ...prev,
                                                                [item.clean]: cand.symbol,
                                                            }))
                                                        }
                                                        className={`p-2 rounded-xl border text-left transition-all ${selectedMarkets[item.clean] === cand.symbol
                                                                ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                                                                : 'border-border/50 hover:bg-secondary/40'
                                                            }`}
                                                    >
                                                        <div className="text-[11px] font-bold text-foreground">
                                                            {cand.symbol}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {cand.market} · {cand.currency} ({cand.assetType})
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <DialogFooter className="pt-3 gap-2 shrink-0 border-t border-border/40">
                    {step === 'input' ? (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="rounded-xl text-xs font-bold text-muted-foreground"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={analyzing || !rawInput.trim()}
                                onClick={handleAnalyze}
                                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                                {analyzing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-3.5 w-3.5" />
                                )}
                                Analizar lista
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={saving}
                                onClick={() => setStep('input')}
                                className="rounded-xl text-xs font-bold text-muted-foreground"
                            >
                                Volver
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={saving || validCount === 0}
                                onClick={handleConfirmImport}
                                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                                {saving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Confirmar e importar ({validCount})
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
