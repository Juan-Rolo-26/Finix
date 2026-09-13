import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Newspaper } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
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
    const ref = useRef<HTMLDivElement>(null);

    // Scroll active tab into view
    useEffect(() => {
        const btn = ref.current?.querySelector(`[data-slug="${selected}"]`) as HTMLElement | null;
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [selected]);

    return (
        <div
            ref={ref}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {categories.map((cat) => {
                const isActive = cat.slug === selected;
                return (
                    <button
                        key={cat.slug}
                        data-slug={cat.slug}
                        onClick={() => onSelect(cat.slug)}
                        className={`shrink-0 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 border outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                            isActive
                                ? 'text-white shadow-lg scale-[1.02]'
                                : 'bg-transparent text-muted-foreground border-border/50 hover:text-foreground hover:border-border'
                        }`}
                        style={isActive ? {
                            background: cat.color || 'hsl(var(--primary))',
                            borderColor: cat.color || 'hsl(var(--primary))',
                            boxShadow: `0 4px 24px ${cat.color || 'hsl(var(--primary))'}50`,
                        } : undefined}
                    >
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ categoryName }: { categoryName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground/25 mb-4" />
            <p className="font-semibold text-muted-foreground">
                {categoryName ? `No hay noticias publicadas en ${categoryName}` : 'Sin contenido disponible'}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
                Nuestro equipo editorial actualizará esta sección pronto.
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

    const isPro = (user as any)?.isPro || (user as any)?.subscriptionTier === 'pro' || (user as any)?.role === 'ADMIN';

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
                    title="Sección exclusiva PRO"
                    description="Accedé a nuestro análisis de noticias financieras curado, organizado por categorías y actualizado en tiempo real por nuestro equipo editorial."
                    buttonText="Activar PRO"
                    onUpgrade={() => navigate('/pro')}
                />
            </div>
        );
    }

    const selectedCat = categories.find((c) => c.slug === selectedSlug);
    const hasContent = categoryData?.slots.some((s) => s.article !== null) ?? false;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                            Noticias
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Información financiera curada por nuestro equipo editorial
                        </p>
                    </div>
                    <button
                        onClick={() => selectedSlug && loadSlots(selectedSlug)}
                        disabled={slotsLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${slotsLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>

                {/* Category tabs */}
                {categoriesLoading ? (
                    <div className="flex gap-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-10 w-24 rounded-2xl bg-secondary/50 animate-pulse" />
                        ))}
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
