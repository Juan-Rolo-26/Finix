import { motion } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export interface ProGateProps {
    title?: string;
    description?: string;
    badgeText?: string;
    buttonText?: string;
    onUpgrade?: () => void;
    className?: string;
}

export function ProGate({
    title = 'Sección exclusiva PRO',
    description = 'Accedé a nuestro análisis de noticias financieras curado, organizado por categorías y actualizado en tiempo real por nuestro equipo editorial.',
    badgeText = 'PRO',
    buttonText = 'Activar PRO',
    onUpgrade,
    className = '',
}: ProGateProps) {
    const navigate = useNavigate();
    const handleUpgrade = onUpgrade || (() => navigate('/pro'));

    return (
        <div className={`flex-1 w-full flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] sm:min-h-[calc(100vh-80px)] px-6 py-16 text-center relative overflow-hidden my-auto ${className}`}>
            {/* Subtle Finix emerald glow */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                    className="w-[500px] h-[350px] rounded-full opacity-15 dark:opacity-25"
                    style={{
                        background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
                        filter: 'blur(90px)',
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative z-10 flex flex-col items-center max-w-lg mx-auto"
            >
                {/* Lock icon container in Finix colors */}
                <div className="relative mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto shadow-xl shadow-primary/15 transition-transform duration-300 hover:scale-105">
                        <Lock className="w-9 h-9 sm:w-11 sm:h-11 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 px-2.5 py-0.5 min-w-[30px] h-7 bg-primary rounded-full flex items-center justify-center text-xs font-black text-primary-foreground shadow-lg shadow-primary/30 border-2 border-background">
                        {badgeText}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground tracking-tight mb-3">
                    {title}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                    {description}
                </p>

                {/* Action button in Finix colors */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        onClick={handleUpgrade}
                        className="px-8 py-3.5 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700 text-primary-foreground border-0 shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                    >
                        <span>{buttonText}</span>
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

export default ProGate;
