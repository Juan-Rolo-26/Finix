import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MailCheck } from 'lucide-react';

export default function VerifyEmail() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await apiFetch('/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: (user as any)?.email, code }),
            });

            const data = await res.json();

            if (res.ok) {
                // Actualizamos el estado del user usando el backend y lo reguardamos.
                // Idealmente el login nos devuelve el accessToken nuevo, o simplemente updateamos store
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, isVerified: true, emailVerified: true } : null
                }));

                if (user && !user.onboardingCompleted) {
                    navigate('/onboarding');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(data?.message || 'Código inválido o expirado');
            }
        } catch {
            setError('Error de conexión. Intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm bg-card p-6 rounded-2xl border flex flex-col items-center"
            >
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex justify-center items-center mb-6">
                    <MailCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-center">Verificación de Correo</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                    Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
                </p>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <Input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest uppercase h-14"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <Button type="submit" disabled={isLoading || code.length < 6} className="w-full shadow-glow">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
