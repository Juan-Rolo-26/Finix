import { useEffect, useRef } from 'react';
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
    const handledRef = useRef(false);

    useEffect(() => {
        const handle = async () => {
            if (handledRef.current) return;
            handledRef.current = true;

            const params = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const authError = params.get('error_description') || params.get('error')
                || hashParams.get('error_description') || hashParams.get('error');
            if (authError) {
                sessionStorage.removeItem('authRedirect');
                navigate(`/?reason=google-auth-error&message=${encodeURIComponent(authError)}`, { replace: true });
                return;
            }

            // Supabase restores the OAuth session from the URL before getSession.
            // A short retry protects slower browsers and mobile redirects.
            let session = null;
            let error = null;
            for (let attempt = 0; attempt < 5 && !session; attempt += 1) {
                const result = await supabase.auth.getSession();
                session = result.data.session;
                error = result.error;
                if (!session && !error) {
                    await new Promise((resolve) => window.setTimeout(resolve, 200));
                }
            }

            if (error || !session) {
                navigate('/?reason=auth-failed', { replace: true });
                return;
            }

            // Sync with NestJS backend
            const user = await syncFromSession();

            if (!user) {
                navigate('/?reason=auth-failed', { replace: true });
                return;
            }

            const isNewUser = session.user.created_at && (new Date().getTime() - new Date(session.user.created_at).getTime()) < 60000;
            const requestedRedirect = sessionStorage.getItem('authRedirect');
            sessionStorage.removeItem('authRedirect');
            const redirectTarget = requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
                ? requestedRedirect
                : '/dashboard';
            navigate(!user.onboardingCompleted && isNewUser ? '/onboarding' : redirectTarget, { replace: true });
        };

        void handle().catch(() => {
            sessionStorage.removeItem('authRedirect');
            navigate('/?reason=auth-failed', { replace: true });
        });
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
