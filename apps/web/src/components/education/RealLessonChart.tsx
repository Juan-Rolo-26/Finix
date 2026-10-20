import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, ExternalLink } from 'lucide-react';
const TradingViewChart = lazy(() => import('@/components/TradingViewChart'));

const LESSONS = {
    moving_averages: {title:'Medias móviles · gráfico real',studies:['MASimple@tv-basicstudies','MAExp@tv-basicstudies'],note:'Compará la media simple y la exponencial calculadas sobre los precios del activo. Podés revisar y ajustar sus períodos desde la configuración de los indicadores.'},
    trend: {title:'Estructura de tendencia · gráfico real',studies:[],note:'Compará máximos y mínimos del activo en distintas fechas. Identificá su estructura en las velas reales; el gráfico no fuerza una tendencia alcista, bajista o lateral.'},
    support_resistance: {title:'Soportes y resistencias · gráfico real',studies:[],note:'Buscá zonas donde el precio haya reaccionado varias veces. Compará los niveles con sus fechas y con el volumen del activo.'},
    rsi: {title:'RSI · gráfico real',studies:['RSI@tv-basicstudies'],note:'El RSI se calcula a partir de los precios del activo. Compará el oscilador con las velas y revisá sus períodos en la configuración del indicador.'},
    macd: {title:'MACD · gráfico real',studies:['MACD@tv-basicstudies'],note:'Observá la línea MACD, la señal y el histograma calculados sobre esta serie de precios. Los cruces dependen del activo y del período elegido.'},
    candles: {title:'Velas japonesas · gráfico real',studies:[],note:'Seleccioná una vela para consultar su apertura, máximo, mínimo y cierre. Compará cuerpos y mechas en su contexto histórico.'},
} satisfies Record<string,{title:string;studies:string[];note:string}>;
export type RealLessonChartKind = keyof typeof LESSONS;
const ASSETS = [['NASDAQ:AAPL','Apple · AAPL'],['NASDAQ:MSFT','Microsoft · MSFT'],['NASDAQ:NVDA','NVIDIA · NVDA'],['AMEX:SPY','S&P 500 · ETF SPY'],['NYSE:YPF','YPF · ADR'],['BINANCE:BTCUSDT','Bitcoin · BTC/USDT']];
class ChartBoundary extends Component<{children:ReactNode},{failed:boolean}> {
    state={failed:false};
    static getDerivedStateFromError(){return{failed:true};}
    render(){return this.state.failed?<p role="alert" className="rounded-xl border border-border p-6 text-sm text-muted-foreground">No se pudo abrir el gráfico. Consultá la fuente de TradingView e intentá nuevamente.</p>:this.props.children;}
}
export default function RealLessonChart({kind}:{kind:RealLessonChartKind}) {
    const lesson=LESSONS[kind];
    const [symbol,setSymbol]=useState('NASDAQ:AAPL');
    const [interval,setInterval]=useState('D');
    const [waiting,setWaiting]=useState(false);
    const timerRef=useRef<number>();
    const onReady=useCallback((widget:any|null)=>{if(widget){window.clearTimeout(timerRef.current);setWaiting(false);}},[]);
    useEffect(()=>{setWaiting(false);timerRef.current=window.setTimeout(()=>setWaiting(true),15000);return()=>window.clearTimeout(timerRef.current);},[symbol,interval,kind]);
    const source='https://www.tradingview.com/chart/?symbol='+encodeURIComponent(symbol);
    return <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4" aria-label={lesson.title}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Activity className="h-5 w-5"/></span><div><h4 className="font-bold text-foreground">{lesson.title}</h4><p className="text-xs text-muted-foreground">Precios e indicadores del activo · Fuente: TradingView</p></div></div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto"><label className="flex-1 text-xs text-muted-foreground sm:flex-none">Activo<select aria-label="Activo del gráfico de la clase" value={symbol} onChange={e=>setSymbol(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground">{ASSETS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs text-muted-foreground">Velas<select aria-label="Intervalo del gráfico de la clase" value={interval} onChange={e=>setInterval(e.target.value)} className="mt-1 block h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"><option value="60">1 hora</option><option value="D">1 día</option><option value="W">1 semana</option></select></label></div>
        </div>
        <ChartBoundary key={kind+symbol+interval}><Suspense fallback={<div role="status" className="h-[540px] animate-pulse rounded-xl bg-muted/40 p-5 text-sm text-muted-foreground">Cargando gráfico de mercado…</div>}><TradingViewChart symbol={symbol} interval={interval} studies={lesson.studies} height={540} allowSymbolChange={false} withDateRanges onWidgetReady={onReady}/></Suspense></ChartBoundary>
        {waiting&&<p role="status" className="text-xs text-muted-foreground">Si el proveedor no carga en tu navegador, podés abrir el gráfico en la fuente.</p>}
        <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">{lesson.note}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Activo: {symbol} · La fecha, la moneda y la demora se indican en el gráfico.</span><a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary">Abrir fuente <ExternalLink className="h-3.5 w-3.5"/></a></div>
    </section>;
}
