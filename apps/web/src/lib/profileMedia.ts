import { apiFetch } from '@/lib/api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ProfileMediaKind = 'avatar' | 'banner';

export function validateProfileImage(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF');
    }

    if (file.size > MAX_IMAGE_BYTES) {
        throw new Error('La imagen no puede superar 5 MB');
    }
}

export async function uploadProfileImage(kind: ProfileMediaKind, file: File) {
    validateProfileImage(file);

    const formData = new FormData();
    formData.append(kind, file);

    const res = await apiFetch(`/me/${kind}`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'No se pudo subir la imagen');
    }

    return res.json() as Promise<{ avatarUrl?: string; bannerUrl?: string }>;
}
