import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeletePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export default function DeletePostModal({ isOpen, onClose, onConfirm, isDeleting }: DeletePostModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-sm bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden"
                    >
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-foreground">¿Eliminar publicación?</h3>
                                <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
                                    Esta acción no se puede deshacer. La publicación será borrada permanentemente de tu feed y del inicio.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={onClose} 
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl h-11 border-border/50 hover:bg-muted/50"
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={onConfirm} 
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl h-11 bg-red-500 hover:bg-red-600 text-white border-0"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                </Button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={onClose}
                            disabled={isDeleting}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
