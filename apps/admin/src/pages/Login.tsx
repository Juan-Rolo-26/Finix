import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail, RefreshCw, Shield } from 'lucide-react';
import { adminFetch } from '../lib/api';

type LoginStep = 'credentials' | 'verify_email';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<LoginStep>('credentials');
    const [preAuthToken, setPreAuthToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleCredentialLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await adminFetch('/admin/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Credenciales inválidas');

            if (data.user) {
                navigate('/dashboard', { replace: true });
                return;
            }
            if (data.step !== 'VERIFY_EMAIL' || !data.token) {
                throw new Error('Respuesta de autenticación inesperada');
            }

            setPreAuthToken(data.token);
            setCode('');
            setStep('verify_email');
            setSuccessMessage('Enviamos un código de acceso a tu correo.');
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailCode = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await adminFetch('/admin/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken, code }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || data.error || 'Código incorrecto o expirado');
            if (!data.user) throw new Error('No se pudo completar el acceso.');

            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.message || 'No se pudo verificar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || !preAuthToken) return;
        setResending(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await adminFetch('/admin/auth/resend-code', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'No se pudo reenviar el código');

            setSuccessMessage(data.message || 'Enviamos un nuevo código a tu correo.');
            setResendCooldown(30);
        } catch (err: any) {
            setError(err.message || 'Error al reenviar el código');
        } finally {
            setResending(false);
        }
    };

    const returnToLogin = () => {
        setStep('credentials');
        setCode('');
        setPreAuthToken('');
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans p-4 select-none">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-6 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xl shadow-primary/5">
                        {step === 'credentials'
                            ? <Shield className="w-8 h-8 text-primary" />
                            : <Mail className="w-8 h-8 text-primary" />}
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Finix Admin</h1>
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                            <Shield className="w-3 h-3" />
                            Acceso protegido por correo
                        </div>
                    </div>
                    <p className="text-muted-foreground text-xs text-center max-w-xs">
                        {step === 'credentials'
                            ? 'Ingreso restringido para administradores de Finix'
                            : 'Verificación de acceso mediante un código enviado a tu correo.'}
                    </p>
                </div>

                <form
                    onSubmit={step === 'credentials' ? handleCredentialLogin : handleVerifyEmailCode}
                    className="bg-card/70 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-2xl space-y-4"
                >
                    {step === 'credentials' ? (
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="admin-email"
                                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                                >
                                    Email admin
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="admin@finixarg.com"
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="admin-password"
                                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                                >
                                    Contraseña
                                </label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center text-xs space-y-1.5">
                                <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                                    <Mail className="w-4 h-4" />
                                    Código enviado a tu correo
                                </div>
                                <p className="text-foreground/90 font-medium">Revisá el correo del administrador.</p>
                                <p className="text-[11px] text-muted-foreground">
                                    Ingresá el código de 6 dígitos recibido por correo para completar el acceso.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="admin-email-code"
                                    className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground text-center"
                                >
                                    Código de verificación
                                </label>
                                <input
                                    id="admin-email-code"
                                    aria-label="Código de verificación de 6 dígitos enviado por correo"
                                    autoComplete="one-time-code"
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    value={code}
                                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="h-14 w-full rounded-2xl border-2 border-primary/30 bg-primary/[0.04] px-4 text-center font-mono text-2xl font-bold tracking-[0.45em] text-foreground shadow-[0_8px_24px_rgba(16,185,129,0.08)] outline-none transition-[border-color,background-color,box-shadow] placeholder:tracking-[0.22em] placeholder:text-muted-foreground/45 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                    placeholder="123456"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={resending || resendCooldown > 0}
                                onClick={handleResendCode}
                                className="w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 py-1"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                                {resendCooldown > 0
                                    ? `Reenviar código en ${resendCooldown}s`
                                    : 'Reenviar código a mi email'}
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center animate-in fade-in duration-200">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (step === 'verify_email' && code.length !== 6)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : step === 'credentials' ? (
                            'Continuar'
                        ) : (
                            'Verificar código y acceder'
                        )}
                    </button>

                    {step === 'verify_email' && (
                        <button
                            type="button"
                            onClick={returnToLogin}
                            className="w-full border border-border/70 hover:border-zinc-500 text-muted-foreground hover:text-foreground rounded-xl px-4 py-2.5 text-xs transition-colors"
                        >
                            Volver al login
                        </button>
                    )}
                </form>

                <p className="text-center text-[11px] text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} Finix Platform &bull; Verificación por correo electrónico
                </p>
            </div>
        </div>
    );
}
