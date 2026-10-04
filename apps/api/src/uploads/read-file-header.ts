import { open } from 'node:fs/promises';

/** Validate file signatures without reading a 100 MB upload on the event loop. */
export async function readFileHeader(path: string): Promise<Buffer> {
    const file = await open(path, 'r');
    try {
        const header = Buffer.alloc(16);
        const { bytesRead } = await file.read(header, 0, header.length, 0);
        return header.subarray(0, bytesRead);
    } finally {
        await file.close();
    }
}
