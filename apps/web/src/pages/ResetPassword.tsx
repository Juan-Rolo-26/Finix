import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(searchParams.get('sent') === '1' ? 'Revisá tu correo: te enviamos un código.' : '');
    const [error, setError] = useState('');
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); setIsLoading(true); setError(''); setMessage('');
        try {
            const response = await apiFetch('/auth/forgot/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), code, newPassword: password }) });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || 'El código es inválido o expiró.');
            setMessage(data.message || 'Tu contraseña fue actualizada.'); setTimeout(() => navigate('/'), 1500);
        } catch (err) { setError(err instanceof Error ? err.message : 'Error de conexión.'); } finally { setIsLoading(false); }
    };
    return <div className="min-h-screen flex items-center justify-center bg-background p-6"><div className="w-full max-w-sm bg-card p-6 rounded-2xl border space-y-5"><div className="flex flex-col items-center gap-3"><Lock className="w-8 h-8 text-primary" /><h2 className="text-xl font-bold">Restablecer contraseña</h2></div><form onSubmit={handleSubmit} className="space-y-4"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required /><Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Código de 6 dígitos" required /><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" minLength={6} required />{message && <p className="text-sm text-emerald-500 text-center">{message}</p>}{error && <p className="text-sm text-destructive text-center">{error}</p>}<Button type="submit" disabled={isLoading || code.length !== 6} className="w-full">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar contraseña'}</Button></form></div></div>;
}
