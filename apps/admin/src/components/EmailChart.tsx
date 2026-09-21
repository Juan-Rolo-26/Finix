import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, ColorType, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import { Camera, RefreshCw } from 'lucide-react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';

export async function uploadEmailImage(blob: Blob) {
    const body = new FormData();
    body.append('file', blob, 'chart.png');
    const response = await adminFetch('/admin/email-marketing/media', { method: 'POST', body });
    if (!response.ok) throw new Error(await readAdminErrorMessage(response, 'No se pudo guardar la imagen'));
    return (await response.json()).url as string;
}

export default function EmailChart({ onAttach }: { onAttach: (url: string) => void }) {
    const container = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi>();
    const [symbol, setSymbol] = useState('AAPL');
    const [range, setRange] = useState('6mo');
    const [request, setRequest] = useState({ symbol: 'AAPL', range: '6mo', version: 0 });
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [averages, setAverages] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!container.current) return;
        let cancelled = false;
        setReady(false); setError('');
        const instance = createChart(container.current, { autoSize: true, height: 320, layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#25342f', attributionLogo: true }, grid: { vertLines: { color: '#e9eeeb' }, horzLines: { color: '#e9eeeb' } }, timeScale: { borderColor: '#dce3df' } });
        chart.current = instance;
        const series = instance.addSeries(CandlestickSeries, { upColor: '#079669', downColor: '#e34f65', borderVisible: false, wickUpColor: '#079669', wickDownColor: '#e34f65' });
        const theme = () => {
            const dark = document.documentElement.classList.contains('dark');
            instance.applyOptions({ layout: { background: { type: ColorType.Solid, color: dark ? '#171c19' : '#ffffff' }, textColor: dark ? '#e6eee9' : '#25342f' }, grid: { vertLines: { color: dark ? '#2b342f' : '#e9eeeb' }, horzLines: { color: dark ? '#2b342f' : '#e9eeeb' } } });
        };
        theme();
        const observer = new MutationObserver(theme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        void (async () => {
            try {
                const response = await adminFetch('/market/candles?symbol=' + encodeURIComponent(request.symbol) + '&interval=1d&range=' + request.range);
                if (!response.ok) throw new Error('No se pudieron cargar las cotizaciones.');
                const data = await response.json();
                const candles = (data.candles || []).filter((c: Record<string, number>) => ['time', 'open', 'high', 'low', 'close'].every(k => Number.isFinite(c[k])));
                if (!candles.length) throw new Error('El proveedor no devolvio precios. Reintenta o cambia el activo.');
                if (cancelled) return;
                const unique = new Map<number, typeof candles[number]>(candles.map((c: { time: number }) => [c.time, c]));
                series.setData([...unique.values()].sort((a, b) => a.time - b.time).map(c => ({ ...c, time: c.time as UTCTimestamp })));
                const ordered = [...unique.values()].sort((a, b) => a.time - b.time);
                if (averages) {
                    for (const [period, color] of [[20, '#dc9823'], [50, '#668be8']] as const) {
                        const average = instance.addSeries(LineSeries, { color, lineWidth: 2, title: 'SMA ' + period, priceLineVisible: false, lastValueVisible: false });
                        average.setData(ordered.slice(period - 1).map((c, offset) => ({ time: c.time as UTCTimestamp, value: ordered.slice(offset, offset + period).reduce((sum, item) => sum + item.close, 0) / period })));
                    }
                }
                instance.timeScale().fitContent(); setReady(true);
            } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar el grafico'); }
        })();
        return () => { cancelled = true; observer.disconnect(); instance.remove(); chart.current = undefined; };
    }, [request, averages]);
    const capture = async () => {
        if (!chart.current || !ready) return;
        setBusy(true); setError('');
        try {
            const original = chart.current.takeScreenshot();
            const canvas = document.createElement('canvas');
            canvas.width = original.width; canvas.height = original.height + 54;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#152c22'; ctx.font = 'bold 16px Arial';
            ctx.fillText(request.symbol + ' · ' + request.range + ' · ' + new Date().toLocaleDateString(), 16, 32);
            ctx.drawImage(original, 0, 54);
            const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('No se pudo exportar')), 'image/png'));
            onAttach(await uploadEmailImage(blob));
        } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo adjuntar el grafico'); }
        finally { setBusy(false); }
    };
    return <section className="space-y-3 border-y border-border py-5">
        <h3 className="font-semibold">Grafico de velas · TradingView Lightweight Charts</h3>
        <div className="flex flex-wrap gap-2">
            <input aria-label="Ticker" className="min-w-0 rounded-md border border-border bg-background px-3 py-2 text-foreground" maxLength={24} value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9.:-]/g, ''))} />
            <select aria-label="Periodo" className="rounded-md border border-border bg-background p-2 text-foreground" value={range} onChange={e => setRange(e.target.value)}>{['1mo', '3mo', '6mo', '1y', '5y'].map(r => <option key={r}>{r}</option>)}</select>
            <button type="button" title="Cargar cotizaciones" aria-label="Cargar cotizaciones" disabled={!symbol} onClick={() => setRequest({ symbol, range, version: request.version + 1 })} className="rounded-md border border-border p-2"><RefreshCw size={18} /></button>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={averages} onChange={e => setAverages(e.target.checked)} />SMA 20 / SMA 50</label>
        <div ref={container} className="h-80 min-w-0 overflow-hidden" />
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="button" disabled={!ready || busy} onClick={() => void capture()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40"><Camera size={16} />{busy ? 'Guardando...' : 'Adjuntar grafico al email'}</button>
        <a className="block text-xs text-muted-foreground underline" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Charts by TradingView</a>
    </section>;
}
