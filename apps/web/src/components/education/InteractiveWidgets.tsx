import { UiText as FinixUiText } from '@/i18n/UiText';
import { useState } from 'react';
import { Scale, Calculator, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import RealLessonChart from './RealLessonChart';

export function TrendWidget(){return <RealLessonChart kind="trend"/>;}
export function RsiWidget(){return <RealLessonChart kind="rsi"/>;}
export function MacdWidget(){return <RealLessonChart kind="macd"/>;}
export function CandlesWidget(){return <RealLessonChart kind="candles"/>;}

// ─── 4. ROIC vs WACC WIDGET ──────────────────────────────────────────────────
export function RoicWaccWidget() {
    const [roic, setRoic] = useState(22);
    const [wacc, setWacc] = useState(8.5);

    const spread = (roic - wacc).toFixed(1);
    const isCreating = roic > wacc;

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Scale className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">{""}<FinixUiText text={"Simulador de Creación de Valor: ROIC vs WACC"} />{""}</h4>
                        <p className="text-xs text-muted-foreground">{""}<FinixUiText text={"Medí si un negocio enriquece o destruye el patrimonio del inversor"} />{""}</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-xl font-black font-mono ${isCreating ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {" "}<FinixUiText text={"Spread:"} />{" "}{Number(spread) > 0 ? `+${spread}` : spread} {" "}<FinixUiText text={"pp"} />{" "}</div>
                    <div className={`text-[11px] font-bold ${isCreating ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isCreating ? 'CREA VALOR ECONÓMICO' : 'DESTRUYE VALOR'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3.5 rounded-xl bg-background/60 border border-border">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{""}<FinixUiText text={"ROIC (Retorno del Capital)"} />{""}</span>
                        <span className="text-emerald-500 font-bold">{roic}%</span>
                    </div>
                    <input
                        type="range"
                        min={2}
                        max={45}
                        step={1}
                        value={roic}
                        onChange={e => setRoic(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl bg-background/60 border border-border">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{""}<FinixUiText text={"WACC (Costo Medio de Capital)"} />{""}</span>
                        <span className="text-amber-500 font-bold">{wacc}%</span>
                    </div>
                    <input
                        type="range"
                        min={4}
                        max={18}
                        step={0.5}
                        value={wacc}
                        onChange={e => setWacc(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                {isCreating ? (
                    <p>
                        🟢 <strong>{""}<FinixUiText text={"Creación genuina de valor:"} />{""}</strong> {" "}<FinixUiText text={"Por cada US$ 100 invertidos en el negocio, la empresa obtiene un retorno de US$"} />{" "}{roic}{""}<FinixUiText text={", mientras que el costo de financiarse es de solo US$"} />{" "}{wacc}{""}<FinixUiText text={". El excedente de"} />{" "}<strong>{""}<FinixUiText text={"US$"} />{" "}{spread}</strong> {" "}<FinixUiText text={"va directo a capitalizar al accionista."} />{" "}</p>
                ) : (
                    <p>
                        🔴 <strong>{""}<FinixUiText text={"Destrucción de valor:"} />{""}</strong> {" "}<FinixUiText text={"Aunque la compañía registre ganancias contables en su balance, su rentabilidad ("} />{""}{roic}{""}<FinixUiText text={"%) es inferior a lo que cuesta conseguir el dinero ("} />{""}{wacc}{""}<FinixUiText text={"%). Cada reinversión empobrece al negocio."} />{" "}</p>
                )}
            </div>
        </div>
    );
}

// ─── 6. DCF VALUATION SIMULATOR WIDGET ───────────────────────────────────────
export function DcfValuationWidget() {
    const [initialFcf, setInitialFcf] = useState<number>(1000); // M USD
    const [growthRate5y, setGrowthRate5y] = useState<number>(12); // %
    const [terminalGrowth, setTerminalGrowth] = useState<number>(2.5); // %
    const [wacc, setWacc] = useState<number>(9.5); // %
    const [sharesOutstanding, setSharesOutstanding] = useState<number>(50); // M shares
    const [currentPrice, setCurrentPrice] = useState<number>(310); // USD

    const g = growthRate5y / 100;
    const r = wacc / 100;
    const gTerm = terminalGrowth / 100;

    const projectedCashFlows: { year: number; fcf: number; pv: number }[] = [];
    let currentFcfVal = initialFcf;
    let sumPv5Years = 0;

    for (let yr = 1; yr <= 5; yr++) {
        currentFcfVal = currentFcfVal * (1 + g);
        const discountFactor = Math.pow(1 + r, yr);
        const pv = currentFcfVal / discountFactor;
        sumPv5Years += pv;
        projectedCashFlows.push({
            year: yr,
            fcf: Math.round(currentFcfVal),
            pv: Math.round(pv),
        });
    }

    // Terminal Value at Year 5 using Gordon Growth Model
    const effectiveDiscount = Math.max(r - gTerm, 0.015);
    const terminalValue = (currentFcfVal * (1 + gTerm)) / effectiveDiscount;
    const pvTerminalValue = terminalValue / Math.pow(1 + r, 5);

    const totalEnterpriseValue = sumPv5Years + pvTerminalValue;
    const intrinsicValuePerShare = sharesOutstanding > 0 ? totalEnterpriseValue / sharesOutstanding : 0;
    const marginOfSafety = currentPrice > 0 ? ((intrinsicValuePerShare - currentPrice) / currentPrice) * 100 : 0;
    const isUndervalued = intrinsicValuePerShare >= currentPrice;

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">{""}<FinixUiText text={"Simulador Interactivo de Flujos Descontados (DCF)"} />{""}</h4>
                        <p className="text-xs text-muted-foreground">{""}<FinixUiText text={"Calculá el valor intrínseco (Fair Value) sensibilizando crecimiento y costo de capital (WACC)"} />{""}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {" "}<FinixUiText text={"Modelo 2-Etapas"} />{" "}</span>
                </div>
            </div>

            {/* SLIDERS & CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* FCF Base */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{""}<FinixUiText text={"FCF Año 0 (Base)"} />{""}</span>
                        <span className="text-primary font-bold">${initialFcf.toLocaleString()} {" "}<FinixUiText text={"M USD"} />{""}</span>
                    </div>
                    <input
                        type="range"
                        min="100"
                        max="5000"
                        step="50"
                        value={initialFcf}
                        onChange={e => setInitialFcf(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">{""}<FinixUiText text={"Caja libre actual generada por la compañía"} />{""}</p>
                </div>

                {/* Crecimiento 5 años */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{""}<FinixUiText text={"Crecimiento estimado (Años 1-5)"} />{""}</span>
                        <span className="text-primary font-bold">+{growthRate5y}{""}<FinixUiText text={"% anual"} />{""}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="35"
                        step="0.5"
                        value={growthRate5y}
                        onChange={e => setGrowthRate5y(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">{""}<FinixUiText text={"Tasa a la que crecerá el FCF en los próximos 5 años"} />{""}</p>
                </div>

                {/* WACC */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{""}<FinixUiText text={"Tasa Descuento (WACC)"} />{""}</span>
                        <span className="text-primary font-bold">{wacc.toFixed(1)}%</span>
                    </div>
                    <input
                        type="range"
                        min="6"
                        max="16"
                        step="0.25"
                        value={wacc}
                        onChange={e => setWacc(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">{""}<FinixUiText text={"Retorno mínimo exigido según riesgo del negocio"} />{""}</p>
                </div>

                {/* Crecimiento Terminal */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{""}<FinixUiText text={"Crecimiento Terminal (g)"} />{""}</span>
                        <span className="text-primary font-bold">{terminalGrowth.toFixed(1)}%</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="4.5"
                        step="0.1"
                        value={terminalGrowth}
                        onChange={e => setTerminalGrowth(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">{""}<FinixUiText text={"Tasa a perpetuidad (acorde al PIB mundial, 2% - 3%)"} />{""}</p>
                </div>

                {/* Acciones en circulación */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{""}<FinixUiText text={"Acciones en circulación"} />{""}</span>
                        <span className="text-primary font-bold">{sharesOutstanding} {" "}<FinixUiText text={"M"} />{""}</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="200"
                        step="5"
                        value={sharesOutstanding}
                        onChange={e => setSharesOutstanding(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">{""}<FinixUiText text={"Cantidad total de acciones emitidas (dilución)"} />{""}</p>
                </div>

                {/* Precio de mercado actual */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">{""}<FinixUiText text={"Precio de Mercado Actual"} />{""}</span>
                        <span className="text-primary font-bold">${currentPrice} {" "}<FinixUiText text={"USD"} />{""}</span>
                    </div>
                    <input
                        type="range"
                        min="20"
                        max="800"
                        step="5"
                        value={currentPrice}
                        onChange={e => setCurrentPrice(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">{""}<FinixUiText text={"Cotización actual en el mercado bursátil"} />{""}</p>
                </div>
            </div>

            {/* RESULTS DASHBOARD */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 flex flex-col md:flex-row items-stretch justify-between gap-6">
                <div className="space-y-2 md:w-1/2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {" "}<FinixUiText text={"Resultado de la Valuación"} />{" "}</div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-foreground">
                            ${intrinsicValuePerShare.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">{""}<FinixUiText text={"USD / acción (Fair Value)"} />{""}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <div className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                            isUndervalued ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                            {isUndervalued ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isUndervalued ? `Margen de Seguridad: +${marginOfSafety.toFixed(1)}% (Infravalorada)` : `Sobrevaloración: ${Math.abs(marginOfSafety).toFixed(1)}%`}
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                        {isUndervalued
                            ? `El valor intrínseco proyectado ($${intrinsicValuePerShare.toFixed(2)}) supera el precio de cotización ($${currentPrice}), ofreciendo un colchón protector frente a posibles desviaciones.`
                            : `La cotización actual de mercado ($${currentPrice}) incorpora supuestos más optimistas o una prima de precio frente a las proyecciones seleccionadas.`}
                    </p>
                </div>

                {/* BREAKDOWN BOX */}
                <div className="md:w-1/2 flex flex-col justify-between p-4 rounded-xl bg-card border border-border/70 space-y-3">
                    <div className="text-xs font-bold text-foreground">{""}<FinixUiText text={"Desglose del Enterprise Value Total:"} />{""}</div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                            <span>{""}<FinixUiText text={"Suma VP Flujos Años 1 al 5:"} />{""}</span>
                            <span className="font-bold text-foreground">${Math.round(sumPv5Years).toLocaleString()} {" "}<FinixUiText text={"M ("} />{""}{((sumPv5Years / totalEnterpriseValue) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>{""}<FinixUiText text={"VP Valor Terminal (a perpetuidad):"} />{""}</span>
                            <span className="font-bold text-foreground">${Math.round(pvTerminalValue).toLocaleString()} {" "}<FinixUiText text={"M ("} />{""}{((pvTerminalValue / totalEnterpriseValue) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-px bg-border/60 my-1" />
                        <div className="flex justify-between font-bold text-foreground">
                            <span>{""}<FinixUiText text={"Enterprise Value Total:"} />{""}</span>
                            <span className="text-primary">${Math.round(totalEnterpriseValue).toLocaleString()} {" "}<FinixUiText text={"M USD"} />{""}</span>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

// ─── CONTAINER: DISPATCHER DE WIDGETS INTERACTIVOS ───────────────────────────
export function EducationalWidgetContainer({ widgetKey, articleSlug }: { widgetKey?: string | null; articleSlug?: string }) {
    if (articleSlug === 'medias-moviles-sma-ema') return <RealLessonChart kind="moving_averages" />;
    if (!widgetKey) return null;

    switch (widgetKey) {
        case 'trend':
            return <TrendWidget />;
        case 'rsi':
            return <RsiWidget />;
        case 'macd':
            return <MacdWidget />;
        case 'roic_wacc':
            return <RoicWaccWidget />;
        case 'candles':
            return <CandlesWidget />;
        case 'support_resistance':
            return <RealLessonChart kind="support_resistance" />;
        case 'dcf_simulator':
        case 'dcf':
        case 'valuation':
            return <DcfValuationWidget />;
        default:
            return null;
    }
}
