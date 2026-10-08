import { useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowUpRight, Bookmark, Crown, Loader2, Plus, Search, Target, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import SymbolLogo from '@/components/SymbolLogo';

interface Asset { symbol: string; name?: string; description?: string; exchange?: string }

function WatchlistAssetSearch({ inputRef, onAddAsset }: {
    inputRef: RefObject<HTMLInputElement>;
    onAddAsset: (asset: Asset) => void;
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [result, setResult] = useState<{ query: string; assets: Asset[]; error: boolean }>({ query: '', assets: [], error: false });
    const normalized = query.trim();
    const loading = normalized.length > 0 && result.query !== normalized;
    const assets = result.query === normalized ? result.assets : [];
    const searchError = result.query === normalized && result.error;

    useEffect(() => {
        if (!normalized) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const response = await apiFetch(`/market/search?query=${encodeURIComponent(normalized)}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Search failed');
                const data = await response.json();
                if (!controller.signal.aborted) setResult({ query: normalized, assets: Array.isArray(data) ? data.filter(asset => asset && typeof asset.symbol === 'string').slice(0, 6) : [], error: false });
            } catch {
                if (!controller.signal.aborted) setResult({ query: normalized, assets: [], error: true });
            }
        }, 280);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [normalized]);

    const selectAsset = (asset: Asset) => {
        setOpen(false);
        setQuery('');
        onAddAsset(asset);
    };

    return (
        <div className="watchlist-asset-search" onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}>
            <div className="watchlist-asset-search__field">
                <Search size={19} aria-hidden="true" />
                <input
                    id="watchlist-asset-search"
                    ref={inputRef}
                    role="combobox"
                    aria-label="Buscar activos para seguir"
                    aria-autocomplete="list"
                    aria-expanded={open && Boolean(normalized)}
                    aria-controls="watchlist-search-results"
                    aria-activedescendant={open && assets[selectedIndex] ? `watchlist-search-${selectedIndex}` : undefined}
                    placeholder="Buscá por empresa o símbolo…"
                    value={query}
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onChange={event => { setQuery(event.target.value); setOpen(true); setSelectedIndex(0); }}
                    onKeyDown={event => {
                        if (event.key === 'Escape') { setOpen(false); return; }
                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                            event.preventDefault(); setOpen(true);
                            if (assets.length) setSelectedIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + assets.length) % assets.length);
                        }
                        if (event.key === 'Enter' && open && assets[selectedIndex]) { event.preventDefault(); selectAsset(assets[selectedIndex]); }
                    }}
                />
                {loading ? <Loader2 size={18} className="animate-spin" aria-label="Buscando" /> : query ? (
                    <button type="button" aria-label="Limpiar búsqueda de activos" onClick={() => { setQuery(''); inputRef.current?.focus(); }}><X size={17} /></button>
                ) : <span className="watchlist-asset-search__hint">Ticker o empresa</span>}
            </div>
            {open && normalized && (
                <div className="watchlist-search-results" id="watchlist-search-results" role="listbox" aria-label="Activos encontrados" aria-busy={loading}>
                    {loading || searchError || assets.length === 0 ? (
                        <p role="status">{loading ? 'Buscando activos…' : searchError ? 'No se pudo buscar. Volvé a intentarlo.' : 'No encontramos activos con esa búsqueda.'}</p>
                    ) : assets.map((asset, index) => (
                        <button type="button" role="option" id={`watchlist-search-${index}`} aria-selected={index === selectedIndex} key={asset.symbol}
                            onMouseEnter={() => setSelectedIndex(index)} onClick={() => selectAsset(asset)}>
                            <SymbolLogo symbol={asset.symbol} size={32} />
                            <span><strong>{asset.symbol.split(':').pop()}</strong><small>{asset.name || asset.description || asset.symbol}</small></span>
                            <span className="watchlist-search-results__exchange">{asset.exchange || asset.symbol.split(':')[0]}</span>
                            <Plus size={17} aria-hidden="true" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function WatchlistHero({ items, isPro, showWelcome, onDismissWelcome, onAddAsset }: {
    items: Asset[];
    isPro: boolean;
    showWelcome: boolean;
    onDismissWelcome: () => void;
    onAddAsset: (asset: Asset) => void;
}) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <header className="watchlist-hero">
            <div className="watchlist-hero__inner">
                <div className="watchlist-hero__main">
                    <span className="watchlist-hero__eyebrow"><Bookmark size={14} /> TU RADAR DE INVERSIÓN</span>
                    <h2>¿Cuál es tu próxima<br /><span>oportunidad?</span></h2>
                    <p>Encontrá activos, definí tu precio de entrada y seguí su evolución.</p>
                    <WatchlistAssetSearch inputRef={inputRef} onAddAsset={onAddAsset} />
                    {items.length > 0 && (
                        <div className="watchlist-hero__shortcuts">
                            <span>En tu radar</span>
                            {items.slice(0, 4).map(item => (
                                <button key={item.symbol} type="button" onClick={() => navigate(`/market?symbol=${encodeURIComponent(item.symbol)}`)} title={`Ver ${item.name || item.symbol} en Mercado`}>
                                    <SymbolLogo symbol={item.symbol} size={18} />{item.symbol.split(':').pop()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <aside className="watchlist-hero__aside">
                    <div className="watchlist-hero__aside-label"><span /> PARA VOS <span /></div>
                    <div className="watchlist-hero__tip">
                        {showWelcome && <button type="button" className="watchlist-hero__dismiss" onClick={onDismissWelcome} aria-label="Cerrar aviso"><X size={15} /></button>}
                        {isPro ? <Target size={22} /> : <Crown size={22} />}
                        <h3>{isPro ? 'Tu estrategia empieza acá' : 'Dale más espacio a tus ideas'}</h3>
                        <p>{isPro ? 'Organizá tus ideas en listas y configurá objetivos de precio para detectar oportunidades a tiempo.' : 'Tu plan Free incluye 1 lista y hasta 5 activos. Con Finix PRO podés crear listas ilimitadas y usar alertas avanzadas.'}</p>
                        <button type="button" className="watchlist-hero__tip-action" onClick={() => isPro ? inputRef.current?.focus() : navigate('/settings/plan')}>
                            {isPro ? 'Buscar un activo' : 'Conocer Finix PRO'}<ArrowUpRight size={16} />
                        </button>
                    </div>
                    {showWelcome && <p className="watchlist-hero__welcome">Tus listas son un espacio para investigar. Agregar activos acá no modifica tu portafolio.</p>}
                </aside>
            </div>
        </header>
    );
}
