import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Newspaper } from 'lucide-react';
import { useAuthStore, isJuanUser } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { NewsMosaic, NewsMosaicSkeleton } from '@/components/news/NewsMosaic';
import type { NewsSlotData } from '@/components/news/NewsCard';
import { ProGate } from '@/components/ProGate';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NewsCategory {
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    image?: string;
    displayOrder: number;
}

interface CategoryData {
    category: { id: string; name: string; slug: string; color?: string; icon?: string };
    slots: NewsSlotData[];
}

// ─── Category tabs ─────────────────────────────────────────────────────────────

function CategoryTabs({
    categories,
    selected,
    onSelect,
}: {
    categories: NewsCategory[];
    selected: string;
    onSelect: (slug: string) => void;
}) {
    return (
        <div className="w-full flex justify-center py-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-5xl mx-auto">
                {categories.map((cat) => {
                    const isActive = cat.slug === selected;
                    const catColor = cat.color || 'hsl(var(--primary))';
                    return (
                        <button
                            key={cat.slug}
                            data-slug={cat.slug}
                            onClick={() => onSelect(cat.slug)}
                            className={`group relative inline-flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer select-none border ${
                                isActive
                                    ? 'shadow-md scale-[1.03] font-bold keep-white'
                                    : 'bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground border-border/70 hover:border-foreground/20 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95'
                            }`}
                            style={
                                isActive
                                    ? {
                                          backgroundColor: catColor,
                                          borderColor: catColor,
                                          boxShadow: `0 4px 16px -2px ${catColor}55`,
                                          color: '#ffffff',
                                      }
                                    : undefined
                            }
                        >
                            {/* Signature category color indicator dot */}
                            <span
                                className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-200 ${
                                    isActive
                                        ? 'bg-white scale-110 shadow-xs'
                                        : 'group-hover:scale-125 opacity-80 group-hover:opacity-100'
                                }`}
                                style={!isActive ? { backgroundColor: catColor } : undefined}
                            />
                            <span
                                className={isActive ? 'keep-white font-bold' : ''}
                                style={isActive ? { color: '#ffffff' } : undefined}
                            >
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ categoryName }: { categoryName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-28 text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-secondary/40 border border-border/60 flex items-center justify-center mb-4 text-muted-foreground">
                <Newspaper className="w-8 h-8 opacity-60" />
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground">
                {categoryName ? `No hay noticias publicadas en ${categoryName}` : 'Sin contenido disponible'}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Nuestro equipo editorial actualizará esta sección pronto con la información más relevante.
            </p>
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NewsPage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const [categories, setCategories] = useState<NewsCategory[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string>('');
    const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPro = Boolean(
        (user as any)?.isPro ||
        (user as any)?.subscriptionTier === 'pro' ||
        (user as any)?.role === 'ADMIN' ||
        (user as any)?.plan === 'PRO' ||
        (user as any)?.accountType === 'PRO' ||
        isJuanUser(user)
    );

    // Load categories from API
    useEffect(() => {
        if (!isPro) { setCategoriesLoading(false); return; }
        apiFetch('/news/slots/categories')
            .then((r) => r.json())
            .then((data) => {
                const cats: NewsCategory[] = Array.isArray(data) ? data : [];
                setCategories(cats);
                if (cats.length > 0) setSelectedSlug(cats[0].slug);
            })
            .catch(() => setError('No se pudieron cargar las categorías'))
            .finally(() => setCategoriesLoading(false));
    }, [isPro]);

    // Load slots for selected category
    const loadSlots = useCallback(async (slug: string) => {
        setSlotsLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`/news/slots/category/${slug}`);
            if (!res.ok) throw new Error('Error al cargar slots');
            const data = await res.json();
            setCategoryData(data);
        } catch {
            setError('No se pudo cargar el contenido. Intentá de nuevo.');
            setCategoryData(null);
        } finally {
            setSlotsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedSlug) loadSlots(selectedSlug);
    }, [selectedSlug, loadSlots]);

    // Click tracking
    const handleClickTracking = useCallback((slotId: string) => {
        apiFetch(`/news/slots/${slotId}/click`, { method: 'POST' }).catch(() => {});
    }, []);

    // PRO Gate
    if (!isPro && !categoriesLoading) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    section="news"
                    buttonText="Activar Finix PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    const selectedCat = categories.find((c) => c.slug === selectedSlug);
    const hasContent = categoryData?.slots.some((s) => s.article !== null) ?? false;

    return (
        <div className="min-h-screen bg-background w-full">
            <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                            Noticias
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base mt-1">
                            Información financiera curada por nuestro equipo editorial
                        </p>
                    </div>
                    <button
                        onClick={() => selectedSlug && loadSlots(selectedSlug)}
                        disabled={slotsLoading}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold text-foreground transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                        <RefreshCw className={`w-4 h-4 ${slotsLoading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                    </button>
                </div>

                {/* Category tabs */}
                {categoriesLoading ? (
                    <div className="w-full flex justify-center py-1">
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl mx-auto">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-8 sm:h-9 w-24 sm:w-28 rounded-full bg-secondary/50 animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : categories.length > 0 ? (
                    <CategoryTabs
                        categories={categories}
                        selected={selectedSlug}
                        onSelect={(slug) => {
                            if (slug !== selectedSlug) {
                                setSelectedSlug(slug);
                                setCategoryData(null);
                            }
                        }}
                    />
                ) : null}

                {/* Error */}
                {error && (
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 text-sm">
                        <span>{error}</span>
                        <button
                            onClick={() => selectedSlug && loadSlots(selectedSlug)}
                            className="shrink-0 text-xs underline hover:no-underline"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Mosaic */}
                <AnimatePresence mode="wait">
                    {slotsLoading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <NewsMosaicSkeleton />
                        </motion.div>
                    ) : categoryData ? (
                        hasContent ? (
                            <motion.div
                                key={selectedSlug}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <NewsMosaic
                                    slots={categoryData.slots}
                                    categoryColor={selectedCat?.color}
                                    categoryName={selectedCat?.name}
                                    onClickTracking={handleClickTracking}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <EmptyState categoryName={selectedCat?.name} />
                            </motion.div>
                        )
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
}
