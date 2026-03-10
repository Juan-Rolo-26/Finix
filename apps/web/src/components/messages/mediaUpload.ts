import { apiFetch } from '@/lib/api';

export interface UploadedChatMedia {
    url: string;
    mediaType: 'image' | 'video';
    originalName?: string;
    size?: number;
}

export async function uploadChatFile(file: File): Promise<UploadedChatMedia> {
    const formData = new FormData();
    formData.append('files', file);

    const res = await apiFetch('/posts/upload-media', {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'No se pudo subir el archivo');
    }

    const uploaded = await res.json();
    return uploaded[0];
}

export async function uploadChatBlob(blob: Blob, filename: string) {
    const file = new File([blob], filename, {
        type: blob.type || 'image/png',
    });

    return uploadChatFile(file);
}
