import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Loader2, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const paramEmail = searchParams.get('email') || '';
    const paramCode = (searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6);
    const paramSent = searchParams.get('sent') === '1';

    const [email, setEmail] = useState(paramEmail);
    const [code, setCode] = useState(paramCode);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [step, setStep] = useState<'request' | 'reset'>(
        paramCode || paramSent || paramEmail ? 'reset' : 'request',
    );
    const [isLoading, setIsLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState(
        paramSent ? `Te enviamos un código de 6 dígitos a ${paramEmail || 'tu correo'}.` : '',
    );
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (paramEmail && !email) setEmail(paramEmail);
        if (paramCode && !code) setCode(paramCode);
    }, [paramEmail, paramCode]);

    const handleRequestCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Ingresá tu correo electrónico.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await apiFetch('/auth/forgot/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'No pudimos enviar el código.');

            setStep('reset');
            setMessage(`Te enviamos un código de 6 dígitos a ${normalizedEmail}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setError('Ingresá tu correo para reenviar el código.');
            return;
        }

        setResending(true);
        setError('');
        setMessage('');

        try {
            const res = await apiFetch('/auth/forgot/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'No pudimos reenviar el código.');

            setMessage('Te reenviamos un nuevo código a tu correo.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al reenviar el código.');
        } finally {
            setResending(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();
        const cleanCode = code.trim().replace(/\D/g, '');

        if (!normalizedEmail) {
            setError('Ingresá tu correo electrónico.');
            return;
        }
        if (cleanCode.length !== 6) {
            setError('El código debe tener 6 dígitos.');
            return;
        }
        if (password.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await apiFetch('/auth/forgot/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normalizedEmail,
                    code: cleanCode,
                    newPassword: password,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'El código es inválido o expiró.');

            setIsSuccess(true);
            setMessage(data.message || 'Tu contraseña fue restablecida con éxito.');
            setTimeout(() => {
                navigate('/');
            }, 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <m.div
                        className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <m.div
                        className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
                        style={{ background: 'radial-gradient(circle, hsl(160 80% 40% / 0.2) 0%, transparent 70%)' }}
                        animate={{ scale: [1.1, 1.25, 1.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md bg-card/90 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl relative z-10 flex flex-col gap-6"
                >
                    {/* Header */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <Link to="/" className="flex items-center gap-2 mb-1 group">
                            <img src="/logo.png" alt="Finix" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.4)] transition-transform group-hover:scale-105" />
                            <span className="text-xl font-heading font-extrabold text-foreground tracking-tight">Finix</span>
                        </Link>

                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                            {isSuccess ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : step === 'reset' ? <KeyRound className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold font-heading text-foreground">
                                {isSuccess ? '¡Contraseña actualizada!' : step === 'reset' ? 'Restablecer contraseña' : '¿Olvidaste tu contraseña?'}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isSuccess
                                    ? 'Redirigiendo a inicio de sesión en unos segundos...'
                                    : step === 'reset'
                                        ? 'Ingresá el código de 6 dígitos que te enviamos y creá una nueva contraseña.'
                                        : 'Ingresá tu correo electrónico y te mandaremos un código de verificación.'}
                            </p>
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {message && !error && (
                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2.5">
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Request Code */}
                    {step === 'request' && !isSuccess && (
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Correo electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="tu@email.com"
                                        className="pl-11 h-11 bg-secondary/40 border-input/50 focus:border-primary/50"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !email.trim()}
                                className="w-full h-11 px-5 rounded-xl font-bold text-sm tracking-normal flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/25"
                                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff' }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Enviando código...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Enviar código</span>
                                        <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                                    </>
                                )}
                            </button>

                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('reset')}
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    ¿Ya tenés un código? Ingresalo acá
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Reset with Code */}
                    {step === 'reset' && !isSuccess && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Correo electrónico
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setStep('request')}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="tu@email.com"
                                        className="pl-11 h-11 bg-secondary/40 border-input/50 focus:border-primary/50"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Código de 6 dígitos
                                </label>
                                <Input
                                    inputMode="numeric"
                                    placeholder="123456"
                                    className="h-12 bg-secondary/40 border-input/50 focus:border-primary/50 text-center text-xl tracking-[0.35em] font-mono font-bold"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    maxLength={6}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Nueva contraseña (mínimo 8 caracteres)
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Mínimo 8 caracteres"
                                        className="pl-11 pr-11 h-11 bg-secondary/40 border-input/50 focus:border-primary/50"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Confirmar nueva contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Repetí tu nueva contraseña"
                                        className="pl-11 pr-11 h-11 bg-secondary/40 border-input/50 focus:border-primary/50"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || code.length !== 6 || password.length < 8 || password !== confirmPassword}
                                className="w-full h-11 px-5 rounded-xl font-bold text-sm tracking-normal flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/25"
                                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff' }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Guardando contraseña...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Guardar nueva contraseña</span>
                                        <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-between pt-2 text-xs">
                                <button
                                    type="button"
                                    disabled={resending}
                                    onClick={handleResendCode}
                                    className="text-muted-foreground hover:text-foreground underline transition-colors disabled:opacity-50"
                                >
                                    {resending ? 'Reenviando...' : 'Reenviar código'}
                                </button>

                                <Link to="/" className="text-primary hover:underline font-medium">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Success state action */}
                    {isSuccess && (
                        <div className="space-y-3 pt-2">
                            <Button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full h-11 font-bold"
                            >
                                Ir al inicio de sesión
                            </Button>
                        </div>
                    )}

                    {/* Back to Login Footer */}
                    {!isSuccess && (
                        <div className="pt-2 border-t border-border/40 text-center">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Volver al inicio</span>
                            </Link>
                        </div>
                    )}
                </m.div>
            </div>
        </LazyMotion>
    );
}
