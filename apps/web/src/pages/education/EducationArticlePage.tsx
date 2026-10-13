import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    GraduationCap, Clock, ArrowLeft, ArrowRight, CheckCircle2,
    Sparkles, ChevronRight,
    ArrowUp, BookOpen, AlertCircle, AlignLeft, ExternalLink
} from 'lucide-react';
import { renderEducationText as renderMarkdownText, EducationTextBlock, EducationTable } from '@/components/education/EducationText';
import { apiFetch } from '@/lib/api';
import { EducationalWidgetContainer } from '@/components/education/InteractiveWidgets';

interface TocItem {
    id: string;
    title: string;
}

export default function EducationArticlePage() {
    const { articleSlug } = useParams<{ categorySlug?: string; articleSlug: string }>();

    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeHeadingId, setActiveHeadingId] = useState<string>('');

    // Extract table of contents headings
    const tocItems: TocItem[] = useMemo(() => {
        if (!article?.content) return [];
        const lines = article.content.split('\n');
        const items: TocItem[] = [];
        lines.forEach((line: string, index: number) => {
            if (line.startsWith('### ')) {
                const title = line.replace('### ', '').trim();
                const id = 'sec-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `sec-${index}`;
                items.push({ id, title });
            }
        });
        return items;
    }, [article?.content]);

    // Dynamic SEO Metadata and JSON-LD Structured Data
    useEffect(() => {
        if (!article) return;
        document.title = `${article.title} | Finix Educativa`;

        // Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', article.summary || article.title);

        // OpenGraph Title & Description
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', `${article.title} | Finix Educativa`);

        let ogDesc = document.querySelector('meta[property="og:description"]');
        if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
        }
        ogDesc.setAttribute('content', article.summary || article.title);

        // JSON-LD Structured Data
        const scriptId = 'edu-jsonld-schema';
        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        const schema = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Article',
                    'headline': article.title,
                    'description': article.summary,
                    'articleSection': article.category?.name || 'Educación Financiera',
                    'educationalLevel': article.level,
                    'timeRequired': `PT${article.readTimeMinutes}M`,
                    'author': {
                        '@type': 'Organization',
                        'name': 'Finix'
                    },
                    'publisher': {
                        '@type': 'Organization',
                        'name': 'Finix'
                    }
                },
                {
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {
                            '@type': 'ListItem',
                            'position': 1,
                            'name': 'Educativa',
                            'item': `${window.location.origin}/educativa`
                        },
                        {
                            '@type': 'ListItem',
                            'position': 2,
                            'name': article.category?.name || 'Categoría',
                            'item': `${window.location.origin}/educativa/${article.category?.slug}`
                        },
                        {
                            '@type': 'ListItem',
                            'position': 3,
                            'name': article.title,
                            'item': window.location.href
                        }
                    ]
                }
            ]
        };
        script.textContent = JSON.stringify(schema);

        return () => {
            const s = document.getElementById(scriptId);
            if (s) s.remove();
        };
    }, [article]);

    // Scroll spy for headings
    useEffect(() => {
        if (!tocItems.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find(e => e.isIntersecting);
                if (visible) {
                    setActiveHeadingId(visible.target.id);
                }
            },
            { rootMargin: '-60px 0px -60% 0px' }
        );

        tocItems.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [tocItems]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`/education/articles/${articleSlug}`);
                if (res.ok && mounted) {
                    const data = await res.json();
                    setArticle(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (articleSlug) void load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return () => { mounted = false; };
    }, [articleSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">
                Cargando artículo educativo...
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4">
                <GraduationCap className="w-12 h-12 text-muted-foreground" />
                <h2 className="text-xl font-bold">Artículo no encontrado</h2>
                <Link
                    to="/educativa"
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
                >
                    Volver a Educativa
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* TOP NAVIGATION BREADCRUMB */}
            <div className="border-b border-border/70 bg-card/40 sticky top-14 z-30 backdrop-blur-md px-4 py-3 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs pt-0.5">
                    <div className="flex items-center gap-1.5 overflow-hidden text-muted-foreground">
                        <Link to="/educativa" className="hover:text-primary transition-colors flex items-center gap-1 shrink-0">
                            <GraduationCap className="w-3.5 h-3.5" /> Educativa
                        </Link>
                        <span>/</span>
                        <Link
                            to={`/educativa/${article.category?.slug}`}
                            className="hover:text-primary transition-colors shrink-0"
                        >
                            {article.category?.name}
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-semibold truncate">
                            {article.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                            Consulta Libre
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN 3-ZONE LAYOUT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT SIDEBAR: THEMATIC CONTEXT */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-6">
                        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                                <BookOpen className="w-4 h-4" />
                                {article.category?.name}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Conceptos relacionados y artículos de esta categoría.
                            </p>
                            <div className="pt-2 border-t border-border/60">
                                <Link
                                    to={`/educativa/${article.category?.slug}`}
                                    className="text-xs font-semibold text-primary hover:underline flex items-center justify-between"
                                >
                                    Ver todos los conceptos <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Category Fast Switcher */}
                        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-2 text-xs">
                            <h4 className="font-bold text-foreground mb-2">Otras Categorías</h4>
                            {[
                                { name: 'Fundamentos', slug: 'fundamentos' },
                                { name: 'Análisis Fundamental', slug: 'analisis-fundamental' },
                                { name: 'Análisis Técnico', slug: 'analisis-tecnico' },
                                { name: 'Macroeconomía', slug: 'macroeconomia' },
                                { name: 'Estrategias & Riesgo', slug: 'estrategias' },
                            ].map(cat => (
                                <Link
                                    key={cat.slug}
                                    to={`/educativa/${cat.slug}`}
                                    className="block p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </aside>

                    {/* CENTRAL ZONE: ARTICLE CONTENT */}
                    <div className="lg:col-span-6 space-y-8 min-w-0">
                        {/* Header Details */}
                        <div className="space-y-4 border-b border-border/70 pb-6">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                                    article.level === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                    article.level === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                    'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                }`}>
                                    Nivel: {article.level === 'BEGINNER' ? 'Principiante' : article.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> {article.readTimeMinutes} min de lectura
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                                {article.title}
                            </h1>

                            {/* Executive Summary */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 text-foreground text-sm sm:text-base leading-relaxed font-medium">
                                {article.summary}
                            </div>

                            {/* MOBILE TABLE OF CONTENTS ACCORDION */}
                            {tocItems.length > 0 && (
                                <div className="lg:hidden p-3.5 rounded-2xl bg-card border border-border/80 space-y-2">
                                    <details className="group">
                                        <summary className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer list-none">
                                            <span className="flex items-center gap-2">
                                                <AlignLeft className="w-4 h-4 text-primary" />
                                                Índice del artículo ({tocItems.length} secciones)
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                                        </summary>
                                        <div className="pt-3 space-y-1 text-xs border-t border-border/50 mt-3">
                                            {tocItems.map((item, idx) => (
                                                <a
                                                    key={item.id}
                                                    href={`#${item.id}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const el = document.getElementById(item.id);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }}
                                                    className="block py-1.5 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                                                >
                                                    <span className="text-[10px] text-muted-foreground mr-1.5 font-mono">{idx + 1}.</span>
                                                    {item.title}
                                                </a>
                                            ))}
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>

                        {/* INTERACTIVE WIDGET (IF CONFIGURED) */}
                        {article.interactiveWidget && (
                            <section className="space-y-2">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Laboratorio Interactivo Finix
                                </div>
                                <EducationalWidgetContainer widgetKey={article.interactiveWidget} />
                            </section>
                        )}

                        {/* FORMULA HIGHLIGHT (IF CONFIGURED) */}
                        {article.formula && (
                            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-sm space-y-2">
                                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                                    Fórmula Matemática
                                </span>
                                <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap text-emerald-300 leading-relaxed overflow-x-auto">
                                    {article.formula}
                                </pre>
                            </div>
                        )}

                        {/* BODY CONTENT (MARKDOWN) */}
                        <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/90 text-sm sm:text-base leading-relaxed space-y-4">
                            {article.content.split('\n\n').map((block: string, idx: number, blocks: string[]) => {
                                const previousCaption = blocks[idx - 1]?.match(/^!\[([^\]]*)\]\(/)?.[1];
                                if (previousCaption && block.trim() === previousCaption) return null;
                                if (block.startsWith('### ')) {
                                    const [heading, ...remainingLines] = block.split('\n');
                                    const title = heading.replace('### ', '').trim();
                                    const id = 'sec-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `sec-${idx}`;
                                    return (
                                        <Fragment key={idx}>
                                        <h3
                                            id={id}
                                            className="text-lg sm:text-xl font-bold text-foreground mt-8 mb-3 scroll-mt-24 flex items-center justify-between group border-b border-border/40 pb-2"
                                        >
                                            <span>{title}</span>
                                            <a
                                                href={`#${id}`}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity text-sm font-mono font-normal"
                                                title="Enlace a esta sección"
                                            >
                                                #
                                            </a>
                                        </h3>
                                        {remainingLines.join('\n').trim() && <EducationTextBlock text={remainingLines.join('\n').trim()} />}
                                        </Fragment>
                                    );
                                }
                                if (block.startsWith('---')) {
                                    return <hr key={idx} className="border-border/60 my-6" />;
                                }
                                if (/^\s*\|/.test(block)) {
                                    return <EducationTable key={idx} text={block} />;
                                }
                                if (block.startsWith('![')) {
                                    const match = block.match(/!\[(.*?)\]\((.*?)\)/);
                                    if (match) {
                                        const alt = match[1];
                                        const src = match[2];
                                        const remaining = block.replace(/!\[.*?\]\(.*?\)/, '').trim();
                                        const caption = remaining ? remaining.replace(/^\*+|\*+$/g, '') : alt;
                                        return (
                                            <figure key={idx} className="my-6 space-y-2">
                                                <div className="rounded-2xl overflow-hidden border border-border/80 bg-card shadow-xs group">
                                                    <a
                                                        href={src}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block cursor-zoom-in"
                                                        title="Tocar para ver en tamaño completo"
                                                    >
                                                        <img
                                                            src={src}
                                                            alt={alt}
                                                            loading="lazy"
                                                            className="w-full h-auto max-h-[460px] object-contain mx-auto bg-card hover:scale-[1.01] transition-transform"
                                                        />
                                                    </a>
                                                    <div className="p-2.5 bg-muted/50 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground px-3">
                                                        <span className="truncate">Gráfico educativo</span>
                                                        <a
                                                            href={src}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-primary hover:underline font-bold shrink-0 ml-2"
                                                        >
                                                            Ampliar imagen ↗
                                                        </a>
                                                    </div>
                                                </div>
                                                {caption && (
                                                    <figcaption className="text-xs text-muted-foreground leading-relaxed px-1 text-center italic">
                                                        {renderMarkdownText(caption)}
                                                    </figcaption>
                                                )}
                                            </figure>
                                        );
                                    }
                                }
                                return (
<EducationTextBlock key={idx} text={block} />
                                );
                            })}
                        </div>

                        {/* KEY TAKEAWAYS (PUNTOS CLAVE) */}
                        {Array.isArray(article.keyTakeaways) && article.keyTakeaways.length > 0 && (
                            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    Puntos Clave para Recordar
                                </div>
                                <ul className="space-y-2 text-xs sm:text-sm text-foreground/90">
                                    {article.keyTakeaways.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-500 font-bold">•</span>
                                            <span>{renderMarkdownText(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* COMMON MISTAKES (ERRORES FRECUENTES) */}
                        {Array.isArray(article.commonMistakes) && article.commonMistakes.length > 0 && (
                            <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Errores Frecuentes al Interpretar
                                </div>
                                <ul className="space-y-2 text-xs sm:text-sm text-foreground/90">
                                    {article.commonMistakes.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-rose-500 font-bold">•</span>
                                            <span>{renderMarkdownText(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* SOURCES & BIBLIOGRAPHY */}
                        {Array.isArray(article.sources) && article.sources.length > 0 && (
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs text-muted-foreground">
                                <span className="font-bold text-foreground block">Fuentes y Bibliografía:</span>
                                <ul className="list-disc pl-4 space-y-1">
                                    {article.sources.map((s: any, i: number) => {
                                        if (typeof s === 'string') {
                                            return <li key={i}>{renderMarkdownText(s)}</li>;
                                        }
                                        if (s?.url) {
                                            return (
                                                <li key={i}>
                                                    <a
                                                        href={s.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                                                    >
                                                        {s.title || s.url}
                                                        <ExternalLink className="w-3 h-3 opacity-70" />
                                                    </a>
                                                </li>
                                            );
                                        }
                                        return <li key={i}>{renderMarkdownText(s?.title || '')}</li>;
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* PREVIOUS & NEXT NAVIGATION */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border/70">
                            {article.navigation?.previous ? (
                                <Link
                                    to={`/educativa/${article.category?.slug}/${article.navigation.previous.slug}`}
                                    className="p-4 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted/40 transition-all text-left space-y-1"
                                >
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                        <ArrowLeft className="w-3 h-3" /> Artículo anterior
                                    </span>
                                    <span className="text-xs font-bold text-foreground block truncate">
                                        {article.navigation.previous.title}
                                    </span>
                                </Link>
                            ) : <div />}

                            {article.navigation?.next ? (
                                <Link
                                    to={`/educativa/${article.category?.slug}/${article.navigation.next.slug}`}
                                    className="p-4 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-muted/40 transition-all text-right space-y-1"
                                >
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-end gap-1">
                                        Artículo siguiente <ArrowRight className="w-3 h-3" />
                                    </span>
                                    <span className="text-xs font-bold text-foreground block truncate">
                                        {article.navigation.next.title}
                                    </span>
                                </Link>
                            ) : <div />}
                        </div>

                        {/* LEGAL DISCLAIMER */}
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-center text-xs text-muted-foreground leading-relaxed">
                            El contenido publicado en esta sección tiene fines exclusivamente informativos y educativos. No constituye asesoramiento financiero ni recomendación de inversión.
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR: READING SUMMARY & FAST LINKS */}
                    <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-6">
                        {/* TABLE OF CONTENTS (DESKTOP SCROLL-SPY) */}
                        {tocItems.length > 0 && (
                            <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                                    <AlignLeft className="w-3.5 h-3.5 text-primary" />
                                    Índice de Contenido
                                </div>
                                <nav className="space-y-1 text-xs">
                                    {tocItems.map((item, idx) => {
                                        const isActive = activeHeadingId === item.id;
                                        return (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const el = document.getElementById(item.id);
                                                    if (el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        setActiveHeadingId(item.id);
                                                    }
                                                }}
                                                className={`block py-1.5 px-2.5 rounded-lg transition-all text-xs line-clamp-2 ${
                                                    isActive
                                                        ? 'bg-primary/10 text-primary font-bold border-l-2 border-primary pl-2'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                                }`}
                                            >
                                                <span className="text-[10px] text-muted-foreground/60 mr-1.5 font-mono">{idx + 1}.</span>
                                                {item.title}
                                            </a>
                                        );
                                    })}
                                </nav>
                            </div>
                        )}

                        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                Ficha Técnica
                            </h4>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between py-1 border-b border-border/50">
                                    <span className="text-muted-foreground">Categoría</span>
                                    <span className="font-semibold text-foreground">{article.category?.name || 'General'}</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-border/50">
                                    <span className="text-muted-foreground">Subcategoría</span>
                                    <span className="font-semibold text-foreground">{article.subcategory?.name || 'General'}</span>
                                </div>
                                <div className="flex items-center justify-between py-1 border-b border-border/50">
                                    <span className="text-muted-foreground">Nivel</span>
                                    <span className="font-semibold text-foreground">
                                        {article.level === 'BEGINNER' ? 'Principiante' : article.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Lectura</span>
                                    <span className="font-semibold text-foreground">{article.readTimeMinutes} min</span>
                                </div>
                            </div>

                            <Link
                                to={`/educativa/${article.category?.slug}`}
                                className="block w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold text-center transition-colors"
                            >
                                Ver categoría completa
                            </Link>
                        </div>

                        {/* Related Articles */}
                        {Array.isArray(article.relatedArticles) && article.relatedArticles.length > 0 && (
                            <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Conceptos Relacionados
                                </h4>
                                <div className="space-y-2">
                                    {article.relatedArticles.map((rel: any) => (
                                        <Link
                                            key={rel.id}
                                            to={`/educativa/${article.category?.slug}/${rel.slug}`}
                                            className="block p-2 rounded-lg hover:bg-muted/60 transition-colors text-xs font-semibold text-foreground truncate"
                                        >
                                            {rel.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="w-full py-2 px-3 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <ArrowUp className="w-3.5 h-3.5" /> Volver arriba
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
}
