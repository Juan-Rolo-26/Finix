import { Clock, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { normalizeNewsImage } from '@/lib/newsImage';
import { formatRelativeTime, type NewsSlotData } from './NewsCard';

export function DesktopNewsCard({ slot, variant, categoryName, onClickTracking }: {
    slot: NewsSlotData;
    variant: 'desktop' | 'timeline';
    categoryName?: string;
    onClickTracking: (slotId: string) => void;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const article = slot.article;
    if (!slot.isActive || !article) return null;
    const time = formatRelativeTime(article.publishedAt);
    return (
        <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={() => onClickTracking(slot.id)} className={`desktop-news-card desktop-news-card--${variant}`}>
            <div className="desktop-news-card__cover">
                {variant === 'desktop' && !imageFailed && normalizeNewsImage(article.imageUrl) && <img src={normalizeNewsImage(article.imageUrl)!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />}
                <span className="desktop-news-card__source">{article.sourceName || 'Finix'}</span>
                <h2>{article.title}</h2>
                {categoryName && <span className="desktop-news-card__category">{categoryName}</span>}
            </div>
            <div className="desktop-news-card__body">
                {article.description && <p>{article.description}</p>}
                {variant === 'timeline' && <span className="desktop-news-card__read">Leer noticia<ExternalLink size={14} /></span>}
            </div>
            <div className="desktop-news-card__footer">{time && <span><Clock size={13} /><time dateTime={article.publishedAt}>{time}</time></span>}{variant === 'desktop' && <ExternalLink size={13} aria-label="Abrir noticia" />}</div>
        </a>
    );
}
