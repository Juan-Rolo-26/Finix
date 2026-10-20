import { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DeletePostModalProps { isOpen:boolean; onClose:()=>void; onConfirm:()=>void; isDeleting?:boolean; }
export default function DeletePostModal({isOpen,onClose,onConfirm,isDeleting}:DeletePostModalProps){
    const cancelRef=useRef<HTMLButtonElement>(null);
    return <Dialog open={isOpen} onOpenChange={open=>{if(!open&&!isDeleting)onClose();}}>
        <DialogContent className="z-[100] max-w-sm rounded-2xl p-6 text-center overscroll-contain" onOpenAutoFocus={event=>{event.preventDefault();cancelRef.current?.focus({preventScroll:true});}} onCloseAutoFocus={event=>event.preventDefault()} onEscapeKeyDown={event=>{if(isDeleting)event.preventDefault();}} onPointerDownOutside={event=>{if(isDeleting)event.preventDefault();}}>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600"><AlertTriangle className="h-6 w-6"/></span>
            <DialogTitle className="text-center text-lg">¿Eliminar publicación?</DialogTitle>
            <DialogDescription className="text-center">Esta acción no se puede deshacer. La publicación será borrada permanentemente de tu feed y del inicio.</DialogDescription>
            <div className="mt-2 flex gap-3"><Button ref={cancelRef} variant="outline" onClick={onClose} disabled={isDeleting} className="h-11 flex-1">Cancelar</Button><Button onClick={onConfirm} disabled={isDeleting} className="h-11 flex-1 bg-red-600 text-white hover:bg-red-700">{isDeleting?'Eliminando…':'Eliminar'}</Button></div>
        </DialogContent>
    </Dialog>;
}
