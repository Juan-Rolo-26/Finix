import { Scale } from 'lucide-react';
import BackButton from '@/components/BackButton';

const Terms = () => {
    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans">
            <nav className="fixed top-0 w-full z-50 border-b border-primary/10 bg-background/60 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <BackButton to="/" label="Volver al inicio" />
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xl">Finix</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-32 pb-20 max-w-3xl">
                <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Scale className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Términos y Condiciones</h1>
                    <p className="text-muted-foreground">Última actualización: 29 de Enero, 2026</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
                        <p className="mb-4">
                            Al acceder o utilizar Finix, aceptas estar legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Naturaleza de la Plataforma</h2>
                        <p className="mb-4">
                            Finix es una red social para el intercambio de ideas y análisis financiero. No somos un bróker, asesor financiero registrado ni gestor de fondos. El contenido de la plataforma es generado por usuarios y es exclusivamente para fines educativos e informativos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Conducta del Usuario</h2>
                        <p className="mb-4">
                            Te comprometes a utilizar la plataforma de manera respetuosa y legal. Está prohibido:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Publicar información falsa o engañosa intencionalmente (Fake News).</li>
                            <li>Realizar actividades de "Pump and Dump" o manipulación de mercado.</li>
                            <li>Acosar, insultar o discriminar a otros miembros de la comunidad.</li>
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Terms;
