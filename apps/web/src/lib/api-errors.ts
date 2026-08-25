export async function readApiError(response: Response) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
        return 'El servidor no está disponible temporalmente. Intenta de nuevo más tarde.';
    }

    try {
        const data = await response.clone().json();
        if (typeof data?.message === 'string') {
            return data.message;
        }
        if (Array.isArray(data?.message)) {
            return data.message.join(', ');
        }
        return null;
    } catch {
        return null;
    }
}

export function normalizeAuthError(message: string | null | undefined, fallback: string) {
    if (!message) {
        return fallback;
    }

    const normalized = message.trim().toLowerCase();

    if (
        normalized.includes('invalid login credentials') ||
        normalized.includes('invalid credentials') ||
        normalized.includes('credenciales invalid')
    ) {
        return 'El correo o la contrasena no son correctos.';
    }

    if (normalized.includes('email not confirmed')) {
        return 'Primero verifica tu correo para terminar de crear la cuenta.';
    }

    return message;
}
