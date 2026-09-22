import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Compass,
    CheckCircle2,
    AlertTriangle,
    Layers,
    Lightbulb,
    Scale,
    Target,
} from 'lucide-react';

interface HeatmapTechnicalGuideModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function HeatmapTechnicalGuideModal({
    open,
    onOpenChange,
}: HeatmapTechnicalGuideModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white dark:bg-card border border-border/80 shadow-2xl rounded-3xl">
                <DialogHeader className="space-y-3 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                            <Compass className="w-3.5 h-3.5" />
                            MANUAL TÉCNICO INSTITUCIONAL
                        </span>
                        <Badge variant="outline" className="text-xs font-medium border-border/70 text-muted-foreground rounded-full">
                            Temporalidad 1W (Semanal)
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium border-border/70 text-muted-foreground rounded-full">
                            Top 250 S&amp;P 500
                        </Badge>
                    </div>

                    <div>
                        <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            Metodología y Lectura del Mapa de Calor
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-1.5 leading-relaxed font-normal">
                            Aprende a interpretar el mapa de calor, los osciladores de confluencia semanal y el sistema de puntuación cuantitativo para invertir con ventaja estadística.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    <Tabs defaultValue="strategy" className="w-full space-y-5">
                        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-secondary/50 dark:bg-secondary/30 rounded-2xl border border-border/60">
                            <TabsTrigger
                                value="strategy"
                                className="py-2.5 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                            >
                                <Target className="w-4 h-4 mr-1.5 text-emerald-600 hidden sm:inline" />
                                Estrategia &amp; Reglas
                            </TabsTrigger>
                            <TabsTrigger
                                value="indicators"
                                className="py-2.5 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                            >
                                <Activity className="w-4 h-4 mr-1.5 text-blue-600 hidden sm:inline" />
                                4 Indicadores
                            </TabsTrigger>
                            <TabsTrigger
                                value="heatmap"
                                className="py-2.5 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                            >
                                <Layers className="w-4 h-4 mr-1.5 text-violet-600 hidden sm:inline" />
                                Leer el Treemap
                            </TabsTrigger>
                            <TabsTrigger
                                value="scoring"
                                className="py-2.5 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                            >
                                <Scale className="w-4 h-4 mr-1.5 text-amber-600 hidden sm:inline" />
                                Sistema de Score
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: ESTRATEGIA & REGLAS */}
                        <TabsContent value="strategy" className="space-y-4 focus-visible:outline-none">
                            {/* Why 1W Timeframe Callout */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-start gap-3.5">
                                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                                    <Lightbulb className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
                                    <span className="font-bold text-foreground block">
                                        ¿Por qué operamos en temporalidad semanal (1W)?
                                    </span>
                                    <p className="text-muted-foreground font-normal">
                                        Los grandes fondos institucionales de Wall Street acumulan y distribuyen posiciones durante semanas, no en minutos. Los gráficos semanales eliminan el 85% del ruido del día a día y ofrecen señales de alta fiabilidad para swing trading y carteras de mediano plazo.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Buy & Accumulation Card */}
                                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            Compra &amp; Acumulación
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 border-0 text-[11px] font-bold">
                                            CONVERGENCIA ALCISTA
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 text-xs leading-relaxed">
                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                                    RSI Semanal &lt; 45
                                                </span>
                                                <span>Zona de Descuento Técnico</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                El activo ha sufrido una corrección sana. En gráficos semanales, el soporte entre 40 y 45 suele marcar suelos de retroceso en empresas líderes del S&amp;P 500 sin caer en pánico.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                                    MACD Histograma &gt; 0
                                                </span>
                                                <span>Aceleración Compradora</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                La media rápida cruza al alza la media lenta o el histograma expande barras positivas, indicando entrada neta de liquidez institucional.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                                    Rendimiento +1S
                                                </span>
                                                <span>Fuerza Relativa</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                La acción muestra cierre verde semanal sostenido mientras su sector acompaña el movimiento de capital.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sell & Risk Card */}
                                <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
                                            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
                                                <TrendingDown className="w-4 h-4 text-rose-600" />
                                            </div>
                                            Venta &amp; Sobrecompra
                                        </div>
                                        <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30 border-0 text-[11px] font-bold">
                                            DISTRIBUCIÓN / RIESGO
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 text-xs leading-relaxed">
                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                                                    RSI Semanal &gt; 55
                                                </span>
                                                <span>Zona Extendida</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                El precio ha corrido demasiado rápido en pocas semanas. El ratio riesgo/beneficio para compras nuevas se deteriora significativamente.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                                                    MACD Histograma &lt; 0
                                                </span>
                                                <span>Frenado o Cruce Bajista</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Las barras del histograma caen en terreno negativo o se comprimen, señalando agotamiento de la demanda y toma de beneficios institucional.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                                                    Rendimiento -1S
                                                </span>
                                                <span>Presión Distribuidora</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Velas de rechazo con cierres en mínimos semanales que invitan a ajustar stop-loss o tomar ganancias parciales.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 2: 4 INDICADORES EXPLICADOS */}
                        <TabsContent value="indicators" className="space-y-4 focus-visible:outline-none">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Indicator 1: RSI */}
                                <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm">
                                            RSI
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">RSI (Relative Strength Index 14W)</h4>
                                            <span className="text-[11px] text-muted-foreground">Oscilador de Momentum y Amplitud</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Mide la velocidad y cambio de los movimientos de precio en un periodo de 14 semanas.
                                    </p>
                                    {/* Visual Gauge Preview */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-emerald-600">&lt; 45 Acumulación</span>
                                            <span className="text-muted-foreground">45-55 Neutral</span>
                                            <span className="text-rose-600">&gt; 55 Sobrecompra</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-[45%] bg-emerald-500/80" />
                                            <div className="w-[10%] bg-zinc-300 dark:bg-zinc-700" />
                                            <div className="w-[45%] bg-rose-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Regla Pro:</strong> A diferencia del RSI diario (que usa 30 y 70), en el semanal los niveles 45 y 55 marcan con anticipación los cambios de régimen institucional.
                                    </div>
                                </div>

                                {/* Indicator 2: MACD */}
                                <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 flex items-center justify-center font-bold text-sm">
                                            MACD
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">MACD (12, 26, 9 Semanal)</h4>
                                            <span className="text-[11px] text-muted-foreground">Convergencia / Divergencia de Medias</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Compara una media móvil exponencial rápida de 12 semanas con una lenta de 26 semanas, graficando la diferencia en el histograma.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-emerald-600">Hist &gt; 0: Cruce Alcista</span>
                                            <span className="text-rose-600">Hist &lt; 0: Cruce Bajista</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-1/2 bg-emerald-500/80" />
                                            <div className="w-1/2 bg-rose-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Regla Pro:</strong> Cuando el histograma del MACD semanal pasa de negativo a positivo, representa el punto de entrada con mejor ratio riesgo/retorno.
                                    </div>
                                </div>

                                {/* Indicator 3: ADX */}
                                <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            ADX
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">ADX (Average Directional Index 14W)</h4>
                                            <span className="text-[11px] text-muted-foreground">Fuerza de la Tendencia</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Indica si el mercado tiene una tendencia clara o se encuentra en consolidación lateral, sin importar si va al alza o a la baja.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-zinc-500">&lt; 20 Rango Lateral</span>
                                            <span className="text-blue-600">≥ 25 Tendencia Fuerte</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-1/3 bg-zinc-400" />
                                            <div className="w-2/3 bg-blue-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Regla Pro:</strong> Combinar un ADX ≥ 25 con un MACD alcista confirma que el rally está respaldado por capital institucional real.
                                    </div>
                                </div>

                                {/* Indicator 4: Estocástico */}
                                <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold text-sm">
                                            %K
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">Estocástico Semanal (%K/%D)</h4>
                                            <span className="text-[11px] text-muted-foreground">Timing de Giro Rápido</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Compara el precio de cierre con su rango de máximos y mínimos para detectar puntos exactos de giro en retrocesos.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-emerald-600">≤ 20 Rebote Inminente</span>
                                            <span className="text-rose-600">≥ 80 Agotamiento</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-[20%] bg-emerald-500/80" />
                                            <div className="w-[60%] bg-zinc-300 dark:bg-zinc-700" />
                                            <div className="w-[20%] bg-rose-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Regla Pro:</strong> Un estocástico en sobreventa dentro de una acción alcista en MACD genera una excelente oportunidad de entrada táctica.
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 3: LEER EL TREEMAP */}
                        <TabsContent value="heatmap" className="space-y-4 focus-visible:outline-none">
                            <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-4 shadow-2xs">
                                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                    Estructura Visual del Treemap S&amp;P 500
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
                                        <span className="font-bold text-foreground block">1. Tamaño de Cada Caja</span>
                                        <p className="text-muted-foreground">
                                            Es directamente proporcional a la <strong>Capitalización Bursátil (Market Cap)</strong>. Acciones gigantes como Apple (AAPL), Microsoft (MSFT) o NVIDIA (NVDA) ocupan mayor área por su peso en el índice.
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
                                        <span className="font-bold text-foreground block">2. Código de Colores</span>
                                        <p className="text-muted-foreground">
                                            <strong>Verde Esmeralda:</strong> Crecimiento semanal superior. <br />
                                            <strong>Rojo Rubí:</strong> Corrección o presión vendedora. <br />
                                            <strong>Intensidad:</strong> Mayor brillo representa mayor porcentaje de cambio.
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
                                        <span className="font-bold text-foreground block">3. Los 11 Sectores GICS</span>
                                        <p className="text-muted-foreground">
                                            Las empresas están agrupadas por su industria oficial (Tecnología, Consumo, Salud, Finanzas, Energía, etc.) para identificar de inmediato la <strong>Rotación Sectorial</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tactical Tip */}
                            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] text-xs space-y-1.5">
                                <span className="font-bold text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Cómo detectar rotación de capital:
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    Si ves el sector de <em>Tecnología</em> en rojo mientras <em>Energía</em> o <em>Servicios Financieros</em> están completamente en verde, el mercado no está cayendo por pánico sino que los fondos institucionales están rotando liquidez hacia activos de valor o defensivos.
                                </p>
                            </div>
                        </TabsContent>

                        {/* TAB 4: SISTEMA DE SCORE */}
                        <TabsContent value="scoring" className="space-y-4 focus-visible:outline-none">
                            <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-4 shadow-2xs">
                                <div>
                                    <h4 className="font-bold text-base text-foreground">
                                        Fórmula Cuantitativa de Confluencia (-3 a +3)
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Cada acción analizada en Finix recibe una puntuación técnica objetiva sumando las condiciones favorables y restando las desfavorables:
                                    </p>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-emerald-600 font-mono w-14">
                                                +3 pts
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">FUERTE COMPRA</span>
                                                <p className="text-[11px] text-muted-foreground">RSI &lt; 45 + MACD Hist &gt; 0 + Retorno Semanal Positivo</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white font-bold text-[10px]">MÁXIMA CONFLUENCIA</Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-emerald-600 font-mono w-14">
                                                +1 a +2
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">COMPRA / ACUMULACIÓN</span>
                                                <p className="text-[11px] text-muted-foreground">Mayoría de indicadores en territorio alcista con buen soporte</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 font-bold text-[10px]">FAVORABLE</Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-secondary/30 text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-muted-foreground font-mono w-14">
                                                0 pts
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">NEUTRAL</span>
                                                <p className="text-[11px] text-muted-foreground">Fuerzas equilibradas, consolidación lateral o señales contradictorias</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="font-bold text-[10px]">EQUILIBRIO</Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-rose-600 font-mono w-14">
                                                -1 a -2
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">VENTA / PRECAUCIÓN</span>
                                                <p className="text-[11px] text-muted-foreground">Osciladores sobrecomprados o MACD perdiendo momentum</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-rose-600 border-rose-500/30 font-bold text-[10px]">TOMA DE GANANCIAS</Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-rose-600 font-mono w-14">
                                                -3 pts
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">FUERTE VENTA</span>
                                                <p className="text-[11px] text-muted-foreground">RSI &gt; 55 + MACD Hist &lt; 0 + Retorno Semanal Negativo</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-rose-500 text-white font-bold text-[10px]">ALTO RIESGO</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Risk disclaimer */}
                            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] flex items-start gap-3 text-xs leading-relaxed">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-muted-foreground">
                                    <strong className="text-foreground">Gestión de Riesgo:</strong> El mapa de calor y sus osciladores son herramientas analíticas de apoyo estadístico. Nunca operes con apalancamiento excesivo y utiliza siempre una correcta gestión monetaria y stop-loss.
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
