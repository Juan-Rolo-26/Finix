import { useState, useEffect } from 'react';
import { X, Download, Share2, PlusSquare, CheckCircle2, Sparkles, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [showGuideModal, setShowGuideModal] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Si ya se está ejecutando en modo standalone (instalada como app), no mostrar
        const isStandalone = 
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            return;
        }

        // 2. Verificar si el usuario lo descartó recientemente
        const isDismissed = localStorage.getItem('finix_install_dismissed_v2');
        if (!isDismissed) {
            // Mostrar tras una breve pausa para no interrumpir la carga inicial
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, []);

    // Capturar el evento nativo de instalación de PWA (Chrome / Android / Edge)
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('finix_install_dismissed_v2', 'true');
        setIsVisible(false);
    };

    const isIOS = typeof navigator !== 'undefined' && 
        /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(window as any).MSStream;

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Disparador nativo automático de instalación del navegador
            try {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    setIsVisible(false);
                    localStorage.setItem('finix_install_dismissed_v2', 'true');
                }
            } catch (err) {
                console.error('Error al solicitar instalación PWA:', err);
            }
            setDeferredPrompt(null);
        } else {
            // Si es iOS o navegador sin prompt directo, abrimos la guía interactiva
            setShowGuideModal(true);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* ── BANNER FLOTANTE REDISEÑADO CON SOPORTE COMPLETO LIGHT Y DARK MODE ── */}
            <div className="md:hidden fixed bottom-[76px] left-3 right-3 max-w-md mx-auto z-40">
                <div 
                    className="relative overflow-hidden rounded-2xl p-3 sm:p-3.5 
                    bg-white/95 dark:bg-slate-950/95 
                    border border-emerald-500/30 dark:border-emerald-500/25 
                    shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/70 
                    backdrop-blur-xl flex items-center justify-between gap-3 
                    text-slate-900 dark:text-white 
                    ring-1 ring-slate-900/5 dark:ring-white/10 
                    animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                    {/* Acento superior de gradiente */}
                    <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-primary" />

                    {/* Logo & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-500 dark:to-teal-700 p-0.5 shadow-sm flex items-center justify-center">
                            <div className="w-full h-full bg-emerald-50/90 dark:bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                                <img 
                                    src="/logo.png" 
                                    alt="Finix" 
                                    className="w-7 h-7 object-contain"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 dark:bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-xs">
                                <Sparkles className="w-2 h-2 text-white dark:text-slate-950 stroke-[3]" />
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-black text-slate-900 dark:text-white leading-snug truncate flex items-center gap-1.5">
                                Finix en tu celular
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium leading-tight truncate">
                                {isIOS ? 'Agregá a pantalla de inicio' : 'Navegá más rápido y en pantalla completa'}
                            </span>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Instalar</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label="Cerrar notificación"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MODAL GUÍA PASO A PASO (PARA IOS O NAVEGADORES SIN BEFOREINSTALLPROMPT) ── */}
            <AnimatePresence>
                {showGuideModal && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white space-y-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md flex items-center justify-center">
                                        <div className="w-full h-full bg-emerald-50/80 dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                                            <img src="/logo.png" alt="Finix" className="w-7 h-7 object-contain" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">Cómo tener Finix como App</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Instalación rápida en tu celular</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGuideModal(false)}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Pasos guiados según sistema */}
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm">
                                {isIOS ? (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                                <Share2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">1. Tocá el botón Compartir</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">Ubicado en la barra inferior de Safari.</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                                <PlusSquare className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">2. Seleccioná "Agregar a inicio"</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">Deslizá hacia abajo en el menú de opciones.</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">3. Presioná "Agregar"</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">¡Listo! Finix aparecerá como app en tu pantalla de inicio.</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                                <Smartphone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">1. Abrí el menú del navegador (⋮)</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">En la esquina superior derecha de Chrome o tu navegador.</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                                <PlusSquare className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">2. Elegí "Instalar aplicación"</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">O "Agregar a la pantalla principal".</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 dark:text-white block">3. Confirmar instalación</span>
                                                <span className="text-slate-500 dark:text-slate-400 text-xs">Finix se instalará como aplicación independiente en tu teléfono.</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowGuideModal(false);
                                    handleDismiss();
                                }}
                                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                            >
                                ¡Entendido!
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
