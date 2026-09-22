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

    if (!file || file.size === 0) {
        throw new Error('La imagen seleccionada está vacía. Elegí otra imagen e intentá nuevamente.');
    }

    const formData = new FormData();
    formData.append(kind, file, file.name || `${kind}.jpg`);

    const response = await apiFetch(`/me/${kind}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let errorMsg = `Error subiendo el ${kind === 'avatar' ? 'avatar' : 'banner'}`;
        try {
            const errData = await response.json();
            errorMsg = errData.message || errorMsg;
        } catch {
            // ignore
        }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    return {
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
    };
}
