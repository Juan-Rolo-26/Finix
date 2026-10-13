import { EducationCover } from '@/components/education/EducationCover';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    GraduationCap, ChevronRight, Clock, ArrowLeft,
    Zap
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function EducationCategoryPage() {
    const { categorySlug } = useParams<{ categorySlug: string }>();
    const navigate = useNavigate();
    const [category, setCategory] = useState<any>(null);
    const [activeSubcategory, setActiveSubcategory] = useState<string>('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`/education/categories/${categorySlug}`);
                if (res.ok && mounted) {
                    setCategory(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (categorySlug) void load();
        return () => { mounted = false; };
    }, [categorySlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">
                Cargando categoría...
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4">
                <GraduationCap className="w-12 h-12 text-muted-foreground" />
                <h2 className="text-xl font-bold">Categoría no encontrada</h2>
                <button
                    type="button"
                    onClick={() => navigate('/educativa')}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
                >
                    Volver a Educativa
                </button>
            </div>
        );
    }

    const allArticles = category.articles || [];
    const filteredArticles = activeSubcategory === 'ALL'
        ? allArticles
        : allArticles.filter((a: any) => a.subcategory?.slug === activeSubcategory);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Header */}
            <header className="border-b border-border/80 bg-card/60 px-4 py-8 sm:py-12">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link to="/educativa" className="hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" /> Biblioteca Educativa
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-semibold">{category.name}</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                        {category.name}
                    </h1>

                    <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                        {category.description}
                    </p>

                    {/* Subcategories Tabs */}
                    {category.subcategories?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-3 pb-1">
                            <button
                                type="button"
                                onClick={() => setActiveSubcategory('ALL')}
                                className={`shrink-0 min-h-11 max-w-full px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-normal text-left ${
                                    activeSubcategory === 'ALL'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Todos ({allArticles.length})
                            </button>
                            {category.subcategories.map((sub: any) => (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setActiveSubcategory(sub.slug)}
                                    className={`shrink-0 min-h-11 max-w-full px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-normal text-left ${
                                        activeSubcategory === sub.slug
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {sub.name} ({sub._count?.articles ?? sub.articles?.length ?? 0})
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* Articles Grid */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredArticles.map((art: any) => (
                        <Link
                            key={art.id}
                            to={`/educativa/${category.slug}/${art.slug}`}
                            className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <EducationCover image={art.coverImage} />
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                                        {art.subcategory?.name || category.name}
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
                    ))}
                </div>
            </div>
        </div>
    );
}
