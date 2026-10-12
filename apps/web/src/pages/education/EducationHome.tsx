import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    GraduationCap, Search, BookOpen, TrendingUp,
    BarChart3, Landmark, ShieldCheck, ArrowRight,
    Clock, Compass, HelpCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { searchEducationArticles } from '@/lib/educationSearch';

interface Category {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    _count?: { articles: number };
    subcategories?: { id: string; slug: string; name: string }[];
}

interface Article {
    id: string;
    slug: string;
    title: string;
    summary: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    readTimeMinutes: number;
    formula?: string;
    interactiveWidget?: string;
    isFeatured: boolean;
    category?: { id: string; name: string; slug: string; icon: string };
    subcategory?: { id: string; name: string; slug: string };
}

const CATEGORY_ICONS: Record<string, any> = {
    BookOpen,
    BarChart3,
    TrendingUp,
    Landmark,
    ShieldCheck,
    Compass,
};



export default function EducationHome() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('search') || '';
    const [search, setSearch] = useState(urlQuery);
    const [categories, setCategories] = useState<Category[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

    // Sync input with urlQuery when navigating or clicking EduInfoBadge
    useEffect(() => {
        setSearch(urlQuery);
    }, [urlQuery]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // Fetch categories
                const catRes = await apiFetch('/education/categories');
                if (catRes.ok && mounted) {
                    setCategories(await catRes.json());
                }

                // Fetch ALL articles by traversing pages until the catalog is complete
                let allArticles: Article[] = [];
                let page = 1;
                let totalPages = 1;
                do {
                    const artRes = await apiFetch(`/education/articles?limit=50&page=${page}`);
                    if (!artRes.ok) break;
                    const data = await artRes.json();
                    const items: Article[] = data.items || [];
                    allArticles = allArticles.concat(items);
                    totalPages = data.pagination?.totalPages || 1;
                    page++;
                } while (page <= totalPages);

                if (mounted) {
                    setArticles(allArticles);
                }
            } catch (err) {
                console.error('Error cargando biblioteca educativa:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void load();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        document.title = 'Finix Educativa | Biblioteca Integral de Finanzas e Inversiones';

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', 'Biblioteca integral de consulta: análisis técnico, análisis fundamental, instrumentos argentinos, macroeconomía y valuación en Finix.');

        const scriptId = 'edu-home-jsonld';
        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            'name': 'Finix Educativa',
            'description': 'Biblioteca técnica y de consulta para inversores',
            'url': window.location.href,
        };
        script.textContent = JSON.stringify(schema);

        return () => {
            const s = document.getElementById(scriptId);
            if (s) s.remove();
        };
    }, []);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (val.trim()) {
            setSearchParams({ search: val });
        } else {
            setSearchParams({});
        }
    };

    // Client-side instant filter powered by verified searchEducationArticles
    const filteredArticles = useMemo(() => {
        // Pre-filter by category & level
        const basePool = articles.filter(art => {
            if (selectedCategory !== 'ALL' && art.category?.slug !== selectedCategory) {
                return false;
            }
            if (selectedLevel !== 'ALL' && art.level !== selectedLevel) {
                return false;
            }
            return true;
        });

        return searchEducationArticles(basePool, search);
    }, [articles, search, selectedCategory, selectedLevel]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center" role="status">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* HERO & SEARCH BAR */}
            <section className="relative border-b border-border/80 bg-gradient-to-b from-primary/5 via-card to-background px-4 py-10 sm:py-14 md:py-16 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(0,0,0,0))] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
                        <GraduationCap className="w-4 h-4" />
                        Finix · Biblioteca de Consulta Financiera
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                        Biblioteca Educativa
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
                        Consultá conceptos, fórmulas, indicadores y métricas de mercado con rigor técnico institucional. Libre acceso y sin registro requerido.
                    </p>

                    {/* BUSCADOR INSTANTÁNEO */}
                    <div className="max-w-2xl mx-auto relative pt-2">
                        <div className="relative flex items-center shadow-md shadow-black/5 rounded-2xl bg-card border border-border/80 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
                            <Search className="w-5 h-5 ml-4 text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                placeholder="Buscar por métrica, sigla o fórmula (ej: PE, P-E, RSI, MACD, Media Móvil 20/200, CEDEAR, TIR)..."
                                className="w-full bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                                aria-label="Buscador instantáneo de conceptos financieros"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange('')}
                                    className="mr-3 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-muted/60"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ACCESOS DIRECTOS POPULARES */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs">
                        <span className="text-muted-foreground font-medium mr-1">Consultas rápidas:</span>
                        {[
                            { label: 'PER (P/E)', term: 'PER' },
                            { label: 'RSI 14', term: 'RSI' },
                            { label: 'MACD 12/26/9', term: 'MACD' },
                            { label: 'Media Móvil 20/200', term: 'Media Móvil' },
                            { label: 'ROIC & WACC', term: 'ROIC' },
                            { label: 'DCF Fair Value', term: 'DCF' },
                            { label: 'CEDEARs y Ratios', term: 'CEDEAR' },
                            { label: 'Dólar MEP & CCL', term: 'MEP' },
                            { label: 'Bonos & TIR', term: 'Bonos' },
                            { label: 'Bollinger', term: 'Bollinger' },
                            { label: 'ATR', term: 'ATR' },
                            { label: 'VWAP', term: 'VWAP' },
                        ].map(item => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => handleSearchChange(item.term)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                                    search.toLowerCase() === item.term.toLowerCase()
                                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                        : 'bg-card border-border/80 hover:border-primary/50 text-foreground hover:text-primary'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* MAIN CATALOG & FILTERS */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* CATEGORY & LEVEL FILTER BAR */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 border-b border-border/80 pb-5">
                    {/* Category tabs */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full text-xs">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('ALL')}
                            className={`shrink-0 max-w-full min-h-11 px-3.5 py-2 rounded-xl font-bold whitespace-normal text-left transition-all ${
                                selectedCategory === 'ALL'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Todas las categorías ({articles.length})
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.slug)}
                                className={`shrink-0 max-w-full min-h-11 px-3.5 py-2 rounded-xl font-bold whitespace-normal text-left transition-all ${
                                    selectedCategory === cat.slug
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Level selector */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
                        <span className="text-muted-foreground font-medium hidden md:inline">Nivel:</span>
                        {[
                            { label: 'Todos', value: 'ALL' },
                            { label: 'Principiante', value: 'BEGINNER' },
                            { label: 'Intermedio', value: 'INTERMEDIATE' },
                            { label: 'Avanzado', value: 'ADVANCED' },
                        ].map(lvl => (
                            <button
                                key={lvl.value}
                                type="button"
                                onClick={() => setSelectedLevel(lvl.value)}
                                className={`shrink-0 min-h-11 px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                    selectedLevel === lvl.value
                                        ? 'bg-secondary text-foreground font-bold border border-border'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {lvl.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* RESULTS SUMMARY BAR */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                        <span>Mostrando </span>
                        <strong className="text-foreground font-bold">{filteredArticles.length}</strong>
                        <span> de {articles.length} artículos</span>
                        {search && <span> para «{search}»</span>}
                    </div>
                    {(search || selectedCategory !== 'ALL' || selectedLevel !== 'ALL') && (
                        <button
                            type="button"
                            onClick={() => {
                                handleSearchChange('');
                                setSelectedCategory('ALL');
                                setSelectedLevel('ALL');
                            }}
                            className="text-primary hover:underline font-semibold"
                        >
                            Restablecer filtros
                        </button>
                    )}
                </div>

                {/* ARTICLES GRID */}
                {filteredArticles.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
                        <HelpCircle className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                        <h3 className="text-base font-bold text-foreground">
                            No se encontraron artículos con ese criterio
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            Probá buscando por la sigla (ej: RSI, MACD, PER, DCF), nombre en español (ej: medias móviles, flujo de caja, inflación) o limpiando los filtros.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                handleSearchChange('');
                                setSelectedCategory('ALL');
                                setSelectedLevel('ALL');
                            }}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                        >
                            Ver todos los artículos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredArticles.map(art => {
                            const IconComp = CATEGORY_ICONS[art.category?.icon || 'BookOpen'] || BookOpen;
                            return (
                                <Link
                                    key={art.id}
                                    to={`/educativa/${art.category?.slug || 'general'}/${art.slug}`}
                                    className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-primary flex items-center gap-1 truncate">
                                                <IconComp className="w-3.5 h-3.5 shrink-0" />
                                                {art.category?.name}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                art.level === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                art.level === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                            }`}>
                                                {art.level === 'BEGINNER' ? 'Principiante' : art.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                            </span>
                                        </div>

                                        <h2 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                                            {art.title}
                                        </h2>

                                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                            {art.summary}
                                        </p>

                                        {art.formula && (
                                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-300 truncate">
                                                {art.formula.split('\n')[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border/60 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Clock className="w-3.5 h-3.5" /> {art.readTimeMinutes} min de lectura
                                        </span>
                                        <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                            Consultar <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
