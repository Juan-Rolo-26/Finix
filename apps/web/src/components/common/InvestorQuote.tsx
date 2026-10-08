import { useState, useMemo } from 'react';
import { ArrowUp, Quote, RotateCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Investor {
    id: string;
    name: string;
    title: string;
    quote: string;
    image: string;
}

export const INVESTORS: Investor[] = [
    {
        id: 'howard-marks',
        name: 'Howard Marks',
        title: 'Co-fundador de Oaktree Capital Management',
        quote: 'Lo importante no es lo que compras, sino lo que pagas. El éxito al invertir no consiste en comprar cosas buenas, sino en comprarlas bien. Y si no sabes distinguir entre ambas cosas, te has equivocado de profesión.',
        image: '/investors/howard-marks.jpg',
    },
    {
        id: 'warren-buffett',
        name: 'Warren Buffett',
        title: 'Presidente y CEO de Berkshire Hathaway',
        quote: 'El precio es lo que pagas; el valor es lo que recibes. Sé temeroso cuando los demás sean codiciosos, y sé codicioso cuando los demás sean temerosos.',
        image: '/investors/warren-buffett.jpg',
    },
    {
        id: 'charlie-munger',
        name: 'Charlie Munger',
        title: 'Vicepresidente de Berkshire Hathaway',
        quote: 'El dinero grande no está en comprar o vender, sino en saber esperar. La paciencia disciplinada combinada con agresividad cuando llega la oportunidad es lo que produce resultados extraordinarios.',
        image: '/investors/charlie-munger.jpg',
    },
    {
        id: 'peter-lynch',
        name: 'Peter Lynch',
        title: 'Histórico gestor del Fondo Magellan de Fidelity',
        quote: 'Invierte en lo que entiendes. Sepa lo que posee y por qué lo posee. Detrás de cada acción siempre hay una empresa real: averigüe qué está haciendo.',
        image: '/investors/peter-lynch.jpg',
    },
    {
        id: 'benjamin-graham',
        name: 'Benjamin Graham',
        title: 'Padre del Value Investing y autor de El Inversor Inteligente',
        quote: 'A corto plazo, el mercado de valores es una máquina de votación; a largo plazo, es una balanza que pesa. La esencia de la inversión inteligente se resume en tres palabras: margen de seguridad.',
        image: '/investors/benjamin-graham.jpg',
    },
    {
        id: 'ray-dalio',
        name: 'Ray Dalio',
        title: 'Fundador de Bridgewater Associates',
        quote: 'Si no eres agresivo no ganarás dinero, y si no estás a la defensiva no lo conservarás. El dolor sumado a la reflexión equivale al progreso.',
        image: '/investors/ray-dalio.jpg',
    },
    {
        id: 'john-templeton',
        name: 'Sir John Templeton',
        title: 'Pionero de la inversión global y Templeton Growth Fund',
        quote: 'Los mercados alcistas nacen en el pesimismo, crecen en el escepticismo, maduran en el optimismo y mueren en la euforia. El momento de máximo pesimismo es el mejor momento para comprar.',
        image: '/investors/john-templeton.jpg',
    },
    {
        id: 'stanley-druckenmiller',
        name: 'Stanley Druckenmiller',
        title: 'Fundador de Duquesne Capital Management',
        quote: 'No importa si estás en lo correcto o equivocado; lo que importa es cuánto dinero ganas cuando aciertas y cuánto pierdes cuando te equivocas.',
        image: '/investors/stanley-druckenmiller.jpg',
    },
    {
        id: 'mohnish-pabrai',
        name: 'Mohnish Pabrai',
        title: 'Fundador de Pabrai Investment Funds',
        quote: 'Cara gano yo, cruz no pierdo mucho. La inversión de valor de bajo riesgo y alto rendimiento se basa en encontrar situaciones donde la pérdida está acotada y el potencial es enorme.',
        image: '/investors/mohnish-pabrai.jpg',
    },
    {
        id: 'joel-greenblatt',
        name: 'Joel Greenblatt',
        title: 'Fundador de Gotham Capital y autor de El pequeño libro que vence al mercado',
        quote: 'Comprar empresas de buena calidad a precios de ganga es el verdadero secreto para batir consistentemente al mercado a largo plazo.',
        image: '/investors/joel-greenblatt.jpg',
    },
    {
        id: 'george-soros',
        name: 'George Soros',
        title: 'Presidente de Soros Fund Management',
        quote: 'Los mercados financieros son impredecibles por naturaleza. Por eso uno debe tener diferentes escenarios: la clave de la supervivencia es aceptar los errores rápidamente y saber adaptarse.',
        image: '/investors/george-soros.jpg',
    },
];

interface InvestorQuoteProps {
    investorId?: string;
    showBackToTop?: boolean;
    className?: string;
}

export function InvestorQuote({
    investorId,
    showBackToTop = false,
    className = '',
}: InvestorQuoteProps) {
    const defaultIndex = useMemo(() => {
        if (investorId) {
            const idx = INVESTORS.findIndex((i) => i.id === investorId);
            if (idx !== -1) return idx;
        }
        return 1; // Warren Buffett by default
    }, [investorId]);

    const [currentIndex, setCurrentIndex] = useState(defaultIndex);
    const [isRotating, setIsRotating] = useState(false);

    const investor = INVESTORS[currentIndex] ?? INVESTORS[0];

    const handleNextQuote = () => {
        setIsRotating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % INVESTORS.length);
            setIsRotating(false);
        }, 150);
    };

    const handleScrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section
            className={`investor-quote-section my-12 py-10 px-4 flex flex-col items-center text-center justify-center ${className}`}
            aria-label="Cita de inversor legendario"
        >
            <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
                {/* Pill Badge at the top */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/25 mb-4 shadow-2xs select-none">
                    <Sparkles className="w-3 h-3" />
                    <span>Sabiduría de Inversión</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={investor.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center text-center"
                    >
                        {/* Circular Portrait with soft shadow & ring */}
                        <div className="relative mb-3 group">
                            <img
                                src={investor.image}
                                alt={investor.name}
                                loading="lazy"
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg ring-4 ring-card border-2 border-border/80 mx-auto transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Name */}
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1">
                            {investor.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 mb-6">
                            {investor.title}
                        </p>

                        {/* Quote Box */}
                        <div className="relative max-w-2xl px-6 sm:px-10">
                            <Quote
                                size={22}
                                className="inline-block text-primary/40 fill-primary/20 mr-2 -mt-2 transform -scale-x-100"
                            />
                            <blockquote className="inline text-base sm:text-lg lg:text-[19px] italic text-foreground/90 font-normal leading-relaxed">
                                {investor.quote}
                            </blockquote>
                            <Quote
                                size={22}
                                className="inline-block text-primary/40 fill-primary/20 ml-2 -mt-2"
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Circular action pill buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                    {/* Shuffle / Next Quote Button */}
                    <button
                        type="button"
                        onClick={handleNextQuote}
                        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-border/70 bg-card/80 hover:bg-secondary text-muted-foreground hover:text-foreground shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                        title="Ver otra frase célebre"
                    >
                        <span className="w-5 h-5 rounded-full bg-secondary/80 flex items-center justify-center text-foreground group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                            <RotateCw size={12} className={`transition-transform duration-300 ${isRotating ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                        </span>
                        <span>Otra frase</span>
                    </button>

                    {/* Back to top circular pill button */}
                    {showBackToTop && (
                        <button
                            type="button"
                            onClick={handleScrollTop}
                            className="group inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold border border-border/80 bg-card hover:bg-secondary text-foreground shadow-xs hover:shadow-sm hover:border-primary/40 transition-all active:scale-95 cursor-pointer"
                        >
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
                                <ArrowUp size={12} />
                            </span>
                            <span>Volver arriba</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

