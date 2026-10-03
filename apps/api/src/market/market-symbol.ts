import { getCedearDefinition } from './cedear.data';

export function resolveMarketIdentity(raw: string, market?: string) {
    let symbol = (raw || '').trim().toUpperCase().replace(/^BYMA:/, 'BCBA:');
    if (!symbol.includes(':') && (symbol.endsWith('.BA') || market === 'BCBA' || market === 'BYMA')) {
        symbol = `BCBA:${symbol.replace(/\.BA$/, '')}`;
    }
    const separator = symbol.indexOf(':');
    const exchange = separator >= 0 ? symbol.slice(0, separator) : '';
    const ticker = separator >= 0 ? symbol.slice(separator + 1) : symbol;
    const local = exchange === 'BCBA';
    const crypto = ['BINANCE', 'CRYPTO', 'COINBASE', 'BITSTAMP'].includes(exchange)
        || (!exchange && (/(?:USDT|-USD)$/.test(ticker) || ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'LTC'].includes(ticker)));
    const cedear = local ? getCedearDefinition(ticker) : null;
    const assetType = crypto ? 'CRYPTO' : cedear ? 'CEDEAR' : ['TVC', 'INDEX', 'SP'].includes(exchange) ? 'INDEX'
        : ['OANDA', 'FX', 'FX_IDC', 'FOREXCOM'].includes(exchange) ? 'FOREX'
        : ['COMEX', 'NYMEX', 'CBOT', 'CME', 'CME_MINI'].includes(exchange) ? 'COMMODITY' : 'STOCK';
    const aliases: Record<string, string> = {
        'BCBA:IMV': '^MERV', 'TVC:SPX': '^GSPC', 'SP:SPX': '^GSPC', 'INDEX:SPX': '^GSPC',
        'TVC:DJI': '^DJI', 'TVC:NDX': '^NDX', 'TVC:VIX': '^VIX', 'TVC:DXY': 'DX-Y.NYB', 'TVC:US10Y': '^TNX',
        'NYMEX:CL1!': 'CL=F', 'NYMEX:NG1!': 'NG=F', 'COMEX:GC1!': 'GC=F', 'COMEX:SI1!': 'SI=F',
        'COMEX:HG1!': 'HG=F', 'CBOT:ZS1!': 'ZS=F', 'CBOT:ZW1!': 'ZW=F', 'CBOT:ZC1!': 'ZC=F',
        'CME_MINI:ES1!': 'ES=F', 'CME_MINI:NQ1!': 'NQ=F',
    };
    let binancePair: string | null = null;
    let yahooSymbol: string | null = aliases[symbol] || null;
    if (local) yahooSymbol ||= `${ticker}.BA`;
    else if (crypto) {
        binancePair = /(?:USDT|USDC|BTC|ETH)$/.test(ticker) && !['BTC', 'ETH'].includes(ticker) ? ticker : `${ticker.replace(/-?USD$/, '')}USDT`;
        // USD history is equivalent only to a USD-quoted input, never BTC/ETH/USDC pairs.
        yahooSymbol = /USDT$/.test(binancePair) ? `${binancePair.slice(0, -4)}-USD` : null;
    } else if (!exchange || ['NASDAQ', 'NYSE', 'AMEX', 'NYSEARCA'].includes(exchange)) yahooSymbol = ticker.replace(/\./g, '-');
    else if (['OANDA', 'FX', 'FX_IDC', 'FOREXCOM'].includes(exchange) && /^[A-Z]{6}$/.test(ticker) && !/^XA[UG]/.test(ticker)) yahooSymbol = `${ticker}=X`;
    // Unmapped series have no substitute: a related asset may trade at a different price.
    return { symbol, exchange, ticker, local, crypto, cedear, yahooSymbol, binancePair,
        market: exchange || (crypto ? 'CRYPTO' : 'US'), currency: local ? 'ARS' : crypto && binancePair && /(?:USDC|BTC|ETH)$/.test(binancePair) ? (binancePair.match(/(?:USDC|BTC|ETH)$/)?.[0] || 'USD') : 'USD', assetType };
}
