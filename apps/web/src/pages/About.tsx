import { Info } from 'lucide-react';
import BackButton from '@/components/BackButton';

const About = () => {
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
                        <Info className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Sobre Nosotros</h1>
                    <p className="text-muted-foreground">Construyendo el futuro de la educación y colaboración financiera.</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Nuestra Misión</h2>
                        <p className="mb-4">
                            En Finix, nuestra misión es democratizar el acceso a la información financiera, permitiendo que inversores de todos los niveles puedan conectar, aprender y crecer juntos. Creemos en la transparencia y en el poder de la comunidad para tomar mejores decisiones de inversión.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">¿Qué es Finix?</h2>
                        <p className="mb-4">
                            Finix es la primera red social de finanzas diseñada para simplificar tu vida como inversor. Aquí puedes hacer seguimiento de tu portafolio, compartir ideas con la comunidad, y ver gráficos en tiempo real, todo desde una interfaz unificada y profesional.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Nuestro Equipo</h2>
                        <p className="mb-4">
                            Somos un grupo de desarrolladores apasionados por la tecnología y las finanzas. Trabajamos constantemente junto a nuestra comunidad para iterar y mejorar la plataforma con el objetivo de brindar las herramientas más robustas y útiles del mercado.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default About;
