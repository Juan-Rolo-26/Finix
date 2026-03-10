import { ChangeEvent, useMemo, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, Type, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { uploadChatFile } from '@/components/messages/mediaUpload';
import type { StoryAuthor, StoryItem } from './storyTypes';

const BACKGROUNDS = [
    'linear-gradient(135deg, #0f172a 0%, #111827 45%, #10b981 100%)',
    'linear-gradient(135deg, #1f2937 0%, #2563eb 50%, #60a5fa 100%)',
    'linear-gradient(135deg, #111827 0%, #7c3aed 55%, #ec4899 100%)',
    'linear-gradient(135deg, #1c1917 0%, #f97316 50%, #facc15 100%)',
    'linear-gradient(135deg, #052e16 0%, #14532d 50%, #22c55e 100%)',
];

const TEXT_COLORS = ['#ffffff', '#e2e8f0', '#fde68a', '#86efac', '#bfdbfe'];

const initialState = {
    content: '',
    mediaUrl: '',
    background: BACKGROUNDS[0],
    textColor: TEXT_COLORS[0],
};

export function StoryComposerModal({
    open,
    onOpenChange,
    onCreated,
    currentUser,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (story: StoryItem) => void;
    currentUser: StoryAuthor | null;
}) {
    const [content, setContent] = useState(initialState.content);
    const [mediaUrl, setMediaUrl] = useState(initialState.mediaUrl);
    const [background, setBackground] = useState(initialState.background);
    const [textColor, setTextColor] = useState(initialState.textColor);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const previewText = useMemo(() => {
        const trimmed = content.trim();
        return trimmed || 'Conta algo rapido sobre el mercado, una idea o una foto.';
    }, [content]);

    const reset = () => {
        setContent(initialState.content);
        setMediaUrl(initialState.mediaUrl);
        setBackground(initialState.background);
        setTextColor(initialState.textColor);
        setError('');
        setIsUploading(false);
        setIsSubmitting(false);
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
        }
        onOpenChange(nextOpen);
    };

    const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Solo podes subir imagenes para las historias');
            event.target.value = '';
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const uploaded = await uploadChatFile(file);
            setMediaUrl(uploaded.url);
        } catch (uploadError: any) {
            setError(uploadError?.message || 'No se pudo subir la imagen');
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const handleSubmit = async () => {
        if ((!content.trim() && !mediaUrl) || isUploading || isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const res = await apiFetch('/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim() || undefined,
                    mediaUrl: mediaUrl || undefined,
                    background,
                    textColor,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || 'No se pudo publicar la historia');
            }

            const story: StoryItem = await res.json();
            onCreated({
                ...story,
                author: story.author || currentUser || {
                    id: '',
                    username: 'vos',
                },
            });
            handleClose(false);
        } catch (submitError: any) {
            setError(submitError?.message || 'No se pudo publicar la historia');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[92vh] overflow-y-auto border-border/60 bg-card/95 p-0 text-foreground backdrop-blur-xl sm:max-w-5xl">
                <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="border-b border-border/60 bg-muted/35 p-5 lg:border-b-0 lg:border-r">
                        <div
                            className="relative mx-auto flex aspect-[9/16] w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
                            style={{ background }}
                        >
                            {mediaUrl ? (
                                <img
                                    src={mediaUrl}
                                    alt="Preview de historia"
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            ) : null}

                            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />

                            <div className="absolute left-4 top-4 flex items-center gap-3 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
                                <div className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-black/30">
                                    {currentUser?.avatarUrl ? (
                                        <img src={currentUser.avatarUrl} alt={currentUser.username} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase text-white">
                                            {currentUser?.username?.[0] || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-white">{currentUser?.username || 'Tu historia'}</div>
                                    <div className="text-[11px] text-white/65">Vista previa</div>
                                </div>
                            </div>

                            <div className="relative z-10 flex h-full w-full items-center justify-center p-8 text-center">
                                <p
                                    className="max-w-[88%] whitespace-pre-wrap break-words text-[1.65rem] font-semibold leading-tight"
                                    style={{ color: textColor, textShadow: '0 12px 38px rgba(0,0,0,0.38)' }}
                                >
                                    {previewText}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <DialogHeader className="space-y-2 text-left">
                            <DialogTitle className="text-2xl">Nueva historia</DialogTitle>
                            <DialogDescription>
                                Subi una imagen o escribi un mensaje breve. La historia dura 24 horas.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Type className="h-4 w-4 text-primary" />
                                    Texto
                                </div>
                                <Textarea
                                    value={content}
                                    onChange={(event) => setContent(event.target.value.slice(0, 220))}
                                    placeholder="Que queres compartir hoy?"
                                    className="min-h-[132px] resize-none border-border/60 bg-background text-base text-foreground"
                                />
                                <div className="text-right text-xs text-muted-foreground">{content.length}/220</div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <ImagePlus className="h-4 w-4 text-primary" />
                                    Imagen
                                </div>
                                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border/70 bg-muted/25 px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5">
                                    <span className="truncate text-muted-foreground">
                                        {mediaUrl ? 'Imagen subida correctamente' : 'Subir una imagen vertical o cuadrada'}
                                    </span>
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                        {isUploading ? 'Subiendo...' : 'Elegir'}
                                    </span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>

                                {mediaUrl ? (
                                    <button
                                        type="button"
                                        onClick={() => setMediaUrl('')}
                                        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Quitar imagen
                                    </button>
                                ) : null}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Fondo
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {BACKGROUNDS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setBackground(preset)}
                                            className={`h-12 rounded-2xl border transition-transform hover:scale-[1.03] ${background === preset ? 'border-primary shadow-[0_0_0_1px_rgba(16,185,129,0.5)]' : 'border-border/70'
                                                }`}
                                            style={{ background: preset }}
                                            aria-label="Seleccionar fondo"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-medium text-foreground">Color del texto</div>
                                <div className="flex gap-2">
                                    {TEXT_COLORS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setTextColor(preset)}
                                            className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 ${textColor === preset ? 'border-primary' : 'border-border/70'
                                                }`}
                                            style={{ backgroundColor: preset }}
                                            aria-label="Seleccionar color del texto"
                                        />
                                    ))}
                                </div>
                            </div>

                            {error ? (
                                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    {error}
                                </div>
                            ) : null}
                        </div>

                        <DialogFooter className="mt-8 flex-col gap-3 sm:flex-row">
                            <Button
                                variant="outline"
                                className="border-border/60 bg-transparent"
                                onClick={() => handleClose(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isUploading || (!content.trim() && !mediaUrl)}
                                className="gap-2"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Publicar historia
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
