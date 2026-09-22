import { motion } from 'framer-motion';
import { Lock, ChevronRight, Crown, Check, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export interface ProGateProps {
    title?: string;
    description?: string;
    badgeText?: string;
    buttonText?: string;
    onUpgrade?: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function ProGate({
    title = 'Sección exclusiva PRO',
    description = 'Accedé a herramientas financieras avanzadas, análisis institucional, cotizaciones en tiempo real y alertas automáticas.',
    badgeText = 'PRO',
    buttonText = 'Activar Finix PRO',
    onUpgrade,
    className = '',
    children,
}: ProGateProps) {
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);

    const handleUpgrade = onUpgrade || (() => {
        if (!user) {
            navigate(`/auth?redirect=${encodeURIComponent('/pro')}&plan=PRO`);
        } else {
            navigate('/pro');
        }
    });

    return (
        <div className={`relative w-full flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 sm:px-6 py-10 overflow-hidden bg-background ${className}`}>
            
            {/* ── TEASER DE FONDO: INTERFAZ FINANCIERA CON DATOS OCULTOS / DIFUMINADOS ── */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none filter blur-[3.5px] opacity-35 dark:opacity-25 scale-[0.99] transition-all">
                {children ? (
                    <div className="w-full h-full p-6 opacity-30">
                        {children}
                    </div>
                ) : (
                    <div className="w-full max-w-7xl mx-auto h-full p-4 sm:p-8 flex flex-col gap-6">
                        {/* Mock Header & Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-48 rounded-xl bg-card border border-border/60 flex items-center px-3 gap-2">
                                    <div className="w-4 h-4 rounded-full bg-primary/40" />
                                    <div className="h-3 w-24 rounded bg-muted-foreground/30" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {['$NVDA', '$AAPL', '$MELI', '$SPY', '$BTC'].map((t, idx) => (
                                        <span key={t} className="px-3 py-1 rounded-lg text-xs font-bold bg-card border border-border/60 text-muted-foreground/60 flex items-center gap-1.5">
                                            <span>{t}</span>
                                            <span className={idx % 2 === 0 ? 'text-emerald-500/70' : 'text-primary/70'}>+•.••%</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-28 rounded-lg bg-card border border-border/60" />
                                <div className="h-8 w-20 rounded-lg bg-primary/20 border border-primary/30" />
                            </div>
                        </div>

                        {/* Mock KPI Metric Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Rendimiento Anualizado', val: '+38.45%', change: '+4.2% hoy', positive: true },
                                { label: 'Valor Intrínseco DCF', val: 'US$ 184.20', change: 'Descuento 21%', positive: true },
                                { label: 'Ratio Sharpe & Alpha', val: '2.14 / +6.8%', change: 'Riesgo Óptimo', positive: true },
                                { label: 'Señales Algorítmicas', val: '12 Activas', change: 'Alta Convicción', positive: true },
                            ].map((card, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border/50 shadow-sm flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground/70">{card.label}</span>
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black tracking-tight text-foreground/80 filter blur-[2px]">
                                            {card.val}
                                        </span>
                                        <span className="text-[11px] font-bold text-emerald-500/80 filter blur-[1px]">
                                            {card.change}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-primary/50 rounded-full" style={{ width: `${60 + idx * 10}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mock Central Chart Area */}
                        <div className="w-full h-72 rounded-2xl bg-card/40 border border-border/50 p-5 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-32 rounded bg-muted/60" />
                                    <div className="h-5 w-20 rounded bg-emerald-500/20" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {['1D', '1S', '1M', '1A', 'TODOS'].map((tf, i) => (
                                        <span key={tf} className={`px-2.5 py-1 rounded text-[11px] font-bold ${i === 2 ? 'bg-primary/20 text-primary' : 'text-muted-foreground/40'}`}>
                                            {tf}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Simulated Candlestick / Line Wave SVG */}
                            <svg className="w-full h-40 overflow-visible text-primary/30" viewBox="0 0 800 160" fill="none" preserveAspectRatio="none">
                                <path
                                    d="M0 130 Q 100 110, 200 70 T 400 90 T 600 30 T 800 50"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M0 130 Q 100 110, 200 70 T 400 90 T 600 30 T 800 50 L 800 160 L 0 160 Z"
                                    fill="url(#emerald-gradient)"
                                    opacity="0.25"
                                />
                                <defs>
                                    <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            <div className="flex items-center justify-between text-xs text-muted-foreground/40 pt-2 border-t border-border/30">
                                <span>Volumen institucional diario: •••••••</span>
                                <span>RSI(14): •••• | MACD: Bullish | EMA 200: Soporte</span>
                            </div>
                        </div>

                        {/* Mock Asset Rows / Table */}
                        <div className="rounded-2xl bg-card/40 border border-border/50 divide-y divide-border/30">
                            {[
                                { sym: 'NVDA', name: 'Nvidia Corporation', price: 'US$ 124.50', fair: 'US$ 145.00', rec: 'STRONG BUY' },
                                { sym: 'MELI', name: 'MercadoLibre Inc.', price: 'US$ 1,980.00', fair: 'US$ 2,250.00', rec: 'COMPRA' },
                                { sym: 'AAPL', name: 'Apple Inc.', price: 'US$ 228.10', fair: 'US$ 240.00', rec: 'MANTENER' },
                            ].map((item) => (
                                <div key={item.sym} className="p-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                                            {item.sym[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground/80">{item.sym}</p>
                                            <p className="text-xs text-muted-foreground/60">{item.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right filter blur-[2px]">
                                            <p className="font-bold text-sm text-foreground/70">{item.price}</p>
                                            <p className="text-[11px] text-muted-foreground/60">Precio Mercado</p>
                                        </div>
                                        <div className="text-right filter blur-[2px] hidden sm:block">
                                            <p className="font-bold text-sm text-emerald-400/70">{item.fair}</p>
                                            <p className="text-[11px] text-muted-foreground/60">Fair Value DCF</p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 filter blur-[1px]">
                                            {item.rec}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── AMBIENT GLOW EFFECT ── */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div
                    className="w-[600px] h-[450px] rounded-full opacity-25 dark:opacity-30"
                    style={{
                        background: 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />
            </div>

            {/* ── MODAL PAYWALL FLOTANTE EN PRIMER PLANO ── */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative z-20 w-full max-w-xl mx-auto rounded-[2.5rem] bg-card/90 dark:bg-zinc-950/85 backdrop-blur-2xl border border-primary/35 shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)] p-6 sm:p-9 text-center my-auto"
            >
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 mb-5 shadow-sm">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span>{badgeText} · ACCESO EXCLUSIVO</span>
                </div>

                {/* Lock Icon with Pulsating Ring */}
                <div className="relative mb-5 flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Lock className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-foreground tracking-tight mb-3">
                    {title}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 max-w-md mx-auto">
                    {description}
                </p>

                {/* Key Benefits List */}
                <div className="bg-secondary/40 border border-border/40 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Cotizaciones y métricas en tiempo real</strong> sin demoras ni restricciones de uso.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Modelos de valuación fundamental</strong> con cálculo automático de Fair Value y múltiplos.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Alertas y resúmenes diarios por email (Gmail)</strong> para anticipar movimientos del mercado.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-400 font-semibold pt-1 border-t border-border/30">
                        <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Cobro recurrente mensual automático</strong> al mismo precio fijo. Cancelás cuando quieras con 1 click.</span>
                    </div>
                </div>

                {/* CTA Action Button */}
                <div className="flex flex-col items-center gap-3">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full py-6 px-8 text-base sm:text-lg font-extrabold rounded-2xl bg-gradient-to-r from-emerald-600 via-primary to-emerald-500 hover:from-emerald-500 hover:to-primary text-white border-0 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>{buttonText}</span>
                        <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>

                    <p className="text-[11px] sm:text-xs text-muted-foreground/80 leading-tight">
                        🔒 Facturación mensual automática sin permanencia mínima. Podés dar de baja tu plan en cualquier momento desde tu Configuración.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default ProGate;
