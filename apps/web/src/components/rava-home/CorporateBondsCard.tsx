import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileSpreadsheet, Search } from 'lucide-react';
import { CORPORATE_BONDS } from './rava-market-data';
import { formatNumberAr, formatPct } from './MarketTableCard';

export function CorporateBondsCard() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('');

    const filtered = useMemo(() => {
        if (!filter.trim()) return CORPORATE_BONDS;
        const q = filter.toLowerCase().trim();
        return CORPORATE_BONDS.filter(
            (b) => b.symbol.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)
        );
    }, [filter]);

    return (
        <div className="bg-card text-card-foreground rounded-xl border border-border/80 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-[13px] font-bold text-foreground tracking-tight select-none">
                        Obligaciones Negociables (ONs)
                    </h3>
                </div>
                <button
                    onClick={() => navigate('/market')}
                    className="text-muted-foreground hover:text-emerald-500 transition-colors p-0.5 rounded flex items-center gap-0.5 text-[11px] font-bold"
                    aria-label="Ver todas las Obligaciones Negociables"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Quick search input */}
            <div className="px-3 py-1.5 border-b border-border/40 bg-muted/10 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filtrar por empresa o ticker (YPF, Pampa, Vista, Telecom...)"
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
            </div>

            <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-border/60 bg-[#ebebeb] dark:bg-[#222222]">
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none">
                                ESPECIE
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none">
                                NOMBRE
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none text-center">
                                VTO.
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none text-right">
                                ÚLTIMO
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none text-right">
                                PARIDAD
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none text-right">
                                TIR
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none text-right">
                                VOLUMEN
                            </th>
                            <th className="px-3 py-1.5 text-[11px] font-bold text-[#666666] dark:text-[#888888] tracking-wider uppercase select-none text-right">
                                % DÍA
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {filtered.map((bond) => (
                            <tr
                                key={bond.symbol}
                                onClick={() => navigate(`/market?symbol=${encodeURIComponent(bond.symbol)}`)}
                                className="group hover:bg-muted/40 cursor-pointer transition-colors"
                            >
                                <td className="px-3 py-1.5 text-[11.5px] font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                                    {bond.symbol}
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] text-muted-foreground truncate max-w-[120px]">
                                    {bond.name}
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] font-mono text-muted-foreground text-center">
                                    {bond.maturity}
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] font-mono text-right font-semibold text-foreground">
                                    {formatNumberAr(bond.last, 2)}
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] font-mono text-right text-muted-foreground">
                                    {formatNumberAr(bond.parity, 1)}
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">
                                    {bond.tir.toFixed(1).replace('.', ',')}%
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] font-mono text-right text-muted-foreground">
                                    {bond.volume.toLocaleString('es-AR')}
                                </td>
                                <td className="px-3 py-1.5 text-[11.5px] font-mono text-right">
                                    {formatPct(bond.dayChangePct)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
