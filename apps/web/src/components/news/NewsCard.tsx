import { Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

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

type Variant = 'hero' | 'standard' | 'banner';

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
        return (
            <div
                className={cn(
                    'rounded-3xl border border-dashed border-border/40 flex items-center justify-center',
                    variant === 'hero' && 'min-h-[380px] lg:min-h-[480px]',
                    variant === 'standard' && 'min-h-[260px]',
                    variant === 'banner' && 'min-h-[130px]',
                )}
                style={{ background: 'hsl(var(--secondary) / 0.2)' }}
            >
                <p className="text-sm text-muted-foreground/40 italic">Contenido próximamente</p>
            </div>
        );
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
                className="group relative flex flex-col rounded-3xl overflow-hidden border min-h-[380px] lg:min-h-[480px] transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20"
                style={{ borderColor: 'hsl(var(--border) / 0.3)', background: 'hsl(var(--card))' }}
            >
                <div className="absolute inset-0">
                    <img
                        src={imgSrc}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.6) 55%, transparent 100%)' }} />
                </div>

                <div className="relative flex flex-col flex-1 justify-end p-6 lg:p-8 text-white z-10 pt-40">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {categoryName && (
                            <span
                                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                                style={{ background: categoryColor ? `${categoryColor}30` : 'rgba(255,255,255,0.15)', color: '#fff', border: `1px solid ${categoryColor || 'rgba(255,255,255,0.2)'}` }}
                            >
                                {categoryName}
                            </span>
                        )}
                        {article.sourceName && (
                            <span className="text-[11px] font-semibold opacity-80 px-2 py-1 rounded-full bg-white/10">
                                {article.sourceName}
                            </span>
                        )}
                        {time && (
                            <span className="flex items-center gap-1 text-xs opacity-75">
                                <Clock className="w-3 h-3" /> {time}
                            </span>
                        )}
                    </div>
                    <h2
                        className="text-2xl md:text-3xl lg:text-4xl font-black leading-[1.1] mb-3 text-white text-balance drop-shadow-xl"
                        style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}
                    >
                        {article.title}
                    </h2>
                    {article.description && (
                        <p className="text-sm md:text-base leading-relaxed opacity-85 line-clamp-2 max-w-2xl font-medium text-white/90 drop-shadow-lg">
                            {article.description}
                        </p>
                    )}
                    <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/70">
                        <ExternalLink className="w-3 h-3" /> Leer nota completa
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
                className="group relative flex flex-row rounded-3xl overflow-hidden border min-h-[130px] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/30"
                style={{ borderColor: 'hsl(var(--border) / 0.4)', background: 'hsl(var(--card))' }}
            >
                {/* Image strip on left */}
                <div className="relative w-48 lg:w-64 shrink-0 overflow-hidden">
                    <img
                        src={imgSrc}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, hsl(var(--card)))' }} />
                </div>
                <div className="flex flex-col justify-center p-5 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {categoryName && (
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: categoryColor || 'hsl(var(--primary))' }}>
                                {categoryName}
                            </span>
                        )}
                        {article.sourceName && (
                            <span className="text-[10px] text-muted-foreground font-medium">{article.sourceName}</span>
                        )}
                        {time && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5" /> {time}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base lg:text-lg font-black leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                    </h3>
                    {article.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1 hidden md:block">{article.description}</p>
                    )}
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
            className="group flex flex-col rounded-3xl border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 hover:shadow-primary/5"
            style={{ borderColor: 'hsl(var(--border) / 0.4)', background: 'hsl(var(--card))' }}
        >
            <div className="relative overflow-hidden h-48 shrink-0">
                <img
                    src={imgSrc}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FINIX_PLACEHOLDER; }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--card)) 0%, transparent 50%)' }} />
                {categoryName && (
                    <div className="absolute top-3 left-3">
                        <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg backdrop-blur-md"
                            style={{ background: categoryColor ? `${categoryColor}25` : 'hsl(var(--card)/0.85)', color: categoryColor || 'hsl(var(--foreground))', border: `1px solid ${categoryColor || 'hsl(var(--border))'}40` }}
                        >
                            {categoryName}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{article.sourceName || ''}</span>
                    {time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" /> {time}
                        </span>
                    )}
                </div>
                <h3 className="text-[15px] font-bold leading-snug line-clamp-3 group-hover:text-primary transition-colors text-balance flex-1">
                    {article.title}
                </h3>
                {article.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{article.description}</p>
                )}
            </div>
        </a>
    );
}
