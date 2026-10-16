import { useEffect, useId, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/i18n';

interface SymbolResult { symbol: string; name?: string; description?: string; exchange?: string; type?: string }
interface Props { value: string; onChange: (value: string) => void; onSelect: (symbol: string) => void; onSubmit: () => void }

export default function SymbolSearchInput({ value, onChange, onSelect, onSubmit }: Props) {
    const { ui } = useTranslation();
    const id = useId();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(0);
    const [result, setResult] = useState<{ query: string; items: SymbolResult[]; error: boolean }>({ query: '', items: [], error: false });
    const query = value.trim();
    const loading = Boolean(query && result.query !== query);
    const items = result.query === query ? result.items : [];
    useEffect(() => {
        if (!open || !query) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const response = await apiFetch(`/market/search?query=${encodeURIComponent(query)}`, { signal: controller.signal });
                if (!response.ok) throw new Error('search');
                const data = await response.json();
                const seen = new Set<string>();
                const assets = (Array.isArray(data) ? data : []).filter((asset: SymbolResult) => {
                    if (!asset || typeof asset.symbol !== 'string' || seen.has(asset.symbol)) return false;
                    seen.add(asset.symbol); return true;
                }).slice(0, 20);
                if (!controller.signal.aborted) setResult({ query, items: assets, error: false });
            } catch {
                if (!controller.signal.aborted) setResult({ query, items: [], error: true });
            }
        }, 280);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [query, open]);

    const choose = (asset: SymbolResult) => { setOpen(false); onSelect(asset.symbol); };
    return (
        <div className="relative min-w-0 flex-1 symbol-search" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={value} role="combobox" aria-label={ui('Buscar símbolo o empresa')} aria-autocomplete="list" aria-expanded={open && Boolean(query)}
                aria-controls={id} aria-activedescendant={open && items[selected] ? `${id}-${selected}` : undefined}
                autoComplete="off" placeholder={ui('Buscar símbolo o empresa')} onFocus={() => setOpen(true)}
                onChange={event => { onChange(event.target.value.toUpperCase()); setOpen(true); setSelected(0); }}
                onKeyDown={event => {
                    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
                    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault(); setOpen(true);
                        if (items.length) setSelected(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
                    } else if (event.key === 'Enter') {
                        event.preventDefault(); if (open && items[selected]) choose(items[selected]); else { setOpen(false); onSubmit(); }
                    }
                }}
                className="h-11 w-full rounded-xl border border-border/50 bg-secondary/30 pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary/60" />
            {open && loading && <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />}
            {open && query && (
                <div id={id} role="listbox" aria-label={ui('Opciones de símbolo')} aria-busy={loading}
                    className="symbol-search-results absolute inset-x-0 top-full z-50 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-1 shadow-xl">
                    {loading || !items.length ? <p role="status" className="px-3 py-4 text-xs text-muted-foreground">
                        {ui(loading ? 'Buscando activos…' : result.error ? 'No se pudo buscar. Volvé a intentarlo.' : 'No encontramos activos con esa búsqueda.')}
                    </p> : items.map((asset, index) => (
                        <button key={asset.symbol} id={`${id}-${index}`} type="button" role="option" aria-selected={selected === index}
                            onMouseDown={event => event.preventDefault()} onMouseEnter={() => setSelected(index)} onClick={() => choose(asset)}
                            ref={element => { if (selected === index && document.activeElement?.getAttribute('role') === 'combobox') element?.scrollIntoView({ block: 'nearest' }); }}
                            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${selected === index ? 'bg-primary/10' : 'hover:bg-secondary'}`}>
                            <span className="min-w-0"><strong className="block text-sm text-foreground">{asset.symbol.split(':').pop()}</strong>
                                <span className="block truncate text-xs text-muted-foreground">{asset.name || asset.description || asset.symbol}</span></span>
                            <span className="shrink-0 text-right"><span className="block text-xs font-semibold text-primary">{asset.exchange || asset.symbol.split(':')[0]}</span>
                                <span className="block text-[10px] text-muted-foreground">{asset.type || ''}</span></span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
