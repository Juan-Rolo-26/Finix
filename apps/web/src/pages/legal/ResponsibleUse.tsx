import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';

const ResponsibleUse = () => {
    const { ui: finixUi } = useFinixUiTranslation();

    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-colors">
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

            <main className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-3xl">
                <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight mb-3">{""}<FinixUiText text={"Uso Responsable y Riesgos"} />{""}</h1>
                    <p className="text-muted-foreground text-sm">{""}<FinixUiText text={"Lectura obligatoria para todos los miembros de la comunidad."} />{""}</p>
                </div>

                <div className="space-y-10 text-muted-foreground leading-relaxed">
                    <section className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6">
                        <h2 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            {" "}<FinixUiText text={"ADVERTENCIA DE RIESGO"} />{" "}</h2>
                        <p className="mb-2 text-foreground/90 text-sm leading-relaxed">
                            {" "}<FinixUiText text={"Invertir en mercados financieros conlleva riesgos significativos, incluida la pérdida total del capital. El rendimiento pasado no garantiza resultados futuros."} />{" "}</p>
                    </section>

                    <section className="rounded-2xl border border-border/40 bg-card/60 p-6">
                        <h2 className="text-xl font-bold text-foreground mb-3">{""}<FinixUiText text={"No es Asesoramiento Financiero"} />{""}</h2>
                        <p className="mb-3 text-sm leading-relaxed">
                            {" "}<FinixUiText text={"Todo el contenido publicado en Finix (posts, análisis, comentarios, gráficos) refleja únicamente la opinión del autor."} />{" "}<strong className="text-foreground block mt-2">{""}<FinixUiText text={"Finix NO proporciona recomendaciones de inversión personalizadas."} />{""}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {" "}<FinixUiText text={"Nunca debes tomar decisiones financieras basadas únicamente en lo que lees en una red social. Siempre realiza tu propia investigación (DYOR - Do Your Own Research) o consulta a un asesor financiero certificado."} />{" "}</p>
                    </section>

                    <section className="rounded-2xl border border-border/40 bg-card/60 p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">{""}<FinixUiText text={"Nuestras Reglas de Oro"} />{""}</h2>
                        <div className="grid gap-4">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-foreground font-bold text-sm mb-1">{""}<FinixUiText text={"Verifica las Fuentes"} />{""}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{""}<FinixUiText text={"No confíes ciegamente en capturas de pantalla o afirmaciones sin sustento."} />{""}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-foreground font-bold text-sm mb-1">{""}<FinixUiText text={"Diversifica"} />{""}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{""}<FinixUiText text={"Nunca pongas \"todos los huevos en la misma canasta\" basándote en una tendencia viral."} />{""}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-foreground font-bold text-sm mb-1">{""}<FinixUiText text={"Sé Escéptico"} />{""}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{""}<FinixUiText text={"Si algo suena demasiado bueno para ser verdad (ej. \"ganancias garantizadas\"), probablemente sea una estafa."} />{""}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ResponsibleUse;
