import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ResponsibleUse = () => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <nav className="fixed top-0 w-full z-50 border-b border-primary/10 bg-background/60 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Volver al inicio</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xl">Finix</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-32 pb-20 max-w-3xl">
                <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Uso Responsable y Riesgos</h1>
                    <p className="text-muted-foreground">Lectura obligatoria para todos los miembros de la comunidad.</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-relaxed">
                    <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            ADVERTENCIA DE RIESGO
                        </h2>
                        <p className="mb-4 text-white">
                            Invertir en mercados financieros conlleva riesgos significativos, incluida la pérdida total del capital. El rendimiento pasado no garantiza resultados futuros.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">No es Asesoramiento Financiero</h2>
                        <p className="mb-4">
                            Todo el contenido publicado en Finix (posts, análisis, comentarios, gráficos) refleja únicamente la opinión del autor.
                            <strong className="text-white block mt-2">Finix NO proporciona recomendaciones de inversión personalizadas.</strong>
                        </p>
                        <p>
                            Nunca debes tomar decisiones financieras basadas únicamente en lo que lees en una red social. Siempre realiza tu propia investigación (DYOR - Do Your Own Research) o consulta a un asesor financiero certificado.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Nuestras Reglas de Oro</h2>
                        <div className="grid gap-4">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-1">Verifica las Fuentes</h3>
                                    <p className="text-sm">No confíes ciegamente en capturas de pantalla o afirmaciones sin sustento.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-1">Diversifica</h3>
                                    <p className="text-sm">Nunca pongas "todos los huevos en la misma canasta" basándote en una tendencia viral.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-1">Sé Escéptico</h3>
                                    <p className="text-sm">Si algo suena demasiado bueno para ser verdad (ej. "ganancias garantizadas"), probablemente sea una estafa.</p>
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
