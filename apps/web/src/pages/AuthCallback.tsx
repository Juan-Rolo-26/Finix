import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

/**
 * Landing page after Supabase email verification links and OAuth redirects.
 * Supabase puts the session tokens in the URL hash (#access_token=...).
 * The Supabase client picks them up automatically on load.
 */
export default function AuthCallback() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    useEffect(() => {
        const handle = async () => {
            // Wait for Supabase to pick up the session from the URL hash
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                navigate('/');
                return;
            }

            const token = session.access_token;
            localStorage.setItem('token', token);

            // Get the username from Supabase user metadata (set during signup)
            const username = session.user.user_metadata?.username as string | undefined;

            // Sync/create the Prisma user
            const syncRes = await apiFetch('/auth/sync-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (!syncRes.ok) {
                // User already exists — just fetch profile
                const profileRes = await apiFetch('/auth/me');
                if (profileRes.ok) {
                    const user = await profileRes.json();
                    login(token, user);
                    navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding');
                } else {
                    navigate('/');
                }
                return;
            }

            const user = await syncRes.json();
            login(token, user);
            navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding');
        };

        handle();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Iniciando sesión...</p>
            </div>
        </div>
    );
}
