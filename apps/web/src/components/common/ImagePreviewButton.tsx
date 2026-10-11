import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The trigger is separate from article links and upload controls. */
export function ImagePreviewButton({ src, alt, label = 'Ver imagen completa', className }: {
    src: string; alt: string; label?: string; className?: string;
}) {
    const [failed, setFailed] = useState(false);
    return (
        <Dialog.Root onOpenChange={(open) => { if (open) setFailed(false); }}>
            <Dialog.Trigger asChild>
                <button type="button" className={cn('min-h-11 min-w-11 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary', className)}>
                    <Maximize2 className="h-4 w-4 shrink-0" aria-hidden="true" />{label}
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/80" />
                <Dialog.Content aria-describedby={undefined} className="fixed inset-4 z-[101] flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-foreground shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                        <Dialog.Title className="min-w-0 break-words text-sm font-semibold">{label}</Dialog.Title>
                        <Dialog.Close asChild><button type="button" aria-label="Cerrar imagen completa" className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-xl border border-border focus-visible:ring-2 focus-visible:ring-primary"><X className="h-5 w-5" aria-hidden="true" /></button></Dialog.Close>
                    </div>
                    {failed ? <p role="status">La imagen original no está disponible. Cerrá esta vista para continuar.</p> :
                        <img src={src} alt={alt} referrerPolicy="no-referrer" onError={() => setFailed(true)} className="min-h-0 flex-1 w-full object-contain" />}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
