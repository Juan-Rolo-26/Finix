import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import type { CSSProperties, ReactNode } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import type { NewsSlotData } from './NewsCard';
import { DesktopNewsCard } from './DesktopNewsCard';
import { NewsContextSidebar } from './NewsContextSidebar';
import './news-context.css';

export function DesktopNewsHero({ children }: { children?: ReactNode }) {
    return (
        <div className="desktop-news-intro">
            <header className="desktop-news-hero">
                <div>
                    <h1>{""}<FinixUiText text={"NOTICIAS"} />{""}</h1>
                    <p>{""}<FinixUiText text={"Información financiera curada por nuestro equipo editorial"} />{""}</p>
                    {children && <div className="desktop-news-hero-categories">{children}</div>}
                </div>
            </header>
        </div>
    );
}

export function DesktopNews({ slots, categoryName, categoryColor, loading, refreshing, onRefresh, onClickTracking }: {
    slots: NewsSlotData[];
    categoryName?: string;
    categoryColor?: string;
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onClickTracking: (slotId: string) => void;
}) {
    const { ui: finixUi } = useFinixUiTranslation();

    const activeSlots = slots.filter(slot => slot.isActive && slot.article).sort((a, b) => a.position - b.position);
    const shared = { categoryName, onClickTracking };
    const color = /^#[0-9a-f]{6}$/i.test(categoryColor || '') ? categoryColor : 'hsl(var(--primary))';
    return (
        <div className="desktop-news-edition" style={{ '--news-category-color': color } as CSSProperties}>
            <div className="desktop-news-featured" aria-busy={loading}>
                {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="desktop-news-skeleton animate-pulse" />) : activeSlots.slice(0, 4).map(slot => <DesktopNewsCard key={slot.article!.id} slot={slot} variant="desktop" {...shared} />)}
            </div>
            <div className="desktop-news-section-heading">
                <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <h2>{""}<FinixUiText text={"Actualidad"} />{""}</h2>
                    <span>{categoryName} · {activeSlots.length} {" "}<FinixUiText text={"noticias"} />{""}</span>
                </div>
                <button
                    type="button"
                    className="desktop-news-refresh-inline"
                    disabled={refreshing}
                    onClick={onRefresh}
                    title={finixUi("Actualizar noticias")}
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{""}<FinixUiText text={"Actualizar noticias"} />{""}</span>
                </button>
            </div>
            <div className={`desktop-news-columns ${!loading && activeSlots.length <= 4 ? 'desktop-news-columns--brief' : ''}`}>
                <div className="desktop-news-timeline" aria-busy={loading}>
                    {loading ? <div className="desktop-news-skeleton animate-pulse" /> : activeSlots.slice(4).map(slot => <DesktopNewsCard key={slot.article!.id} slot={slot} variant="timeline" {...shared} />)}
                    {!loading && activeSlots.length === 0 && <p className="desktop-news-empty">{""}<FinixUiText text={"No hay noticias publicadas en esta categoría."} />{""}</p>}
                </div>
                <NewsContextSidebar slots={activeSlots} loading={loading} categoryName={categoryName} onClickTracking={onClickTracking} />
            </div>
        </div>
    );
}
