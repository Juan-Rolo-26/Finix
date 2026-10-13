import { UiText as FinixUiText } from '@/i18n/UiText';
import { useId } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { financialNumber } from '@finix/shared';

export default function FinancialPriceHistory({ candles, currency }: { candles: any[]; currency?: string | null }) {
    const id = useId();
    const rows = candles.flatMap(candle => {
        const close = financialNumber(candle.close);
        const rawTime = candle.time ?? candle.timestamp ?? candle.date;
        const date = new Date(typeof rawTime === 'number' ? rawTime * (rawTime < 1e12 ? 1000 : 1) : rawTime);
        if (close === undefined || !Number.isFinite(date.getTime())) return [];
        return [{ date: date.toLocaleDateString('es-AR', { timeZone: 'UTC' }), close }];
    });
    if (rows.length < 2) return <p className="py-8 text-center text-sm text-muted-foreground">{""}<FinixUiText text={"No hay histórico con fechas verificables disponible."} />{""}</p>;
    const unit = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'moneda no informada';
    const format = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 2 });
    return <figure aria-labelledby={id} className="min-w-0 space-y-3">
        <figcaption id={id} className="text-sm text-muted-foreground">{""}<FinixUiText text={"Precio de cierre ·"} />{" "}{unit}. {rows[0].date} {" "}<FinixUiText text={"al"} />{" "}{rows[rows.length - 1].date}.</figcaption>
        <div role="img" aria-label={`Evolución del precio de cierre en ${unit}. Los valores están disponibles en la tabla.`} className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 12, left: 0 }}>
                    <XAxis dataKey="date" minTickGap={32} interval="preserveStartEnd" tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }} />
                    <YAxis width={64} domain={['auto', 'auto']} tickFormatter={format} tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip formatter={(value: number) => [`${format(value)} · ${unit}`, 'Cierre']} contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }} />
                    <Line dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <details className="text-sm">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:outline focus-visible:outline-primary">{""}<FinixUiText text={"Ver fechas y valores del gráfico"} />{""}</summary>
            <table className="w-full text-left"><caption className="text-left py-2">{""}<FinixUiText text={"Cierres ·"} />{" "}{unit}</caption><thead><tr><th scope="col">{""}<FinixUiText text={"Fecha"} />{""}</th><th scope="col">{""}<FinixUiText text={"Precio"} />{""}</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><th scope="row" className="font-normal py-2">{row.date}</th><td>{format(row.close)}</td></tr>)}</tbody></table>
        </details>
    </figure>;
}
