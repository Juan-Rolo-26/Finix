import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

interface PlatformAccessState {
    loaded: boolean;
    freeAccessEnabled: boolean;
    purchasesPaused: boolean;
    load: () => Promise<void>;
}

let pending: Promise<void> | null = null;

export const usePlatformAccessStore = create<PlatformAccessState>((set) => ({
    loaded: false,
    freeAccessEnabled: false,
    // Never offer checkout before the server has confirmed its availability.
    purchasesPaused: true,
    load: () => {
        if (pending) return pending;
        pending = (async () => {
            try {
                const response = await apiFetch('/mercadopago/config');
                if (!response.ok) throw new Error('No se pudo consultar el acceso de Finix.');
                const data = await response.json();
                set({ loaded: true, freeAccessEnabled: data.freeAccessEnabled === true, purchasesPaused: data.purchasesPaused === true });
            } catch {
                set({ loaded: true, freeAccessEnabled: false, purchasesPaused: true });
            } finally {
                pending = null;
            }
        })();
        return pending;
    },
}));

export const isFreeAccessEnabled = () => usePlatformAccessStore.getState().freeAccessEnabled;
