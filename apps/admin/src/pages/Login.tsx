import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, KeyRound } from 'lucide-react';
import { adminFetch } from '../lib/api';

type LoginStep = 'credentials' | 'verify_2fa' | 'setup_2fa';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<LoginStep>('credentials');
    const [preAuthToken, setPreAuthToken] = useState('');
    const [setupSecret, setSetupSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');
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

            if (data.step === 'SETUP_2FA') {
                setPreAuthToken(data.token);
                setSetupSecret(data.secret || '');
                setOtpauthUrl(data.otpauthUrl || '');
                setStep('setup_2fa');
                return;
            }

            if (data.step === 'VERIFY_2FA') {
                setPreAuthToken(data.token);
                setStep('verify_2fa');
                return;
            }

            throw new Error('Respuesta de autenticación inválida');
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
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
                throw new Error(data.message || 'Código 2FA inválido');
            }

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'No se pudo verificar el código 2FA');
        } finally {
            setLoading(false);
        }
    };

    const renderCredentialStep = () => (
        <>
            <div>
                <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Email
                </label>
                <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="admin@finix.com"
                    autoComplete="email"
                />
            </div>

            <div>
                <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Contraseña
                </label>
                <input
                    id="admin-password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                />
            </div>
        </>
    );

    const renderTwoFactorStep = () => (
        <>
            {step === 'setup_2fa' && (
                <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <p>Configura Google Authenticator (o app TOTP compatible) con este secreto:</p>
                    <p className="font-mono break-all text-amber-100">{setupSecret}</p>
                    {otpauthUrl && (
                        <p className="font-mono break-all text-[10px] text-amber-300">{otpauthUrl}</p>
                    )}
                    <p>Luego ingresa el código de 6 dígitos para activar 2FA.</p>
                </div>
            )}

            <div>
                <label htmlFor="admin-2fa-code" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Código 2FA
                </label>
                <input
                    id="admin-2fa-code"
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all tracking-[0.3em] text-center font-mono"
                    placeholder="000000"
                    autoComplete="one-time-code"
                />
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 font-sans p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                        {step === 'credentials' ? <Shield className="w-8 h-8 text-emerald-500" /> : <KeyRound className="w-8 h-8 text-emerald-500" />}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Finix Admin</h1>
                    <p className="text-zinc-500 text-sm">
                        {step === 'credentials' ? 'Ingreso restringido para administradores' : 'Verificación 2FA obligatoria'}
                    </p>
                </div>

                <form
                    onSubmit={step === 'credentials' ? handleCredentialLogin : handleVerify2FA}
                    className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 p-6 rounded-2xl shadow-2xl"
                >
                    <div className="space-y-4">
                        {step === 'credentials' ? renderCredentialStep() : renderTwoFactorStep()}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg text-center animate-in fade-in duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-semibold rounded-lg px-4 py-3 text-sm transition-all disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 'credentials' ? 'Continuar' : 'Verificar 2FA')}
                        </button>

                        {step !== 'credentials' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('credentials');
                                    setCode('');
                                    setError('');
                                    setPreAuthToken('');
                                }}
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
