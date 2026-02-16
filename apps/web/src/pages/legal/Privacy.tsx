import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Política de Privacidad</h1>
                    <p className="text-muted-foreground">Última actualización: 29 de Enero, 2026</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Recopilación de Información</h2>
                        <p className="mb-4">
                            Recopilamos información que nos proporcionas directamente, como cuando creas una cuenta, actualizas tu perfil o interactúas con otros usuarios. Esto incluye tu nombre, correo electrónico y cualquier otra información que decidas compartir en tu perfil público.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Uso de la Información</h2>
                        <p className="mb-4">
                            Utilizamos la información recopilada para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
                            <li>Personalizar tu experiencia y el feed de contenidos.</li>
                            <li>Enviar notificaciones técnicas y de seguridad.</li>
                            <li>Prevenir el fraude y el abuso en la plataforma.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Compartir Información</h2>
                        <p className="mb-4">
                            No vendemos tu información personal a terceros. Solo compartimos información con tu consentimiento o según sea necesario para cumplir con obligaciones legales.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Privacy;
