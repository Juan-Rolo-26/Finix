import { resolve } from 'path';
import { existsSync, realpathSync } from 'fs';

export function verificationStorageRoot(): string {
    return process.env.FINIX_PRIVATE_STORAGE_DIR || resolve(__dirname, '../../../../.local/finix/private/storage');
}
export function isOwnedVerificationDocument(path: unknown, userId: string): boolean {
    if (typeof path !== 'string' || !path.startsWith(`financial-verifications/${userId}-`) ||
        !/^financial-verifications\/[a-zA-Z0-9-]+\.(pdf|jpg|png|webp)$/.test(path)) return false;
    const root = verificationStorageRoot(), file = resolve(root, path);
    return existsSync(file) && realpathSync(file).startsWith(realpathSync(root) + '/');
}
export function validVerificationSignature(bytes: Buffer, mime: string): boolean {
    if (mime === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
    if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (mime === 'image/webp') return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    return false;
}
