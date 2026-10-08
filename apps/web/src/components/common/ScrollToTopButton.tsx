import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 350) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.6, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6, y: 15 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    onClick={scrollToTop}
                    type="button"
                    className="fixed bottom-20 lg:bottom-7 right-5 lg:right-7 z-50 w-11 h-11 rounded-full border border-border/80 bg-card/90 dark:bg-card/85 text-foreground shadow-xl backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:border-primary/60 hover:text-primary group cursor-pointer select-none"
                    aria-label="Volver arriba"
                    title="Volver arriba"
                >
                    <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
export default ScrollToTopButton;
