import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [error, setError] = useState('');

    const handleResend = async () => {
        setResending(true);
        setError('');

        const { data } = await supabase.auth.getUser();
        const targetEmail = emailFromUrl || data.user?.email || '';

        if (!targetEmail) {
            setError('No encontramos el correo para reenviar la verificación.');
            setResending(false);
            return;
        }

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: targetEmail,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });

        if (resendError) {
            setError(resendError.message || 'No se pudo reenviar el correo.');
        } else {
            setResent(true);
        }

        setResending(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm bg-card p-6 rounded-2xl border flex flex-col items-center text-center gap-4"
            >
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex justify-center items-center">
                    <MailCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold">Verificá tu correo</h2>
                <p className="text-sm text-muted-foreground">
                    Te enviamos un enlace de confirmacion. Revisa tu bandeja de entrada y hace clic en el enlace para activar tu cuenta.
                </p>
                {emailFromUrl ? (
                    <p className="text-xs text-primary">{emailFromUrl}</p>
                ) : null}
                <p className="text-xs text-muted-foreground/60">
                    Si no lo ves, revisa la carpeta de correo no deseado.
                </p>

                {resent ? (
                    <p className="text-sm text-emerald-400">¡Correo reenviado!</p>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResend}
                        disabled={resending}
                        className="mt-2"
                    >
                        {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reenviar correo'}
                    </Button>
                )}
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </motion.div>
        </div>
    );
}
