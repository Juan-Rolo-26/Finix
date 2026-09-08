import { useState } from 'react';
import { getLogoUrls, resolveAssetInfo } from '@/lib/tradingview';

interface SymbolLogoProps {
    symbol: string;
    size?: number;
    className?: string;
}

export function SymbolLogo({ symbol, size = 32, className }: SymbolLogoProps) {
    const { ticker } = resolveAssetInfo(symbol);
    const urls = getLogoUrls(symbol);
    const [idx, setIdx] = useState(0);
    const [failed, setFailed] = useState(false);

    const radius = Math.round(size * 0.28);
    const letter = ticker.replace(/USD(T)?$/, '').slice(0, 1).toUpperCase();

    const handleError = () => {
        if (idx + 1 < urls.length) {
            setIdx(i => i + 1);
        } else {
            setFailed(true);
        }
    };

    if (failed || urls.length === 0) {
        return (
            <div
                className={`flex items-center justify-center font-black flex-shrink-0 ${className ?? ''}`}
                style={{
                    width: size,
                    height: size,
                    fontSize: size * 0.38,
                    borderRadius: radius,
                    background: 'hsl(var(--primary) / 0.15)',
                    color: 'hsl(var(--primary))',
                }}
            >
                {letter}
            </div>
        );
    }

    return (
        <img
            key={`${symbol}-${idx}`}
            src={urls[idx]}
            alt={ticker}
            onError={handleError}
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                objectFit: 'contain',
                flexShrink: 0,
                background: 'hsl(var(--card))',
            }}
        />
    );
}

// Keep default export for backwards compat
export default SymbolLogo;
