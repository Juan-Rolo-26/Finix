import { useNavigate } from 'react-router-dom';
import type { HeatmapTile } from './rava-market-data';

export interface MarketTreemapProps {
    title: string;
    timestamp?: string;
    tiles: HeatmapTile[];
    height?: number | string;
    className?: string;
}

export function MarketTreemap({
    title,
    timestamp = '28/10 13:51',
    tiles,
    height = 200,
    className = '',
}: MarketTreemapProps) {
    const navigate = useNavigate();

    // Helper to get background color matching Rava's signature tiles
    const getTileBg = (changePct: number) => {
        if (changePct <= -2.0) return 'bg-[#8d2323] hover:bg-[#a12828] text-white';
        if (changePct < -0.3) return 'bg-[#982b2b] hover:bg-[#ac3232] text-white';
        if (changePct <= -0.01) return 'bg-[#802e2e] hover:bg-[#963737] text-white';
        if (changePct >= 2.0) return 'bg-[#187538] hover:bg-[#1d8c43] text-white';
        if (changePct > 0.3) return 'bg-[#1f8342] hover:bg-[#259b4e] text-white';
        if (changePct >= 0.01) return 'bg-[#217740] hover:bg-[#288f4e] text-white';
        return 'bg-[#2d3748] hover:bg-[#3a475d] text-white';
    };

    const handleTileClick = (symbol: string) => {
        navigate(`/market?symbol=${encodeURIComponent(symbol)}`);
    };

    // Calculate layout: split into main leader tile (left or large) and remainder tiles (right / grid)
    const sorted = [...tiles].sort((a, b) => b.weight - a.weight);
    const leader = sorted[0];
    const secondary = sorted.slice(1, 4);
    const tertiary = sorted.slice(4);

    return (
        <div className={`rounded-xl border border-border/80 bg-[#161a22] text-white overflow-hidden shadow-sm flex flex-col ${className}`}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1f2633] border-b border-white/10 text-[0.6875rem] font-bold text-gray-300">
                <span className="uppercase tracking-wide">{title}</span>
                <span className="font-mono text-gray-400 font-normal text-[0.625rem]">{timestamp}</span>
            </div>

            {/* Treemap Container */}
            <div
                className="w-full p-1 gap-1 flex flex-1 min-h-[140px] select-none"
                style={{ height: typeof height === 'number' ? `${height}px` : height }}
            >
                {/* Main large tile */}
                {leader && (
                    <div
                        onClick={() => handleTileClick(leader.symbol)}
                        className={`flex-[1.4] rounded flex flex-col items-center justify-center cursor-pointer transition-all p-2 text-center border border-black/20 ${getTileBg(
                            leader.changePct
                        )}`}
                    >
                        <span className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">
                            {leader.symbol}
                        </span>
                        <span className="text-xs md:text-sm font-semibold tracking-wide opacity-95">
                            {leader.changePct > 0 ? '+' : ''}{leader.changePct.toFixed(2)}%
                        </span>
                    </div>
                )}

                {/* Secondary column */}
                <div className="flex-1 flex flex-col gap-1">
                    {secondary.map((tile) => (
                        <div
                            key={tile.symbol}
                            onClick={() => handleTileClick(tile.symbol)}
                            className={`flex-1 rounded flex flex-col items-center justify-center cursor-pointer transition-all p-1 text-center border border-black/20 ${getTileBg(
                                tile.changePct
                            )}`}
                        >
                            <span className="text-xs md:text-sm font-bold tracking-tight">
                                {tile.symbol}
                            </span>
                            <span className="text-[0.625rem] md:text-[0.6875rem] font-medium opacity-90">
                                {tile.changePct > 0 ? '+' : ''}{tile.changePct.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Tertiary column / small tiles */}
                {tertiary.length > 0 && (
                    <div className="flex-1 grid grid-cols-2 gap-1">
                        {tertiary.slice(0, 6).map((tile) => (
                            <div
                                key={tile.symbol}
                                onClick={() => handleTileClick(tile.symbol)}
                                className={`rounded flex flex-col items-center justify-center cursor-pointer transition-all p-1 text-center border border-black/20 ${getTileBg(
                                    tile.changePct
                                )}`}
                            >
                                <span className="text-[0.625rem] font-bold truncate max-w-[60px]">
                                    {tile.symbol}
                                </span>
                                <span className="text-[0.5625rem] font-medium opacity-90">
                                    {tile.changePct > 0 ? '+' : ''}{tile.changePct.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
