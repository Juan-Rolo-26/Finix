import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeAuthError } from '@/lib/api-errors';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const initialEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState(() => (searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6));
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState(
        searchParams.get('sent') === '1'
            ? `Te enviamos un codigo de verificacion a ${initialEmail || 'tu correo'}.`
            : '',
    );
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        const normalizedEmail = email.trim().toLowerCase();
        const { data, error: supaError } = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token: code,
            type: 'signup',
        });

        if (supaError) {
            setError(normalizeAuthError(supaError.message, 'No pudimos verificar el codigo. Proba otra vez.'));
            setIsLoading(false);
            return;
        }

        if (data.session && data.user) {
            const mappedUser: any = {
                id: data.user.id,
                email: data.user.email,
                username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
                onboardingCompleted: data.user.user_metadata?.onboardingCompleted || false,
                role: 'USER',
                plan: 'FREE',
                accountType: 'STANDARD',
                isInfluencer: false,
                isCreator: false,
                isVerified: true,
                emailVerified: true,
            };
            login(data.session.access_token, mappedUser);
            navigate(mappedUser.onboardingCompleted ? '/dashboard' : '/onboarding');
        } else {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Ingresa tu correo para reenviar el codigo.');
            return;
        }

        setResending(true);
        setError('');
        setMessage('');

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: normalizedEmail,
        });

        if (error) {
            setError(normalizeAuthError(error.message, 'No pudimos reenviar el codigo.'));
            setResending(false);
            return;
        }

        setMessage('Te reenviamos un nuevo codigo de verificacion.');
        setResending(false);
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm bg-card p-6 rounded-2xl border flex flex-col items-center text-center gap-4"
                >
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex justify-center items-center">
                        <MailCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold">Verifica tu correo</h2>
                    <p className="text-sm text-muted-foreground">
                        Finix te mando un codigo de 6 digitos por correo. Ingresalo abajo para activar tu cuenta.
                    </p>

                    <form onSubmit={handleVerify} className="w-full space-y-4 text-left">
                        <div className="space-y-2">
                            <label htmlFor="verify-email" className="text-sm font-medium text-foreground">Correo electronico</label>
                            <Input
                                id="verify-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="verify-code" className="text-sm font-medium text-foreground">Codigo de verificacion</label>
                            <Input
                                id="verify-code"
                                inputMode="numeric"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="h-11 text-center text-lg tracking-[0.35em]"
                                required
                            />
                        </div>

                        {message ? <p className="text-sm text-emerald-500 text-center">{message}</p> : null}
                        {error ? <p className="text-sm text-red-400 text-center">{error}</p> : null}

                        <Button
                            type="submit"
                            disabled={isLoading || code.length !== 6 || !email.trim()}
                            className="w-full"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar codigo'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            disabled={resending}
                            onClick={handleResend}
                            className="w-full"
                        >
                            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reenviar codigo'}
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground/70">
                        Si tocaste el boton del mail y llegaste aca, usa el codigo que Finix te envio en ese mismo correo.
                    </p>
                </m.div>
            </div>
        </LazyMotion>
    );
}
