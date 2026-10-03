import type { ReactNode } from 'react';
import { LineChart } from 'lucide-react';
import { SymbolLogo } from '@/components/SymbolLogo';
import './technical-chart.css';

export function MarketChartHeader({ title, symbol, exchange, actions }: {
    title: string;
    symbol: string;
    exchange?: string;
    actions: ReactNode;
}) {
    const ticker = symbol.split(':').pop() || symbol;
    const market = exchange || (symbol.includes(':') ? symbol.split(':')[0] : '');

    return (
        <header className="market-chart-heading" aria-label="Activo del análisis técnico">
            <div className="market-chart-heading__content">
                <div className="market-chart-heading__eyebrow">
                    <LineChart size={14} aria-hidden="true" />
                    <span>Análisis técnico · Finix</span>
                </div>
                <div className="market-chart-heading__identity">
                    <SymbolLogo key={symbol} symbol={symbol} size={52} className="market-chart-heading__logo" />
                    <div className="market-chart-heading__text">
                        <h1>{title}</h1>
                        <div className="market-chart-heading__metadata">
                            <span className="market-chart-heading__ticker">{ticker}</span>
                            {market && <span className="market-chart-heading__exchange">{market}</span>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="market-chart-heading__actions">{actions}</div>
        </header>
    );
}
