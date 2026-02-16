import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Mail,
    Lock,
    User,

    ArrowRight,
    Loader2,
    CheckCircle2,
    ArrowLeft,
    Eye,
    EyeOff
} from 'lucide-react';

export default function AuthPage() {
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [authError, setAuthError] = useState('');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const loginGoogle = () => {
        setAuthError('Login con Google no está configurado todavía. Usa email y contraseña.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAuthError('');

        if (view === 'forgot') {
            setResetSent(true);
            setIsLoading(false);
            return;
        }

        const endpoint = view === 'login' ? '/auth/login' : '/auth/register';

        try {
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(view === 'login' ? { email, password } : { email, password, username })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.removeItem('demo_mode');
                login(data.access_token, data.user);
                navigate('/dashboard');
                return;
            }

            setAuthError(data?.message || 'Credenciales inválidas o usuario ya registrado.');
        } catch (err) {
            setAuthError('No se pudo conectar con el servidor. Verifica que la API esté levantada.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden bg-background">
            {/* Left Side - Visuals */}
            <div className="relative hidden lg:flex flex-col justify-center items-center p-12 bg-[#0b0f14] text-white overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-background to-background z-10" />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute bottom-32 right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"
                    />
                </div>

                <div className="relative z-20 max-w-lg text-center space-y-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <img src="/logo.png" alt="Finix" className="h-24 w-24 mx-auto object-contain drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]" />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-6">
                            Bienvenido al Futuro <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Financiero Social</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Únete a la comunidad de inversores más inteligente. Comparte ideas, analiza mercados y haz crecer tu portafolio con herramientas profesionales.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-2 gap-4 pt-8"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                            <h3 className="text-2xl font-bold text-primary mb-1">100%</h3>
                            <p className="text-sm text-muted-foreground">Transparencia</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                            <h3 className="text-2xl font-bold text-indigo-400 mb-1">24/7</h3>
                            <p className="text-sm text-muted-foreground">Acceso al Mercado</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative">
                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </Link>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-heading font-bold tracking-tight">
                            {view === 'login' && 'Iniciar Sesión'}
                            {view === 'register' && 'Crear Cuenta'}
                            {view === 'forgot' && 'Recuperar Contraseña'}
                        </h2>
                        <p className="text-muted-foreground">
                            {view === 'login' && 'Ingresa tus credenciales para continuar'}
                            {view === 'register' && 'Regístrate gratis en menos de 1 minuto'}
                            {view === 'forgot' && 'Te enviaremos las instrucciones a tu email'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {resetSent && view === 'forgot' ? (
                            <motion.div
                                key="reset-success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-400">¡Correo Enviado!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor revisa tu bandeja de entrada.
                                </p>
                                <Button
                                    onClick={() => { setView('login'); setResetSent(false); }}
                                    className="w-full mt-4"
                                    variant="outline"
                                >
                                    Volver al Login
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key={view}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                {view === 'register' && (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                placeholder="Nombre de usuario"
                                                className="pl-10 h-11 bg-secondary/50 border-input/50 focus:border-primary/50"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="Correo electrónico"
                                            className="pl-10 h-11 bg-secondary/50 border-input/50 focus:border-primary/50"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {view !== 'forgot' && (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Contraseña"
                                                className="pl-10 pr-10 h-11 bg-secondary/50 border-input/50 focus:border-primary/50"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {view === 'login' && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot')}
                                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full text-base font-bold shadow-glow hover:shadow-intense transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {view === 'login' && 'Ingresar'}
                                            {view === 'register' && 'Crear Cuenta'}
                                            {view === 'forgot' && 'Enviar Enlace'}
                                            {(view === 'login' || view === 'register') && <ArrowRight className="w-5 h-5 ml-2" />}
                                        </>
                                    )}
                                </Button>
                                {authError && (
                                    <p className="text-sm text-red-400 text-center">{authError}</p>
                                )}

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-muted/30" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground/50">O continúa con</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full relative py-5 border-muted/40 hover:bg-muted/50 transition-all font-medium"
                                    onClick={loginGoogle}
                                    disabled={isLoading}
                                >
                                    <div className="absolute left-4">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <span className="flex-1 text-center">Google</span>
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="text-center text-sm">
                        {view === 'login' ? (
                            <p className="text-muted-foreground">
                                ¿No tienes una cuenta?{' '}
                                <button onClick={() => setView('register')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                    Regístrate
                                </button>
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                {view === 'register' ? (
                                    <>
                                        ¿Ya tienes cuenta?{' '}
                                        <button onClick={() => setView('login')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                            Inicia Sesión
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => { setView('login'); setResetSent(false); }} className="font-bold text-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 w-full">
                                        <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
                                    </button>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Links */}
                <div className="absolute bottom-6 flex gap-6 text-xs text-muted-foreground">
                    <Link to="/legal/privacy" className="hover:text-foreground">Privacidad</Link>
                    <Link to="/legal/terms" className="hover:text-foreground">Términos</Link>
                    <Link to="/legal/responsible" className="hover:text-foreground">Ayuda</Link>
                </div>
            </div>
        </div>
    );
}
