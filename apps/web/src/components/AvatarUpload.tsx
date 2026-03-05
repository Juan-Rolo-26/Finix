import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Loader2, Upload, X, Camera } from 'lucide-react';

interface AvatarUploadProps {
    currentUrl?: string | null;
    onUploaded: (url: string) => void;
    size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
    sm: { container: 'w-16 h-16', icon: 'w-5 h-5', text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 'w-6 h-6', text: 'text-xs' },
    lg: { container: 'w-32 h-32', icon: 'w-7 h-7', text: 'text-sm' },
};

export default function AvatarUpload({ currentUrl, onUploaded, size = 'md' }: AvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const s = SIZES[size];

    const handleFile = async (file: File) => {
        // Validate client-side
        const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!ALLOWED.includes(file.type)) {
            setError('Solo se permiten imágenes JPG, PNG, WEBP o GIF');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no puede superar 5 MB');
            return;
        }

        setError('');
        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await apiFetch('/me/avatar', {
                method: 'POST',
                body: formData,
                // Don't set Content-Type — browser sets it with boundary for multipart
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d?.message || `Error ${res.status}`);
            }

            const { avatarUrl } = await res.json();
            onUploaded(avatarUrl);
            setPreview(avatarUrl);
        } catch (e: any) {
            setError(e.message || 'No se pudo subir la imagen');
            setPreview(currentUrl || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar circle */}
            <div
                className={`relative ${s.container} rounded-full cursor-pointer group`}
                onClick={() => !isUploading && inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Avatar"
                        className={`${s.container} rounded-full object-cover border-2 border-primary/40 group-hover:border-primary transition-all`}
                    />
                ) : (
                    <div className={`${s.container} rounded-full bg-secondary/50 border-2 border-dashed border-border/60 group-hover:border-primary/60 flex items-center justify-center transition-all`}>
                        <Camera className={`${s.icon} text-muted-foreground group-hover:text-primary transition-colors`} />
                    </div>
                )}

                {/* Overlay on hover */}
                <div className={`absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                    {isUploading ? (
                        <Loader2 className={`${s.icon} text-white animate-spin`} />
                    ) : (
                        <Upload className={`${s.icon} text-white`} />
                    )}
                </div>

                {/* Remove button */}
                {preview && !isUploading && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreview(null);
                            onUploaded('');
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                        <X className="w-2.5 h-2.5 text-white" />
                    </button>
                )}
            </div>

            {/* Upload button */}
            <button
                type="button"
                onClick={() => !isUploading && inputRef.current?.click()}
                disabled={isUploading}
                className={`${s.text} text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 disabled:opacity-50`}
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Subiendo...
                    </>
                ) : (
                    <>
                        <Upload className="w-3 h-3" />
                        {preview ? 'Cambiar foto' : 'Subir foto'}
                    </>
                )}
            </button>

            <p className={`${s.text} text-muted-foreground/60 text-center`}>
                JPG, PNG, WEBP · Máx 5 MB
            </p>

            {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleChange}
                className="hidden"
            />
        </div>
    );
}
