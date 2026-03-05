import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';

export default function Login() {
    const [loginStr, setLoginStr] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Using standard auth endpoint. The Admin Guard and Next routes verify Role!
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginStr, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Credenciales inválidas');
            }

            const data = await res.json();

            // Si funciona guardamos el token
            localStorage.setItem('auth-token', data.access_token);

            // Validar que realmente sea un admin (Haciendo un ping a un endpoint protegido de Admin)
            const kpiCheck = await fetch('/api/admin/kpis', {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });

            if (!kpiCheck.ok) {
                localStorage.removeItem('auth-token');
                throw new Error('Access denied: You are not an admin/allowlisted.');
            }

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 font-sans p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                        <Shield className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Finix Admin</h1>
                    <p className="text-zinc-500 text-sm">Ingreso restringido para administradores</p>
                </div>

                <form onSubmit={handleLogin} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 p-6 rounded-2xl shadow-2xl">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                Email / Usuario
                            </label>
                            <input
                                type="text"
                                required
                                value={loginStr}
                                onChange={e => setLoginStr(e.target.value)}
                                className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                                placeholder="tucorreo@finix.app"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#09090b] border border-zinc-700/50 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>

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
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar al CRM'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs text-zinc-600 mt-8">
                    &copy; {new Date().getFullYear()} Finix Technologies. Safe & Sound.
                </p>
            </div>
        </div>
    );
}
