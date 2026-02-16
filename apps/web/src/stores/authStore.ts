import { create } from 'zustand';
import { User } from '@finix/shared';


interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    updateUser: (patch: Partial<User>) => void;
    logout: () => void;
}

const persistedToken = localStorage.getItem('token');
if (persistedToken && !persistedToken.startsWith('demo-')) {
    localStorage.removeItem('demo_mode');
}

export const useAuthStore = create<AuthState>((set) => ({
    token: persistedToken,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    login: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
    },
    updateUser: (patch) => {
        const currentRaw = localStorage.getItem('user');
        const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
        const nextUser = currentUser ? { ...currentUser, ...patch } : patch;
        localStorage.setItem('user', JSON.stringify(nextUser));
        set({ user: nextUser });
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('demo_mode');
        set({ token: null, user: null });
    },
}));
