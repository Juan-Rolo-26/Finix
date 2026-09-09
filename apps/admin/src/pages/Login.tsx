import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, KeyRound, Mail } from 'lucide-react';
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
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCredentialLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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
                return;
            }

            throw new Error('Respuesta de autenticación inesperada');
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await adminFetch('/admin/auth/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken, code }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Código de email inválido');
            }

            if (data.step === 'VERIFY_2FA') {
                setPreAuthToken(data.token);
                setStep('verify_2fa');
                setCode('');
                return;
            } else if (data.step === 'SETUP_2FA') {
                setPreAuthToken(data.token);
                setMfaSecret(data.secret);
                setStep('setup_2fa');
                setCode('');
                return;
            }

            throw new Error('Respuesta de validación inesperada');
        } catch (err: any) {
            setError(err.message || 'Error validando código de email');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await adminFetch('/admin/auth/verify-2fa', {
                method: 'POST',
                body: JSON.stringify({ token: preAuthToken, code }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || data.error || 'Código 2FA inválido');
            }

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'No se pudo verificar el código 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 font-sans p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                        {step === 'credentials' ? <Shield className="w-8 h-8 text-emerald-500" /> :
                            step === 'verify_email' ? <Mail className="w-8 h-8 text-emerald-500" /> :
                                <KeyRound className="w-8 h-8 text-emerald-500" />}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Finix Admin</h1>
                    <p className="text-zinc-500 text-sm">
                        {step === 'credentials' ? 'Ingreso restringido para administradores' :
                            step === 'verify_email' ? 'Verificación Requerida' :
                                step === 'setup_2fa' ? 'Configuración 2FA Requerida' :
                                    'Verificación 2FA obligatoria'}
                    </p>
                </div>

                <form
                    onSubmit={step === 'credentials' ? handleCredentialLogin : step === 'verify_email' ? handleVerifyEmail : handleVerify2FA}
                    className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 p-6 rounded-2xl shadow-2xl"
                >
                    <div className="space-y-4">
                        {step === 'credentials' && (
                            <>
                                <div>
                                    <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Email</label>
                                    <input
                                        id="admin-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="admin@finix.com" autoComplete="email"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Contraseña</label>
                                    <input
                                        id="admin-password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                        placeholder="••••••••" autoComplete="current-password"
                                    />
                                </div>
                            </>
                        )}

                        {step === 'verify_email' && (
                            <>
                                <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-200 text-center mb-4">
                                    <p>¡Hemos enviado un código de 6 dígitos a tu correo electrónico!</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 text-center">Código Email</label>
                                    <input
                                        type="text" required inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all tracking-[0.3em] text-center font-mono"
                                        placeholder="000000"
                                    />
                                </div>
                            </>
                        )}

                        {step === 'setup_2fa' && (
                            <>
                                <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-200 text-center mb-4">
                                    <p>Escanea este código QR con Google Authenticator o Authy para habilitar el acceso seguro con 2FA.</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg flex justify-center mb-2 mx-auto w-fit">
                                    <QRCodeSVG value={`otpauth://totp/Finix%20Admin:${email}?secret=${mfaSecret}&issuer=Finix%20Admin`} size={150} />
                                </div>
                                <p className="text-center text-[10px] text-zinc-500 font-mono mb-4 break-all px-2">{mfaSecret}</p>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 text-center">Código de la App</label>
                                    <input
                                        type="text" required inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all tracking-[0.3em] text-center font-mono"
                                        placeholder="000000"
                                    />
                                </div>
                            </>
                        )}

                        {step === 'verify_2fa' && (
                            <>
                                <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-200 text-center mb-4">
                                    <p>Por favor, ingresa el código generado por tu aplicación Authenticator.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 text-center">Código 2FA Autenticador</label>
                                    <input
                                        type="text" required inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all tracking-[0.3em] text-center font-mono"
                                        placeholder="000000"
                                    />
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg text-center animate-in fade-in duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-semibold rounded-lg px-4 py-3 text-sm transition-all disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                step === 'credentials' ? 'Continuar' :
                                    step === 'verify_email' ? 'Verificar Correo' : 'Verificar 2FA'
                            )}
                        </button>

                        {step !== 'credentials' && (
                            <button
                                type="button"
                                onClick={() => { setStep('credentials'); setCode(''); setError(''); setPreAuthToken(''); }}
                                className="w-full border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-lg px-4 py-2.5 text-sm"
                            >
                                Volver al login
                            </button>
                        )}
                    </div>
                </form>

                <p className="text-center text-xs text-zinc-600 mt-8">
                    &copy; {new Date().getFullYear()} Finix Technologies.
                </p>
            </div>
        </div>
    );
}
