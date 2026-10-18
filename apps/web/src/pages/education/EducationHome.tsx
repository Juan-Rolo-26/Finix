import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    GraduationCap, Search, BookOpen, TrendingUp,
    BarChart3, Landmark, ShieldCheck, ArrowRight,
    Clock, Compass, HelpCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { EducationCover, type EducationCoverImage } from '@/components/education/EducationCover';
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
    coverImage?: EducationCoverImage;
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
    const { ui: finixUi } = useFinixUiTranslation();

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
                const [catRes, firstArtRes] = await Promise.all([
                    apiFetch('/education/categories'),
                    apiFetch('/education/articles?limit=200&page=1'),
                ]);
                if (catRes.ok && mounted) {
                    setCategories(await catRes.json());
                }

                // Fetch ALL articles by traversing pages until the catalog is complete
                let allArticles: Article[] = [];
                let page = 1;
                let totalPages = 1;
                do {
                    const artRes = page === 1 ? firstArtRes : await apiFetch(`/education/articles?limit=200&page=${page}`);
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
        <div className="min-h-screen bg-emerald-50/70 text-foreground pb-20 dark:bg-background">
            {/* HERO & SEARCH BAR */}
            <section className="relative mx-auto max-w-[1800px] overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 px-4 py-14 text-white shadow-lg shadow-emerald-950/10 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_0%,rgba(255,255,255,0.16),transparent)]" />
                <div className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border border-white/10" />

                <div className="relative z-10 mx-auto max-w-7xl space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-wider text-emerald-50 shadow-sm backdrop-blur-sm">
                        <GraduationCap className="w-4 h-4" />
                        {" "}<FinixUiText text={"Finix · Biblioteca de Consulta Financiera"} />{" "}</div>

                    <h1 className="text-4xl font-black tracking-tight !text-white sm:text-6xl">
                        {" "}<FinixUiText text={"Biblioteca Educativa"} />{" "}</h1>

                    <p className="mx-auto max-w-4xl text-base font-normal leading-relaxed text-emerald-50/90 sm:text-lg lg:text-xl">
                        {" "}<FinixUiText text={"Consultá conceptos, fórmulas, indicadores y métricas de mercado con rigor técnico institucional. Libre acceso y sin registro requerido."} />{" "}</p>

                    <Link to="/laboratorio" className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/70 bg-white px-6 py-3 text-base font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800">{""}<FinixUiText text={"Probá los conceptos en el Laboratorio"} />{" "}<ArrowRight className="h-4 w-4 shrink-0" /></Link>
                    {/* BUSCADOR INSTANTÁNEO */}
                    <div className="relative mx-auto max-w-5xl pt-2">
                        <div className="relative flex items-center rounded-2xl border border-white/70 bg-white shadow-xl shadow-emerald-950/15 transition-all focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-200/60">
                            <Search className="w-5 h-5 ml-4 text-muted-foreground shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                placeholder={finixUi("Buscar por métrica, sigla o fórmula (ej: PE, P-E, RSI, MACD, Media Móvil 20/200, CEDEAR, TIR)...")}
                                className="w-full bg-transparent px-4 py-4 text-base sm:text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                                aria-label={finixUi("Buscador instantáneo de conceptos financieros")}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange('')}
                                    className="mr-3 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-muted/60"
                                >
                                    {" "}<FinixUiText text={"Limpiar"} />{" "}</button>
                            )}
                        </div>
                    </div>

                    {/* ACCESOS DIRECTOS POPULARES */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-sm">
                        <span className="mr-1 font-semibold text-emerald-50/90">{""}<FinixUiText text={"Consultas rápidas:"} />{""}</span>
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
                                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                                    search.toLowerCase() === item.term.toLowerCase()
                                        ? 'bg-white !text-emerald-800 border-white shadow-sm'
                                        : 'bg-white/10 border-white/20 hover:bg-white/20 !text-white hover:!text-white'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* MAIN CATALOG & FILTERS */}
            <div className="mx-auto max-w-[1800px] space-y-8 px-4 py-8 sm:px-8 xl:px-12 2xl:px-16">
                {/* CATEGORY & LEVEL FILTER BAR */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 border-b border-border/80 pb-5">
                    {/* Category tabs */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full text-sm">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('ALL')}
                            className={`shrink-0 max-w-full min-h-11 px-3.5 py-2 rounded-xl font-bold whitespace-normal text-left transition-all ${
                                selectedCategory === 'ALL'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {" "}<FinixUiText text={"Todas las categorías ("} />{""}{articles.length})
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
                    <div className="flex flex-wrap items-center gap-2 shrink-0 text-sm">
                        <span className="text-muted-foreground font-medium hidden md:inline">{""}<FinixUiText text={"Nivel:"} />{""}</span>
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
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        <span>{""}<FinixUiText text={"Mostrando"} />{" "}</span>
                        <strong className="text-foreground font-bold">{filteredArticles.length}</strong>
                        <span> {" "}<FinixUiText text={"de"} />{" "}{articles.length} {" "}<FinixUiText text={"artículos"} />{""}</span>
                        {search && <span> {" "}<FinixUiText text={"para «"} />{""}{search}»</span>}
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
                            {" "}<FinixUiText text={"Restablecer filtros"} />{" "}</button>
                    )}
                </div>

                {/* ARTICLES GRID */}
                {filteredArticles.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 space-y-3">
                        <HelpCircle className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                        <h3 className="text-base font-bold text-foreground">
                            {" "}<FinixUiText text={"No se encontraron artículos con ese criterio"} />{" "}</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            {" "}<FinixUiText text={"Probá buscando por la sigla (ej: RSI, MACD, PER, DCF), nombre en español (ej: medias móviles, flujo de caja, inflación) o limpiando los filtros."} />{" "}</p>
                        <button
                            type="button"
                            onClick={() => {
                                handleSearchChange('');
                                setSelectedCategory('ALL');
                                setSelectedLevel('ALL');
                            }}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                        >
                            {" "}<FinixUiText text={"Ver todos los artículos"} />{" "}</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredArticles.map(art => {
                            const IconComp = CATEGORY_ICONS[art.category?.icon || 'BookOpen'] || BookOpen;
                            return (
                                <Link
                                    key={art.id}
                                    to={`/educativa/${art.category?.slug || 'general'}/${art.slug}`}
                                    className="group p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <EducationCover image={art.coverImage} />
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-primary flex items-center gap-1.5 truncate">
                                                <IconComp className="w-3.5 h-3.5 shrink-0" />
                                                {art.category?.name}
                                            </span>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                                                art.level === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                art.level === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                            }`}>
                                                {art.level === 'BEGINNER' ? 'Principiante' : art.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                            </span>
                                        </div>

                                        <h2 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                                            {art.title}
                                        </h2>

                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {art.summary}
                                        </p>

                                        {art.formula && (
                                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-300 truncate">
                                                {art.formula.split('\n')[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-border/60 mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Clock className="w-3.5 h-3.5" /> {art.readTimeMinutes} {" "}<FinixUiText text={"min de lectura"} />{" "}</span>
                                        <span className="font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                            {" "}<FinixUiText text={"Consultar"} />{" "}<ArrowRight className="w-3.5 h-3.5" />
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
