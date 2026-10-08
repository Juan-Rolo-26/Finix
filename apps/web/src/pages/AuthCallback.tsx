import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

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

            const user = await syncFromSession();

            if (!user) {
                navigate('/?reason=auth-failed', { replace: true });
                return;
            }

            const isNewUser = !user.onboardingCompleted;
            const requestedRedirect = sessionStorage.getItem('authRedirect');
            sessionStorage.removeItem('authRedirect');
            localStorage.removeItem('pendingUsername');
            const redirectTarget = requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
                ? requestedRedirect
                : '/dashboard';
            if (!user.onboardingCompleted && isNewUser) {
                sessionStorage.setItem('postOnboardingRedirect', redirectTarget);
                navigate('/onboarding', { replace: true });
                return;
            }
            navigate(redirectTarget, { replace: true });
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
