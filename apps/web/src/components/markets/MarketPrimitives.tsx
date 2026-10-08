import type { ReactNode } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Minus,
    type LucideIcon,
} from 'lucide-react';
import { SymbolLogo } from '@/components/SymbolLogo';
import './premarket.css';
import './market.css';

export function MarketHeader({
    title,
    eyebrow,
    icon: Icon,
    description,
    actions,
    centered = true,
}: {
    title: string;
    eyebrow: string;
    icon: LucideIcon;
    description?: ReactNode;
    actions?: ReactNode;
    centered?: boolean;
}) {
    return (
        <header className={`market-header ${centered ? 'market-header--centered' : ''} flex flex-col items-center text-center gap-4 pb-4 mb-5 border-b border-border/40 w-full`}>
            <div className="market-header__text flex flex-col items-center text-center min-w-0">
                <div className="market-eyebrow flex items-center justify-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                    <Icon size={14} aria-hidden="true" className="text-primary" />
                    <span>{eyebrow}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground text-center">{title}</h1>
                {description && (
                    <div className="market-header__description text-sm text-muted-foreground mt-1 text-center flex justify-center">{description}</div>
                )}
            </div>
            {actions && <div className="market-header__actions flex items-center justify-center gap-2 flex-wrap shrink-0 w-full">{actions}</div>}
        </header>
    );
}

export function MarketSectionTitle({
    title,
    icon: Icon,
    count,
}: {
    title: string;
    icon: LucideIcon;
    count?: string | number;
}) {
    return (
        <div className="market-section-title">
            <span className="market-section-title__icon">
                <Icon size={18} aria-hidden="true" />
            </span>
            <h2>{title}</h2>
            {count !== undefined && <span>{typeof count === 'number' ? `${count} ${count === 1 ? 'activo' : 'activos'}` : count}</span>}
        </div>
    );
}

const changeFormatter = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: 'exceptZero',
});

export function MarketChange({
    value,
    suffix = '%',
}: {
    value: number | null | undefined;
    suffix?: string;
}) {
    const valid = value != null && Number.isFinite(value);
    const tone =
        !valid || value === 0 ? 'neutral' : value > 0 ? 'positive' : 'negative';
    const Icon =
        tone === 'positive'
            ? ArrowUpRight
            : tone === 'negative'
              ? ArrowDownRight
              : Minus;
    return (
        <span className={`market-change market-change--${tone}`}>
            <Icon size={15} aria-hidden="true" />
            {valid ? `${changeFormatter.format(value)}${suffix}` : 'Sin datos'}
        </span>
    );
}

export function MarketQuoteCard({
    symbol,
    label,
    value,
    change,
    quoteLabel = 'Cotización',
    unit,
    footer,
    footerRight,
    children,
    onSelect,
    action,
}: {
    symbol: string;
    label: string;
    value: string;
    change?: number | null;
    quoteLabel?: string;
    unit?: string;
    footer?: ReactNode;
    footerRight?: ReactNode;
    children?: ReactNode;
    onSelect?: () => void;
    action?: ReactNode;
}) {
    const ticker = symbol.split(':').pop() || symbol;
    return (
        <article className="market-quote-card">
            {onSelect && (
                <button
                    type="button"
                    className="market-quote-card__link"
                    onClick={onSelect}
                    aria-label={`Ver ${label} (${ticker})`}
                />
            )}
            <div className="market-quote-card__identity">
                <SymbolLogo symbol={symbol} size={48} />
                <div className="market-quote-card__name">
                    <span className="market-quote-card__symbol">{ticker}</span>
                    <span className="market-quote-card__label" title={label}>
                        {label}
                    </span>
                </div>
                {action ? (
                    <div className="market-quote-card__action">{action}</div>
                ) : (
                    onSelect && (
                        <ArrowUpRight
                            className="market-quote-card__open"
                            size={18}
                            aria-hidden="true"
                        />
                    )
                )}
            </div>
            <div className="market-quote-card__quote">
                <span className="market-quote-card__quote-label">
                    {quoteLabel}
                    {unit && <span>{unit}</span>}
                </span>
                <div className="market-quote-card__numbers">
                    <span className="market-quote-card__price">{value}</span>
                    {change !== undefined && <MarketChange value={change} />}
                </div>
            </div>
            {children}
            {(footer || footerRight) && (
                <div className="market-quote-card__footer">
                    <span>{footer}</span>
                    <span>{footerRight}</span>
                </div>
            )}
        </article>
    );
}
