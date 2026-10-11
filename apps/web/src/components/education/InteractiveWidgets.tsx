import { useState } from 'react';
import {
    TrendingUp,
    Layers,
    Activity,
    Scale,
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
} from 'lucide-react';

// ─── 1. TREND WIDGET (ESTRUCTURA DE TENDENCIA) ──────────────────────────────
export function TrendWidget() {
    const [mode, setMode] = useState<'UP' | 'DOWN' | 'SIDEWAYS'>('UP');

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Simulador de Estructura de Tendencia</h4>
                        <p className="text-xs text-muted-foreground">Acción del precio y sucesión de máximos y mínimos</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setMode('UP')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            mode === 'UP' ? 'bg-emerald-500 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Alcista (Uptrend)
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('DOWN')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            mode === 'DOWN' ? 'bg-rose-500 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Bajista (Downtrend)
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('SIDEWAYS')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            mode === 'SIDEWAYS' ? 'bg-secondary text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Lateral (Rango)
                    </button>
                </div>
            </div>

            {/* Visual SVG Chart */}
            <div className="relative w-full h-52 sm:h-64 rounded-xl bg-background/50 border border-border/50 p-4 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="currentColor" strokeDasharray="3 3" className="text-border/40" />
                    <line x1="0" y1="110" x2="600" y2="110" stroke="currentColor" strokeDasharray="3 3" className="text-border/40" />
                    <line x1="0" y1="170" x2="600" y2="170" stroke="currentColor" strokeDasharray="3 3" className="text-border/40" />

                    {mode === 'UP' && (
                        <>
                            {/* Trend Line Guide */}
                            <line x1="50" y1="190" x2="550" y2="50" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                            {/* Price Wave */}
                            <path
                                d="M 40 180 Q 90 90, 130 110 T 220 70 T 320 90 T 420 40 T 520 60 L 560 25"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            {/* Key points with badges */}
                            <circle cx="130" cy="110" r="5" fill="#10b981" />
                            <text x="130" y="95" textAnchor="middle" fill="currentColor" className="text-[11px] font-black fill-primary">HH1</text>

                            <circle cx="220" cy="140" r="5" fill="#10b981" />
                            <text x="220" y="160" textAnchor="middle" fill="currentColor" className="text-[11px] font-black fill-primary">HL1</text>

                            <circle cx="320" cy="65" r="5" fill="#10b981" />
                            <text x="320" y="50" textAnchor="middle" fill="currentColor" className="text-[11px] font-black fill-primary">HH2</text>

                            <circle cx="420" cy="105" r="5" fill="#10b981" />
                            <text x="420" y="125" textAnchor="middle" fill="currentColor" className="text-[11px] font-black fill-primary">HL2</text>

                            <circle cx="520" cy="35" r="5" fill="#10b981" />
                            <text x="520" y="20" textAnchor="middle" fill="currentColor" className="text-[11px] font-black fill-primary">HH3</text>
                        </>
                    )}

                    {mode === 'DOWN' && (
                        <>
                            {/* Trend Line Guide */}
                            <line x1="50" y1="30" x2="550" y2="190" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                            {/* Price Wave */}
                            <path
                                d="M 40 40 Q 90 130, 130 120 T 220 160 T 320 130 T 420 180 T 520 150 L 560 195"
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            {/* Points */}
                            <circle cx="130" cy="120" r="5" fill="#f43f5e" />
                            <text x="130" y="140" textAnchor="middle" className="text-[11px] font-black fill-rose-500">LH1</text>

                            <circle cx="220" cy="80" r="5" fill="#f43f5e" />
                            <text x="220" y="65" textAnchor="middle" className="text-[11px] font-black fill-rose-500">LL1</text>

                            <circle cx="320" cy="155" r="5" fill="#f43f5e" />
                            <text x="320" y="175" textAnchor="middle" className="text-[11px] font-black fill-rose-500">LH2</text>

                            <circle cx="420" cy="115" r="5" fill="#f43f5e" />
                            <text x="420" y="100" textAnchor="middle" className="text-[11px] font-black fill-rose-500">LL2</text>
                        </>
                    )}

                    {mode === 'SIDEWAYS' && (
                        <>
                            {/* Range Resistance & Support */}
                            <line x1="20" y1="60" x2="580" y2="60" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 5" />
                            <text x="50" y="50" className="text-[10px] font-bold fill-rose-500">RESISTENCIA (Techo)</text>

                            <line x1="20" y1="160" x2="580" y2="160" stroke="#10b981" strokeWidth="2" strokeDasharray="5 5" />
                            <text x="50" y="180" className="text-[10px] font-bold fill-emerald-500">SOPORTE (Suelo)</text>

                            <path
                                d="M 40 150 Q 80 60, 120 70 T 200 155 T 290 65 T 380 158 T 470 65 L 550 140"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </>
                    )}
                </svg>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs leading-relaxed text-muted-foreground">
                {mode === 'UP' && (
                    <p>
                        <strong className="text-foreground">Estructura Alcista:</strong> Cada máximo supera al anterior (<strong>Higher High - HH</strong>) y cada corrección frena por encima del piso anterior (<strong>Higher Low - HL</strong>). La tendencia sigue intacta mientras el precio respete el último HL.
                    </p>
                )}
                {mode === 'DOWN' && (
                    <p>
                        <strong className="text-foreground">Estructura Bajista:</strong> Se forman máximos descendentes (<strong>Lower High - LH</strong>) y nuevos mínimos cada vez más bajos (<strong>Lower Low - LL</strong>). La presión de los vendedores predomina.
                    </p>
                )}
                {mode === 'SIDEWAYS' && (
                    <p>
                        <strong className="text-foreground">Estructura Lateral:</strong> El precio oscila entre un soporte y una resistencia sin definir nuevos extremos. Corresponde a etapas de acumulación o distribución institucional antes de la ruptura.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── 2. RSI WIDGET ───────────────────────────────────────────────────────────
export function RsiWidget() {
    const [rsiValue, setRsiValue] = useState(65);

    const condition = rsiValue >= 70 ? 'SOBRECOMPRA' : rsiValue <= 30 ? 'SOBREVENTA' : 'ZONA NEUTRA';
    const conditionColor = rsiValue >= 70 ? 'text-rose-500' : rsiValue <= 30 ? 'text-emerald-500' : 'text-blue-500';

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Simulador Interactivo de RSI (14 Períodos)</h4>
                        <p className="text-xs text-muted-foreground">Deslizá el control para ver cómo reacciona el oscilador</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xl font-black font-mono text-foreground">{rsiValue}</div>
                    <div className={`text-[11px] font-bold ${conditionColor}`}>{condition}</div>
                </div>
            </div>

            {/* Slider Control */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Sobreventa extrema (0)</span>
                    <span>Neutro (50)</span>
                    <span>Sobrecompra extrema (100)</span>
                </div>
                <input
                    type="range"
                    min={5}
                    max={95}
                    value={rsiValue}
                    onChange={e => setRsiValue(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>

            {/* Gauge Bar */}
            <div className="relative h-9 w-full rounded-xl bg-muted/40 border border-border overflow-hidden flex items-center">
                {/* Zone 0-30: Oversold */}
                <div className="h-full bg-emerald-500/20 border-r border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400" style={{ width: '30%' }}>
                    Sobreventa (&lt; 30)
                </div>
                {/* Zone 30-70: Neutral */}
                <div className="h-full bg-muted/30 flex items-center justify-center text-[10px] font-medium text-muted-foreground" style={{ width: '40%' }}>
                    Zona Neutra (30 - 70)
                </div>
                {/* Zone 70-100: Overbought */}
                <div className="h-full bg-rose-500/20 border-l border-rose-500/40 flex items-center justify-center text-[10px] font-bold text-rose-600 dark:text-rose-400" style={{ width: '30%' }}>
                    Sobrecompra (&gt; 70)
                </div>

                {/* Needle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-foreground transition-all duration-150 shadow-md"
                    style={{ left: `${rsiValue}%` }}
                />
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                {rsiValue >= 70 && (
                    <p>
                        ⚠️ <strong>Lectura de Sobrecompra ({rsiValue}):</strong> El precio subió con fuerza reciente. Los compradores pueden comenzar a tomar ganancias. En tendencias fuertes el RSI puede mantenerse en sobrecompra, pero aumenta el riesgo de consolidación.
                    </p>
                )}
                {rsiValue <= 30 && (
                    <p>
                        🟢 <strong>Lectura de Sobreventa ({rsiValue}):</strong> El activo sufrió ventas intensas. Si confluye con un soporte clave de precio, la probabilidad de un rebote técnico alcista se incrementa.
                    </p>
                )}
                {rsiValue > 30 && rsiValue < 70 && (
                    <p>
                        ℹ️ <strong>Zona Neutra ({rsiValue}):</strong> El momentum no se encuentra en extremos. La superación de 50 hacia arriba confirma control comprador; por debajo de 50, predominio de la oferta.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── 3. MACD WIDGET ──────────────────────────────────────────────────────────
export function MacdWidget() {
    const [crossType, setCrossType] = useState<'BULL' | 'BEAR'>('BULL');

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Anatomía del MACD (12, 26, 9)</h4>
                        <p className="text-xs text-muted-foreground">Línea MACD, Línea de Señal e Histograma</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setCrossType('BULL')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            crossType === 'BULL' ? 'bg-emerald-500 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Cruce Alcista (Compra)
                    </button>
                    <button
                        type="button"
                        onClick={() => setCrossType('BEAR')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            crossType === 'BEAR' ? 'bg-rose-500 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Cruce Bajista (Venta)
                    </button>
                </div>
            </div>

            <div className="h-44 w-full rounded-xl bg-background/50 border border-border/50 p-4 relative overflow-hidden flex items-center">
                <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                    {/* Zero Line */}
                    <line x1="0" y1="70" x2="500" y2="70" stroke="currentColor" strokeWidth="1.5" className="text-border" />
                    <text x="10" y="65" className="text-[10px] font-bold fill-muted-foreground">Línea Cero (0.0)</text>

                    {/* Histogram bars */}
                    {crossType === 'BULL' ? (
                        <>
                            {/* Negative contracting bars */}
                            <rect x="70" y="70" width="16" height="30" fill="#f43f5e" opacity="0.6" rx="2" />
                            <rect x="110" y="70" width="16" height="20" fill="#f43f5e" opacity="0.6" rx="2" />
                            <rect x="150" y="70" width="16" height="8" fill="#f43f5e" opacity="0.6" rx="2" />
                            {/* Positive expanding bars */}
                            <rect x="190" y="62" width="16" height="8" fill="#10b981" rx="2" />
                            <rect x="230" y="45" width="16" height="25" fill="#10b981" rx="2" />
                            <rect x="270" y="30" width="16" height="40" fill="#10b981" rx="2" />
                            <rect x="310" y="20" width="16" height="50" fill="#10b981" rx="2" />
                            <rect x="350" y="15" width="16" height="55" fill="#10b981" rx="2" />

                            {/* Lines: Blue = MACD, Amber = Signal */}
                            <path d="M 50 110 Q 150 95, 190 70 T 360 20" fill="none" stroke="#0ea5e9" strokeWidth="3" />
                            <path d="M 50 95 Q 150 85, 190 70 T 360 45" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />

                            {/* Signal marker */}
                            <circle cx="190" cy="70" r="6" fill="#10b981" />
                            <text x="190" y="95" textAnchor="middle" className="text-[10px] font-black fill-emerald-500">CRUCE ALCISTA</text>
                        </>
                    ) : (
                        <>
                            {/* Positive contracting bars */}
                            <rect x="70" y="30" width="16" height="40" fill="#10b981" opacity="0.6" rx="2" />
                            <rect x="110" y="45" width="16" height="25" fill="#10b981" opacity="0.6" rx="2" />
                            <rect x="150" y="60" width="16" height="10" fill="#10b981" opacity="0.6" rx="2" />
                            {/* Negative expanding bars */}
                            <rect x="190" y="70" width="16" height="12" fill="#f43f5e" rx="2" />
                            <rect x="230" y="70" width="16" height="30" fill="#f43f5e" rx="2" />
                            <rect x="270" y="70" width="16" height="48" fill="#f43f5e" rx="2" />

                            {/* Lines */}
                            <path d="M 50 30 Q 150 45, 190 70 T 360 120" fill="none" stroke="#0ea5e9" strokeWidth="3" />
                            <path d="M 50 45 Q 150 55, 190 70 T 360 95" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />

                            {/* Signal marker */}
                            <circle cx="190" cy="70" r="6" fill="#f43f5e" />
                            <text x="190" y="55" textAnchor="middle" className="text-[10px] font-black fill-rose-500">CRUCE BAJISTA</text>
                        </>
                    )}
                </svg>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold text-sky-500">
                    <span className="w-3 h-1 bg-sky-500 rounded-full" /> Línea MACD (Rápida: EMA 12 - 26)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-500">
                    <span className="w-3 h-1 bg-amber-500 rounded-full" /> Línea de Señal (Lenta: EMA 9)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="w-2 h-2 bg-emerald-500 rounded-xs" /> Histograma (Diferencia)
                </span>
            </div>
        </div>
    );
}

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
                        <h4 className="text-sm font-bold text-foreground">Simulador de Creación de Valor: ROIC vs WACC</h4>
                        <p className="text-xs text-muted-foreground">Medí si un negocio enriquece o destruye el patrimonio del inversor</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-xl font-black font-mono ${isCreating ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Spread: {Number(spread) > 0 ? `+${spread}` : spread} pp
                    </div>
                    <div className={`text-[11px] font-bold ${isCreating ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isCreating ? 'CREA VALOR ECONÓMICO' : 'DESTRUYE VALOR'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3.5 rounded-xl bg-background/60 border border-border">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">ROIC (Retorno del Capital)</span>
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
                        <span className="text-foreground">WACC (Costo Medio de Capital)</span>
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

            {/* Comparison Visualizer */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-foreground">
                        <span>ROIC: {roic}%</span>
                        <span className="text-muted-foreground">Retorno Operativo</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (roic / 45) * 100)}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-foreground">
                        <span>WACC: {wacc}%</span>
                        <span className="text-muted-foreground">Costo de Financiamiento</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (wacc / 45) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                {isCreating ? (
                    <p>
                        🟢 <strong>Creación genuina de valor:</strong> Por cada US$ 100 invertidos en el negocio, la empresa obtiene un retorno de US$ {roic}, mientras que el costo de financiarse es de solo US$ {wacc}. El excedente de <strong>US$ {spread}</strong> va directo a capitalizar al accionista.
                    </p>
                ) : (
                    <p>
                        🔴 <strong>Destrucción de valor:</strong> Aunque la compañía registre ganancias contables en su balance, su rentabilidad ({roic}%) es inferior a lo que cuesta conseguir el dinero ({wacc}%). Cada reinversión empobrece al negocio.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── 5. CANDLES WIDGET ───────────────────────────────────────────────────────
export function CandlesWidget() {
    const [pattern, setPattern] = useState<'HAMMER' | 'DOJI' | 'ENGULFING' | 'SHOOTING_STAR'>('HAMMER');

    return (
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Anatomía y Patrones de Velas Japonesas</h4>
                        <p className="text-xs text-muted-foreground">Apertura, Cierre, Máximos, Mínimos y Psicología</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-muted/60 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setPattern('HAMMER')}
                        className={`px-2.5 py-1.5 rounded-lg transition-all ${pattern === 'HAMMER' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                        Martillo (Hammer)
                    </button>
                    <button
                        type="button"
                        onClick={() => setPattern('DOJI')}
                        className={`px-2.5 py-1.5 rounded-lg transition-all ${pattern === 'DOJI' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                        Doji (Indecisión)
                    </button>
                    <button
                        type="button"
                        onClick={() => setPattern('ENGULFING')}
                        className={`px-2.5 py-1.5 rounded-lg transition-all ${pattern === 'ENGULFING' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                        Envolvente Alcista
                    </button>
                    <button
                        type="button"
                        onClick={() => setPattern('SHOOTING_STAR')}
                        className={`px-2.5 py-1.5 rounded-lg transition-all ${pattern === 'SHOOTING_STAR' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >
                        Estrella Fugaz
                    </button>
                </div>
            </div>

            {/* Candle Graphic */}
            <div className="h-48 w-full rounded-xl bg-background/50 border border-border/50 p-4 flex items-center justify-center">
                {pattern === 'HAMMER' && (
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center">
                            {/* Tiny top wick */}
                            <div className="w-0.5 h-3 bg-emerald-500" />
                            {/* Body */}
                            <div className="w-12 h-10 rounded-xs bg-emerald-500 shadow-sm flex items-center justify-center text-[10px] font-bold text-white">
                                Cierre
                            </div>
                            {/* Long lower wick */}
                            <div className="w-0.5 h-24 bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 mt-1">Mínimo rechazado</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-bold text-foreground">Martillo Alcista (Hammer):</p>
                            <p>• Mecha inferior al menos el doble de largo que el cuerpo.</p>
                            <p>• Señal de rechazo agresivo de precios bajos en zona de soporte.</p>
                            <p>• Los compradores recuperaron todo el terreno perdido en la sesión.</p>
                        </div>
                    </div>
                )}

                {pattern === 'DOJI' && (
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className="w-0.5 h-16 bg-muted-foreground" />
                            <div className="w-14 h-1 bg-foreground" />
                            <div className="w-0.5 h-16 bg-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-bold text-foreground">Doji (Indecisión Absoluta):</p>
                            <p>• Apertura y Cierre prácticamente al mismo precio.</p>
                            <p>• Equilibrio exacto entre oferta y demanda.</p>
                            <p>• Frecuente al final de tendencias extendidas antes de un giro.</p>
                        </div>
                    </div>
                )}

                {pattern === 'ENGULFING' && (
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            {/* Small Red Candle */}
                            <div className="flex flex-col items-center">
                                <div className="w-0.5 h-4 bg-rose-500" />
                                <div className="w-8 h-12 bg-rose-500 rounded-xs" />
                                <div className="w-0.5 h-4 bg-rose-500" />
                            </div>
                            {/* Big Green Candle */}
                            <div className="flex flex-col items-center">
                                <div className="w-0.5 h-3 bg-emerald-500" />
                                <div className="w-11 h-24 bg-emerald-500 rounded-xs" />
                                <div className="w-0.5 h-3 bg-emerald-500" />
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-bold text-foreground">Envolvente Alcista (Bullish Engulfing):</p>
                            <p>• La vela verde envuelve por completo el cuerpo de la vela roja previa.</p>
                            <p>• Señal contundente de toma de control por compradores.</p>
                        </div>
                    </div>
                )}

                {pattern === 'SHOOTING_STAR' && (
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className="w-0.5 h-24 bg-rose-500" />
                            <div className="w-12 h-10 rounded-xs bg-rose-500 shadow-sm flex items-center justify-center text-[10px] font-bold text-white">
                                Cierre
                            </div>
                            <div className="w-0.5 h-3 bg-rose-500" />
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-bold text-foreground">Estrella Fugaz (Shooting Star):</p>
                            <p>• Mecha superior larga en zona de resistencia.</p>
                            <p>• Los compradores intentaron marcar nuevos máximos y fueron repelidos.</p>
                        </div>
                    </div>
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
                        <h4 className="text-sm font-bold text-foreground">Simulador Interactivo de Flujos Descontados (DCF)</h4>
                        <p className="text-xs text-muted-foreground">Calculá el valor intrínseco (Fair Value) sensibilizando crecimiento y costo de capital (WACC)</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Modelo 2-Etapas
                    </span>
                </div>
            </div>

            {/* SLIDERS & CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* FCF Base */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">FCF Año 0 (Base)</span>
                        <span className="text-primary font-bold">${initialFcf.toLocaleString()} M USD</span>
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
                    <p className="text-[10px] text-muted-foreground">Caja libre actual generada por la compañía</p>
                </div>

                {/* Crecimiento 5 años */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Crecimiento estimado (Años 1-5)</span>
                        <span className="text-primary font-bold">+{growthRate5y}% anual</span>
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
                    <p className="text-[10px] text-muted-foreground">Tasa a la que crecerá el FCF en los próximos 5 años</p>
                </div>

                {/* WACC */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Tasa Descuento (WACC)</span>
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
                    <p className="text-[10px] text-muted-foreground">Retorno mínimo exigido según riesgo del negocio</p>
                </div>

                {/* Crecimiento Terminal */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Crecimiento Terminal (g)</span>
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
                    <p className="text-[10px] text-muted-foreground">Tasa a perpetuidad (acorde al PIB mundial, 2% - 3%)</p>
                </div>

                {/* Acciones en circulación */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Acciones en circulación</span>
                        <span className="text-primary font-bold">{sharesOutstanding} M</span>
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
                    <p className="text-[10px] text-muted-foreground">Cantidad total de acciones emitidas (dilución)</p>
                </div>

                {/* Precio de mercado actual */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/60 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Precio de Mercado Actual</span>
                        <span className="text-primary font-bold">${currentPrice} USD</span>
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
                    <p className="text-[10px] text-muted-foreground">Cotización actual en el mercado bursátil</p>
                </div>
            </div>

            {/* RESULTS DASHBOARD */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 flex flex-col md:flex-row items-stretch justify-between gap-6">
                <div className="space-y-2 md:w-1/2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Resultado de la Valuación
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-foreground">
                            ${intrinsicValuePerShare.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">USD / acción (Fair Value)</span>
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
                    <div className="text-xs font-bold text-foreground">Desglose del Enterprise Value Total:</div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Suma VP Flujos Años 1 al 5:</span>
                            <span className="font-bold text-foreground">${Math.round(sumPv5Years).toLocaleString()} M ({((sumPv5Years / totalEnterpriseValue) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>VP Valor Terminal (a perpetuidad):</span>
                            <span className="font-bold text-foreground">${Math.round(pvTerminalValue).toLocaleString()} M ({((pvTerminalValue / totalEnterpriseValue) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="h-px bg-border/60 my-1" />
                        <div className="flex justify-between font-bold text-foreground">
                            <span>Enterprise Value Total:</span>
                            <span className="text-primary">${Math.round(totalEnterpriseValue).toLocaleString()} M USD</span>
                        </div>
                    </div>

                    {/* COMPARISON VISUAL BAR */}
                    <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Precio Actual: ${currentPrice}</span>
                            <span>Fair Value: ${intrinsicValuePerShare.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden relative">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${isUndervalued ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(Math.max((intrinsicValuePerShare / (currentPrice * 1.5)) * 100, 10), 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── CONTAINER: DISPATCHER DE WIDGETS INTERACTIVOS ───────────────────────────
export function EducationalWidgetContainer({ widgetKey }: { widgetKey?: string | null }) {
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
            return <TrendWidget />;
        case 'dcf_simulator':
        case 'dcf':
        case 'valuation':
            return <DcfValuationWidget />;
        default:
            return null;
    }
}
