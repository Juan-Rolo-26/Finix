import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Get token from URL
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <p className="text-red-400">Enlace inválido o expirado.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await apiFetch('/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Tu contraseña ha sido restablecida. Redirigiendo...');
                setTimeout(() => navigate('/'), 2500);
            } else {
                setError(data?.message || 'Error restableciendo la contraseña');
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
                    <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-center">Restablecer Contraseña</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                    Ingresa tu nueva contraseña para acceder a Finix.
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

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    {message && <p className="text-emerald-400 text-sm text-center font-medium">{message}</p>}

                    <Button type="submit" disabled={isLoading || password.length < 8} className="w-full shadow-glow">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Cambios'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
