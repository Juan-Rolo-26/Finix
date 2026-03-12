import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { normalizeAuthError, readApiError } from '@/lib/api-errors';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState(() => (searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6));
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState(
        searchParams.get('sent') === '1'
            ? `Te enviamos un codigo para restablecer la contrasena a ${initialEmail || 'tu correo'}.`
            : '',
    );
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        const response = await apiFetch('/auth/forgot/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                code,
                newPassword: password,
            }),
        });

        if (!response.ok) {
            setError(
                normalizeAuthError(
                    await readApiError(response),
                    'No pudimos restablecer tu contrasena.',
                ),
            );
            setIsLoading(false);
            return;
        }

        const data = await response.json();
        setMessage(data.message || 'Tu contrasena fue actualizada. Ahora puedes iniciar sesion.');
        setIsLoading(false);
        setTimeout(() => navigate('/'), 2200);
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

        const response = await apiFetch('/auth/forgot/request-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: normalizedEmail,
            }),
        });

        if (!response.ok) {
            setError(
                normalizeAuthError(
                    await readApiError(response),
                    'No pudimos reenviar el codigo.',
                ),
            );
            setResending(false);
            return;
        }

        const data = await response.json();
        setMessage(data.message || 'Te enviamos un nuevo codigo para restablecer tu contrasena.');
        setResending(false);
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
                    <h2 className="text-xl font-bold mb-2 text-center">Restablecer contrasena</h2>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        Ingresa el codigo que te mando Finix por correo y define tu nueva contrasena.
                    </p>

                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        <Input
                            type="email"
                            placeholder="Correo electronico"
                            className="h-11 bg-secondary/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            inputMode="numeric"
                            placeholder="Codigo de 6 digitos"
                            className="h-11 bg-secondary/50 text-center text-lg tracking-[0.35em]"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                        />

                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contrasena"
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
                            disabled={isLoading || password.length < 8 || code.length !== 6 || !email.trim()}
                            className="w-full shadow-glow"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar nueva contrasena'}
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
                </m.div>
            </div>
        </LazyMotion>
    );
}
