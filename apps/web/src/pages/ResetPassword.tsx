import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // En Supabase, el enlace mágico inicia una sesión de recuperación automáticamente.
        // Validamos que haya una activa para permitir guardar la nueva contraseña.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setError('El enlace es inválido o expiró. Volvé a solicitar un restablecimiento desde el inicio de sesión.');
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                setError(updateError.message || 'Error al actualizar la contraseña.');
                setIsLoading(false);
                return;
            }

            setMessage('Tu contraseña fue actualizada.');

            // Sincronizar usuario con backend si es necesario post actualización
            await useAuthStore.getState().syncFromSession();

            setTimeout(() => {
                navigate('/dashboard');
            }, 2200);
        } catch (err) {
            setError('Error de conexión.');
            setIsLoading(false);
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm bg-card p-6 rounded-2xl border flex flex-col items-center"
                >
                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex justify-center items-center mb-6">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-center">Definir nueva contraseña</h2>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        Ingresa y confirma tu nueva contraseña de Finix.
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña"
                                className="pr-10 bg-secondary/50 h-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {error ? <p className="text-red-400 text-sm text-center">{error}</p> : null}
                        {message ? <p className="text-emerald-400 text-sm text-center font-medium">{message}</p> : null}

                        <Button
                            type="submit"
                            disabled={isLoading || password.length < 8}
                            className="w-full shadow-glow"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar nueva contraseña'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/')}
                            className="w-full"
                        >
                            Volver al inicio
                        </Button>
                    </form>
                </m.div>
            </div>
        </LazyMotion>
    );
}
