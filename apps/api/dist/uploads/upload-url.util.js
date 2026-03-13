"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUploadPublicPath = buildUploadPublicPath;
exports.normalizeStoredUploadUrl = normalizeStoredUploadUrl;
function buildUploadPublicPath(folder, filename) {
    return `/uploads/${folder}/${filename}`;
}
function normalizeStoredUploadUrl(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            if (parsed.pathname.startsWith('/uploads/')) {
                return `${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
        }
        catch {
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
//# sourceMappingURL=upload-url.util.js.map