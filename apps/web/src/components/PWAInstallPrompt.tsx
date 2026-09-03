import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Only show if mobile
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;

        const hasSeenPrompt = localStorage.getItem('pwa_prompt_seen');
        if (hasSeenPrompt) return;

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Fallback for iOS / Safari where beforeinstallprompt is not supported
        const isIos = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isIos && !isStandalone) {
            setTimeout(() => {
                if (!localStorage.getItem('pwa_prompt_seen')) {
                    setShow(true);
                }
            }, 3000); // show after 3s
        }

        // Auto close after 7 seconds
        let timeout: any;
        if (show) {
            timeout = setTimeout(() => {
                setShow(false);
                localStorage.setItem('pwa_prompt_seen', 'true');
            }, 7000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timeout);
        };
    }, [show]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            setDeferredPrompt(null);
        } else {
            // Probably iOS
            alert('En iOS, toca el botón de "Compartir" en tu navegador y selecciona "Agregar a inicio".');
        }
        setShow(false);
        localStorage.setItem('pwa_prompt_seen', 'true');
    };

    const handleClose = () => {
        setShow(false);
        localStorage.setItem('pwa_prompt_seen', 'true');
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg border border-border/50 flex flex-col gap-3"
                    style={{ background: 'hsl(var(--card))' }}
                >
                    <button onClick={handleClose} className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Instalar Finix</h3>
                            <p className="text-xs text-muted-foreground">Accede rápido a tus finanzas sociales con un toque.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleInstall}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-lg text-sm transition-colors mt-1"
                    >
                        Crear acceso directo
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

