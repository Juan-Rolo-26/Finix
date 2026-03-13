export function buildUploadPublicPath(folder: string, filename: string) {
    return `/uploads/${folder}/${filename}`;
}

export function normalizeStoredUploadUrl(value?: string | null) {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            if (parsed.pathname.startsWith('/uploads/')) {
                return `${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
        } catch {
            return trimmed;
        }
    }

    if (trimmed.startsWith('/uploads/')) {
        return trimmed;
    }

    if (trimmed.startsWith('uploads/')) {
        return `/${trimmed}`;
    }

    return trimmed;
}
