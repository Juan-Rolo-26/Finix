import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import type { MarketTickerRow } from './rava-market-data';

export interface ColumnDef {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    render?: (row: any) => React.ReactNode;
}

export interface MarketTableCardProps {
    title: string;
    icon?: React.ReactNode;
    viewAllHref?: string;
    data: any[];
    columns?: ColumnDef[];
    maxHeight?: string;
    className?: string;
    searchable?: boolean;
    onRowClick?: (row: any) => void;
}

export function formatNumberAr(val: number | string | null | undefined, decimals = 2): string {
    if (val === null || val === undefined || val === '') return '-';
    const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return val.toString();

    const parts = num.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimals > 0 ? `${integerPart},${parts[1]}` : integerPart;
}

export function formatPct(val: number | null | undefined): React.ReactNode {
    if (val === null || val === undefined) return <span className="text-muted-foreground">-</span>;
    if (val === 0) return <span className="text-muted-foreground font-mono tabular-nums text-[0.75rem]">0,0%</span>;

    const isPositive = val > 0;
    const formatted = Math.abs(val).toFixed(1).replace('.', ',');
    return (
        <span
            className={`font-mono tabular-nums text-[0.75rem] font-bold ${
                isPositive
                    ? 'text-[#15803d] dark:text-[#22c55e]'
                    : 'text-[#b91c1c] dark:text-[#ef4444]'
            }`}
        >
            {isPositive ? '+' : '-'}{formatted}%
        </span>
    );
}

export function MarketTableCard({
    title,
    icon,
    viewAllHref,
    data,
    columns,
    maxHeight,
    className = '',
    searchable = false,
    onRowClick,
}: MarketTableCardProps) {
    const navigate = useNavigate();
    const [filterQuery, setFilterQuery] = useState('');

    const filteredData = useMemo(() => {
        if (!filterQuery.trim()) return data;
        const q = filterQuery.toLowerCase().trim();
        return data.filter((item) => {
            const sym = (item.symbol || '').toLowerCase();
            const name = (item.name || '').toLowerCase();
            return sym.includes(q) || name.includes(q);
        });
    }, [data, filterQuery]);

    // Default columns matching financial portal tables
    const activeColumns: ColumnDef[] = useMemo(() => {
        if (columns && columns.length > 0) return columns;

        const hasMonth = data.some((d) => d.monthChangePct !== undefined);
        const hasYear = data.some((d) => d.yearChangePct !== undefined);

        const cols: ColumnDef[] = [
            {
                key: 'symbol',
                label: 'ESPECIE',
                align: 'left',
                render: (r: MarketTickerRow) => (
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-emerald-500 transition-colors tracking-tight text-[0.75rem]">
                            {r.symbol}
                        </span>
                        {r.name && (
                            <span className="text-[0.625rem] text-muted-foreground truncate max-w-[90px] font-normal">
                                {r.name}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'last',
                label: 'ÚLTIMO',
                align: 'right',
                render: (r: MarketTickerRow) => (
                    <span className="font-mono text-[0.75rem] text-foreground font-semibold">
                        {typeof r.last === 'number'
                            ? formatNumberAr(r.last, r.last >= 1000 ? (r.last % 1 === 0 ? 0 : 2) : 2)
                            : r.last}
                    </span>
                ),
            },
            {
                key: 'dayChangePct',
                label: '% DÍA',
                align: 'right',
                render: (r: MarketTickerRow) => formatPct(r.dayChangePct),
            },
        ];

        if (hasMonth) {
            cols.push({
                key: 'monthChangePct',
                label: '% MES',
                align: 'right',
                render: (r: MarketTickerRow) => formatPct(r.monthChangePct),
            });
        }

        if (hasYear) {
            cols.push({
                key: 'yearChangePct',
                label: '% AÑO',
                align: 'right',
                render: (r: MarketTickerRow) => formatPct(r.yearChangePct),
            });
        }

        return cols;
    }, [columns, data]);

    const handleRowClick = (row: any) => {
        if (onRowClick) {
            onRowClick(row);
            return;
        }
        if (row.symbol) {
            const sym = row.symbol.replace('_US', '');
            navigate(`/market?symbol=${encodeURIComponent(sym)}`);
        }
    };

    return (
        <div className={`bg-card text-card-foreground rounded-xl border border-border/80 shadow-xs overflow-hidden flex flex-col ${className}`}>
            {/* Header with Rava Blue typography */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-primary flex-shrink-0">{icon}</span>}
                    <h3 className="text-[0.875rem] font-bold text-primary tracking-tight select-none">
                        {title}
                    </h3>
                </div>
                {viewAllHref ? (
                    <button
                        onClick={() => navigate(viewAllHref)}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded focus:outline-none flex items-center gap-0.5 text-[0.6875rem] font-bold"
                        aria-label={`Ver todo ${title}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                )}
            </div>

            {/* Optional search input */}
            {searchable && data.length > 8 && (
                <div className="px-3 py-1.5 border-b border-border/40 bg-muted/10 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        placeholder={`Filtrar ${title.toLowerCase()}...`}
                        className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                    />
                </div>
            )}

            {/* Table Container with Rava Zebra and Header Styling */}
            <div
                className="overflow-x-auto overflow-y-auto scrollbar-thin"
                style={{ maxHeight: maxHeight || 'none' }}
            >
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                            {activeColumns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none ${
                                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                    }`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row, idx) => (
                            <tr
                                key={row.symbol || row.id || idx}
                                onClick={() => handleRowClick(row)}
                                className="group odd:bg-transparent even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors border-none"
                            >
                                {activeColumns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-3 py-1.5 text-[0.75rem] whitespace-nowrap tabular-nums ${
                                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                        }`}
                                    >
                                        {col.render ? col.render(row) : (row[col.key] ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
