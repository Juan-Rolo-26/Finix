import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, Smartphone, CheckCircle2, RefreshCw, Copy, Check, QrCode } from 'lucide-react';
import { adminFetch } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';

type LoginStep = 'credentials' | 'verify_email' | 'verify_2fa' | 'setup_2fa';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<LoginStep>('credentials');
    const [preAuthToken, setPreAuthToken] = useState('');
    const [mfaSecret, setMfaSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCredentialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await adminFetch('/admin/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            if (data.step === 'VERIFY_EMAIL') {
                setPreAuthToken(data.token);
                setStep('verify_email');
                setCode('');
                setSuccessMessage('¡Enviamos un código de verificación a tu correo!');
                return;
            }

            if (data.user) {
                navigate('/dashboard');
                return;
            }

            throw new Error('Respuesta de autenticación inesperada');
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await adminFetch('/admin/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken, code }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Código incorrecto o expirado');
            }

            if (data.user) {
                navigate('/dashboard');
                return;
            }

            if (data.step === 'SETUP_2FA') {
                setPreAuthToken(data.token);
                setMfaSecret(data.secret);
                setStep('setup_2fa');
                setCode('');
                setSuccessMessage('Código de email validado. Ahora ingresá el código de Google Authenticator.');
                return;
            }

            if (data.step === 'VERIFY_2FA') {
                setPreAuthToken(data.token);
                setStep('verify_2fa');
                setCode('');
                return;
            }

            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Error validando código');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await adminFetch('/admin/auth/verify-2fa', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken, code }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Código 2FA incorrecto');
            }

            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.message || 'No se pudo verificar el código 2FA');
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
            const res = await adminFetch('/admin/auth/resend-code', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'No se pudo reenviar el código');
            }

            setSuccessMessage(data.message || '¡Código reenviado a tu correo electrónico!');
            setResendCooldown(30);
        } catch (err: any) {
            setError(err.message || 'Error reenviando código');
        } finally {
            setResending(false);
        }
    };

    const handleSetupNewTotp = async () => {
        if (!preAuthToken) return;
        setLoading(true);
        setError('');
        try {
            const res = await adminFetch('/admin/auth/setup-totp', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Error generando código QR');
            }
            setMfaSecret(data.secret);
            setStep('setup_2fa');
            setCode('');
            setSuccessMessage('Escaneá este nuevo código QR en tu celular.');
        } catch (err: any) {
            setError(err.message || 'Error al configurar autenticador');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        if (!mfaSecret) return;
        navigator.clipboard.writeText(mfaSecret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans p-4 select-none">
            <div className="w-full max-w-md">
                {/* Header Brand */}
                <div className="flex flex-col items-center mb-6 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xl shadow-primary/5">
                        {step === 'credentials' ? (
                            <Shield className="w-8 h-8 text-primary" />
                        ) : step === 'setup_2fa' ? (
                            <QrCode className="w-8 h-8 text-primary" />
                        ) : (
                            <Smartphone className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Finix Admin</h1>
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                            <Shield className="w-3 h-3" />
                            Acceso Protegido con 2FA
                        </div>
                    </div>
                    <p className="text-muted-foreground text-xs text-center max-w-xs">
                        {step === 'credentials'
                            ? 'Ingreso de seguridad restringido para administradores de Finix'
                            : step === 'setup_2fa'
                            ? 'Vincular Google Authenticator / Authy a tu celular'
                            : 'Autenticación de 2 Factores (Email + Google Authenticator)'}
                    </p>
                </div>

                {/* Main Card */}
                <form
                    onSubmit={
                        step === 'credentials'
                            ? handleCredentialLogin
                            : step === 'verify_email'
                            ? handleVerifyEmailCode
                            : handleVerify2FA
                    }
                    className="bg-card/70 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-2xl space-y-4"
                >
                    {/* CREDENTIALS STEP */}
                    {step === 'credentials' && (
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="admin-email"
                                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                                >
                                    Email Admin
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>
                    )}

                    {/* VERIFY EMAIL STEP */}
                    {step === 'verify_email' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center text-xs space-y-1.5">
                                <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                                    <Smartphone className="w-4 h-4" />
                                    Código enviado a tu email
                                </div>
                                <p className="text-foreground/90 font-mono font-medium">juanpablorolo2007@gmail.com</p>
                                <p className="text-[11px] text-muted-foreground">
                                    Ingresá el código de 6 dígitos que enviamos a tu email para verificar tu identidad.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground text-center">
                                    Código de verificación
                                </label>
                                <input
                                    aria-label="Código de verificación de 6 dígitos"
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

                    {/* SETUP 2FA (TOTP en Celular) */}
                    {step === 'setup_2fa' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs space-y-2 text-center">
                                <p className="font-semibold text-primary">Configuración de Google Authenticator</p>
                                <ol className="text-[11px] text-muted-foreground text-left space-y-1 list-decimal list-inside px-1">
                                    <li>Abrí <b>Google Authenticator</b> o <b>Authy</b> en tu celular.</li>
                                    <li>Tocá <b>+</b> y elegí <b>Escanear código QR</b>.</li>
                                    <li>Escaneá el código que aparece aquí abajo:</li>
                                </ol>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl flex flex-col items-center justify-center mx-auto w-fit shadow-md">
                                <QRCodeSVG
                                    value={`otpauth://totp/Finix%20Admin:${encodeURIComponent(email)}?secret=${mfaSecret}&issuer=Finix%20Admin`}
                                    size={160}
                                    level="M"
                                />
                            </div>

                            <div className="bg-background/80 border border-border/60 rounded-xl p-2.5 flex items-center justify-between gap-2">
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Clave secreta manual</p>
                                    <p className="font-mono text-xs text-foreground tracking-wider truncate select-all">{mfaSecret}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={copySecret}
                                    className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Copiar clave secreta"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                                    Código generado en la App de tu celular
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-lg font-bold text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all tracking-[0.4em] text-center font-mono"
                                    placeholder="000000"
                                />
                            </div>
                        </div>
                    )}

                    {/* VERIFY 2FA (LOGIN HABITUAL) */}
                    {step === 'verify_2fa' && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center text-xs space-y-1.5">
                                <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                                    <Smartphone className="w-4 h-4" />
                                    Verificación en 2 Pasos (2FA)
                                </div>
                                <p className="text-foreground/90 text-xs">
                                    Código de Google Authenticator
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Ingresá el código de 6 dígitos que muestra tu app <b>Google Authenticator</b>.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground text-center">
                                    Código de autenticación
                                </label>
                                <input
                                    aria-label="Código de autenticación de 6 dígitos"
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="h-14 w-full rounded-2xl border-2 border-primary/30 bg-primary/[0.04] px-4 text-center font-mono text-2xl font-bold tracking-[0.45em] text-foreground shadow-[0_8px_24px_rgba(16,185,129,0.08)] outline-none transition-[border-color,background-color,box-shadow] placeholder:tracking-[0.22em] placeholder:text-muted-foreground/45 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                                    placeholder="123456"
                                />
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={resending || resendCooldown > 0}
                                    onClick={handleResendCode}
                                    className="flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 py-1"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                                    {resendCooldown > 0
                                        ? `Reenviar código en ${resendCooldown}s`
                                        : 'El código de Google Authenticator cambia cada 30 segundos'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSetupNewTotp}
                                    className="text-[11px] text-muted-foreground hover:text-foreground text-center transition-colors"
                                >
                                    ¿Configurar o cambiar app Authenticator en mi celular?
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success notification */}
                    {successMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl text-center flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Error notification */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center animate-in fade-in duration-200">
                            {error}
                        </div>
                    )}

                    {/* Action buttons */}
                    <button
                        type="submit"
                        disabled={loading || (step !== 'credentials' && code.length !== 6)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : step === 'credentials' ? (
                            'Continuar con 2FA'
                        ) : step === 'setup_2fa' ? (
                            'Confirmar y Activar 2FA'
                        ) : (
                            'Verificar y Acceder'
                        )}
                    </button>

                    {step !== 'credentials' && (
                        <button
                            type="button"
                            onClick={() => {
                                setStep('credentials');
                                setCode('');
                                setError('');
                                setSuccessMessage('');
                                setPreAuthToken('');
                            }}
                            className="w-full border border-border/70 hover:border-zinc-500 text-muted-foreground hover:text-foreground rounded-xl px-4 py-2.5 text-xs transition-colors"
                        >
                            Volver al login
                        </button>
                    )}
                </form>

                <p className="text-center text-[11px] text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} Finix Platform &bull; Sistema de Seguridad 2FA
                </p>
            </div>
        </div>
    );
}
