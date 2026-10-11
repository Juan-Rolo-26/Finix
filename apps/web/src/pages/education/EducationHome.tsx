import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    GraduationCap, Search, Sparkles, BookOpen, TrendingUp,
    BarChart3, Landmark, ShieldCheck, ArrowRight,
    Clock, Compass, ChevronRight, Zap
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

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
    interactiveWidget?: string;
    isFeatured: boolean;
    category?: { id: string; name: string; slug: string; icon: string };
    subcategory?: { id: string; name: string; slug: string };
}

interface LearningPath {
    id: string;
    slug: string;
    title: string;
    description: string;
    level: string;
    items: { id: string; article: { title: string; slug: string; readTimeMinutes: number } }[];
    progress?: { total: number; completed: number; percent: number };
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
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [categories, setCategories] = useState<Category[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const [catRes, artRes, pathRes] = await Promise.all([
                    apiFetch('/education/categories'),
                    apiFetch(`/education/articles${search ? `?search=${encodeURIComponent(search)}` : ''}`),
                    apiFetch('/education/learning-paths'),
                ]);

                if (mounted) {
                    if (catRes.ok) setCategories(await catRes.json());
                    if (artRes.ok) {
                        const data = await artRes.json();
                        setArticles(data.items || []);
                    }
                    if (pathRes.ok) setPaths(await pathRes.json());
                }
            } catch (err) {
                console.error('Error cargando biblioteca educativa:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void load();
        return () => { mounted = false; };
    }, [search]);

