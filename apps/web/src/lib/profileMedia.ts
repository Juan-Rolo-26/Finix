import { supabase } from '@/lib/supabase';

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

    // Generate unique name for the image
    const ext = file.name.split('.').pop();
    const fileName = `${kind}_${crypto.randomUUID()}.${ext}`;
    const path = `profiles/${fileName}`;

    const { error } = await supabase.storage
        .from('public-media')
        .upload(path, file, { upsert: true });

    if (error) {
        throw new Error(`Error subiendo la imagen: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('public-media').getPublicUrl(path);

    if (kind === 'avatar') {
        return { avatarUrl: publicUrlData.publicUrl };
    }
    return { bannerUrl: publicUrlData.publicUrl };
}

