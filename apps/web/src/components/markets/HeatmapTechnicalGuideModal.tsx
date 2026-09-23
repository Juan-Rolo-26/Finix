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
                            GUÍA TÉCNICA · PLAN PRO
                        </span>
                        <Badge variant="outline" className="text-xs font-medium border-border/70 text-muted-foreground rounded-full">
                            Gráficos Semanales (1W)
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium border-border/70 text-muted-foreground rounded-full">
                            250 Empresas Líderes S&amp;P 500
                        </Badge>
                    </div>

                    <div>
                        <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                            Metodología y Criterios Operativos
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-1.5 leading-relaxed font-normal">
                            Cómo interpretar las señales de compra, venta y neutralidad para operar acciones del S&P 500 con criterio profesional y visión de mediano plazo.
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
                                Estrategia 1W
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
                                Mapa Sectorial
                            </TabsTrigger>
                            <TabsTrigger
                                value="scoring"
                                className="py-2.5 text-xs sm:text-sm font-bold rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                            >
                                <Scale className="w-4 h-4 mr-1.5 text-amber-600 hidden sm:inline" />
                                Sistema de Score
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: ESTRATEGIA 1W */}
                        <TabsContent value="strategy" className="space-y-4 focus-visible:outline-none">
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-start gap-3.5">
                                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                                    <Lightbulb className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
                                    <span className="font-bold text-foreground block">
                                        ¿Por qué analizamos velas semanales (1W)?
                                    </span>
                                    <p className="text-muted-foreground font-normal">
                                        Los gráficos diarios suelen tener demasiado ruido provocado por noticias de corto plazo o balances puntuales. Las velas semanales limpian esas oscilaciones menores y permiten identificar la dirección de fondo del dinero real, facilitando operaciones de swing trading y armado de carteras con paradas técnicas más claras.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Zona de Compra */}
                                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            Señales de Compra & Acumulación
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-0 text-[11px] font-bold">
                                            SESGO ALCISTA
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 text-xs leading-relaxed">
                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                                    RSI Semanal &lt; 45
                                                </span>
                                                <span>Corrección o Descuento</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                El activo retrocedió tras un rally previo. En velas semanales de empresas grandes del S&P 500, la franja de 40 a 45 suele actuar como piso técnico donde reaparece el interés comprador.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                                    MACD Histograma &gt; 0
                                                </span>
                                                <span>Entrada de Momentum</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                El histograma cruza al alza o acelera en terreno positivo, confirmando que la velocidad del precio volvió a favor de los compradores.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                                    Cierre Semanal Positivo
                                                </span>
                                                <span>Acompañamiento del Precio</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                La acción muestra velas semanales con cierres cerca de los máximos de la semana, confirmando que hay demanda real sosteniendo la cotización.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Zona de Venta */}
                                <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-base">
                                            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
                                                <TrendingDown className="w-4 h-4 text-rose-600" />
                                            </div>
                                            Señales de Venta & Toma de Ganancias
                                        </div>
                                        <Badge className="bg-rose-500/20 text-rose-800 dark:text-rose-200 border-0 text-[11px] font-bold">
                                            ZONA DE RIESGO
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 text-xs leading-relaxed">
                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                                                    RSI Semanal &gt; 55
                                                </span>
                                                <span>Precio Extendió Demasiado</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Tras subas consecutivas, el activo queda sobrecomprado. Entrar en estos niveles ofrece poco margen al alza y expone la posición a tomas de ganancias bruscas.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                                                    MACD Histograma &lt; 0
                                                </span>
                                                <span>Agotamiento del Impulso</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Las barras del histograma se comprimen o pasan a valores negativos, alertando que el empuje comprador se desinfló y los vendedores toman el control.
                                            </p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white dark:bg-card border border-border/70 space-y-1">
                                            <div className="flex items-center gap-2 font-bold text-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                                                    Cierre Semanal en Rojo
                                                </span>
                                                <span>Rechazo en Máximos</span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Cierres semanales cerca de mínimos o con sombras largas superiores indican que el mercado no convalidó precios más altos y conviene proteger ganancias.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 2: 4 INDICADORES */}
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
                                            <span className="text-[11px] text-muted-foreground">Fuerza relativa y zonas de sobrecompra / sobreventa</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Mide el balance entre las semanas alcistas y bajistas de los últimos 3 meses y medio (14 semanas). Permite saber si el activo está en zona de sobrecompra o si corrigió a niveles atractivos.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-emerald-600">&lt; 45 Acumulación</span>
                                            <span className="text-muted-foreground">45 a 55 Neutral</span>
                                            <span className="text-rose-600">&gt; 55 Sobrecompra</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-[45%] bg-emerald-500/80" />
                                            <div className="w-[10%] bg-zinc-300 dark:bg-zinc-700" />
                                            <div className="w-[45%] bg-rose-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Cómo usarlo:</strong> En velas semanales los extremos 30 y 70 tardan meses en llegar. Por eso, el umbral de 45 suele marcar correcciones sanas en papeles fuertes, y arriba de 55 conviene no perseguir precios.
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
                                            <span className="text-[11px] text-muted-foreground">Dirección y aceleración del precio</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Compara una media móvil de 12 semanas contra una de 26 semanas. La diferencia entre ambas se grafica en el histograma y refleja quién domina el movimiento.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-emerald-600">Hist &gt; 0: Impulso Alcista</span>
                                            <span className="text-rose-600">Hist &lt; 0: Impulso Bajista</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-1/2 bg-emerald-500/80" />
                                            <div className="w-1/2 bg-rose-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Cómo usarlo:</strong> El momento en que el histograma deja de caer y pasa a terreno positivo suele coincidir con el inicio de un nuevo tramo alcista con muy buena relación riesgo/retorno.
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
                                            <span className="text-[11px] text-muted-foreground">Fuerza de la tendencia actual</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Mide qué tan fuerte es la tendencia vigente, sin importar si es alcista o bajista. Ayuda a distinguir un movimiento con volumen real de una oscilación sin rumbo.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-zinc-500">&lt; 20 Rango Lateral</span>
                                            <span className="text-blue-600">≥ 25 Tendencia Definida</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-1/3 bg-zinc-400" />
                                            <div className="w-2/3 bg-blue-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Cómo usarlo:</strong> Si el ADX supera los 25 puntos y el MACD es positivo, la suba tiene combustible para continuar. Con ADX bajo 20, el mercado suele quedar atrapado en rangos lentos.
                                    </div>
                                </div>

                                {/* Indicator 4: Estocástico */}
                                <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-3 shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold text-sm">
                                            %K
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">Oscilador Estocástico (%K / %D Semanal)</h4>
                                            <span className="text-[11px] text-muted-foreground">Sintonía fina para entradas en retrocesos</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Compara el precio de cierre con el rango de máximos y mínimos de las últimas semanas. Es más rápido que el RSI y ayuda a afinar el momento exacto de entrada.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                                            <span className="text-emerald-600">≤ 20 Rebote Probable</span>
                                            <span className="text-rose-600">≥ 80 Sobrecompra</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-secondary flex overflow-hidden">
                                            <div className="w-[20%] bg-emerald-500/80" />
                                            <div className="w-[60%] bg-zinc-300 dark:bg-zinc-700" />
                                            <div className="w-[20%] bg-rose-500/80" />
                                        </div>
                                    </div>
                                    <div className="text-[11px] p-2.5 rounded-xl bg-secondary/50 text-muted-foreground leading-relaxed">
                                        <strong>Cómo usarlo:</strong> Cuando una acción con tendencia de fondo alcista tiene su estocástico en zona de sobreventa (cerca de 20), suele marcar el final de un recorte y un punto de compra con stop ajustado.
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 3: MAPA SECTORIAL */}
                        <TabsContent value="heatmap" className="space-y-4 focus-visible:outline-none">
                            <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-4 shadow-2xs">
                                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                    Lectura Rápida del Mapa de Calor
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
                                        <span className="font-bold text-foreground block">1. Tamaño de las Cajas</span>
                                        <p className="text-muted-foreground">
                                            Proporcional al <strong>Market Cap</strong> (tamaño de la empresa). Firmas como Apple, Microsoft o NVIDIA ocupan áreas mayores porque representan un porcentaje más grande del índice.
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
                                        <span className="font-bold text-foreground block">2. Código de Color</span>
                                        <p className="text-muted-foreground">
                                            <strong>Verde:</strong> Variación semanal positiva (mayor intensidad = mayor suba). <br />
                                            <strong>Rojo:</strong> Variación semanal negativa (mayor intensidad = mayor caída). <br />
                                            <strong>Gris:</strong> Sin variación relevante.
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 space-y-1.5">
                                        <span className="font-bold text-foreground block">3. Sectores del Mercado</span>
                                        <p className="text-muted-foreground">
                                            Las empresas están agrupadas por su industria (Tecnología, Finanzas, Salud, Energía, etc.). Te permite identificar en un instante si el movimiento es general o concentrado en un sector.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] text-xs space-y-1.5">
                                <span className="font-bold text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    Rotación sectorial en la práctica:
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                    Si observás que el sector de Tecnología está en rojo mientras Energía, Consumo Básico o Finanzas suben con firmeza en verde, no significa que el mercado esté cayendo en bloque: el dinero simplemente está rotando hacia sectores más defensivos o de valor.
                                </p>
                            </div>
                        </TabsContent>

                        {/* TAB 4: SISTEMA DE SCORE */}
                        <TabsContent value="scoring" className="space-y-4 focus-visible:outline-none">
                            <div className="p-5 rounded-2xl border border-border/70 bg-white dark:bg-card space-y-4 shadow-2xs">
                                <div>
                                    <h4 className="font-bold text-base text-foreground">
                                        Sistema de Puntuación Técnica (-3 a +3)
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Para evitar mirar indicador por indicador, Finix calcula una puntuación neta que resume si los criterios técnicos coinciden a favor de compras o de ventas:
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
                                                <p className="text-[11px] text-muted-foreground">RSI &lt; 45 + Histograma MACD positivo + Cierre semanal en verde</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white font-bold text-[10px]">COINCIDENCIA PLENA</Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-emerald-600 font-mono w-14">
                                                +1 a +2
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">COMPRA / ACUMULACIÓN</span>
                                                <p className="text-[11px] text-muted-foreground">La mayoría de los osciladores tienen sesgo alcista y buen soporte</p>
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
                                                <p className="text-[11px] text-muted-foreground">Mercado en rango lateral o con señales contrapuestas entre indicadores</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="font-bold text-[10px]">SIN DEFINICIÓN</Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-sm text-rose-600 font-mono w-14">
                                                -1 a -2
                                            </span>
                                            <div>
                                                <span className="font-bold text-foreground">VENTA / PRECAUCIÓN</span>
                                                <p className="text-[11px] text-muted-foreground">Osciladores sobrecomprados o pérdida gradual de fuerza compradora</p>
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
                                                <p className="text-[11px] text-muted-foreground">RSI &gt; 55 + Histograma MACD negativo + Cierre semanal en rojo</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-rose-500 text-white font-bold text-[10px]">RIESGO ELEVADO</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] flex items-start gap-3 text-xs leading-relaxed">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-muted-foreground">
                                    <strong className="text-foreground">Nota de riesgo:</strong> Los indicadores técnicos son herramientas estadísticas para ordenar decisiones, no predicciones infalibles. Siempre gestioná el tamaño de tus posiciones y fijá de antemano tus niveles de stop-loss según tu perfil.
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
