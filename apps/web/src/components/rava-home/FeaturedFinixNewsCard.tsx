import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Newspaper, ExternalLink, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveNewsImage } from '@/lib/newsImage';

export interface FinixNewsItem {
    id: string;
    source: string;
    publishedAt: string;
    date: string;
    title: string;
    summary: string;
    link: string;
    tag?: string;
    imageUrl?: string;
}

function cleanHtmlText(text?: string): string {
    if (!text) return '';
    return text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function inferNewsTag(title: string, source?: string): string {
    const text = `${title} ${source || ''}`.toLowerCase();
    if (text.includes('riesgo') || text.includes('bono') || text.includes('deuda') || text.includes('al30') || text.includes('gd30') || text.includes('soberan')) {
        return 'Bonos & Deuda';
    }
    if (text.includes('dólar') || text.includes('dolar') || text.includes('bcra') || text.includes('reservas') || text.includes('tipo de cambio') || text.includes('ccl') || text.includes('mep') || text.includes('divisas')) {
        return 'Dólar & BCRA';
    }
    if (text.includes('merval') || text.includes('byma') || text.includes('adr') || text.includes('accion') || text.includes('acciones') || text.includes('ypf') || text.includes('galicia') || text.includes('pampa')) {
        return 'Acciones BYMA';
    }
    if (text.includes('wall street') || text.includes('s&p') || text.includes('nasdaq') || text.includes('fed') || text.includes('reserva federal') || text.includes('powell') || text.includes('tesoro')) {
        return 'Wall Street & Tasas';
    }
    if (text.includes('inflación') || text.includes('inflacion') || text.includes('ipc') || text.includes('fmi') || text.includes('caputo') || text.includes('milei') || text.includes('superávit')) {
        return 'Macroeconomía';
    }
    if (text.includes('cripto') || text.includes('bitcoin') || text.includes('btc') || text.includes('ethereum') || text.includes('eth')) {
        return 'Criptomonedas';
    }
    if (text.includes('commodit') || text.includes('petróleo') || text.includes('petroleo') || text.includes('soja') || text.includes('oro')) {
        return 'Commodities';
    }
    return 'Mercados';
}

const DEFAULT_NEWS: FinixNewsItem[] = [
    {
        id: 'news-1',
        source: 'El Cronista',
        publishedAt: '2026-10-30T03:00:00Z',
        date: 'En vivo',
        title: 'Dólar hoy y dólar blue hoy: cuál es la cotización en la plaza cambiaria minuto a minuto',
        summary:
            'A cuánto cotiza el dólar blue, el precio del dólar oficial y los dólares financieros CCL y MEP. Monitoreo permanente de liquidación de divisas y reservas del Banco Central.',
        link: 'https://www.cronista.com/finanzas-mercados/dolar-hoy-y-dolar-blue-hoy-cual-es-la-cotizacion-del-viernes-30-de-octubre-minuto-a-minuto/',
        tag: 'Dólar & BCRA',
        imageUrl: 'https://www.cronista.com/resizer/v2/ETCXCPXFRZD6BETJOEJXYSHCF4.jpg?auth=92eeb4c7b34e374e8701fbaf1488042a4d655320596cc4e5a4f182960ab2b907&smart=true&width=740&height=517',
    },
    {
        id: 'news-2',
        source: 'El Economista',
        publishedAt: '2026-10-29T20:13:00Z',
        date: 'Hoy',
        title: 'El viento en contra no afecta al dólar ni a los bonos, pero sí a las acciones',
        summary:
            'Con volatilidad en los mercados externos, el mercado argentino transita una rueda con dólares en calma y el BCRA comprando divisas, mientras los bonos sostienen paridades.',
        link: 'https://eleconomista.com.ar/finanzas/el-viento-afecta-dolar-ni-bonos-pero-acciones-n99329',
        tag: 'Mercados',
        imageUrl: 'https://statics.eleconomista.com.ar/2026/08/crop/6a8deba1bf380__950x512.webp',
    },
    {
        id: 'news-3',
        source: 'El Cronista',
        publishedAt: '2026-10-29T22:38:00Z',
        date: 'Hoy',
        title: 'Avanza la licencia bancaria de Mercado Pago: el BCRA dio un paso clave para aprobarla',
        summary:
            'El Banco Central de la República Argentina dio detalles sobre el proceso regulatorio para la entidad fintech de Mercado Libre.',
        link: 'https://www.cronista.com/finanzas-mercados/avanza-la-licencia-bancaria-de-mercado-libre-el-bcra-dio-detalles-sobre-el-proceso-regulatorio/',
        tag: 'Acciones BYMA',
        imageUrl: 'https://www.cronista.com/resizer/v2/V4ZHLY67RNBYLIEV56QG4FPNR4.jpg?auth=fdb576c93d58f527317984358e13f2b6f4f92726f69ccadc0f097b4cf641a8ea&smart=true&width=3000&height=2054',
    },
];

export function FeaturedFinixNewsCard() {
    const navigate = useNavigate();
    const [newsList, setNewsList] = useState<FinixNewsItem[]>(DEFAULT_NEWS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [currentIndex]);

    // ─── Fetch live market news from API (up to 20 news items for continuous loop) ───
    useEffect(() => {
        let isMounted = true;

        apiFetch('/market/news')
            .then((res) => res.json())
            .then((data: any[]) => {
                if (!isMounted || !Array.isArray(data) || data.length === 0) return;

                const items: FinixNewsItem[] = data.slice(0, 20).map((item, idx) => {
                    const cleanDate = item.publishedAt
                        ? new Date(item.publishedAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : 'En vivo';

                    const cleanTitle = cleanHtmlText(item.title);
                    const cleanSource = cleanHtmlText(item.source) || 'Finix Mercados';
                    const tag = inferNewsTag(cleanTitle, cleanSource);
                    const rawImg = (item.image || item.imageUrl || item.urlToImage || '').trim();
                    const normalizedImg = rawImg.startsWith('//') ? `https:${rawImg}` : rawImg;
                    const finalImg = normalizedImg.startsWith('http')
                        ? normalizedImg
                        : resolveNewsImage(cleanTitle, tag);

                    return {
                        id: `api-news-${idx}`,
                        source: cleanSource,
                        publishedAt: item.publishedAt || new Date().toISOString(),
                        date: cleanDate,
                        title: cleanTitle,
                        summary:
                            cleanHtmlText(item.summary || item.description) ||
                            DEFAULT_NEWS[idx % DEFAULT_NEWS.length]?.summary ||
                            'Detalles ampliados de la jornada financiera, cotizaciones y proyecciones de mercado.',
                        link: item.link || '/news',
                        tag,
                        imageUrl: finalImg,
                    };
                });

                if (items.length > 0) {
                    setNewsList(items);
                }
            })
            .catch(() => {
                // Fallback to verified DEFAULT_NEWS
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const totalNews = Math.max(1, newsList.length);

    // ─── Auto-rotate every 20 seconds in infinite loop without stopping ───
    useEffect(() => {
        const INTERVAL_MS = 20000; // 20s
        const TICK_MS = 200;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += TICK_MS;
            const pct = Math.min(100, (elapsed / INTERVAL_MS) * 100);
            setProgress(pct);

            if (elapsed >= INTERVAL_MS) {
                elapsed = 0;
                setProgress(0);
                setCurrentIndex((prev) => (prev + 1) % totalNews);
            }
        }, TICK_MS);

        return () => clearInterval(timer);
    }, [totalNews]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % totalNews);
        setProgress(0);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + totalNews) % totalNews);
        setProgress(0);
    };

    const currentArticle = newsList[currentIndex % totalNews] || DEFAULT_NEWS[0];

    const handleOpenArticle = () => {
        if (currentArticle.link.startsWith('http')) {
            window.open(currentArticle.link, '_blank', 'noopener,noreferrer');
        } else {
            navigate(currentArticle.link);
        }
    };

    // Fallback to topic image if the article original image fails
    const displayImageUrl = useMemo(() => {
        if (currentArticle.imageUrl && !imageFailed) {
            return currentArticle.imageUrl;
        }
        return resolveNewsImage(currentArticle.title, currentArticle.tag);
    }, [currentArticle.imageUrl, currentArticle.title, currentArticle.tag, imageFailed]);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs transition-colors flex flex-col justify-between">
            {/* Top 20-Second Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/40 overflow-hidden z-20">
                <div
                    className="h-full bg-primary transition-all ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header: Title, Live dot & Minimalist Arrow Controls */}
            <div className="px-4 sm:px-5 py-2.5 bg-muted/20 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <h3 className="text-[0.875rem] font-bold text-foreground tracking-tight select-none">
                        Noticias del Mercado
                    </h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        En Vivo
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Minimalist Navigation Arrows in loop */}
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                            aria-label="Noticia anterior"
                            title="Anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                            aria-label="Siguiente noticia"
                            title="Siguiente"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/news')}
                        className="text-[0.6875rem] font-bold text-primary hover:underline inline-flex items-center gap-0.5 ml-1"
                    >
                        <span>Ver todas</span>
                        <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Main Article Body with Much Larger Image and Editorial Layout */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                {/* Source, Tag & Date bar */}
                <div className="flex items-center justify-between text-[0.6875rem] text-muted-foreground border-b border-border/40 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-primary tracking-wider text-[0.6875rem] uppercase">
                            POR {currentArticle.source.toUpperCase()}
                        </span>
                        {currentArticle.tag && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65625rem] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {currentArticle.tag}
                            </span>
                        )}
                    </div>
                    <span className="font-mono text-[0.65625rem] opacity-80">{currentArticle.date}</span>
                </div>

                {/* Content Row: Text on Left + MUCH LARGER REAL ARTICLE PHOTO on Right */}
                <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-5">
                    {/* Text Block */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2 order-2 sm:order-1">
                        <div className="space-y-2">
                            <h3
                                onClick={handleOpenArticle}
                                className="text-[0.96875rem] sm:text-[1.0625rem] md:text-[1.125rem] font-extrabold text-foreground leading-snug cursor-pointer hover:text-primary transition-colors tracking-tight line-clamp-3"
                            >
                                {cleanHtmlText(currentArticle.title)}
                            </h3>

                            <p className="text-[0.78125rem] sm:text-[0.8125rem] text-muted-foreground leading-relaxed line-clamp-3">
                                {cleanHtmlText(currentArticle.summary)}
                            </p>
                        </div>

                        {/* Action link */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleOpenArticle}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group cursor-pointer"
                            >
                                <span>Leer noticia completa</span>
                                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Much Larger Real Article Photo */}
                    <div
                        onClick={handleOpenArticle}
                        className="w-full sm:w-56 md:w-64 lg:w-72 h-44 sm:h-auto min-h-[160px] max-h-[210px] rounded-xl overflow-hidden shrink-0 border border-border/70 bg-slate-900 cursor-pointer group/thumb shadow-sm relative order-1 sm:order-2"
                    >
                        <img
                            key={displayImageUrl}
                            src={displayImageUrl}
                            alt={currentArticle.title}
                            referrerPolicy="no-referrer"
                            onError={() => setImageFailed(true)}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[0.625rem] font-bold bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-xs">
                            {currentArticle.source}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
