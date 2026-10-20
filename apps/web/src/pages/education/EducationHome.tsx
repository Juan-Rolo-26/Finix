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
import './education.css';

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const toCategory = (value: unknown): Category | null => {
    if (!isRecord(value) || typeof value.id !== "string" || typeof value.slug !== "string" || typeof value.name !== "string") return null;
    return {
        id: value.id, slug: value.slug, name: value.name,
        description: typeof value.description === "string" ? value.description : "",
        icon: typeof value.icon === "string" ? value.icon : "BookOpen",
        ...(isRecord(value._count) && typeof value._count.articles === "number" ? { _count: { articles: value._count.articles } } : {}),
    };
};

const toArticle = (value: unknown): Article | null => {
    if (!isRecord(value) || typeof value.id !== "string" || typeof value.slug !== "string" || typeof value.title !== "string") return null;
    const category = toCategory(value.category);
    const subcategory = toCategory(value.subcategory);
    const rawCover = isRecord(value.coverImage) ? value.coverImage : null;
    const coverImage = rawCover && typeof rawCover.src === "string" && rawCover.src.trim()
        ? { src: rawCover.src, alt: typeof rawCover.alt === "string" ? rawCover.alt : "" }
        : undefined;
    const level = value.level === "BEGINNER" || value.level === "INTERMEDIATE" || value.level === "ADVANCED"
        ? value.level : "INTERMEDIATE";
    return {
        id: value.id, slug: value.slug, title: value.title,
        summary: typeof value.summary === "string" ? value.summary : "",
        level, readTimeMinutes: typeof value.readTimeMinutes === "number" && Number.isFinite(value.readTimeMinutes)
            ? Math.max(1, Math.round(value.readTimeMinutes)) : 1,
        formula: typeof value.formula === "string" ? value.formula : undefined,
        interactiveWidget: typeof value.interactiveWidget === "string" ? value.interactiveWidget : undefined,
        isFeatured: value.isFeatured === true,
        coverImage,
        ...(category ? { category: { id: category.id, name: category.name, slug: category.slug, icon: category.icon } } : {}),
        ...(subcategory ? { subcategory: { id: subcategory.id, name: subcategory.name, slug: subcategory.slug } } : {}),
    };
};

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
                    const rawCategories: unknown = await catRes.json();
                    setCategories(Array.isArray(rawCategories) ? rawCategories.map(toCategory).filter((item): item is Category => item !== null) : []);
                }

                // Fetch ALL articles by traversing pages until the catalog is complete
                let allArticles: Article[] = [];
                let page = 1;
                let totalPages = 1;
                do {
                    const artRes = page === 1 ? firstArtRes : await apiFetch(`/education/articles?limit=200&page=${page}`);
                    if (!artRes.ok) break;
                    const data: unknown = await artRes.json();
                    const payload: Record<string, unknown> = isRecord(data) ? data : {};
                    const items = Array.isArray(payload.items)
                        ? payload.items.map(toArticle).filter((item): item is Article => item !== null)
                        : [];
                    allArticles = allArticles.concat(items);
                    const pagination = isRecord(payload.pagination) ? payload.pagination : null;
                    totalPages = typeof pagination?.totalPages === "number" && Number.isFinite(pagination.totalPages)
                        ? Math.max(1, Math.floor(pagination.totalPages)) : 1;
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
            setSearchParams({ search: val }, { replace:true });
        } else {
            setSearchParams({}, { replace:true });
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
        <div className="education-home min-h-screen bg-background text-foreground pb-20">
            <header className="education-hero">
                <div className="education-hero-copy"><span className="education-brand"><GraduationCap size={20}/> Finix Educativa</span><h1>Aprendé a invertir<br/>con criterio.</h1><p>Entendé los conceptos, leé los datos y llevá cada idea a la práctica. Una biblioteca abierta para tomar decisiones con más contexto.</p><Link to="/laboratorio" className="education-practice">Llevarlo a la práctica <ArrowRight size={16}/></Link></div>
                <aside className="education-topics"><h2>Elegí tu próximo tema</h2>{categories.slice(0,3).map(cat=>{const Icon=CATEGORY_ICONS[cat.icon]||BookOpen;return <Link key={cat.id} to={'/educativa/'+cat.slug}><span className="education-topic-icon"><Icon size={20}/></span><span><strong>{cat.name}</strong><small>{cat.description || 'Conceptos y herramientas para profundizar.'}</small></span><ArrowRight size={16}/></Link>;})}<p>{articles.length} artículos para consultar a tu ritmo</p></aside>
            </header>
            <section className="education-search" aria-label="Buscar en la biblioteca"><div className="education-search-field"><Search size={20}/><input value={search} onChange={e=>handleSearchChange(e.target.value)} placeholder="¿Qué querés entender hoy? Buscá RSI, CEDEARs, bonos, DCF…" aria-label={finixUi("Buscador instantáneo de conceptos financieros")}/>{search&&<button type="button" onClick={()=>handleSearchChange('')}>Limpiar</button>}</div><div className="education-quick-search"><span>Consultas frecuentes</span>{['RSI','MACD','ROIC','DCF','CEDEAR','Bonos'].map(term=><button key={term} type="button" onClick={()=>handleSearchChange(term)} aria-pressed={search===term}>{term}</button>)}</div></section>

            {/* MAIN CATALOG & FILTERS */}
            <div id="biblioteca" className="education-catalog mx-auto max-w-[1360px] space-y-6 px-4 py-8 sm:px-8">
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
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredArticles.map(art => {
                            const IconComp = CATEGORY_ICONS[art.category?.icon || 'BookOpen'] || BookOpen;
                            return (
                                <Link
                                    key={art.id}
                                    to={`/educativa/${art.category?.slug || 'general'}/${art.slug}`}
                                    className="education-article-card group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
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

                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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
