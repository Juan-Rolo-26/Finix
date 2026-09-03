import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Users,
    TrendingUp,
    MessageSquare,
    Wallet,
    X,
    Command,
    History,
    Sparkles,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';

// Búsquedas sugeridas "inteligentes"
const SUGGESTED_QUERIES = [
    "Inversores que tengan Apple",
    "Comunidades de Crypto",
    "Portafolios con alto riesgo",
    "Últimas noticias de TSLA",
];

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'assets' | 'communities'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [history, setHistory] = useState<string[]>(['AAPL', 'Warren Buffett']);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Keyboard shortcut to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Búsqueda real
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                // By now, just user search, but it can be expanded.
                const res = await apiFetch(`/users/search?q=${query}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (err) {
                console.error('Search error', err);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query, activeFilter]);

    const handleSelect = (result: any) => {
        // Adding to history
        setHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 5));
        navigate(`/profile/${result.username}`);
        onClose();
    };

    const applySuggested = (q: string) => {
        setQuery(q);
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
                    initial={{ scale: 0.95, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: -20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header Input */}
                    <div className="flex items-center px-4 py-3 border-b border-border/50 gap-3">
                        <Search className="w-5 h-5 text-primary" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
                            placeholder="Buscar en Finix o pedir a la IA..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-secondary rounded-full transition-colors">
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                        <kbd className="hidden sm:inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            ESC
                        </kbd>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/20 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'all', label: 'Todo', icon: Search },
                            { id: 'users', label: 'Inversores', icon: Users },
                            { id: 'assets', label: 'Mercado', icon: TrendingUp },
                            { id: 'communities', label: 'Comunidades', icon: MessageSquare }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id as any)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                                    ${activeFilter === f.id
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                            >
                                <f.icon className="w-3.5 h-3.5" />
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                <span className="text-xs text-muted-foreground">Buscando inteligéntemente...</span>
                            </div>
                        ) : query.length < 2 ? (
                            <div className="p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-6">
                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
                                        <History className="w-3.5 h-3.5" />
                                        Búsquedas Recientes
                                    </h4>
                                    <div className="space-y-1">
                                        {history.map(h => (
                                            <button
                                                key={h}
                                                onClick={() => applySuggested(h)}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors group"
                                            >
                                                <span className="text-foreground">{h}</span>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest px-2 mb-3">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Consultas Inteligentes (IA)
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {SUGGESTED_QUERIES.map(q => (
                                            <button
                                                key={q}
                                                onClick={() => applySuggested(q)}
                                                className="flex items-center text-left gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="text-xs font-medium text-primary-foreground sm:text-foreground">{q}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1 p-2">
                                <h4 className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                                    Resultados ({results.length})
                                </h4>
                                {results.map((r, i) => (
                                    <button
                                        key={r.id || i}
                                        onClick={() => handleSelect(r)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-secondary flex overflow-hidden items-center justify-center flex-shrink-0 border border-border">
                                            {r.avatarUrl ? (
                                                <img src={resolveMediaUrl(r.avatarUrl)} alt={r.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground truncate">
                                                    {r.username}
                                                </span>
                                                {r.isInfluencer && (
                                                    <Sparkles className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground block truncate">
                                                {r.title || r.bio || "Inversor en Finix"}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                                    <Search className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-semibold mb-1">No hay resultados</h3>
                                <p className="text-xs text-muted-foreground max-w-[250px]">
                                    No pudimos encontrar nada que coincida con "{query}". Prueba buscar otra cosa o usar la IA.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
