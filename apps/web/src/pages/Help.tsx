import { HelpCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';

const Help = () => {
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
                        <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Centro de Ayuda</h1>
                    <p className="text-muted-foreground">Encuentra respuestas a tus preguntas y aprende a usar Finix.</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Preguntas Frecuentes</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">¿Cómo agrego activos a mi portafolio?</h3>
                                <p>Ve a la sección "Portafolio" desde el menú lateral y haz clic en "Agregar activos". Busca el ticker de tu preferencia (ej. AAPL, BTC) y define la cantidad que deseas trackerar, el precio de compra y fecha.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">¿Cómo publico un análisis?</h3>
                                <p>En el Inicio (Sección principal de la aplicación), puedes utilizar el cuadro de la parte superior, similar a cualquier otra red social, para redactar un post. Puedes adjuntar imágenes y pronto también enlaces específicos directos desde tu cuenta global.</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">¿Los datos son en tiempo real?</h3>
                                <p>Sí, la gran mayoría de nuestros cotizadores a través de TradingView o Yahoo Finance proveen información de mercado en tiempo real, garantizando que el estado de tu cuenta se muestre siempre lo más ajustado posible al flujo global.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Soporte y Contacto</h2>
                        <p className="mb-4">
                            Si tienes problemas adicionales u observaciones, por favor no dudes en enviarnos un mensaje directamente a nuestro equipo a la dirección <strong>finixarg@gmail.com</strong> y trataremos de asistirte en menor tiempo posible.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Help;
