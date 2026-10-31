import { useNavigate } from 'react-router-dom';
import { ChevronRight, LineChart } from 'lucide-react';
import {
    MOVING_AVERAGE_SIGNALS,
    MACD_SIGNALS,
    GLOBAL_EARNINGS,
} from './rava-market-data';
import { formatNumberAr } from './MarketTableCard';

export function TechnicalSignalsCard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            {/* 1. Medias 21/42 */}
            <div className="bg-card text-card-foreground rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-primary" />
                        <h3 className="text-[0.875rem] font-bold text-primary tracking-tight select-none">
                            Medias 21/42: Últimos cortes (Global)
                        </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider">
                                    ESPECIE
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-center">
                                    FECHA
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-center">
                                    TIPO
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-right">
                                    PRECIO
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOVING_AVERAGE_SIGNALS.map((sig) => (
                                <tr
                                    key={sig.symbol + sig.date}
                                    onClick={() => navigate(`/market?symbol=${encodeURIComponent(sig.symbol.replace('_US', ''))}`)}
                                    className="group odd:bg-transparent even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors border-none"
                                >
                                    <td className="px-3 py-1.5 text-[0.75rem] font-bold text-foreground group-hover:text-primary transition-colors">
                                        {sig.symbol}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-muted-foreground text-center">
                                        {sig.date}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] text-center">
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded text-[0.6875rem] font-bold ${
                                                sig.type === 'Compra'
                                                    ? 'bg-[#15803d]/10 text-[#15803d] dark:text-[#22c55e] border border-[#15803d]/20'
                                                    : 'bg-[#b91c1c]/10 text-[#b91c1c] dark:text-[#ef4444] border border-[#b91c1c]/20'
                                            }`}
                                        >
                                            {sig.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right font-semibold">
                                        {formatNumberAr(sig.price, 1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. MACD: Últimos cortes */}
            <div className="bg-card text-card-foreground rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-primary" />
                        <h3 className="text-[0.875rem] font-bold text-primary tracking-tight select-none">
                            MACD: Últimos cortes (Global)
                        </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider">
                                    ESPECIE
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-center">
                                    FECHA
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-center">
                                    TIPO
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-right">
                                    PRECIO
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {MACD_SIGNALS.map((sig) => (
                                <tr
                                    key={sig.symbol + sig.date}
                                    onClick={() => navigate(`/market?symbol=${encodeURIComponent(sig.symbol.replace('_US', ''))}`)}
                                    className="group odd:bg-transparent even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors border-none"
                                >
                                    <td className="px-3 py-1.5 text-[0.75rem] font-bold text-foreground group-hover:text-primary transition-colors">
                                        {sig.symbol}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-muted-foreground text-center">
                                        {sig.date}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] text-center">
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded text-[0.6875rem] font-bold ${
                                                sig.type === 'Compra'
                                                    ? 'bg-[#15803d]/10 text-[#15803d] dark:text-[#22c55e] border border-[#15803d]/20'
                                                    : 'bg-[#b91c1c]/10 text-[#b91c1c] dark:text-[#ef4444] border border-[#b91c1c]/20'
                                            }`}
                                        >
                                            {sig.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right font-semibold">
                                        {formatNumberAr(sig.price, 1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Mercado Global: Últimos balances */}
            <div className="bg-card text-card-foreground rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <LineChart className="w-4 h-4 text-primary" />
                        <h3 className="text-[0.875rem] font-bold text-primary tracking-tight select-none">
                            Mercado Global: Últimos balances
                        </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider">
                                    ESPECIE
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-center">
                                    FECHA
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-right">
                                    AÑO ANT.
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-right">
                                    ESTIMADO
                                </th>
                                <th className="px-3 py-1.5 text-[0.6875rem] font-bold text-[#666666] dark:text-[#888888] uppercase tracking-wider text-right">
                                    REAL
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {GLOBAL_EARNINGS.map((earn) => (
                                <tr
                                    key={earn.symbol + earn.date}
                                    onClick={() => navigate(`/market?symbol=${encodeURIComponent(earn.symbol.replace('_US', ''))}`)}
                                    className="group odd:bg-transparent even:bg-[#f6f7f9] dark:even:bg-white/[0.03] hover:bg-[#eaf1f7] dark:hover:bg-white/[0.07] cursor-pointer transition-colors border-none"
                                >
                                    <td className="px-3 py-1.5 text-[0.75rem] font-bold text-foreground group-hover:text-primary transition-colors">
                                        {earn.symbol}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-muted-foreground text-center">
                                        {earn.date}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right text-muted-foreground">
                                        {earn.previousYear}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right text-muted-foreground">
                                        {earn.estimated}
                                    </td>
                                    <td className="px-3 py-1.5 text-[0.75rem] font-mono tabular-nums text-right font-bold text-[#15803d] dark:text-[#22c55e]">
                                        {earn.actual}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
