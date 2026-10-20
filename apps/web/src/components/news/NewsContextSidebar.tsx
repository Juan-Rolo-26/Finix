import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Globe2, Newspaper, Activity } from 'lucide-react';
import { UiText } from '@/i18n/UiText';
import { formatRelativeTime, type NewsSlotData } from './NewsCard';

export function NewsContextSidebar({ slots, loading, categoryName, onClickTracking }: { slots: NewsSlotData[]; loading: boolean; categoryName?: string; onClickTracking: (id: string) => void }) {
    const sources = new Map<string, number>();
    for (const slot of slots) {
        const source = slot.article?.sourceName || 'Finix';
        sources.set(source, (sources.get(source) || 0) + 1);
    }
    const latest = [...slots].sort((a, b) => {
        const time = (value?: string) => { const date = Date.parse(value || ''); return Number.isFinite(date) ? date : 0; };
        return time(b.article?.publishedAt) - time(a.article?.publishedAt);
    }).slice(0, 3);
    return <aside className="news-context" aria-label="Contexto de noticias" aria-busy={loading}>
        <section className="news-context-panel">
            <h3><Globe2 size={17} /><UiText text="En esta edición" /></h3>
            {loading ? <p className="news-context-muted"><UiText text="Actualizando la edición…" /></p> : <>
                <p className="news-context-category">{categoryName || 'Noticias de mercado'}</p>
                <div className="news-context-counts"><div><strong>{slots.length}</strong><span><UiText text="noticias disponibles" /></span></div><div><strong>{sources.size}</strong><span><UiText text="fuentes" /></span></div></div>
                <ul className="news-context-sources">{[...sources].sort((a,b) => b[1]-a[1]).slice(0,3).map(([source,count]) => <li key={source}><span>{source}</span><b>{count}</b></li>)}</ul>
                {!slots.length && <p className="news-context-muted"><UiText text="Las fuentes aparecerán al publicarse noticias en esta categoría." /></p>}
            </>}
        </section>
        <section className="news-context-panel">
            <h3><Newspaper size={17} /><UiText text="Últimos titulares" /></h3>
            {loading ? <div className="news-context-loading animate-pulse" /> : latest.length ? <ol className="news-context-headlines">{latest.map(slot => <li key={slot.id}><a href={slot.article!.url} target="_blank" rel="noopener noreferrer" onClick={() => onClickTracking(slot.id)}><span>{slot.article!.title}</span><small>{slot.article!.sourceName || 'Finix'}{slot.article!.publishedAt && ` · ${formatRelativeTime(slot.article!.publishedAt)}`}</small></a></li>)}</ol> : <p className="news-context-muted"><UiText text="Todavía no hay titulares en esta categoría." /></p>}
        </section>
        <section className="news-context-panel news-context-tools">
            <h3><Activity size={17} /><UiText text="Seguí el contexto" /></h3>
            <Link to="/market"><Activity size={17} /><span><b><UiText text="Mercados" /></b><small><UiText text="Cotizaciones y variaciones del día" /></small></span><ArrowUpRight size={16} /></Link>
            <Link to="/calendario"><CalendarDays size={17} /><span><b><UiText text="Calendario de mercado" /></b><small><UiText text="Balances, dividendos y datos económicos" /></small></span><ArrowUpRight size={16} /></Link>
        </section>
    </aside>;
}
