import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Lock, Star, TrendingUp, DollarSign, Target, Briefcase, 
    Activity, Users, LineChart, ShieldAlert, Zap, Compass, CheckCircle2, 
    AlertTriangle, ArrowUpRight, ArrowDownRight, Search, 
    Sparkles, Loader2, ArrowLeft, BarChart3,
    Building2, Scale, PieChart, Layers, Camera, HelpCircle,
    Info, ChevronUp, RefreshCw
} from 'lucide-react';
import { 
    ResponsiveContainer, LineChart as RCLineChart, Line, 
    XAxis, YAxis, Tooltip as RCTooltip, CartesianGrid 
} from 'recharts';
import { useAuthStore, isJuanUser } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProGate } from '@/components/ProGate';
import TradingViewChart from '@/components/TradingViewChart';

// Helper para formatear monedas y números grandes
const formatCurrency = (val: number | null | undefined, compact = false) => {
    if (val === null || val === undefined) return null;
    if (compact) {
        if (Math.abs(val) >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
};

// Helper para formatear números de acciones, volúmenes y ratios
const formatNumber = (val: number | null | undefined, compact = false) => {
    if (val === null || val === undefined) return null;
    if (compact) {
        if (Math.abs(val) >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
        if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
        if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
        if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
};

// Helpers de traducción al español para señales técnicas, severidades y horizontes
const translateSignal = (sig?: string) => {
    if (!sig) return '';
    const upper = sig.toUpperCase().trim();
    if (upper === 'STRONG_BUY' || upper === 'STRONG BUY') return 'COMPRA FUERTE';
    if (upper === 'BUY') return 'COMPRA';
    if (upper === 'HOLD') return 'MANTENER';
    if (upper === 'NEUTRAL') return 'NEUTRAL';
    if (upper === 'SELL') return 'VENTA';
    if (upper === 'STRONG_SELL' || upper === 'STRONG SELL') return 'VENTA FUERTE';
    return sig;
};

const translateSeverity = (sev?: string) => {
    if (!sev) return '';
    const upper = sev.toUpperCase().trim();
    if (upper === 'CRITICAL') return 'CRÍTICO';
    if (upper === 'HIGH') return 'ALTO';
    if (upper === 'MEDIUM' || upper === 'MODERATE') return 'MEDIO';
    if (upper === 'LOW') return 'BAJO';
    return sev;
};

const translateHorizon = (hor?: string) => {
    if (!hor) return '';
    const upper = hor.toUpperCase().trim();
    if (upper === 'SHORT_TERM' || upper === 'SHORT TERM' || upper === 'SHORT') return 'Corto Plazo';
    if (upper === 'MEDIUM_TERM' || upper === 'MEDIUM TERM' || upper === 'MEDIUM') return 'Mediano Plazo';
    if (upper === 'LONG_TERM' || upper === 'LONG TERM' || upper === 'LONG') return 'Largo Plazo';
    return hor;
};

// ─── PANTALLA PAYWALL PRO ───────────────────────────────────────────────────
function ProPaywallGate({ analysis }: { analysis: any }) {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card/60 backdrop-blur-md p-8 sm:p-12 text-center my-8 shadow-2xl">
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.15) 0%, transparent 70%)', filter: 'blur(70px)' }}
                />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/20">
                    <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary">
                        <Star className="w-3.5 h-3.5 fill-primary" /> Exclusivo Finix Pro
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground tracking-tight">
                        Desbloqueá el Análisis Completo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">{analysis?.companyName || 'esta acción'}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Accedé a 22 módulos de research institucional: modelos de valuación (DCF), gráficos históricos de márgenes y Cash Flow, comparativa con competidores y análisis técnico cuantitativo.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left py-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Fair Value & Supuestos DCF
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Gráficos de Ingresos & Márgenes
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Ratios frente a Competidores
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Soportes, Resistencias y RSI
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                        onClick={() => navigate('/pricing')} 
                        className="h-12 px-8 rounded-full font-bold text-sm shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-primary-foreground transition-all duration-300 transform hover:scale-105"
                    >
                        Desbloquear con Finix PRO
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── DICCIONARIO EDUCATIVO: GUÍA DE MÉTRICAS (QUÉ ES, QUÉ INDICA, BUENO Y MALO) ───
interface MetricGuideInfo {
    what: string;
    indicates: string;
    good: string;
    bad: string;
}

const METRIC_GUIDES: Record<string, MetricGuideInfo> = {
    // Múltiplos y Valuación
    peratio: {
        what: "Relación entre el precio de cotización actual y el beneficio neto por acción (EPS).",
        indicates: "Cuántas veces las ganancias anuales está pagando el mercado por la empresa.",
        good: "Entre 10x y 22x suele indicar valoración razonable y sostenible en empresas rentables.",
        bad: "> 35x implica sobrevaloración o exigencia de crecimiento casi perfecta. Negativo = la empresa pierde dinero."
    },
    peratiottm: {
        what: "Precio sobre Beneficios de los últimos 12 meses finalizados (Trailing Twelve Months).",
        indicates: "El múltiplo de valoración real y tangible sobre resultados contables ya devengados.",
        good: "Moderado respecto a su media histórica y con múltiplos inferiores a los pares de igual calidad.",
        bad: "Extremadamente elevado (> 40x) sin hipercrecimiento demostrable o con tendencia al alza por caída de beneficios."
    },
    forwardpe: {
        what: "Ratio P/E proyectado utilizando las estimaciones de beneficios de los analistas para los próximos 12 meses.",
        indicates: "Si el mercado espera que la acción se abarate por aumento de ganancias futuras.",
        good: "Menor que el P/E actual (indica previsión de aumento sostenido de utilidades) y < 20x.",
        bad: "Mayor que el P/E actual (anticipa contracción de beneficios) o > 30x sin catalizadores claros."
    },
    pegratio: {
        what: "Múltiplo P/E dividido por la tasa de crecimiento estimada del beneficio por acción (EPS Growth).",
        indicates: "El balance matemático entre el precio pagado y la velocidad a la que crece la empresa.",
        good: "≤ 1.0x se considera excelente valor (crecimiento alto a precio justo o de ganga).",
        bad: "> 2.0x indica que estás pagando un sobreprecio muy caro en relación a su tasa de crecimiento real."
    },
    pricetosales: {
        what: "Precio de la acción respecto a los ingresos totales generados por acción (Price to Sales).",
        indicates: "Cuánto pagas por cada dólar de facturación bruta que genera la compañía.",
        good: "< 3x en empresas industriales, comercio y consumo; < 8x en firmas de software de muy alto margen.",
        bad: "> 10x requiere márgenes operativos colosales para sostenerse en el largo plazo."
    },
    pricetobook: {
        what: "Precio de mercado comparado con el valor neto contable en libros (Patrimonio Neto por acción).",
        indicates: "Si compras por encima o debajo del valor contable de liquidación teórica de activos.",
        good: "< 2.5x en general, y < 1.3x en bancos, seguros o empresas industriales de capital intensivo.",
        bad: "> 6x salvo en modelos tecnológicos de activos intangibles gigantescos no registrados contablemente."
    },
    evtoebitda: {
        what: "Enterprise Value (Capitalización + Deuda neta) dividido por el EBITDA anual.",
        indicates: "Múltiplo de adquisición total del negocio neutral a su estructura de deuda e impuestos.",
        good: "Entre 6x y 12x señala una valoración atractiva y múltiplos saludables de absorción de deuda.",
        bad: "> 18x - 20x indica prima excesiva sobre la caja operativa disponible antes de reinversión."
    },
    evtorevenue: {
        what: "Valor de la empresa (Enterprise Value) respecto a sus ingresos anuales totales.",
        indicates: "El coste total de adquirir el 100% de la compañía frente a su nivel de facturación bruta.",
        good: "Múltiplos bajos respecto a la media del sector (típico 1x a 4x).",
        bad: "> 8x - 10x requiere márgenes y retornos sobre capital excepcionales para ser defendible."
    },
    pricetofcf: {
        what: "Precio de mercado dividido por el Flujo de Caja Libre (Free Cash Flow) por acción.",
        indicates: "Cuánto pagas por cada dólar de dinero contante y sonante disponible tras inversiones de capital.",
        good: "Entre 10x y 20x refleja un flujo de caja abundante y seguro que respalda el valor bursátil.",
        bad: "> 30x o valor negativo (la empresa no genera caja neta real o la quema velozmente)."
    },
    dividendyield: {
        what: "Porcentaje de rendimiento anual que la empresa devuelve al inversor mediante dividendos en efectivo.",
        indicates: "Retorno pasivo directo por tenencia de la acción independiente de la cotización.",
        good: "Entre 2% y 5% financiado holgadamente con un Payout Ratio < 60% del Flujo de Caja Libre.",
        bad: "> 8% suele ser trampa de valor por desplome de precio, o 0% si buscas ingresos por dividendos."
    },
    pehistoricoprom: {
        what: "Promedio del ratio P/E de la propia empresa a lo largo de los últimos 5 a 10 años.",
        indicates: "Si la compañía está transaccionando con rebaja o encarecimiento frente a su propia historia.",
        good: "Cotizar sensiblemente por debajo de su media histórica con el negocio intacto (descuento temporal).",
        bad: "Cotizar en la banda superior histórica, dejando poco margen de seguridad frente a tropiezos."
    },
    pesectorial: {
        what: "Múltiplo P/E medio ponderado de las empresas competidoras del mismo sector.",
        indicates: "La referencia de valoración que el consenso del mercado asigna a la industria.",
        good: "P/E menor que el sectorial con idénticos o superiores márgenes y crecimiento de utilidades.",
        bad: "P/E muy superior a la competencia sin poseer una ventaja competitiva ni mayor rentabilidad."
    },
    primadescuento: {
        what: "Diferencia porcentual entre el precio actual y el valor intrínseco o múltiplos comparables.",
        indicates: "Si la cotización tiene un descuento por infravaloración o una prima por sobrevaloración.",
        good: "Descuento significativo (ej. -15% a -30%) con fundamentales estables y sin deterioro del negocio.",
        bad: "Prima excesiva (+25% a +50%) que reduce el margen de seguridad de la inversión."
    },
    marketcap: {
        what: "Capitalización bursátil total: precio por acción multiplicado por el total de acciones en circulación.",
        indicates: "El tamaño y escala institucional de la empresa en los mercados globales.",
        good: "Mega Cap (> $200B) y Large Cap (> $10B) brindan solidez, liquidez profunda y menor riesgo de quiebra.",
        bad: "Micro/Nano Caps sufren alta volatilidad, baja liquidez, riesgo de desliste y dilución recurrente."
    },
    volumenhoy: {
        what: "Número de acciones negociadas durante la jornada operativa actual.",
        indicates: "El nivel de actividad, liquidez e interés institucional en el activo hoy.",
        good: "Volumen alto acompañando subidas de precio confirma entrada de capital institucional fuerte.",
        bad: "Volumen seco genera spreads amplios y dificulta ejecutar órdenes grandes sin alterar el precio."
    },
    volprom30d: {
        what: "Promedio diario de acciones transaccionadas durante los últimos 30 días de mercado.",
        indicates: "La liquidez normal estructural que garantiza negociar sin slippage de precios.",
        good: "> 1,000,000 de acciones diarias permite entrar y salir de posiciones con agilidad y costo mínimo.",
        bad: "< 100,000 acciones diarias expone a problemas de liquidez y mayor vulnerabilidad a manipulación."
    },
    volrelativo: {
        what: "Relación entre el volumen operado en la sesión actual frente al promedio histórico a la misma hora.",
        indicates: "Si el mercado está experimentando un shock de volumen por noticias o catalizadores de peso.",
        good: "> 1.5x - 2.0x valida quiebres de soportes/resistencias con auténtico interés institucional.",
        bad: "< 0.7x refleja desinterés y aumenta el riesgo de falsos rompimientos técnicos (trampas de mercado)."
    },
    beta: {
        what: "Medida de sensibilidad y volatilidad de la acción comparada con el índice S&P 500 (Beta = 1.0).",
        indicates: "Cuánto amplifica la acción los movimientos del mercado general.",
        good: "Beta entre 0.7 y 1.2 para inversores prudentes; < 1.0 reduce la volatilidad en mercados bajistas.",
        bad: "Beta > 1.8 implica oscilaciones salvajes y correcciones mucho más agresivas durante caídas de mercado."
    },
    beta1y: {
        what: "Coeficiente Beta anualizado calculado en base a las fluctuaciones del último año bursátil.",
        indicates: "Sensibilidad reciente del precio frente a las variaciones del mercado global.",
        good: "Moderado y alineado al apetito por riesgo del inversor (ej. 0.8 a 1.2).",
        bad: "Valores muy extremos (> 2.0) exigen mayor tolerancia al riesgo y stops de protección más holgados."
    },

    // Crecimiento e Ingresos
    revenuettm: {
        what: "Facturación total acumulada durante los últimos 12 meses de actividad comercial.",
        indicates: "El volumen de negocio bruto y la tracción comercial que genera la compañía.",
        good: "Ingresos cuantiosos y con clara trayectoria ascendente trimestre tras trimestre.",
        bad: "Facturación estancada o en descenso sostenido por obsolescencia o pérdida de clientes."
    },
    crecimientoyoy: {
        what: "Tasa de crecimiento porcentual de ventas respecto al mismo trimestre del año anterior.",
        indicates: "La velocidad de expansión del negocio y la demanda actual de sus soluciones.",
        good: "> 12% - 20% en empresas en crecimiento; > 6% - 8% en empresas maduras consolidadas.",
        bad: "Crecimiento negativo (contracción comercial) o desaceleración brusca frente a trimestres previos."
    },
    cagr3anos: {
        what: "Tasa de Crecimiento Anual Compuesto (CAGR) de la facturación en los últimos 3 años.",
        indicates: "La consistencia y solidez del crecimiento del negocio a medio plazo.",
        good: "> 10% - 15% sostenido evidencia una ventaja competitiva durable frente al sector.",
        bad: "Valores planos o decrecientes revelan dificultades estructurales o ciclo negativo del sector."
    },
    arranualizado: {
        what: "Ingresos Recurrentes Anualizados (Annual Recurring Revenue) basados en contratos o suscripciones.",
        indicates: "La visibilidad y previsibilidad de los ingresos futuros garantizados.",
        good: "ARR en aumento con tasa de retención neta (NDR) superior al 110% (los clientes gastan más cada año).",
        bad: "Frenazo en nuevas contrataciones o aumento en la tasa de cancelación de suscriptores (churn)."
    },

    // Rentabilidad y Márgenes
    epsdiluido: {
        what: "Beneficio neto neto por acción teniendo en cuenta opciones, bonos convertibles y acciones diluidas.",
        indicates: "La ganancia neta líquida que le corresponde a cada acción individual del inversor.",
        good: "EPS positivo y en expansión constante año tras año superando las estimaciones de Wall Street.",
        bad: "EPS negativo (pérdidas recurrentes) o disminución sostenida que comprometa dividendos y solidez."
    },
    crecimientoeps: {
        what: "Variación porcentual interanual del beneficio por acción diluido (EPS Growth).",
        indicates: "Con qué rapidez crecen las ganancias disponibles para los accionistas.",
        good: "> 15% anual y creciendo a mayor velocidad que las ventas (apalancamiento operativo virtuoso).",
        bad: "Tasas negativas o crecimiento muy inferior al de ingresos (señal de compresión de márgenes)."
    },
    margenbruto: {
        what: "Porcentaje de ventas que queda tras restar los costos directos de producción de bienes o servicios.",
        indicates: "El poder de fijación de precios (Pricing Power) y la ventaja intrínseca del producto.",
        good: "> 60% - 75% en software y servicios digitales; > 35% en retail y manufactura.",
        bad: "< 20% o en declive constante debido a inflación de costos o guerras de precios destructivas."
    },
    margenoperativo: {
        what: "Beneficio de explotación (EBIT) dividido por los ingresos totales de la empresa.",
        indicates: "La eficiencia operativa descontando gastos de personal, marketing, I+D y administración.",
        good: "> 18% - 25% indica un negocio con control férreo de gastos y excelente rentabilidad operativa.",
        bad: "< 5% deja a la empresa en situación vulnerable ante cualquier caída leve en sus ventas."
    },
    margenneto: {
        what: "Porcentaje final de ingresos que se transforma en beneficio neto limpio para el accionista.",
        indicates: "El margen de ganancia final absoluto tras deducir impuestos, amortizaciones e intereses.",
        good: "> 12% - 20% refleja un modelo de negocio de alta calidad y elevada conversión a utilidades.",
        bad: "Margen ínfimo (< 3%) o negativo: la empresa trabaja para pagar costos sin retener utilidades."
    },
    margenebitda: {
        what: "EBITDA expresado como porcentaje sobre la facturación total.",
        indicates: "La capacidad pura del negocio para generar recursos operativos sin distorsiones fiscales ni de deuda.",
        good: "> 25% denota fortaleza operativa de primer nivel y capacidad para autofinanciarse.",
        bad: "< 10% refleja costes fijos elevados o escaso margen de maniobra ante crisis."
    },
    ebitoperativo: {
        what: "Resultado operativo antes de computar gastos financieros (intereses) e impuestos sobre beneficios.",
        indicates: "El rendimiento del núcleo de negocio puro sin importar la estructura de endeudamiento.",
        good: "EBIT positivo, robusto y con tendencia ascendente en los últimos ejercicios.",
        bad: "EBIT negativo continuo (el negocio quema dinero en su actividad cotidiana)."
    },
    ebitdattm: {
        what: "Beneficio antes de intereses, impuestos, depreciaciones y amortizaciones en los últimos 12 meses.",
        indicates: "Métrica estándar institucional para comparar flujos operativos entre empresas de capital dispar.",
        good: "EBITDA en crecimiento continuo y con correlación estrecha con el flujo de caja real.",
        bad: "EBITDA desalineado del flujo de caja o inflado con ajustes contables cuestionables."
    },
    roe: {
        what: "Rentabilidad sobre el Patrimonio Neto (Return on Equity): Beneficio Neto / Fondos Propios.",
        indicates: "La eficiencia con la que la directiva rentabiliza el dinero aportado por los accionistas.",
        good: "> 15% - 20% sostenido refleja una asignación de capital excepcional y alto retorno para el accionista.",
        bad: "< 8% es pobre, o ROE artificialmente elevado únicamente por endeudamiento desmedido."
    },
    roepatrimonio: {
        what: "Rentabilidad sobre el Patrimonio Neto (Beneficio Neto dividido entre Fondos Propios).",
        indicates: "Cuántos centavos de beneficio neto genera cada dólar de capital de los accionistas.",
        good: "> 15% regular sin recurrir a deuda peligrosa señala una ventaja competitiva real.",
        bad: "< 8% o con patrimonio neto negativo por acumulación de pérdidas históricas."
    },
    roa: {
        what: "Rentabilidad sobre Activos Totales (Return on Assets): Beneficio Neto / Activos Totales.",
        indicates: "Cuánta utilidad produce cada dólar invertido en infraestructura, patentes y activos de la empresa.",
        good: "> 7% - 10% (excepcional en empresas con fábricas, maquinaria o activos pesados).",
        bad: "< 3% denota activos ociosos, baja rotación o sobrecapacidad improductiva."
    },
    roaactivos: {
        what: "Rentabilidad sobre los Activos Totales de la compañía.",
        indicates: "La capacidad de la empresa para extraer beneficios de toda su base de activos globales.",
        good: "> 8% evidencia activos altamente productivos y bien gestionados.",
        bad: "< 3% evidencia ineficiencia en la explotación de la estructura de capital físico."
    },
    roic: {
        what: "Retorno sobre el Capital Invertido (Return on Invested Capital): NOPAT / (Deuda Financiera + Patrimonio).",
        indicates: "La métrica reina de calidad: capacidad de crear valor por encima del coste de capital (WACC).",
        good: "> 15% consistente a lo largo del ciclo confirma la presencia de un Foso Defensivo (Moat) formidable.",
        bad: "< 8% (o por debajo de la tasa de interés de la deuda) destruye valor para el accionista cada año."
    },
    roiccapitalinv: {
        what: "Retorno sobre el Capital Invertido: la medida más rigurosa de rentabilidad económica corporativa.",
        indicates: "Si la compañía es una máquina de reinvertir beneficios a altas tasas compuestas de interés.",
        good: "> 15% - 20% sostenido por 5+ años es el sello característico de las mejores empresas de la historia.",
        bad: "< 7% implica que la empresa ganaría más invirtiendo su dinero en bonos del tesoro sin riesgo."
    },
    roce: {
        what: "Retorno sobre el Capital Empleado (ROCE): EBIT / (Activos Totales - Pasivos Corrientes).",
        indicates: "La eficiencia del negocio en generar utilidades con todos los recursos a largo plazo disponibles.",
        good: "> 15% indica una sobresaliente gestión en la utilización combinada de deuda y patrimonio.",
        bad: "< 8% advierte de proyectos de inversión poco rentables o asignación ineficaz de capital."
    },
    rocecapempleado: {
        what: "Retorno sobre el Capital Empleado a largo plazo.",
        indicates: "Rendimiento del capital fijo y de trabajo que la empresa mantiene en su operación permanente.",
        good: "> 15% con tendencia alcista ratifica la solidez del negocio.",
        bad: "< 7% indica rentabilidad inferior al costo de oportunidad del dinero."
    },
    margenfcf: {
        what: "Margen de Flujo de Caja Libre: FCF dividido entre la Facturación Total (Revenue).",
        indicates: "Qué porcentaje de cada dólar que factura la empresa se convierte en dinero de libre uso disponible.",
        good: "> 15% - 25% otorga libertad total para recomprar acciones, pagar dividendos o adquirir rivales.",
        bad: "< 5% o negativo denota que la empresa necesita consumir casi toda su caja para sobrevivir."
    },

    // Flujo de Caja
    operatingcashflow: {
        what: "Dinero en efectivo neto generado por las operaciones comerciales directas de la empresa.",
        indicates: "La entrada de liquidez genuina por cobros a clientes restando pagos operativos y laborales.",
        good: "Mayor que el Beneficio Neto contable (indica utilidades limpias y de máxima calidad contable).",
        bad: "Menor que el beneficio o negativo (las ventas son a crédito y no se cobran, inflando la contabilidad)."
    },
    freecashflow: {
        what: "Flujo de Caja Libre: Flujo de Caja Operativo menos los Gastos de Capital en activos fijos (CapEx).",
        indicates: "El dinero soberano disponible para los accionistas tras asegurar el mantenimiento del negocio.",
        good: "Positivo, cuantioso y con trayectoria creciente sostenida año a año.",
        bad: "Negativo recurrente: obliga a la empresa a pedir préstamos caros o emitir nuevas acciones dilutivas."
    },
    capex: {
        what: "Gastos de Capital (Capital Expenditures): inversión en servidores, plantas, maquinaria o tecnología.",
        indicates: "Cuánto dinero gasta la empresa en mantener su infraestructura o crear capacidad futura.",
        good: "CapEx disciplinado y rentable, donde cada dólar invertido genera un retorno (ROIC) superior al 15%.",
        bad: "CapEx desmesurado que no produce un aumento visible en ventas ni en flujo libre posterior."
    },
    capexinversion: {
        what: "Gasto en Capital Fijo e Inversiones estructurales de la compañía.",
        indicates: "La intensidad de capital necesaria para sostener la actividad comercial de la empresa.",
        good: "CapEx bajo en relación a las ventas (negocios Asset-Light) que permite escalar con poco costo.",
        bad: "CapEx devorador de caja que deja poco o ningún flujo libre para el inversor."
    },
    fcfyield: {
        what: "Rendimiento del Flujo de Caja Libre: FCF por acción dividido por la cotización de la acción.",
        indicates: "La rentabilidad real en dinero en efectivo que recibes por cada dólar que pagas hoy por la acción.",
        good: "> 5% - 7% señala una acción a precio muy ventajoso o con excelente generación de efectivo.",
        bad: "< 2% o negativo: estás pagando múltiplos altísimos que no devuelven caja libre a corto plazo."
    },
    fcfporaccion: {
        what: "Flujo de Caja Libre dividido entre el número total de acciones en circulación.",
        indicates: "El efectivo disponible neto que genera la empresa por cada acción en tu cartera.",
        good: "Creciente año tras año, preferentemente por encima de la tasa de inflación y del precio de la acción.",
        bad: "Decreciente o insuficiente para sostener el pago del dividendo prometido."
    },
    convgananciaacaja: {
        what: "Porcentaje del Beneficio Neto que se traduce efectivamente en Flujo de Caja Libre (FCF Conversion).",
        indicates: "La pureza de las ganancias contables y la ausencia de maquillaje financiero.",
        good: "> 85% - 100% confirma que los beneficios se cobran íntegramente en efectivo contable.",
        bad: "< 50% advierte de inventarios acumulados, impagos de clientes o trucos contables agresivos."
    },

    // Balance y Solvencia
    efectivocash: {
        what: "Caja en cuentas bancarias e inversiones a corto plazo de inmediata liquidez.",
        indicates: "El colchón de liquidez disponible para emergencias, oportunidades de compra o supervivencia.",
        good: "Caja abundante que supere holgadamente los vencimientos de deuda de los próximos 24 meses.",
        bad: "Caja exigua con vencimientos inminentes, que forzaría ampliaciones de capital de emergencia."
    },
    cash: {
        what: "Total de efectivo y equivalentes disponibles inmediatamente.",
        indicates: "Poder de fuego financiero para afrontar caídas del mercado o crisis de crédito.",
        good: "Posición sólida de tesorería y gestión prudente del capital circulante.",
        bad: "Posición precaria que dependa de líneas de crédito bancarias para pagar nóminas."
    },
    deudatotal: {
        what: "Suma de todas las deudas financieras a corto y largo plazo que conllevan pago de intereses.",
        indicates: "La carga de obligaciones bancarias y emisiones de bonos acumulada por la empresa.",
        good: "Moderada y respaldada por activos productivos y flujos de caja predecibles.",
        bad: "Deuda gigante con vencimientos concentrados o contraída a tipo de interés variable en épocas duras."
    },
    deudaneta: {
        what: "Deuda Total menos el Efectivo disponible: (Deuda Financiera - Caja y Equivalentes).",
        indicates: "La deuda real pendiente si la compañía liquidara toda su caja hoy para amortizar créditos.",
        good: "Negativa (Caja Neta: la empresa tiene más dinero guardado en el banco que toda su deuda total).",
        bad: "Positiva y desproporcionada frente al EBITDA o al Flujo de Caja Operativo anual."
    },
    netdebttoebitda: {
        what: "Deuda Neta dividida entre el EBITDA anual de la empresa.",
        indicates: "Cuántos años de beneficio operativo tardaría la empresa en liquidar toda su deuda neta.",
        good: "< 1.5x es extraordinariamente seguro; ≤ 2.0x es el límite recomendado de solvencia.",
        bad: "> 3.5x - 4.0x enciende alarmas de insolvencia y peligro de rebaja de calificación crediticia."
    },
    ratiocorriente: {
        what: "Activo Corriente dividido por Pasivo Corriente (Current Ratio).",
        indicates: "Capacidad de la compañía para cumplir con todas sus deudas y compromisos en menos de 12 meses.",
        good: "Entre 1.5x y 2.5x refleja liquidez sobrada para operar con total tranquilidad.",
        bad: "< 1.0x indica riesgo de déficit de capital de trabajo y tensión de pagos a proveedores."
    },
    pruebaacida: {
        what: "Liquidez Inmediata (Quick Ratio): (Activo Corriente menos Inventarios) dividido por Pasivo Corriente.",
        indicates: "Capacidad de pagar deudas a corto plazo sin depender de vender inventarios ni mercancía en almacén.",
        good: "> 1.0x asegura que la caja y las cuentas por cobrar cubren con creces las obligaciones inmediatas.",
        bad: "< 0.8x deja a la empresa desprotegida si las ventas se frenan inesperadamente."
    },
    activostotales: {
        what: "Valor total de todos los recursos económicos, bienes y derechos en propiedad de la empresa.",
        indicates: "La escala patrimonial global y capacidad productiva instalada.",
        good: "Activos limpios y eficientes que generan altos retornos sobre el capital (ROA elevado).",
        bad: "Activos inflados con fondos de comercio (Goodwill) que puedan sufrir deterioros repentinos."
    },
    pasivostotales: {
        what: "Suma de todas las obligaciones de pago, deudas comerciales, laborales y financieras.",
        indicates: "El monto total de derechos que los acreedores tienen sobre los bienes de la entidad.",
        good: "Menores que los activos totales, con predominio de financiamiento a largo plazo.",
        bad: "Superiores a los activos (patrimonio neto negativo o quiebra técnica)."
    },
    patrimonioneto: {
        what: "Activos Totales menos Pasivos Totales (Book Value o Fondos Propios de los accionistas).",
        indicates: "El valor contable residual neto que pertenece formalmente a los inversores.",
        good: "Positivo y en constante expansión por reinversión virtuosa de los beneficios anuales.",
        bad: "En declive sistemático por pérdidas operativas continuadas o recompras imprudentes de acciones."
    },
    deudalargoplazo: {
        what: "Deuda financiera con vencimiento posterior a 12 meses (bonos senior, préstamos bancarios sindicados).",
        indicates: "Financiamiento de largo plazo utilizado para inversiones y expansión estructural.",
        good: "Pactada a tipo de interés fijo y con vencimientos bien escalonados a 5, 10 o más años.",
        bad: "Vencimientos concentrados en un único año que obliguen a refinanciar a tasas mucho peores."
    },
    deudacortoplazo: {
        what: "Porción de la deuda financiera que vence en los próximos 12 meses.",
        indicates: "La urgencia de liquidez y pago inmediato que debe afrontar la tesorería de la compañía.",
        good: "Baja y holgadamente cubierta por el saldo de efectivo en caja sin necesidad de pedir nuevos créditos.",
        bad: "Mayor que la caja disponible en un entorno de tipos altos o congelamiento del crédito."
    },
    coberturaintereses: {
        what: "Ratio de Cobertura de Intereses: EBIT dividido por los Gastos Financieros anuales por intereses.",
        indicates: "Cuántas veces el beneficio de la operación cubre el costo del pago de intereses de la deuda.",
        good: "> 5x - 8x garantiza solvencia holgada aun si los ingresos operativos sufren un revés.",
        bad: "< 2.0x indica fragilidad extrema: un traspié comercial comprometería el pago de intereses."
    },

    // Estructura Accionaria y Sentimiento
    accionesencirculacion: {
        what: "Número total de acciones emitidas en poder de inversores públicos, directivos y fondos.",
        indicates: "La base de títulos sobre la que se reparten los beneficios y dividendos de la empresa.",
        good: "Número decreciente año tras año por recompras de acciones (aumenta tu participación automáticamente).",
        bad: "Número en aumento constante por dilución excesiva de compensaciones en acciones (SBC)."
    },
    tenenciainstitucional: {
        what: "Porcentaje del capital en manos de fondos de inversión, fondos de pensiones y ETFs globales.",
        indicates: "El respaldo del 'Smart Money' e inversores institucionales profesionales.",
        good: "Entre 60% y 85% asegura liquidez profunda, auditoría institucional y demanda estable.",
        bad: "> 95% (riesgo de ventas en cascada) o < 20% (falta total de interés institucional)."
    },
    tenenciainsiders: {
        what: "Porcentaje de acciones en manos de fundadores, directores ejecutivos y miembros del consejo.",
        indicates: "Alineación de intereses entre quienes toman las decisiones y los accionistas comunes.",
        good: "> 5% - 15% en medianas empresas asegura que los directivos cuidan el negocio como propio.",
        bad: "< 0.5% indica que los directivos no tienen capital en juego y priorizan sus bonus a corto plazo."
    },
    shortinterest: {
        what: "Porcentaje del total de acciones en circulación vendidas en corto (apostando a la caída del precio).",
        indicates: "El nivel de escepticismo o ataque bajista de fondos de cobertura contra la empresa.",
        good: "< 3% refleja confianza general; > 15% puede provocar un brutal 'Short Squeeze' alcista.",
        bad: "> 10% - 20% suele anticipar que fondos de cobertura han descubierto irregularidades graves."
    },
    shortfloat: {
        what: "Porcentaje de las acciones de libre flotación (Float) prestadas y vendidas a la baja.",
        indicates: "La presión vendedora en corto respecto al inventario de acciones verdaderamente negociables.",
        good: "< 4% indica normalidad en el mercado; niveles extremos aumentan la propensión a squeezes violentos.",
        bad: "Niveles muy altos en empresas endeudadas suelen terminar en desplomes prolongados."
    },
    dilucionvariacionneta: {
        what: "Cambio porcentual anual en el número total de acciones emitidas por la compañía.",
        indicates: "Si la empresa está recomprando acciones (creando valor) o imprimiendo títulos (destruyendo valor).",
        good: "Negativo (-1% a -4% anual): la empresa reduce el flotante y potencia el beneficio por acción.",
        bad: "> 3% anual positivo: tus acciones valen cada año un porcentaje menor del negocio global."
    },
    volatilidadhistorica: {
        what: "Desviación estándar anualizada de los rendimientos del precio de la acción.",
        indicates: "La magnitud típica de las subidas y bajadas que experimenta la cotización.",
        good: "Moderada (15% - 25% en valores consolidados) para perfiles inversores equilibrados.",
        bad: "> 50% somete al inversor a una montaña rusa emocional y exige tolerancia al riesgo muy alta."
    },
    volatilidad: {
        what: "Medida de la variabilidad o dispersión del precio en el tiempo.",
        indicates: "El nivel de riesgo e incertidumbre en las oscilaciones diarias de la acción.",
        good: "Estable y predecible, permitiendo fijar objetivos de salida y stops técnicos eficientes.",
        bad: "Picos extremos de volatilidad que rompen soportes y disparan órdenes de venta por pánico."
    },

    // Análisis Técnico y Tendencia
    rsi14d: {
        what: "Índice de Fuerza Relativa (RSI de 14 sesiones): oscilador de momentum entre 0 y 100.",
        indicates: "Si el activo está experimentando sobrecompra o sobreventa excesiva a corto plazo.",
        good: "Entre 45 y 60 en tendencias alcistas sanas, o rebotes saliendo de zonas de sobreventa (< 30).",
        bad: "> 70 - 80 alerta sobrecompra extrema (riesgo de corrección inmediata); < 30 debilidad acusada."
    },
    rsi: {
        what: "Oscilador RSI de momentum que mide la velocidad y magnitud de los movimientos recientes de precio.",
        indicates: "Presión compradora vs presión vendedora en el marco temporal de 14 ruedas.",
        good: "Consolidación en niveles de 50-65 con rupturas alcistas del precio.",
        bad: "Divergencias bajistas (precio hace nuevos máximos pero el RSI marca máximos decrecientes)."
    },
    sma20: {
        what: "Media Móvil Simple de las últimas 20 sesiones (aproximadamente un mes de mercado).",
        indicates: "La dirección y soporte dinámico de la tendencia a corto plazo.",
        good: "Precio cotizando firmemente por encima de la SMA 20 con pendiente alcista.",
        bad: "Pérdida de la SMA 20 con vela bajista amplia y aumento de volumen vendedor."
    },
    sma50: {
        what: "Media Móvil Simple de 50 sesiones (referencia reina de medio plazo para fondos e instituciones).",
        indicates: "La tendencia estructural de mediano plazo y principal soporte institucional.",
        good: "El precio se apoya en ella para reanudar compras y cotiza por encima de forma continuada.",
        bad: "Ruptura a la baja de la SMA 50 suele desencadenar una fase correctiva prolongada."
    },
    sma100: {
        what: "Media Móvil Simple de 100 sesiones de mercado.",
        indicates: "La tendencia intermedia entre el horizonte táctico y el estratégico institucional.",
        good: "Pendiente positiva actuando como zona elástica de rebote en correcciones sanas.",
        bad: "Pérdida del nivel y resistencia dinámica al intentar recuperar la tendencia previa."
    },
    sma200: {
        what: "Media Móvil Simple de 200 sesiones: la línea divisoria oficial de Wall Street entre alcista y bajista.",
        indicates: "El régimen macroeconómico del activo a largo plazo.",
        good: "Precio por encima de la SMA 200 con la media apuntando al alza (sesgo estructural alcista).",
        bad: "Cotizar por debajo de la SMA 200 sitúa al activo en régimen bajista (mercado bajista / bear market)."
    },
    atr: {
        what: "Average True Range (Rango Medio Verdadero): mide la amplitud del movimiento diario en dólares.",
        indicates: "La volatilidad real que se espera que el precio recorra en una jornada habitual.",
        good: "Excelente para colocar Stop-Loss basados en volatilidad (ej. a 2x ATR del punto de entrada).",
        bad: "Subidas descontroladas del ATR coinciden con momentos de pánico o noticias imprevistas."
    },
    tendencia: {
        what: "Dirección técnica predominante observada en la estructura de máximos y mínimos del activo.",
        indicates: "Hacia dónde se inclina la probabilidad estadística de los próximos movimientos.",
        good: "'Alcista': máximos y mínimos crecientes respetando soportes y medias móviles clave.",
        bad: "'Bajista': máximos decrecientes; operar compras contra tendencia reduce drásticamente las chances de éxito."
    },

    // Perfil Corporativo
    ceoliderazgo: {
        what: "Director General (CEO) y equipo ejecutivo al frente del liderazgo de la empresa.",
        indicates: "La visión estratégica, cultura de ejecución y asignación de capital corporativo.",
        good: "Líder con historial probado de creación de valor, alta reputación y alineación accionaria.",
        bad: "Cambios continuos de CEO, remuneraciones desproporcionadas o escándalos de gobernanza."
    },
    anodefundacion: {
        what: "Año en el que se constituyó formalmente la compañía.",
        indicates: "Madurez corporativa, capacidad de superar crisis históricas y longevidad del negocio.",
        good: "Empresas con décadas de trayectoria que han demostrado adaptabilidad a múltiples ciclos económicos.",
        bad: "Empresas extremadamente jóvenes sin probar su rentabilidad frente a una recesión severa."
    },
    empleados: {
        what: "Total de colaboradores en plantilla activa a tiempo completo en todo el mundo.",
        indicates: "La magnitud de la organización y su productividad laboral (Ingresos por Empleado).",
        good: "Plantilla eficiente con alto revenue por empleado gracias a automatización y tecnología.",
        bad: "Estructuras burocráticas pesadas con despidos masivos recurrentes por sobrecontratación."
    },
    cuotademercado: {
        what: "Porcentaje de ventas totales de la industria que están en manos de la compañía.",
        indicates: "El grado de dominio, liderazgo y barreras de entrada que tiene frente a sus rivales.",
        good: "Líder indiscutido con cuota creciente o posición de oligopolio difícil de replicar.",
        bad: "Pérdida sostenida de cuota ante competidores más innovadores o con costes más bajos."
    }
};

function getMetricGuide(label: string): MetricGuideInfo {
    const cleanKey = label.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Búsqueda directa
    if (METRIC_GUIDES[cleanKey]) {
        return METRIC_GUIDES[cleanKey];
    }

    // Búsqueda aproximada por palabras clave
    if (cleanKey.includes('peratio') || cleanKey.includes('pe') || cleanKey.includes('forwardpe')) {
        return METRIC_GUIDES.peratio;
    }
    if (cleanKey.includes('peg')) {
        return METRIC_GUIDES.pegratio;
    }
    if (cleanKey.includes('sales') || cleanKey.includes('ventas')) {
        return METRIC_GUIDES.pricetosales;
    }
    if (cleanKey.includes('book') || cleanKey.includes('libros')) {
        return METRIC_GUIDES.pricetobook;
    }
    if (cleanKey.includes('mercado') || cleanKey.includes('marketcap') || cleanKey.includes('capbursatil')) {
        return METRIC_GUIDES.marketcap;
    }
    if (cleanKey.includes('evingreso') || cleanKey.includes('evrevenue')) {
        return METRIC_GUIDES.evtorevenue;
    }
    if (cleanKey.includes('ebitda')) {
        return METRIC_GUIDES.evtoebitda;
    }
    if (cleanKey.includes('dividend')) {
        return METRIC_GUIDES.dividendyield;
    }
    if (cleanKey.includes('revenue') || cleanKey.includes('ingreso') || cleanKey.includes('ventas')) {
        return METRIC_GUIDES.revenuettm;
    }
    if (cleanKey.includes('eps')) {
        return METRIC_GUIDES.epsdiluido;
    }
    if (cleanKey.includes('margen') || cleanKey.includes('margin')) {
        return METRIC_GUIDES.margenoperativo;
    }
    if (cleanKey.includes('fcf') || cleanKey.includes('caja')) {
        return METRIC_GUIDES.freecashflow;
    }
    if (cleanKey.includes('roe')) {
        return METRIC_GUIDES.roe;
    }
    if (cleanKey.includes('roic')) {
        return METRIC_GUIDES.roic;
    }
    if (cleanKey.includes('roa')) {
        return METRIC_GUIDES.roa;
    }
    if (cleanKey.includes('deuda') || cleanKey.includes('debt')) {
        return METRIC_GUIDES.deudatotal;
    }
    if (cleanKey.includes('cash') || cleanKey.includes('efectivo')) {
        return METRIC_GUIDES.efectivocash;
    }
    if (cleanKey.includes('beta')) {
        return METRIC_GUIDES.beta;
    }
    if (cleanKey.includes('short')) {
        return METRIC_GUIDES.shortinterest;
    }
    if (cleanKey.includes('volumen') || cleanKey.includes('volume')) {
        return METRIC_GUIDES.volumenhoy;
    }
    if (cleanKey.includes('rsi')) {
        return METRIC_GUIDES.rsi14d;
    }
    if (cleanKey.includes('sma')) {
        return METRIC_GUIDES.sma50;
    }
    if (cleanKey.includes('volatilidad')) {
        return METRIC_GUIDES.volatilidadhistorica;
    }

    // Fallback general inteligente
    return {
        what: `Métrica fundamental o técnica calculada para analizar ${label}.`,
        indicates: `Parámetro de referencia para medir la eficiencia, solvencia o valuación de la empresa en el mercado.`,
        good: `Valores consistentes, crecientes o alineados favorablemente frente al promedio del sector industrial.`,
        bad: `Deterioro sistemático frente a trimestres anteriores o desviación negativa notable ante sus pares directos.`
    };
}

// ─── SUB-COMPONENTE: TARJETA DE MÉTRICA INDIVIDUAL CON GUÍA DESPLEGABLE ────────
function MetricBox({ label, value, unit = '', highlight = false, badge = '', tooltip = '' }: { 
    label: string; 
    value: any; 
    unit?: string; 
    highlight?: boolean; 
    badge?: string;
    tooltip?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    if (value === null || value === undefined || value === '') return null;

    const guide = getMetricGuide(label);

    return (
        <div 
            onClick={() => setIsOpen(prev => !prev)}
            className={`relative rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer group select-none ${
                isOpen
                    ? 'ring-2 ring-primary/40 shadow-2xl shadow-primary/10 bg-card/95 border-primary/40'
                    : 'bg-card/75 hover:bg-card/95 border-border/60 hover:border-primary/40 shadow-xs hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5'
            }`}
            style={{
                backdropFilter: 'blur(16px)',
            }}
        >
            {/* Top gradient accent line */}
            <div
                className={`absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${
                    isOpen 
                        ? 'opacity-100 bg-gradient-to-r from-primary via-emerald-400 to-teal-400' 
                        : 'opacity-0 group-hover:opacity-70 bg-gradient-to-r from-transparent via-primary to-transparent'
                }`}
            />

            <div className="p-4 sm:p-5">
                {/* ── Header row ── */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start gap-1.5 min-h-[28px] sm:min-h-[32px]">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 transition-colors ${
                                isOpen ? 'bg-primary' : 'bg-primary/50 group-hover:bg-primary'
                            }`} />
                            <span
                                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground block leading-tight sm:leading-snug whitespace-normal break-words"
                                title={label}
                            >
                                {label}
                            </span>
                        </div>

                        {/* ── Main value ── */}
                        <div className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                            highlight
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400'
                                : 'text-foreground'
                        }`}>
                            {value}
                            {unit && (
                                <span className="text-sm sm:text-base font-bold text-muted-foreground/70 ml-1">
                                    {unit}
                                </span>
                            )}
                        </div>

                        {/* Tooltip hint (when closed) */}
                        {tooltip && !isOpen && (
                            <p className="text-[11px] text-muted-foreground/75 font-medium leading-tight line-clamp-2 pt-0.5">
                                {tooltip}
                            </p>
                        )}
                    </div>

                    {/* ── Right side: badge + interactive guide button ── */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {badge && (
                            <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border bg-primary/10 border-primary/30 text-primary tracking-wider uppercase">
                                {badge}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(prev => !prev);
                            }}
                            aria-expanded={isOpen}
                            title={isOpen ? 'Cerrar interpretación' : 'Ver interpretación'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                isOpen
                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/40'
                                    : 'bg-muted/50 hover:bg-primary/15 text-muted-foreground hover:text-primary border border-border/60 hover:border-primary/30'
                            }`}
                        >
                            {isOpen ? (
                                <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Cerrar</span>
                                </>
                            ) : (
                                <>
                                    <HelpCircle className="w-3.5 h-3.5 text-primary/70" />
                                    <span className="hidden sm:inline text-[9px]">Info</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Expandable guide ── */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pt-3 mt-1.5 border-t border-border/50 space-y-3">

                            {/* ¿Qué es? */}
                            <div className="space-y-1 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                                <div className="flex items-center gap-1.5">
                                    <span className="p-0.5 rounded-md bg-primary/10 text-primary">
                                        <Info className="w-3 h-3" />
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                        ¿Qué es?
                                    </span>
                                </div>
                                <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/90 font-medium pl-1">
                                    {guide.what}
                                </p>
                            </div>

                            {/* ¿Qué indica? */}
                            <div className="space-y-1 bg-muted/20 p-2.5 rounded-xl border border-border/40">
                                <div className="flex items-center gap-1.5">
                                    <span className="p-0.5 rounded-md bg-sky-500/10 text-sky-500">
                                        <TrendingUp className="w-3 h-3" />
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
                                        ¿Qué indica?
                                    </span>
                                </div>
                                <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/90 font-medium pl-1">
                                    {guide.indicates}
                                </p>
                            </div>

                            {/* Escenario Favorable y Punto de Cautela */}
                            <div className="grid grid-cols-1 gap-2.5 pt-0.5">
                                {/* ✅ Escenario Favorable */}
                                <div className="rounded-xl p-3 sm:p-3.5 space-y-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                                            ¿Qué es favorable?
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-[12px] leading-relaxed text-emerald-950 dark:text-emerald-100 font-semibold pl-1">
                                        {guide.good}
                                    </p>
                                </div>

                                {/* ⚠ Punto de Cautela */}
                                <div className="rounded-xl p-3 sm:p-3.5 space-y-1.5 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-500/20 shadow-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">
                                            Punto de Cautela / Alerta
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-[12px] leading-relaxed text-rose-950 dark:text-rose-100 font-semibold pl-1">
                                        {guide.bad}
                                    </p>
                                </div>
                            </div>

                            {/* Botón de cierre rápido al pie */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="w-full pt-1.5 pb-0.5 text-center text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider flex items-center justify-center gap-1 opacity-70 hover:opacity-100 cursor-pointer"
                            >
                                <ChevronUp className="w-3 h-3" />
                                <span>Cerrar guía</span>
                            </button>

                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// ─── PÁGINA PRINCIPAL: CATÁLOGO O DETALLE ───────────────────────────────────
export default function Analysis() {
    const { slug } = useParams<{ slug?: string }>();
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const { theme: prefTheme } = usePreferencesStore();

    const isDark = prefTheme === 'dark' || (prefTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
    const chartGridStroke = isDark ? '#27272a' : '#e4e4e7';
    const chartAxisStroke = isDark ? '#71717a' : '#a1a1aa';
    const chartTooltipStyle = {
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderColor: isDark ? '#27272a' : '#e4e4e7',
        color: isDark ? '#f4f4f5' : '#18181b',
        borderRadius: '12px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    };

    const [catalog, setCatalog] = useState<any[]>([]);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [isProRestricted, setIsProRestricted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const isPro = Boolean(
        (user as any)?.plan === 'PRO' ||
        (user as any)?.accountType === 'PRO' ||
        (user as any)?.role === 'ADMIN' ||
        (user as any)?.isPro ||
        (user as any)?.subscriptionTier === 'pro' ||
        isJuanUser(user)
    );

    useEffect(() => {
        if (!isPro) {
            setLoading(false);
            return;
        }
        if (slug) {
            fetchDetail(slug);
        } else {
            fetchCatalog();
        }
    }, [slug, user, isPro]);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(`/analysis?_t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setCatalog(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetail = async (targetSlug: string) => {
        try {
            setLoading(true);
            const res = await apiFetch(`/analysis/${targetSlug}?_t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                setAnalysisData(json.data);
                setIsProRestricted(Boolean(json.isProRestricted));
            } else if (res.status === 404) {
                setAnalysisData(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Cargando Análisis Finix Pro...</span>
            </div>
        );
    }

    if (!isPro) {
        return (
            <div className="min-h-[calc(100vh-60px)] flex flex-col flex-1 bg-background">
                <ProGate
                    section="analysis"
                    buttonText="Activar Finix PRO"
                    onUpgrade={() => navigate('/pricing')}
                />
            </div>
        );
    }

    // VISTA 1: CATÁLOGO / DIRECTORIO DE ANÁLISIS DISPONIBLES (si no hay slug)
    if (!slug) {
        const filtered = catalog.filter(item => 
            (item.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.ticker || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.sector || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="w-full max-w-full py-10 px-4 sm:px-6 lg:px-8 xl:px-10 space-y-10 pb-28">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mb-3">
                            <Star className="w-4 h-4 fill-primary" /> Finix Pro Research
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
                            Análisis Profundo de Acciones
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground mt-3 max-w-2xl font-normal leading-relaxed">
                            Informes cuantitativos y fundamentales estructurados por nuestro equipo de analistas.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 max-w-md w-full">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar ticker o empresa..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border/60 text-sm sm:text-base font-medium focus:outline-none focus:border-primary shadow-xs"
                            />
                        </div>
                        <button
                            onClick={() => slug ? fetchDetail(slug) : fetchCatalog()}
                            disabled={loading}
                            className="p-3.5 rounded-2xl border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 shadow-xs"
                            title="Actualizar análisis"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <Link to="/market?view=value-creation" className="group flex flex-col gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-card to-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Nueva herramienta fundamental</p>
                            <h2 className="mt-1 text-xl font-black text-foreground">Radar ROIC vs WACC · Creación real de valor</h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Explorá el S&P 500 completo por spread de valor: quién crea riqueza sobre su coste de capital y quién la destruye.</p>
                        </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">Abrir radar <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                </Link>

                {filtered.length === 0 ? (
                    <div className="p-16 text-center rounded-3xl border border-border/50 bg-card/40 space-y-4">
                        <BarChart3 className="w-16 h-16 text-muted-foreground/40 mx-auto" />
                        <h3 className="text-2xl font-black text-foreground">No se encontraron análisis</h3>
                        <p className="text-lg text-muted-foreground">Pronto publicaremos nuevos informes de activos financieros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((item) => (
                            <motion.div 
                                key={item.id} 
                                whileHover={{ y: -4 }}
                                onClick={() => navigate(`/analysis/${item.slug || item.ticker?.toLowerCase()}`)}
                                className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer space-y-6 shadow-sm hover:shadow-xl group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {item.logoUrl ? (
                                            <img src={item.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-contain bg-white/5 border border-border/50 p-2.5 shrink-0" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-lg border border-primary/20 shrink-0">
                                                {item.ticker || 'STK'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-snug">{item.companyName}</h3>
                                                {item.status === 'DRAFT' && (
                                                    <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                                        Borrador
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm sm:text-base text-muted-foreground font-semibold block mt-1">{item.ticker} • {item.sector || 'Mercado'}</span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                </div>

                                <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                                    {item.currentPrice && (
                                        <div>
                                            <span className="text-muted-foreground block text-xs sm:text-sm font-bold uppercase tracking-wider">Precio Actual</span>
                                            <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                                                <span className="font-black text-foreground text-2xl sm:text-3xl">${Number(item.currentPrice).toFixed(2)}</span>
                                                {item.dailyChange && (
                                                    <span className={`text-xs sm:text-sm font-black ${Number(item.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {Number(item.dailyChange) >= 0 ? '+' : ''}{Number(item.dailyChange).toFixed(2)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {item.estimatedFairValue && (
                                        <div>
                                            <span className="text-muted-foreground block text-xs sm:text-sm font-bold uppercase tracking-wider">Fair Value</span>
                                            <span className="font-black text-primary text-2xl sm:text-3xl block mt-1">${Number(item.estimatedFairValue).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // VISTA 2: INFORME DE ANÁLISIS DE LA ACCIÓN
    if (!analysisData) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
                <Target className="w-12 h-12 text-muted-foreground/40 mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">Análisis no disponible</h2>
                <p className="text-sm text-muted-foreground">No encontramos un reporte para "{slug}".</p>
                <Button onClick={() => navigate('/analysis')} variant="outline">
                    ← Ver todos los análisis
                </Button>
            </div>
        );
    }

    const a = analysisData;
    const visibility = a.sectionVisibility || {};
    const summary = a.executiveSummary;
    const businessModel = a.businessModel || [];
    const competitors = a.competitorsData || [];
    const series = a.historicalSeries || {};
    const tech = a.technicalData || {};
    const risks = a.risksData || [];
    const catalysts = a.catalystsData || [];
    const scenarios = a.scenariosData;
    const swot = a.swotData;
    const methodology = a.valuationMethodology;

    return (
        <div className="w-full max-w-full py-10 px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12 pb-36">
            {/* Navegación Superior */}
            <div className="flex items-center justify-between">
                <Link to="/analysis" className="inline-flex items-center gap-2.5 text-base sm:text-lg font-black text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Volver al catálogo de análisis
                </Link>
                <span className="text-sm sm:text-base font-bold text-muted-foreground">
                    Actualizado: {new Date(a.updatedAt || Date.now()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
            </div>

            {/* 1. HEADER PRINCIPAL */}
            <div className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-sm space-y-9">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {a.logoUrl ? (
                            <img src={a.logoUrl} alt="" className="w-22 h-22 rounded-2xl object-contain bg-white/5 border border-border/50 p-3 shrink-0" />
                        ) : (
                            <div className="w-22 h-22 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-3xl border border-primary/20 shrink-0">
                                {a.ticker || 'STK'}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3.5 mb-2 flex-wrap">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight">{a.companyName || a.symbol}</h1>
                                <span className="text-base sm:text-lg font-black text-muted-foreground bg-muted px-4 py-1 rounded-xl border border-border/50">
                                    {a.ticker}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base font-bold text-muted-foreground">
                                {a.exchange && <span className="bg-primary/10 text-primary font-black px-3 py-1 rounded-lg">{a.exchange}</span>}
                                {a.sector && <span className="bg-muted px-3 py-1 rounded-lg text-foreground font-black">{a.sector}</span>}
                                {a.industry && <span>• {a.industry}</span>}
                                {a.country && <span>• {a.country}</span>}
                            </div>
                        </div>
                    </div>

                    {a.currentPrice && (
                        <div className="sm:text-right bg-muted/30 sm:bg-transparent p-5 sm:p-0 rounded-2xl border border-border/40 sm:border-none">
                            <div className="text-5xl sm:text-7xl font-black text-foreground">${Number(a.currentPrice).toFixed(2)}</div>
                            <div className={`text-lg sm:text-xl font-black flex items-center sm:justify-end gap-1.5 mt-1.5 ${Number(a.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(a.dailyChange) >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                {Number(a.dailyChange) >= 0 ? '+' : ''}{Number(a.dailyChange || 0).toFixed(2)}% hoy
                            </div>
                        </div>
                    )}
                </div>

                {/* Desglose de Rendimientos Periódicos de TradingView */}
                {(a.dailyChange !== null || a.weeklyChange !== null || a.monthlyChange !== null || a.yearlyChange !== null) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5 border-t border-border/40">
                        <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-wider">1 Día</span>
                            <span className={`text-base sm:text-lg font-black flex items-center gap-0.5 ${Number(a.dailyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(a.dailyChange) >= 0 ? '+' : ''}{Number(a.dailyChange || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-wider">1 Semana</span>
                            <span className={`text-base sm:text-lg font-black flex items-center gap-0.5 ${Number(a.weeklyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(a.weeklyChange) >= 0 ? '+' : ''}{Number(a.weeklyChange || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-wider">1 Mes</span>
                            <span className={`text-base sm:text-lg font-black flex items-center gap-0.5 ${Number(a.monthlyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(a.monthlyChange) >= 0 ? '+' : ''}{Number(a.monthlyChange || 0).toFixed(2)}%
                            </span>
                        </div>
                        <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-wider">1 Año</span>
                            <span className={`text-base sm:text-lg font-black flex items-center gap-0.5 ${Number(a.yearlyChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(a.yearlyChange) >= 0 ? '+' : ''}{Number(a.yearlyChange || 0).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Métricas de Mercado y Liquidez */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-2">
                    <MetricBox 
                        label="Cap. de Mercado" 
                        value={formatCurrency(a.marketCap, true)} 
                        tooltip="Capitalización bursátil total" 
                    />
                    <MetricBox 
                        label="P/E Ratio" 
                        value={a.peRatio ? Number(a.peRatio).toFixed(1) : null} 
                        unit="x" 
                        highlight 
                        tooltip="Precio sobre Beneficios" 
                    />
                    <MetricBox 
                        label="Volumen Hoy" 
                        value={formatNumber(a.volume, true)} 
                        tooltip="Acciones negociadas hoy" 
                    />
                    <MetricBox 
                        label="Vol. Prom. (30D)" 
                        value={formatNumber(a.avgVolume, true)} 
                        tooltip="Volumen promedio diario de 30 días" 
                    />
                    <MetricBox 
                        label="Vol. Relativo" 
                        value={a.relativeVolume ? Number(a.relativeVolume).toFixed(2) : null} 
                        unit="x" 
                        highlight 
                        tooltip="Volumen actual respecto al promedio" 
                    />
                    <MetricBox 
                        label="Beta (1Y)" 
                        value={a.beta ? Number(a.beta).toFixed(2) : null} 
                        tooltip="Sensibilidad y volatilidad frente al mercado" 
                    />
                </div>

                {/* Rango de Precios 52 Semanas Interactivo */}
                {a.high52w && a.low52w && (
                    <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-3.5">
                        <div className="flex items-center justify-between text-base">
                            <div>
                                <span className="text-muted-foreground font-black block text-xs sm:text-sm uppercase tracking-wider">Mínimo 52S</span>
                                <span className="text-xl sm:text-2xl font-black text-foreground">${Number(a.low52w).toFixed(2)}</span>
                                {a.distanceToLow && <span className="text-xs sm:text-sm text-emerald-400 ml-1.5 font-black">(+{a.distanceToLow}%)</span>}
                            </div>
                            <div className="text-center">
                                <span className="text-muted-foreground font-black text-xs sm:text-sm uppercase tracking-wider block">Rango 52 Semanas</span>
                                {a.currentPrice && (
                                    <span className="text-lg sm:text-xl font-mono font-black text-primary">${Number(a.currentPrice).toFixed(2)}</span>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="text-muted-foreground font-black block text-xs sm:text-sm uppercase tracking-wider">Máximo 52S</span>
                                <span className="text-xl sm:text-2xl font-black text-foreground">${Number(a.high52w).toFixed(2)}</span>
                                {a.distanceToHigh && <span className="text-xs sm:text-sm text-muted-foreground ml-1.5 font-bold">({a.distanceToHigh}%)</span>}
                            </div>
                        </div>
                        <div className="relative w-full h-3.5 rounded-full bg-muted overflow-hidden border border-border/40">
                            <div 
                                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full"
                                style={{
                                    width: `${Math.max(5, Math.min(95, ((Number(a.currentPrice || a.low52w) - Number(a.low52w)) / (Number(a.high52w) - Number(a.low52w) || 1)) * 100))}%`
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* PAYWALL PRO SI EL USUARIO NO TIENE SUSCRIPCIÓN ACTIVA */}
            {isProRestricted && (
                <>
                    {/* Teaser parcial del resumen ejecutivo */}
                    {summary?.summary && (
                        <div className="p-8 sm:p-10 rounded-3xl border border-border/50 bg-card/60 space-y-4">
                            <h3 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-wider">Visión General</h3>
                            <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-normal">{summary.summary}</p>
                        </div>
                    )}

                    <ProPaywallGate analysis={a} />
                </>
            )}

            {/* SECCIONES COMPLETAS SI EL USUARIO TIENE ACCESO FINIX PRO */}
            {!isProRestricted && (
                <div className="space-y-14">
                    {/* 2. RESUMEN EJECUTIVO */}
                    {visibility.showSummary !== false && summary?.title && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-7">
                            <div className="flex items-center gap-3 text-primary">
                                <Sparkles className="w-7 h-7" />
                                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Resumen Ejecutivo</h2>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-foreground leading-snug">{summary.title}</h3>
                            {summary.summary && <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-normal">{summary.summary}</p>}

                            {(summary.positivePoints?.length > 0 || summary.negativePoints?.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    {summary.positivePoints?.length > 0 && (
                                        <div className="p-6 sm:p-7 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3.5">
                                            <span className="text-base sm:text-lg font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2.5">
                                                <CheckCircle2 className="w-6 h-6" /> Puntos Fuertes
                                            </span>
                                            <ul className="space-y-3 text-base sm:text-lg text-foreground font-medium">
                                                {summary.positivePoints.map((pt: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-3 leading-relaxed">
                                                        <span className="text-emerald-400 font-black text-xl">•</span>
                                                        <span>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {summary.negativePoints?.length > 0 && (
                                        <div className="p-6 sm:p-7 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3.5">
                                            <span className="text-base sm:text-lg font-black text-rose-400 uppercase tracking-wider flex items-center gap-2.5">
                                                <AlertTriangle className="w-6 h-6" /> Aspectos de Cautela
                                            </span>
                                            <ul className="space-y-3 text-base sm:text-lg text-foreground font-medium">
                                                {summary.negativePoints.map((pt: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-3 leading-relaxed">
                                                        <span className="text-rose-400 font-black text-xl">•</span>
                                                        <span>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {summary.conclusion && (
                                <div className="pt-4 text-base sm:text-lg text-muted-foreground italic border-t border-border/40 leading-relaxed font-medium">
                                    {summary.conclusion}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 3. FAIR VALUE & VALUACIÓN INTRÍNSECA */}
                    {visibility.showFairValue !== false && a.estimatedFairValue && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card space-y-9 shadow-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-3.5">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/30">
                                        <Target className="w-4 h-4" /> Fair Value & Valoración
                                    </div>
                                    <div className="text-5xl sm:text-7xl md:text-8xl font-black text-foreground tracking-tight">
                                        ${Number(a.estimatedFairValue).toFixed(2)}
                                    </div>
                                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                                        Precio objetivo intrínseco calculado mediante {methodology?.method || 'flujos de caja descontados (DCF) y múltiplos comparables'}.
                                    </p>
                                </div>

                                {a.currentPrice && (
                                    <div className="p-7 sm:p-8 rounded-2xl bg-card border border-border/60 text-center shrink-0 shadow-xl space-y-1.5">
                                        <span className="text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-wider block">
                                            {Number(a.estimatedFairValue) >= Number(a.currentPrice) ? 'Potencial Alcista' : 'Potencial Bajista'}
                                        </span>
                                        <div className={`text-5xl sm:text-6xl font-black ${Number(a.estimatedFairValue) >= Number(a.currentPrice) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {((Number(a.estimatedFairValue) / Number(a.currentPrice) - 1) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                )}
                            </div>

                            {methodology?.assumptions && (
                                <div className="p-6 rounded-2xl bg-muted/30 border border-border/40 text-base sm:text-lg space-y-2">
                                    <span className="font-black text-foreground block">Supuestos del Modelo:</span>
                                    <p className="text-muted-foreground leading-relaxed font-normal">{methodology.assumptions}</p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* MÚLTIPLOS DE VALUACIÓN Y PRECIOS DE TRADINGVIEW */}
                    {visibility.showValuation !== false && (a.peRatio || a.priceToSales || a.evToEbitda || a.priceToBook) && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <Scale className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Múltiplos de Valuación Bursátil</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Múltiplos de precio, ventas, valor en libros y flujos calculados en tiempo real.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                <MetricBox label="P/E Ratio (TTM)" value={a.peRatio} unit="x" highlight tooltip="Precio sobre Beneficios últimos 12 meses" />
                                <MetricBox label="Forward P/E" value={a.forwardPe} unit="x" tooltip="P/E proyectado a próximos 12 meses" />
                                <MetricBox label="PEG Ratio" value={a.pegRatio} unit="x" tooltip="P/E relativo a la tasa de crecimiento estimada" />
                                <MetricBox label="Precio / Ventas (P/S)" value={a.priceToSales} unit="x" tooltip="Precio sobre Ventas anuales" />
                                <MetricBox label="Precio / Valor Libros (P/B)" value={a.priceToBook} unit="x" tooltip="Precio sobre Valor Contable en Libros" />
                                <MetricBox label="EV / EBITDA" value={a.evToEbitda} unit="x" tooltip="Enterprise Value sobre EBITDA" />
                                <MetricBox label="EV / Ingresos" value={a.evToRevenue} unit="x" tooltip="Enterprise Value sobre Ingresos" />
                                <MetricBox label="Precio / Flujo Libre (P/FCF)" value={a.priceToFcf} unit="x" tooltip="Precio sobre Flujo de Caja Libre" />
                                <MetricBox label="Rendimiento por Dividendo" value={a.dividendYield} unit="%" badge={Number(a.dividendYield) > 2 ? 'Con Dividendo' : undefined} tooltip="Rendimiento anual por dividendo" />
                                <MetricBox label="P/E Histórico Prom." value={a.historicalAvgPe} unit="x" tooltip="Media histórica de valuación" />
                                <MetricBox label="P/E Sectorial" value={a.sectorPe} unit="x" tooltip="Promedio ponderado del sector" />
                                <MetricBox 
                                    label="Prima / Descuento" 
                                    value={a.valuationPremiumDiscount ? `${Number(a.valuationPremiumDiscount) > 0 ? '+' : ''}${Number(a.valuationPremiumDiscount).toFixed(1)}` : null} 
                                    unit="%" 
                                    highlight={Number(a.valuationPremiumDiscount) < 0} 
                                    badge={Number(a.valuationPremiumDiscount) < 0 ? 'Subvaluada' : 'Sobrevaluada'}
                                    tooltip="Diferencia frente al Fair Value estimado" 
                                />
                            </div>

                            {a.competitorsPe && (
                                <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground font-black">Comparativa de Mercado:</strong> {a.competitorsPe}
                                </div>
                            )}
                        </section>
                    )}

                    {/* PERFIL CORPORATIVO, LIDERAZGO Y MOAT */}
                    {visibility.showCompany !== false && (a.businessDescription || a.ceo || a.foundedYear || a.competitiveAdvantage) && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <Building2 className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Perfil Corporativo & Liderazgo</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Estructura directiva, fundamentos institucionales y ventajas competitivas.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MetricBox label="CEO / Liderazgo" value={a.ceo} />
                                <MetricBox label="Año de Fundación" value={a.foundedYear} />
                                <MetricBox label="Empleados" value={a.employeesCount ? formatNumber(a.employeesCount) : null} />
                                <MetricBox label="Cuota de Mercado" value={a.marketShare} />
                            </div>

                            {/* Descripción y Moat */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                                {a.businessDescription && (
                                    <div className="p-7 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                                        <span className="text-base sm:text-lg font-black uppercase tracking-wider text-foreground block">
                                            Descripción Operativa del Negocio
                                        </span>
                                        <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-normal">
                                            {a.businessDescription}
                                        </p>
                                    </div>
                                )}
                                {a.competitiveAdvantage && (
                                    <div className="p-7 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                                        <span className="text-base sm:text-lg font-black uppercase tracking-wider text-primary block">
                                            Ventaja Competitiva & Foso Económico (Moat)
                                        </span>
                                        <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-normal">
                                            {a.competitiveAdvantage}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Dependencias Comerciales */}
                            {(a.customerDependency || a.productDependency) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                                    {a.customerDependency && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-2">
                                            <span className="font-black text-foreground block">Concentración / Dependencia de Clientes:</span>
                                            <p className="text-muted-foreground leading-relaxed">{a.customerDependency}</p>
                                        </div>
                                    )}
                                    {a.productDependency && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-2">
                                            <span className="font-black text-foreground block">Dependencia de Productos Clave:</span>
                                            <p className="text-muted-foreground leading-relaxed">{a.productDependency}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 4. MODELO DE NEGOCIO Y PRODUCTOS */}
                    {visibility.showBusinessModel !== false && businessModel.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3.5 text-foreground font-black">
                                <Briefcase className="w-7 h-7 text-primary shrink-0" />
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Modelo de Negocio y Segmentos</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {businessModel.map((bm: any, idx: number) => (
                                    <div key={idx} className="p-7 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-foreground text-xl sm:text-2xl leading-snug">{bm.product}</h4>
                                            {bm.revenuePct && (
                                                <span className="text-sm sm:text-base font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                    {bm.revenuePct}% ingresos
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-base sm:text-lg text-foreground/85 leading-relaxed font-normal">{bm.description}</p>
                                        <div className="pt-4 border-t border-border/40 flex items-center justify-between text-sm sm:text-base text-muted-foreground">
                                            {bm.growth && <span>Crecimiento: <strong className="text-foreground font-black">{bm.growth}%</strong></span>}
                                            {bm.margin && <span>Margen: <strong className="text-foreground font-black">{bm.margin}%</strong></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 5. INGRESOS Y CRECIMIENTO (CON GRÁFICOS RECHARTS) */}
                    {visibility.showGrowth !== false && (a.revenue || series.revenue?.length > 0) && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <TrendingUp className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Ingresos y Crecimiento</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Evolución de ventas anualizadas, ritmo de expansión y previsiones corporativas.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MetricBox label="Ingresos TTM" value={formatCurrency(a.revenue, true)} highlight />
                                <MetricBox label="Crecimiento YoY" value={a.revenueGrowthYoY} unit="%" />
                                <MetricBox label="CAGR 3 Años" value={a.revenueCagr3y} unit="%" />
                                <MetricBox label="ARR Anualizado" value={formatCurrency(a.arr, true)} />
                            </div>

                            {/* Gráfico Recharts: Revenue Histórico */}
                            {series.revenue?.length > 1 && (
                                <div className="space-y-3.5 pt-4">
                                    <span className="text-base sm:text-lg font-black text-muted-foreground uppercase tracking-wider block">
                                        Evolución Histórica de Ingresos ($M USD)
                                    </span>
                                    <div className="h-80 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RCLineChart data={series.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                                                <XAxis dataKey="period" stroke={chartAxisStroke} fontSize={14} tickLine={false} />
                                                <YAxis stroke={chartAxisStroke} fontSize={14} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}B`} />
                                                <RCTooltip 
                                                    contentStyle={chartTooltipStyle}
                                                    formatter={(val: any) => [`$${val.toLocaleString()} M`, 'Ingresos']}
                                                />
                                                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                                            </RCLineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {a.revenueGuidance && (
                                <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground font-black">Proyección Oficial (Guidance):</strong> {a.revenueGuidance}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 6. RENTABILIDAD Y MÁRGENES (CON GRÁFICOS RECHARTS) */}
                    {visibility.showProfitability !== false && (a.eps || series.margins?.length > 0 || a.grossMargin) && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <DollarSign className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Rentabilidad y Retorno de Capital</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Márgenes de contribución, retornos sobre activos/capital y generación operativa.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                <MetricBox label="EPS Diluido" value={a.eps ? `$${Number(a.eps).toFixed(2)}` : null} highlight />
                                <MetricBox label="Crecimiento EPS" value={a.epsGrowth} unit="%" />
                                <MetricBox label="Margen Bruto" value={a.grossMargin} unit="%" />
                                <MetricBox label="Margen Operativo" value={a.operatingMargin} unit="%" />
                                <MetricBox label="Margen Neto" value={a.netMargin} unit="%" highlight />
                                <MetricBox label="Margen EBITDA" value={a.ebitdaMargin} unit="%" />
                                <MetricBox label="EBIT Operativo" value={formatCurrency(a.ebit, true)} />
                                <MetricBox label="EBITDA TTM" value={formatCurrency(a.ebitda, true)} />
                                <MetricBox label="ROE (Patrimonio)" value={a.roe} unit="%" tooltip="Return on Equity" />
                                <MetricBox label="ROA (Activos)" value={a.roa} unit="%" tooltip="Return on Assets" />
                                <MetricBox label="ROIC (Capital Inv.)" value={a.roic} unit="%" badge="Excelente" tooltip="Return on Invested Capital" />
                                <MetricBox label="ROCE (Cap. Empleado)" value={a.roce} unit="%" tooltip="Return on Capital Employed" />
                                <MetricBox label="Margen FCF" value={a.fcfMargin} unit="%" />
                            </div>

                            {a.epsEstimatedVsReal && (
                                <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground font-black">Sorpresa de Resultados:</strong> {a.epsEstimatedVsReal}
                                </div>
                            )}

                            {/* Gráfico Recharts: Márgenes Históricos */}
                            {series.margins?.length > 1 && (
                                <div className="space-y-3.5 pt-4">
                                    <span className="text-base sm:text-lg font-black text-muted-foreground uppercase tracking-wider block">
                                        Evolución de Márgenes (% Bruto, Operativo, Neto)
                                    </span>
                                    <div className="h-80 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RCLineChart data={series.margins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                                                <XAxis dataKey="period" stroke={chartAxisStroke} fontSize={14} tickLine={false} />
                                                <YAxis stroke={chartAxisStroke} fontSize={14} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                                <RCTooltip 
                                                    contentStyle={chartTooltipStyle}
                                                    formatter={(val: any) => [`${val}%`]}
                                                />
                                                <Line type="monotone" dataKey="grossMargin" name="Bruto" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="operatingMargin" name="Operativo" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="netMargin" name="Neto" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} />
                                            </RCLineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* 7. CASH FLOW & BALANCE FINANCIERO */}
                    <div className="space-y-10">
                        {visibility.showCashFlow !== false && (a.freeCashFlow || a.operatingCashFlow) && (
                            <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                                <div className="flex items-center gap-3.5 text-primary">
                                    <Activity className="w-7 h-7 shrink-0" />
                                    <div>
                                        <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Generación de Flujo de Caja</h3>
                                        <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Flujos operativos, inversiones de capital y rendimiento libre disponible.</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                    <MetricBox label="Flujo de Caja Operativo" value={formatCurrency(a.operatingCashFlow, true)} />
                                    <MetricBox label="Flujo de Caja Libre (FCF)" value={formatCurrency(a.freeCashFlow, true)} highlight />
                                    <MetricBox label="CapEx (Inversión en Capital)" value={formatCurrency(a.capEx, true)} />
                                    <MetricBox label="Rendimiento FCF (Yield)" value={a.fcfYield} unit="%" />
                                    <MetricBox label="FCF por Acción" value={a.fcfPerShare ? `$${Number(a.fcfPerShare).toFixed(2)}` : null} />
                                    <MetricBox label="Conv. Ganancia a Caja" value={a.earningsToCashConversion} unit="%" />
                                </div>

                                {a.historicalCashFlow && (
                                    <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                        <strong className="text-foreground font-black">Histórico de Flujos:</strong> {a.historicalCashFlow}
                                    </div>
                                )}
                            </section>
                        )}

                        {visibility.showBalance !== false && (a.totalDebt !== null || a.cash !== null || a.totalAssets !== null) && (
                            <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                                <div className="flex items-center gap-3.5 text-primary">
                                    <Layers className="w-7 h-7 shrink-0" />
                                    <div>
                                        <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Balance Financiero, Solvencia & Deuda</h3>
                                        <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Estructura patrimonial, activos totales, pasivos y solvencia frente a obligaciones.</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <MetricBox label="Efectivo y Equivalentes" value={formatCurrency(a.cash, true)} highlight />
                                    <MetricBox label="Deuda Total" value={formatCurrency(a.totalDebt, true)} />
                                    <MetricBox label="Deuda Neta" value={formatCurrency(a.netDebt, true)} />
                                    <MetricBox label="Net Debt / EBITDA" value={a.netDebtToEbitda} unit="x" badge={Number(a.netDebtToEbitda) < 1.5 ? 'Sano' : 'Atención'} />
                                    <MetricBox label="Ratio Corriente" value={a.currentRatio} unit="x" tooltip="Activo Corriente / Pasivo Corriente" />
                                    <MetricBox label="Prueba Ácida" value={a.quickRatio} unit="x" tooltip="Liquidez inmediata sin inventarios" />
                                    <MetricBox label="Activos Totales" value={formatCurrency(a.totalAssets, true)} />
                                    <MetricBox label="Pasivos Totales" value={formatCurrency(a.totalLiabilities, true)} />
                                    <MetricBox label="Patrimonio Neto" value={formatCurrency(a.equity, true)} />
                                    <MetricBox label="Deuda Largo Plazo" value={formatCurrency(a.longTermDebt, true)} />
                                    <MetricBox label="Deuda Corto Plazo" value={formatCurrency(a.shortTermDebt, true)} />
                                    <MetricBox label="Cobertura Intereses" value={a.interestCoverageRatio} unit="x" tooltip="EBIT / Intereses pagados" />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ESTRUCTURA ACCIONARIA, FLOTANTE Y SENTIMIENTO */}
                    {visibility.showOwnership !== false && (a.sharesOutstanding || a.institutionalOwnership || a.insiderOwnership || a.beta) && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <PieChart className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Estructura Accionaria, Flotante y Sentimiento</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Distribución de tenencia institucional, directivos, posición corta y programas de recompras.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                <MetricBox label="Acciones en Circulación" value={formatNumber(a.sharesOutstanding, true)} tooltip="Total shares outstanding" />
                                <MetricBox label="Tenencia Institucional" value={a.institutionalOwnership} unit="%" badge="Fondos / ETFs" />
                                <MetricBox label="Tenencia Directivos (Insiders)" value={a.insiderOwnership} unit="%" badge="Directores" />
                                <MetricBox label="Beta (1 Año)" value={a.beta} unit="x" badge={Number(a.beta) > 1.2 ? 'Volátil' : 'Estable'} tooltip="Volatilidad vs S&P 500" />
                                <MetricBox label="Posiciones Cortas (Short Interest)" value={a.shortInterest} unit="%" tooltip="Porcentaje de acciones en corto" />
                                <MetricBox label="% Flotante en Corto" value={a.shortFloat} unit="%" tooltip="Porcentaje del flotante vendido en corto" />
                                <MetricBox label="Dilución / Variación Neta" value={a.shareDilution} unit="%" tooltip="Variación neta anual de acciones en circulación" />
                                <MetricBox label="Volatilidad Histórica" value={a.historicalVolatility} unit="%" tooltip="Volatilidad anualizada calculada" />
                            </div>

                            {/* Detalle de Recompras e Insiders */}
                            {(a.buybacks || a.sharesGrowthReduction || a.insiderBuys || a.insiderSells) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                                    {a.buybacks && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-2">
                                            <span className="font-black text-foreground block">Programa de Recompras de Acciones:</span>
                                            <p className="text-muted-foreground leading-relaxed">{a.buybacks}</p>
                                        </div>
                                    )}
                                    {a.sharesGrowthReduction && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-2">
                                            <span className="font-black text-foreground block">Evolución del Flotante:</span>
                                            <p className="text-muted-foreground leading-relaxed">{a.sharesGrowthReduction}</p>
                                        </div>
                                    )}
                                    {a.insiderBuys && (
                                        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-base sm:text-lg space-y-2">
                                            <span className="font-black text-emerald-400 block">Compras de Directivos (Insiders):</span>
                                            <p className="text-foreground/90 leading-relaxed font-medium">{a.insiderBuys}</p>
                                        </div>
                                    )}
                                    {a.insiderSells && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-2">
                                            <span className="font-black text-muted-foreground block">Ventas Programadas (Insiders):</span>
                                            <p className="text-foreground/90 leading-relaxed font-medium">{a.insiderSells}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 8. COMPETIDORES (TABLA Y GRÁFICO COMPARATIVO) */}
                    {visibility.showCompetitors !== false && competitors.length > 0 && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <Users className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Comparación con Competidores Directos</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Benchmarking sectorial de múltiplos, rentabilidad sobre capital y escala.</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-border/40">
                                <table className="w-full text-base sm:text-lg text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs sm:text-sm border-b border-border/50">
                                        <tr>
                                            <th className="px-6 py-4.5 font-black">Empresa</th>
                                            <th className="px-6 py-4.5 font-black">Ticker</th>
                                            <th className="px-6 py-4.5 font-black">P/E Ratio</th>
                                            <th className="px-6 py-4.5 font-black">ROIC (%)</th>
                                            <th className="px-6 py-4.5 font-black">Margen Neto (%)</th>
                                            <th className="px-6 py-4.5 font-black">Cap. Bursátil</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {competitors.map((c: any, idx: number) => {
                                            const isSelected = c.ticker === a.ticker;
                                            return (
                                                <tr key={idx} className={isSelected ? 'bg-primary/10 font-black text-primary' : 'text-foreground/90 font-medium'}>
                                                    <td className="px-6 py-4.5 font-bold text-lg sm:text-xl">{c.name}</td>
                                                    <td className="px-6 py-4.5 font-bold">{c.ticker}</td>
                                                    <td className="px-6 py-4.5">{c.pe ? `${c.pe}x` : '-'}</td>
                                                    <td className="px-6 py-4.5">{c.roic ? `${c.roic}%` : '-'}</td>
                                                    <td className="px-6 py-4.5">{c.netMargin ? `${c.netMargin}%` : '-'}</td>
                                                    <td className="px-6 py-4.5 font-bold">{c.marketCap ? `$${c.marketCap}B` : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* 9. ANÁLISIS TÉCNICO CUANTITATIVO Y GRÁFICO INTERACTIVO */}
                    {visibility.showTechnical !== false && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-9">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5 text-primary">
                                    <LineChart className="w-7 h-7 shrink-0" />
                                    <div>
                                        <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Análisis Técnico & Gráfico Institucional</h2>
                                        <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Herramientas de dibujo en vivo provistas por TradingView y métricas cuantitativas.</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {tech.technicalScore && (
                                        <span className="text-base sm:text-lg font-mono font-black px-5 py-2 rounded-full bg-primary/10 text-primary border border-primary/30 shadow-sm">
                                            Puntaje: {tech.technicalScore}/100
                                        </span>
                                    )}
                                    {tech.technicalSignal && (
                                        <span className={`text-base sm:text-lg font-black px-5 py-2 rounded-full uppercase tracking-wider shadow-sm ${
                                            tech.technicalSignal.includes('BUY') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40' :
                                            tech.technicalSignal.includes('SELL') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/40' :
                                            'bg-amber-500/10 text-amber-400 border border-amber-500/40'
                                        }`}>
                                            Señal: {translateSignal(tech.technicalSignal)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Gráfico Interactivo de TradingView con Herramientas de Dibujo */}
                            {(() => {
                                const chartStorageId = tech.chartStorageId || (a.id 
                                    ? `finix_analysis_${a.id}` 
                                    : `finix_analysis_${(a.ticker || a.symbol || 'asset').toLowerCase().replace(/[^a-z0-9_]/g, '_')}`);
                                const fullSymbol = a.symbol || (a.ticker ? `${a.exchange || 'NASDAQ'}:${a.ticker}` : 'NASDAQ:AAPL');

                                return (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-base sm:text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-primary" /> Proyección Técnica Interactiva en Vivo
                                                </span>
                                                <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-bold">
                                                    Líneas y figuras trazadas por el analista
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm sm:text-base font-mono font-black text-primary bg-primary/10 border border-primary/30 px-3.5 py-1 rounded-xl">
                                                    {fullSymbol}
                                                </span>
                                                {tech.chartPattern && (
                                                    <span className="text-sm sm:text-base font-bold px-3.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                        Patrón: {tech.chartPattern}
                                                    </span>
                                                )}
                                                {tech.chartTimeframe && (
                                                    <span className="text-sm sm:text-base font-bold px-3.5 py-1 rounded-xl bg-secondary text-foreground">
                                                        {tech.chartTimeframe === 'D' ? '1D' : tech.chartTimeframe === 'W' ? '1W' : tech.chartTimeframe}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Gráfico Interactivo Único con Persistencia de Dibujos */}
                            <div className="rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card w-full min-h-[420px] sm:min-h-[600px] lg:min-h-[760px]">
                                            <TradingViewChart 
                                                symbol={fullSymbol} 
                                                height={760} 
                                                chartStorageId={chartStorageId}
                                                loadLastChart={true}
                                            />
                                        </div>

                                        {/* Diagnóstico técnico y comentarios */}
                                        {(tech.chartPattern || tech.chartNotes) && (
                                            <div className="p-7 rounded-2xl bg-muted/20 border border-border/40 space-y-3.5">
                                                {tech.chartPattern && (
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-base sm:text-lg font-black uppercase tracking-wider text-primary">Diagnóstico Chartista:</span>
                                                        <span className="text-sm sm:text-base font-bold px-3.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                                            {tech.chartPattern}
                                                        </span>
                                                    </div>
                                                )}
                                                {tech.chartNotes && (
                                                    <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-normal">
                                                        {tech.chartNotes}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Respaldo estático si existiera una captura manual */}
                                        {tech.chartSnapshotUrl && (
                                            <details className="group rounded-2xl border border-border/50 bg-muted/10 overflow-hidden">
                                                <summary className="px-5 py-3 cursor-pointer text-sm sm:text-base font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between transition-colors select-none">
                                                    <span className="flex items-center gap-2">
                                                        <Camera className="w-4 h-4 text-muted-foreground" /> Ver captura estática de referencia
                                                    </span>
                                                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">Mostrar captura ▼</span>
                                                </summary>
                                                <div className="p-3 border-t border-border/40">
                                                    <img 
                                                        src={tech.chartSnapshotUrl} 
                                                        alt={`Captura estática de ${a.ticker || a.symbol}`}
                                                        className="w-full h-auto max-h-[500px] object-contain mx-auto rounded-xl"
                                                    />
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Ratios Técnicos Cuantitativos */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5">
                                <MetricBox label="RSI (14D)" value={a.rsi} badge={Number(a.rsi) > 70 ? 'Sobrecompra' : Number(a.rsi) < 30 ? 'Sobreventa' : 'Neutral'} />
                                <MetricBox label="SMA 20" value={a.sma20 ? `$${Number(a.sma20).toFixed(2)}` : null} />
                                <MetricBox label="SMA 50" value={a.sma50 ? `$${Number(a.sma50).toFixed(2)}` : null} />
                                <MetricBox label="SMA 100" value={a.sma100 ? `$${Number(a.sma100).toFixed(2)}` : null} />
                                <MetricBox label="SMA 200" value={a.sma200 ? `$${Number(a.sma200).toFixed(2)}` : null} />
                                <MetricBox label="ATR" value={a.atr ? `$${Number(a.atr).toFixed(2)}` : null} tooltip="Rango Medio Verdadero" />
                                <MetricBox label="Volatilidad" value={a.historicalVolatility} unit="%" tooltip="Volatilidad histórica calculada" />
                                <MetricBox label="Tendencia" value={a.trend || 'Alcista'} highlight />
                            </div>

                            {/* Lectura de Indicadores de Oscilación: MACD & Bollinger */}
                            {(a.macd || a.bollingerBands || a.momentum) && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                                    {a.macd && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-1.5">
                                            <span className="font-black text-foreground block mb-1">Oscilador MACD:</span>
                                            <p className="text-muted-foreground leading-relaxed">{a.macd}</p>
                                        </div>
                                    )}
                                    {a.bollingerBands && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-1.5">
                                            <span className="font-black text-foreground block mb-1">Bandas de Bollinger:</span>
                                            <p className="text-muted-foreground leading-relaxed">{a.bollingerBands}</p>
                                        </div>
                                    )}
                                    {a.momentum && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/30 text-base sm:text-lg space-y-1.5">
                                            <span className="font-black text-foreground block mb-1">Fuerza de Momentum:</span>
                                            <p className="text-primary font-black text-xl">{a.momentum}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Gráfico de Precios con Medias */}
                            {tech.priceSeries?.length > 1 && (
                                <div className="space-y-3.5 pt-4">
                                    <span className="text-base sm:text-lg font-black text-muted-foreground uppercase tracking-wider block">
                                        Evolución de Precio vs Medias Móviles (SMA 20 & 50)
                                    </span>
                                    <div className="h-80 w-full pt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RCLineChart data={tech.priceSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                                                <XAxis dataKey="date" stroke={chartAxisStroke} fontSize={14} tickLine={false} />
                                                <YAxis stroke={chartAxisStroke} fontSize={14} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
                                                <RCTooltip 
                                                    contentStyle={chartTooltipStyle}
                                                    formatter={(val: any) => [`$${val}`]}
                                                />
                                                <Line type="monotone" dataKey="price" name="Precio" stroke={isDark ? '#ffffff' : '#09090b'} strokeWidth={3} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="ma20" name="SMA 20" stroke="#10b981" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="ma50" name="SMA 50" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                            </RCLineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Soportes y Resistencias */}
                            {(a.supports || a.resistances) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    {a.supports && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-2 text-base sm:text-lg">
                                            <span className="font-black text-emerald-400 block uppercase tracking-wider">Niveles de Soporte</span>
                                            <p className="text-foreground/90 font-medium leading-relaxed">{a.supports}</p>
                                        </div>
                                    )}
                                    {a.resistances && (
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-2 text-base sm:text-lg">
                                            <span className="font-black text-rose-400 block uppercase tracking-wider">Niveles de Resistencia</span>
                                            <p className="text-foreground/90 font-medium leading-relaxed">{a.resistances}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* 10. RIESGOS Y CATALIZADORES */}
                    {visibility.showRisks !== false && (risks.length > 0 || catalysts.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Riesgos */}
                            {risks.length > 0 && (
                                <section className="p-7 sm:p-10 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-6">
                                    <div className="flex items-center gap-3.5 text-rose-400 font-bold">
                                        <ShieldAlert className="w-7 h-7 shrink-0" />
                                        <h3 className="text-2xl sm:text-3xl font-black text-foreground">Principales Factores de Riesgo</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {risks.map((r: any, idx: number) => (
                                            <div key={idx} className="p-6 rounded-2xl bg-muted/30 border border-border/40 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-black text-foreground text-lg sm:text-xl">{r.title}</h5>
                                                    <span className={`text-xs sm:text-sm font-black px-3 py-1 rounded uppercase tracking-wider ${
                                                        r.severity === 'HIGH' || r.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                                     }`}>
                                                        {translateSeverity(r.severity)}
                                                    </span>
                                                </div>
                                                <p className="text-base sm:text-lg text-foreground/85 leading-relaxed font-normal">{r.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Catalizadores */}
                            {catalysts.length > 0 && (
                                <section className="p-7 sm:p-10 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-6">
                                    <div className="flex items-center gap-3.5 text-amber-400 font-bold">
                                        <Zap className="w-7 h-7 shrink-0" />
                                        <h3 className="text-2xl sm:text-3xl font-black text-foreground">Catalizadores de Crecimiento</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {catalysts.map((c: any, idx: number) => (
                                            <div key={idx} className="p-6 rounded-2xl bg-muted/30 border border-border/40 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-black text-foreground text-lg sm:text-xl">{c.title}</h5>
                                                    <span className="text-xs sm:text-sm font-black px-3 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                                                        {translateHorizon(c.horizon)}
                                                    </span>
                                                </div>
                                                <p className="text-base sm:text-lg text-foreground/85 leading-relaxed font-normal">{c.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* 11. ESCENARIOS (BULL / BASE / BEAR) */}
                    {visibility.showScenarios !== false && scenarios && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <div className="flex items-center gap-3.5 text-primary">
                                <Compass className="w-7 h-7 shrink-0" />
                                <div>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Escenarios de Inversión (Bull / Base / Bear)</h2>
                                    <span className="text-base sm:text-lg text-muted-foreground mt-1 block">Modelación estocástica de precios objetivos bajo diferentes condiciones de mercado.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {scenarios.bull && (
                                    <div className="p-7 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                                        <span className="text-base sm:text-lg font-black text-emerald-400 uppercase tracking-wider block">Escenario Alcista (Bull)</span>
                                        <div className="text-4xl sm:text-5xl font-black text-foreground">{scenarios.bull.fairValue || '$--'}</div>
                                        {scenarios.bull.upside && <span className="text-base sm:text-lg font-black text-emerald-400 block">{scenarios.bull.upside} potencial alcista</span>}
                                        <p className="text-base sm:text-lg text-foreground/85 pt-2 leading-relaxed font-normal">{scenarios.bull.assumptions}</p>
                                    </div>
                                )}
                                {scenarios.base && (
                                    <div className="p-7 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                                        <span className="text-base sm:text-lg font-black text-blue-400 uppercase tracking-wider block">Escenario Base</span>
                                        <div className="text-4xl sm:text-5xl font-black text-foreground">{scenarios.base.fairValue || '$--'}</div>
                                        {scenarios.base.upside && <span className="text-base sm:text-lg font-black text-blue-400 block">{scenarios.base.upside} potencial base</span>}
                                        <p className="text-base sm:text-lg text-foreground/85 pt-2 leading-relaxed font-normal">{scenarios.base.assumptions}</p>
                                    </div>
                                )}
                                {scenarios.bear && (
                                    <div className="p-7 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                                        <span className="text-base sm:text-lg font-black text-rose-400 uppercase tracking-wider block">Escenario Bajista (Bear)</span>
                                        <div className="text-4xl sm:text-5xl font-black text-foreground">{scenarios.bear.fairValue || '$--'}</div>
                                        {scenarios.bear.upside && <span className="text-base sm:text-lg font-black text-rose-400 block">{scenarios.bear.upside} riesgo bajista</span>}
                                        <p className="text-base sm:text-lg text-foreground/85 pt-2 leading-relaxed font-normal">{scenarios.bear.assumptions}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 12. MATRIZ DAFO / SWOT */}
                    {swot && (swot.strengths?.length > 0 || swot.weaknesses?.length > 0) && (
                        <section className="p-7 sm:p-12 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm space-y-8">
                            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Matriz DAFO / SWOT</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {swot.strengths?.length > 0 && (
                                    <div className="p-6 sm:p-7 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3.5">
                                        <span className="text-base sm:text-lg font-black text-emerald-400 uppercase tracking-wider block">Fortalezas</span>
                                        <ul className="space-y-2.5 text-base sm:text-lg text-foreground/90 font-medium">
                                            {swot.strengths.map((s: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">• <span>{s}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {swot.opportunities?.length > 0 && (
                                    <div className="p-6 sm:p-7 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3.5">
                                        <span className="text-base sm:text-lg font-black text-blue-400 uppercase tracking-wider block">Oportunidades</span>
                                        <ul className="space-y-2.5 text-base sm:text-lg text-foreground/90 font-medium">
                                            {swot.opportunities.map((o: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">• <span>{o}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {swot.weaknesses?.length > 0 && (
                                    <div className="p-6 sm:p-7 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3.5">
                                        <span className="text-base sm:text-lg font-black text-amber-400 uppercase tracking-wider block">Debilidades</span>
                                        <ul className="space-y-2.5 text-base sm:text-lg text-foreground/90 font-medium">
                                            {swot.weaknesses.map((w: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">• <span>{w}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {swot.threats?.length > 0 && (
                                    <div className="p-6 sm:p-7 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3.5">
                                        <span className="text-base sm:text-lg font-black text-rose-400 uppercase tracking-wider block">Amenazas</span>
                                        <ul className="space-y-2.5 text-base sm:text-lg text-foreground/90 font-medium">
                                            {swot.threats.map((t: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">• <span>{t}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* 13. FUENTES Y AVISO LEGAL */}
                    <div className="p-7 sm:p-10 rounded-3xl bg-muted/20 border border-border/40 text-center space-y-3 text-base sm:text-lg text-muted-foreground">
                        {a.sources && <p className="font-bold text-foreground">Fuentes de Información: {a.sources}</p>}
                        <p className="leading-relaxed font-medium">{a.legalDisclaimer || 'Este contenido tiene fines informativos y educativos y no constituye asesoramiento financiero ni recomendación de inversión.'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
