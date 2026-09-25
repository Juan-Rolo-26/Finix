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

type InstallMethod = 'native' | 'share' | null;

const DISMISS_KEY = 'finix_install_dismissed_v3';

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: minimal-ui)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || (window.navigator as any).standalone === true;
}

function isIosDevice() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent)
        || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

export default function InstallBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installMethod, setInstallMethod] = useState<InstallMethod>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Si ya está instalada como app, no mostrar otro aviso.
        if (isStandaloneMode()) {
            return;
        }

        if (localStorage.getItem(DISMISS_KEY)) {
            return;
        }

        // Chrome, Edge y navegadores Chromium entregan este prompt nativo.
        const prompt = (window as any).__finix_deferred_prompt as BeforeInstallPromptEvent | undefined;
        if (prompt) {
            setDeferredPrompt(prompt);
            setInstallMethod('native');
            setIsVisible(true);
            return;
        }

        // Safari en iPhone/iPad no expone beforeinstallprompt. El menú nativo
        // de compartir permite llegar a "Agregar a inicio" sin mostrar pasos.
        if (isIosDevice() && typeof navigator.share === 'function') {
            setInstallMethod('share');
            const timer = window.setTimeout(() => setIsVisible(true), 700);
            return () => window.clearTimeout(timer);
        }
    }, []);

    // Capturar el evento nativo de instalación de PWA
    useEffect(() => {
        const handlePrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            (window as any).__finix_deferred_prompt = e;
            setInstallMethod('native');
            if (!localStorage.getItem(DISMISS_KEY)) setIsVisible(true);
        };
        const handleDeferredPromptReady = () => {
            if ((window as any).__finix_deferred_prompt) {
                setDeferredPrompt((window as any).__finix_deferred_prompt);
                setInstallMethod('native');
                if (!localStorage.getItem(DISMISS_KEY)) setIsVisible(true);
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
        localStorage.setItem(DISMISS_KEY, 'true');
        setIsVisible(false);
    };

    const handleInstallClick = async () => {
        const promptEvent = deferredPrompt || (window as any).__finix_deferred_prompt;
        if (promptEvent && installMethod === 'native') {
            try {
                await promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    setIsVisible(false);
                    localStorage.setItem(DISMISS_KEY, 'true');
                }
            } catch (err) {
                console.error('Error al solicitar instalación PWA:', err);
            }
            setDeferredPrompt(null);
            (window as any).__finix_deferred_prompt = null;
            return;
        }

        if (installMethod === 'share' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: 'Finix',
                    text: 'Agregar Finix a la pantalla de inicio',
                    url: window.location.href,
                });
                handleDismiss();
            } catch (error: any) {
                // Cancelar el menú nativo no debe ocultar la opción para volver a intentarlo.
                if (error?.name !== 'AbortError') console.error('No se pudo abrir el menú de instalación:', error);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <aside
            aria-label="Instalar Finix"
            className="fixed bottom-[72px] left-3 right-3 z-40 mx-auto max-w-md sm:bottom-6 sm:left-auto sm:right-6"
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
                            {installMethod === 'share' ? 'Agregar Finix' : 'Instalar Finix'}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium leading-tight truncate">
                            Acceso directo a tus inversiones
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
                        <span>{installMethod === 'share' ? 'Agregar' : 'Instalar'}</span>
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
