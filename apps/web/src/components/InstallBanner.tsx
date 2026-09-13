import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InstallBanner() {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        const isDismissed = localStorage.getItem('installBannerDismissed');
        // Solo mostramos si no ha sido descartado y estamos en entorno cliente
        if (!isDismissed && typeof window !== 'undefined') {
            setIsVisible(true);
        }
    }, []);
    
    const handleDismiss = () => {
        localStorage.setItem('installBannerDismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    // Detectar si es iOS o Android para texto descriptivo
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    return (
        <div className="md:hidden fixed bottom-16 sm:bottom-0 left-0 w-full z-50 p-2 sm:p-0">
            <div className="bg-primary text-primary-foreground sm:rounded-none rounded-xl shadow-lg border border-primary/20 p-3 sm:p-4 flex items-center justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 bg-background rounded-xl flex items-center justify-center p-1.5 shadow-sm">
                        <img src="/logo.png" alt="Finix" className="h-full w-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">Agrega Finix a tu inicio</span>
                        <span className="text-[11px] opacity-90 leading-tight mt-0.5">
                            {isIOS ? 'Toca Compartir y luego "Agregar a inicio"' : 'Instala la app para una mejor experiencia'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 pl-2">
                    <button 
                        onClick={handleDismiss} 
                        className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
