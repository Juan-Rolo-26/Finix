import { Clock, ExternalLink } from 'lucide-react';

export interface NewsArticle {
    id: string;
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
    sourceName?: string;
    publishedAt?: string;
    author?: string;
    status?: string;
    isPublished?: boolean;
    isActive?: boolean;
}

export interface NewsSlotData {
    id: string;
    slotKey: string;
    position: number;
    isActive: boolean;
    article: NewsArticle | null;
}

type Variant = 'hero' | 'featured' | 'standard' | 'banner';

interface NewsCardProps {
    slot: NewsSlotData;
    variant?: Variant;
    categoryColor?: string;
    categoryName?: string;
    onClickTracking?: (slotId: string) => void;
}

function formatRelativeTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Hace instantes';
    if (diff < 60) return `Hace ${diff}m`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `Hace ${h}h`;
    if (h < 48) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FINIX_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%231a1a2e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23334155">Finix</text></svg>';

export function NewsCard({ slot, variant = 'standard', categoryColor, categoryName, onClickTracking }: NewsCardProps) {
    const article = slot.article;

    const handleClick = () => {
        if (onClickTracking) onClickTracking(slot.id);
    };

    // Empty / inactive slot
    if (!slot.isActive || !article) {
        return null;
    }

    const imgSrc = article.imageUrl || FINIX_PLACEHOLDER;
    const time = formatRelativeTime(article.publishedAt);

    if (variant === 'hero') {
        return (
            <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="group relative flex flex-col w-full rounded-3xl overflow-hidden border min-h-[420px] lg:min-h-[500px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/25"
                style={{ borderColor: 'hsl(var(--border) / 0.4)', background: '#0a0d14' }}
            >
                <div className="absolute inset-0">
                    <img
                        src={imgSrc}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                    />
                    {/* Multi-stop deep dark overlay to guarantee 100% contrast for white text */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.2) 100%)',
                        }}
                    />
                </div>

                <div className="relative flex flex-col flex-1 justify-end p-6 sm:p-8 lg:p-10 z-10 pt-44 keep-white">
                    <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                        {categoryName && (
                            <span
                                className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm"
                                style={{
                                    backgroundColor: categoryColor || 'hsl(var(--primary))',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                }}
                            >
                                {categoryName}
                            </span>
                        )}
                        {article.sourceName && (
                            <span
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md"
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                            >
                                {article.sourceName}
                            </span>
                        )}
                        {time && (
                            <span
                                className="flex items-center gap-1.5 text-xs font-medium"
                                style={{ color: 'rgba(255,255,255,0.85)' }}
                            >
                                <Clock className="w-3.5 h-3.5" /> {time}
                            </span>
                        )}
                    </div>
                    <h2
                        className="text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.15] mb-3 text-balance tracking-tight"
                        style={{ color: '#ffffff', textShadow: '0 2px 14px rgba(0,0,0,0.8)' }}
                    >
                        {article.title}
                    </h2>
                    {article.description && (
                        <p
                            className="text-sm sm:text-base leading-relaxed line-clamp-2 max-w-3xl font-medium"
                            style={{ color: 'rgba(255, 255, 255, 0.92)', textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
                        >
                            {article.description}
                        </p>
                    )}
                    <div
                        className="flex items-center gap-1.5 mt-4 text-xs font-semibold opacity-90 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#ffffff' }}
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Leer nota completa
                    </div>
                </div>
            </a>
        );
    }

    if (variant === 'featured') {
        return (
            <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="group flex flex-col w-full h-full rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 hover:shadow-primary/5"
                style={{ borderColor: 'hsl(var(--border) / 0.5)', background: 'hsl(var(--card))' }}
            >
                <div className="relative overflow-hidden h-52 sm:h-60 shrink-0">
                    <img
                        src={imgSrc}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {categoryName && (
                        <div className="absolute top-3.5 left-3.5">
                            <span
                                className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm"
                                style={{
                                    backgroundColor: categoryColor || 'hsl(var(--primary))',
                                    color: '#ffffff',
                                }}
                            >
                                {categoryName}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col flex-1 p-5 sm:p-6 justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {article.sourceName || 'Finix'}
                            </span>
                            {time && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" /> {time}
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold leading-snug text-foreground group-hover:text-primary transition-colors text-balance line-clamp-3">
                            {article.title}
                        </h3>
                        {article.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2.5 line-clamp-3 leading-relaxed">
                                {article.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary group-hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" /> Leer nota
                    </div>
                </div>
            </a>
        );
    }

    if (variant === 'banner') {
        return (
            <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="group relative flex flex-col md:flex-row rounded-3xl overflow-hidden border min-h-[140px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/40"
                style={{ borderColor: 'hsl(var(--border) / 0.5)', background: 'hsl(var(--card))' }}
            >
                {/* Image strip */}
                <div className="relative w-full md:w-64 lg:w-80 h-44 md:h-auto shrink-0 overflow-hidden">
                    <img
                        src={imgSrc}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                    />
                    <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[hsl(var(--card))]" />
                    <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] via-transparent to-transparent" />
                    {categoryName && (
                        <div className="absolute top-3 left-3">
                            <span
                                className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm"
                                style={{
                                    backgroundColor: categoryColor || 'hsl(var(--primary))',
                                    color: '#ffffff',
                                }}
                            >
                                {categoryName}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center p-5 sm:p-6 flex-1">
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        {article.sourceName && (
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                {article.sourceName}
                            </span>
                        )}
                        {time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" /> {time}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors text-balance">
                        {article.title}
                    </h3>
                    {article.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {article.description}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary">
                        <ExternalLink className="w-3.5 h-3.5" /> Leer nota completa
                    </div>
                </div>
            </a>
        );
    }

    // Standard card
    return (
        <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="group flex flex-col h-full rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40 hover:shadow-primary/5"
            style={{ borderColor: 'hsl(var(--border) / 0.5)', background: 'hsl(var(--card))' }}
        >
            <div className="relative overflow-hidden h-48 sm:h-52 shrink-0">
                <img
                    src={imgSrc}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {categoryName && (
                    <div className="absolute top-3 left-3">
                        <span
                            className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm"
                            style={{
                                backgroundColor: categoryColor || 'hsl(var(--primary))',
                                color: '#ffffff',
                            }}
                        >
                            {categoryName}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1 p-5 justify-between">
                <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-muted-foreground">{article.sourceName || ''}</span>
                        {time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" /> {time}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors text-balance line-clamp-3">
                        {article.title}
                    </h3>
                    {article.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {article.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" /> Leer nota
                </div>
            </div>
        </a>
    );
}