    useEffect(() => {
        document.title = 'Finix Educativa | Biblioteca Integral de Finanzas e Inversiones';

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', 'Biblioteca integral de educación financiera, análisis técnico, análisis fundamental, economía y valoración de empresas en Finix.');

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
            'description': 'Plataforma y biblioteca integral de educación financiera e inversiones',
            'url': window.location.href,
        };
        script.textContent = JSON.stringify(schema);

        return () => {
            const s = document.getElementById(scriptId);
            if (s) s.remove();
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams(search ? { search } : {});
    };

    const filteredArticles = articles.filter(a => {
        if (selectedLevel !== 'ALL' && a.level !== selectedLevel) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center" role="status">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* HERO SECTION */}
            <section className="relative border-b border-border/80 bg-gradient-to-b from-primary/5 via-card to-background px-4 py-12 sm:py-16 md:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(0,0,0,0))] pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
                        <GraduationCap className="w-4 h-4" />
                        Finix Academy · Biblioteca Integral
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground">
                        Educativa
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
                        Comprendé los mercados. Aprendé a analizar. Desarrollá tu propio criterio con rigor institucional.
                    </p>

                    {/* BUSCADOR GLOBAL CON SUGERENCIAS INSTANTÁNEAS */}
                    <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative pt-2">
                        <div className="relative flex items-center shadow-lg shadow-black/5 rounded-2xl bg-card border border-border/80 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
                            <Search className="w-5 h-5 ml-4 text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar conceptos (ej: ROIC, PER, RSI, MACD, Inflación, Soportes)..."
                                className="w-full bg-transparent px-3 py-3.5 sm:py-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); setSearchParams({}); }}
                                    className="mr-3 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
                        {search.trim().length >= 2 && articles.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-40 max-h-80 overflow-y-auto divide-y divide-border/50 text-left">
                                <div className="px-4 py-2 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                    <span>Sugerencias directas ({articles.length})</span>
                                    <span>Enter para filtrar</span>
                                </div>
                                {articles.slice(0, 6).map(art => (
                                    <Link
                                        key={art.id}
                                        to={`/educativa/${art.category?.slug || 'general'}/${art.slug}`}
                                        className="p-3.5 hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                                {art.title}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                                                <span className="font-semibold text-primary">{art.category?.name}</span>
                                                <span>•</span>
                                                <span>{art.readTimeMinutes} min de lectura</span>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            art.level === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-500' :
                                            art.level === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-purple-500/10 text-purple-500'
                                        }`}>
                                            {art.level === 'BEGINNER' ? 'Principiante' : art.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </form>

                    {/* ACCESOS RÁPIDOS */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                        <span className="text-muted-foreground font-medium">Conceptos populares:</span>
                        {[
                            { label: 'ROIC', slug: 'analisis-fundamental/que-es-el-roic' },
                            { label: 'RSI', slug: 'analisis-tecnico/que-es-el-rsi' },
                            { label: 'PER (P/E)', slug: 'analisis-fundamental/que-es-el-per' },
                            { label: 'MACD', slug: 'analisis-tecnico/que-es-el-macd' },
                            { label: 'DCF', slug: 'analisis-fundamental/modelos-de-valuacion-dcf' },
                            { label: 'Tendencias', slug: 'analisis-tecnico/tendencias-alcista-bajista-lateral' },
                        ].map(item => (
                            <Link
                                key={item.label}
                                to={`/educativa/${item.slug}`}
                                className="px-2.5 py-1 rounded-lg bg-card border border-border/80 hover:border-primary/50 text-foreground font-semibold hover:text-primary transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
                {/* RUTAS DE APRENDIZAJE */}
                {paths.length > 0 && !search && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5" />
                                    Guiadas paso a paso
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                                    Rutas de Aprendizaje
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paths.map(path => {
                                const IconComp = CATEGORY_ICONS[path.level === 'BEGINNER' ? 'Compass' : path.level === 'INTERMEDIATE' ? 'BarChart3' : 'TrendingUp'] || Compass;
                                return (
                                    <Link
                                        key={path.id}
                                        to={`/educativa/rutas/${path.slug}`}
                                        className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    <IconComp className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                                    {path.level === 'BEGINNER' ? 'Principiante' : path.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                                                {path.title}
                                            </h3>

                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {path.description}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-border/60 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{path.items?.length || 0} Lecciones estructuradas</span>
                                            <span className="font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                Comenzar <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* CATEGORÍAS PRINCIPALES */}
                {!search && (
                    <section className="space-y-6">
                        <div>
                            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                Explorar por temática
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-foreground">
                                Categorías Educativas
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map(cat => {
                                const IconComponent = CATEGORY_ICONS[cat.icon] || BookOpen;
                                return (
                                    <Link
                                        key={cat.id}
                                        to={`/educativa/${cat.slug}`}
                                        className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:bg-card/80 hover:shadow-md transition-all flex items-start gap-4"
                                    >
                                        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                    {cat.name}
                                                </h3>
                                                <span className="text-[11px] font-semibold text-muted-foreground">
                                                    {cat._count?.articles ?? 0} arts
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {cat.description}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ARTÍCULOS DESTACADOS Y BIBLIOTECA */}
                <section className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
                        <div>
                            <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {search ? `Resultados para "${search}"` : 'Artículos Esenciales'}
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-foreground">
                                {search ? `${filteredArticles.length} artículos encontrados` : 'Conceptos y Análisis Destacados'}
                            </h2>
                        </div>

                        {/* Filtro por nivel */}
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 text-xs font-semibold self-start sm:self-auto">
                            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setSelectedLevel(lvl)}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        selectedLevel === lvl
                                            ? 'bg-card text-foreground font-bold shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {lvl === 'ALL' ? 'Todos' : lvl === 'BEGINNER' ? 'Principiante' : lvl === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredArticles.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
                            <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto" />
                            <p className="text-sm font-semibold text-foreground">
                                No se encontraron artículos con los criterios seleccionados.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Probá con otra búsqueda o seleccioná otro nivel de dificultad.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredArticles.map(art => {
                                const catSlug = art.category?.slug || 'general';
                                return (
                                    <Link
                                        key={art.id}
                                        to={`/educativa/${catSlug}/${art.slug}`}
                                        className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                                                    {art.category?.name || 'Educativa'}
                                                </span>
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {art.readTimeMinutes} min
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                                                {art.title}
                                            </h3>

                                            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                                {art.summary}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-border/60 mt-4 flex items-center justify-between text-xs">
                                            {art.interactiveWidget ? (
                                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <Zap className="w-3 h-3" /> Ejemplo interactivo
                                                </span>
                                            ) : (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                    art.level === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                    art.level === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                    'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                }`}>
                                                    {art.level === 'BEGINNER' ? 'Principiante' : art.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                                </span>
                                            )}

                                            <span className="font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                                Leer <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* AVISO EDUCATIVO LEGAL DISCRETO */}
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/70 text-center max-w-3xl mx-auto">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        🛡️ <strong>Aviso educativo:</strong> El contenido de esta sección tiene fines exclusivamente educativos e informativos. No constituye asesoramiento financiero, recomendación de inversión ni oferta de compra o venta de activos financieros.
                    </p>
                </div>
            </div>
        </div>
    );
}
