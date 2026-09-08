export function buildUploadPublicPath(folder: string, filename: string) {
    return `/uploads/${folder}/${filename}`;
}

/**
 * Normalize a media URL before storing in the database.
 * - External HTTPS URLs (Supabase Storage, CDNs, etc.) are stored as-is.
 * - Local /uploads/ paths from localhost are stripped to the relative path.
 */
export function normalizeStoredUploadUrl(value?: string | null) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
            // Only strip local /uploads/ paths — preserve all external URLs (Supabase, CDN, etc.)
            if (localHosts.has(parsed.hostname) && parsed.pathname.startsWith('/uploads/')) {
                return `${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
        } catch {
            return trimmed;
        }
        // External URL (Supabase, etc.) — keep as-is
        return trimmed;
    }

    if (trimmed.startsWith('/uploads/')) {
        return trimmed;
    }

    if (trimmed.startsWith('uploads/')) {
        return `/${trimmed}`;
    }

    return trimmed;
}
