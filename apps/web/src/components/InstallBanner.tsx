import { useState, useEffect } from 'react';
import { X, Download, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Si ya se está ejecutando en modo standalone (instalada como app), no mostrar
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            return;
        }

        // 2. Verificar si hay prompt capturado tempranamente
        if ((window as any).__finix_deferred_prompt) {
            setDeferredPrompt((window as any).__finix_deferred_prompt);
        }

        // 3. Verificar si el usuario lo descartó recientemente
        const isDismissed = localStorage.getItem('finix_install_dismissed_v2');
        if (!isDismissed) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Capturar el evento nativo de instalación de PWA
    useEffect(() => {
        const handlePrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            (window as any).__finix_deferred_prompt = e;
            setIsVisible(true);
        };
        const handleDeferredPromptReady = () => {
            if ((window as any).__finix_deferred_prompt) {
                setDeferredPrompt((window as any).__finix_deferred_prompt);
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handlePrompt);
        window.addEventListener('finix:deferred-prompt-ready', handleDeferredPromptReady);

        return () => {
            window.removeEventListener('beforeinstallprompt', handlePrompt);
            window.removeEventListener('finix:deferred-prompt-ready', handleDeferredPromptReady);
        };
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('finix_install_dismissed_v2', 'true');
        setIsVisible(false);
    };

    const handleInstallClick = async () => {
        const promptEvent = deferredPrompt || (window as any).__finix_deferred_prompt;
        if (promptEvent) {
            try {
                // Disparador nativo automático inmediato
                await promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    setIsVisible(false);
                    localStorage.setItem('finix_install_dismissed_v2', 'true');
                }
            } catch (err) {
                console.error('Error al solicitar instalación PWA:', err);
            }
            setDeferredPrompt(null);
            (window as any).__finix_deferred_prompt = null;
        } else {
            // Si el navegador ya tiene la app o no soporta prompt directo, cerrar silenciosamente
            handleDismiss();
        }
    };

    if (!isVisible) return null;

    return (
        <aside
            aria-label="Instalar Finix"
            className="md:hidden fixed bottom-[72px] left-3 right-3 max-w-md mx-auto z-40"
        >
            <div
                className="relative overflow-hidden rounded-2xl p-3 sm:p-3.5
                bg-card/95 backdrop-blur-xl border border-border/80
                shadow-xl shadow-black/10 dark:shadow-2xl dark:shadow-black/50
                flex items-center justify-between gap-3 text-foreground
                transition-all duration-200"
            >
                {/* Acento superior de gradiente de marca Finix */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-emerald-400 to-teal-400" />

                {/* Logo & Info */}
                <div 
                    onClick={handleInstallClick}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                >
                    <div className="relative shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-xs">
                        <img
                            src="/logo.png"
                            alt="Finix"
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full border-2 border-card flex items-center justify-center shadow-xs">
                            <Sparkles className="w-2 h-2 text-primary-foreground stroke-[3]" />
                        </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-foreground leading-snug truncate flex items-center gap-1.5">
                            Instalar Finix
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium leading-tight truncate">
                            Acceso directo rápido a tus inversiones
                        </span>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Instalar</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                        aria-label="Cerrar notificación"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
