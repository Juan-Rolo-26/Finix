import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

/**
 * Landing page after Supabase email verification links and OAuth redirects.
 * Supabase puts the session tokens in the URL hash (#access_token=...).
 * The Supabase client picks them up automatically on load.
 */
export default function AuthCallback() {
    const navigate = useNavigate();
    const { syncFromSession } = useAuthStore();

    useEffect(() => {
        const handle = async () => {
            // Wait for Supabase to pick up the session from the URL hash
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                navigate('/');
                return;
            }

            // Remove any old local token to force checking Supabase's current session
            localStorage.removeItem('token');

            // Sync with NestJS backend
            const user = await syncFromSession();

            if (!user) {
                navigate('/?reason=auth-failed');
                return;
            }

            const isNewUser = session.user.created_at && (new Date().getTime() - new Date(session.user.created_at).getTime()) < 60000;
            navigate(!user.onboardingCompleted && isNewUser ? '/onboarding' : '/dashboard');
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
