import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function VerifyEmail() {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        setResending(true);
        // Get the email from the pending Supabase signup
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) {
            await supabase.auth.resend({
                type: 'signup',
                email: data.user.email,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
        }
        setResent(true);
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
            </motion.div>
        </div>
    );
}
