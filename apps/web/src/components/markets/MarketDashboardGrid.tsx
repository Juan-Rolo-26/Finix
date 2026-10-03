import { Children, type CSSProperties, type HTMLAttributes } from 'react';
import './dashboard-grid.css';

export function MarketDashboardGrid({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
    const items = Children.toArray(children);
    const columns: Record<string, number> = {};
    for (let capacity = 1; capacity <= 6; capacity++) {
        const rows = Math.ceil(items.length / capacity);
        columns[`--dashboard-columns-${capacity}`] = rows ? Math.ceil(items.length / rows) : 1;
    }

    return (
        <div {...props} className="market-dashboard-grid" style={{ ...columns, ...style } as CSSProperties}>
            {items}
        </div>
    );
}
