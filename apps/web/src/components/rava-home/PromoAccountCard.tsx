import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function PromoAccountCard() {
    const navigate = useNavigate();
    const { token, user } = useAuthStore();

    if (token && user) {
        return (
            <div className="bg-card text-card-foreground rounded-xl border border-emerald-500/30 p-4 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Tu cuenta Finix está activa</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Accedé a herramientas avanzadas: DCF, laboratorio financiero y portafolio en tiempo real.
                </p>
                <button
                    onClick={() => navigate('/laboratorio')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                    <span>Ir a Laboratorio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-card text-card-foreground rounded-xl border border-emerald-500/25 p-4 shadow-xs flex flex-col justify-between space-y-3 transition-colors dark:bg-gradient-to-br dark:from-[#0a101d] dark:to-[#062319] dark:text-foreground">
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-primary uppercase tracking-wider font-serif italic">
                    <span>CUENTA DIGITAL FINIX</span>
                </div>
                <h4 className="text-sm font-black text-foreground leading-tight">
                    ¿No tenés cuenta en Finix?
                </h4>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Es 100% gratuita.
                </p>
                <p className="text-[0.71875rem] text-muted-foreground leading-relaxed pt-0.5">
                    Accedé a cotizaciones en vivo, modelos DCF de valuación y herramientas de análisis financiero independiente.
                </p>
            </div>

            <div className="pt-1 relative z-10">
                <button
                    onClick={() => navigate('/register')}
                    className="w-full py-2 px-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                    <span>Abrí tu cuenta gratis</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
            </div>
        </div>
    );
}
