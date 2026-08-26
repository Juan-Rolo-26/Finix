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

            const mappedUser: any = {
                id: session.user.id,
                email: session.user.email,
                username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
                onboardingCompleted: session.user.user_metadata?.onboardingCompleted || false,
                role: 'USER',
                plan: 'FREE',
                accountType: 'STANDARD',
                isInfluencer: false,
                isCreator: false,
                isVerified: true,
                emailVerified: true,
            };

            login(token, mappedUser);
            navigate(mappedUser.onboardingCompleted ? '/dashboard' : '/onboarding');
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
