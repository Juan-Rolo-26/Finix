import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { TrendingUp, Calendar, Shield, Users, Sparkles, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { InformationPageTabs } from '@/components/legal/InformationPageTabs';
import { InvestorQuote } from '@/components/common/InvestorQuote';

export default function About() {
    const { ui: finixUi } = useFinixUiTranslation();

    return (
        <div className="info-page min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            {/* ── Top Bar ── */}
            <nav aria-label={finixUi("Volver a Finix")} className="info-page__mobile-nav fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-colors">
                <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <BackButton to="/dashboard" label="Volver a Finix" />
                    <Link to="/dashboard" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-black/20 dark:border-white/30 bg-white dark:bg-zinc-900 shadow-2xs transition-transform group-hover:scale-105">
                            <img src="/logo-small.webp" alt={finixUi("Finix")} className="h-5 w-5 object-contain" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tight text-foreground">{""}<FinixUiText text={"Finix"} />{""}</span>
                    </Link>
                </div>
            </nav>

            <main className="info-page__container container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-5xl">
                {/* ── Navigation Tabs between Legal & Info pages ── */}
                <InformationPageTabs />

                {/* ── Hero ── */}
                <header className="info-page__header text-center max-w-3xl mx-auto mb-16 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{""}<FinixUiText text={"Red Social & Plataforma Financiera"} />{""}</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight leading-tight">
                        {" "}<FinixUiText text={"Democratizando la información y el análisis financiero"} />{" "}</h1>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        {" "}<FinixUiText text={"Finix nace para conectar a la comunidad inversora con herramientas profesionales, datos de mercado en tiempo real y una filosofía clara:"} />{" "}<strong className="text-foreground">{""}<FinixUiText text={"no mostrar todo, sino mostrar lo que realmente importa."} />{""}</strong>
                    </p>
                </header>

                <div className="info-page__grid">
                    <aside className="info-page__sidebar hidden lg:block">
                        <nav aria-label={finixUi("Índice de Sobre Finix")}>
                            <a href="#filosofia">{""}<FinixUiText text={"Nuestra filosofía"} />{""}</a>
                            <a href="#herramientas">{""}<FinixUiText text={"Herramientas de Finix"} />{""}</a>
                            <a href="#seguridad">{""}<FinixUiText text={"Seguridad y privacidad"} />{""}</a>
                            <a href="#empezar">{""}<FinixUiText text={"Empezar en Finix"} />{""}</a>
                        </nav>
                    </aside>
                    <div className="info-page__body">
                        {/* ── Philosophy Banner ── */}
                        <div id="filosofia" className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 mb-16 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                            <div className="max-w-2xl">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">{""}<FinixUiText text={"Nuestra Filosofía"} />{""}</span>
                                <h2 className="text-2xl sm:text-3xl font-heading font-bold mt-2 mb-3">
                                    {" "}<FinixUiText text={"Claridad frente a la sobrecarga de ruido"} />{" "}</h2>
                                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                                    {" "}<FinixUiText text={"El inversor moderno no sufre por falta de información, sino por exceso de ruido. En Finix filtramos y priorizamos inteligentemente: desde los activos que lideran el S&P 500 hasta los eventos macroeconómicos de alto impacto de EE.UU. y Argentina, brindamos contexto accionable sin distracciones."} />{" "}</p>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                        <span>{""}<FinixUiText text={"Cero recomendaciones forzadas"} />{""}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                        <span>{""}<FinixUiText text={"Datos objetivos y auditados"} />{""}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                        <span>{""}<FinixUiText text={"Comunidad constructiva"} />{""}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── The 4 Pillars ── */}
                        <div id="herramientas" className="mb-16">
                            <div className="text-center mb-10">
                                <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight mb-2">
                                    {" "}<FinixUiText text={"Los cuatro pilares de Finix"} />{" "}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {" "}<FinixUiText text={"Una plataforma integral construida para la toma de decisiones informadas."} />{" "}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Pilar 1 */}
                                <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">{""}<FinixUiText text={"Comunidad & Feed Social"} />{""}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {" "}<FinixUiText text={"Un espacio donde inversores, analistas y entusiastas comparten tesis, análisis técnicos con gráficos de TradingView y debaten la coyuntura del mercado en un entorno libre de toxicidad y spam."} />{" "}</p>
                                </div>

                                {/* Pilar 2 */}
                                <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">{""}<FinixUiText text={"Mejores y Peores Rendimientos"} />{""}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {" "}<FinixUiText text={"Ranking diario del universo S&P 500 actualizado automáticamente al cierre de mercado (16:50 ET). Filtra los activos con mayor apreciación o corrección para detectar momentum de forma inmediata."} />{" "}</p>
                                </div>

                                {/* Pilar 3 */}
                                <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">{""}<FinixUiText text={"Calendario Financiero"} />{""}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {" "}<FinixUiText text={"Curación semanal de los hitos que definen el rumbo económico: inflación (IPC), tasas de interés de la Fed y BCRA, y reportes de ganancias de gigantes tecnológicos e industriales."} />{" "}</p>
                                </div>

                                {/* Pilar 4 */}
                                <div className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">{""}<FinixUiText text={"Gestión de Portafolio"} />{""}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {" "}<FinixUiText text={"Visualizá la distribución de tus activos, rendimiento histórico y exposición en dólares o moneda local con total privacidad y control sobre qué datos deseás hacer públicos o mantener privados."} />{" "}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Security & Integrity ── */}
                        <div id="seguridad" className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 mb-16">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{""}<FinixUiText text={"Seguridad y Privacidad por Diseño"} />{""}</h3>
                                    <p className="text-sm text-muted-foreground">{""}<FinixUiText text={"Tu información protegida bajo estándares bancarios."} />{""}</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {" "}<FinixUiText text={"Finix nunca vende tus datos a terceros. Toda comunicación está cifrada de extremo a extremo, tus credenciales nunca se exponen y contás con herramientas exhaustivas para gestionar qué elementos de tu perfil o portafolio son visibles para la comunidad."} />{" "}</p>
                        </div>

                        {/* ── CTA ── */}
                        <div id="empezar" className="text-center p-8 sm:p-12 rounded-3xl bg-secondary/30 border border-border/40 space-y-5">
                            <h3 className="text-2xl font-heading font-bold">{""}<FinixUiText text={"¿Listo para potenciar tus finanzas?"} />{""}</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                {" "}<FinixUiText text={"Sumate hoy a la plataforma financiera creada por y para inversores."} />{" "}</p>
                            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                                <Link to="/dashboard" className="px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all inline-flex items-center gap-2">
                                    {" "}<FinixUiText text={"Ir al Inicio"} />{" "}<ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link to="/help" className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-card transition-colors">
                                    {" "}<FinixUiText text={"Centro de Ayuda"} />{" "}</Link>
                            </div>
                        </div>

                        {/* Investor Wisdom Quote */}
                        <InvestorQuote investorId="mohnish-pabrai" showBackToTop />

                        {/* ── Footer ── */}
                        <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                            <p>© {new Date().getFullYear()} {" "}<FinixUiText text={"Finix. Todos los derechos reservados."} />{""}</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <a href="https://t.me/Finixcomunidad" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium text-sky-400">{""}<FinixUiText text={"Telegram"} />{""}</a>
                                <a href="https://instagram.com/finixarg_" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium text-pink-400">{""}<FinixUiText text={"Instagram"} />{""}</a>
                                <Link to="/terms" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Términos"} />{""}</Link>
                                <Link to="/privacy" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Privacidad"} />{""}</Link>
                                <Link to="/cookies" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Cookies"} />{""}</Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    );
}
