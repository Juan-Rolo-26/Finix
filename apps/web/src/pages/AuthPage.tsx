import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n';
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
    const t = useTranslation();
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
        setAuthError(t.auth.errors.googleNotConfigured);
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

            setAuthError(data?.message || t.auth.errors.invalidCredentials);
        } catch (err) {
            setAuthError(t.auth.errors.connectionError);
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
                            {t.auth.welcomeTitle} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">{t.auth.welcomeSubtitle}</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {t.auth.welcomeBack}
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
                            <p className="text-sm text-muted-foreground">{t.auth.transparency}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                            <h3 className="text-2xl font-bold text-indigo-400 mb-1">24/7</h3>
                            <p className="text-sm text-muted-foreground">{t.auth.marketAccess}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative">
                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {t.auth.backHome}
                </Link>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-heading font-bold tracking-tight">
                            {view === 'login' && t.auth.loginTitle}
                            {view === 'register' && t.auth.registerTitle}
                            {view === 'forgot' && t.auth.forgotTitle}
                        </h2>
                        <p className="text-muted-foreground">
                            {view === 'login' && t.auth.loginDesc}
                            {view === 'register' && t.auth.registerDesc}
                            {view === 'forgot' && t.auth.forgotDesc}
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
                                <h3 className="text-xl font-bold text-emerald-400">{t.auth.emailSentTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t.auth.emailSentDesc} <strong>{email}</strong>. {t.auth.checkInbox}
                                </p>
                                <Button
                                    onClick={() => { setView('login'); setResetSent(false); }}
                                    className="w-full mt-4"
                                    variant="outline"
                                >
                                    {t.auth.backLogin}
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
                                                placeholder={t.auth.username}
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
                                            placeholder={t.auth.email}
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
                                                placeholder={t.auth.password}
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
                                            {t.auth.forgotPassword}
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
                                            {view === 'login' && t.auth.loginBtn}
                                            {view === 'register' && t.auth.createAccountBtn}
                                            {view === 'forgot' && t.auth.sendLinkBtn}
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
                                        <span className="bg-background px-2 text-muted-foreground/50">{t.auth.orContinue}</span>
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
                                {t.auth.noAccount}{' '}
                                <button onClick={() => setView('register')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                    {t.auth.register}
                                </button>
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                {view === 'register' ? (
                                    <>
                                        {t.auth.hasAccount}{' '}
                                        <button onClick={() => setView('login')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                            {t.auth.login}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => { setView('login'); setResetSent(false); }} className="font-bold text-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 w-full">
                                        <ArrowLeft className="w-4 h-4" /> {t.auth.backToLogin}
                                    </button>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Links */}
                <div className="absolute bottom-6 flex gap-6 text-xs text-muted-foreground">
                    <Link to="/legal/privacy" className="hover:text-foreground">{t.legal.privacy}</Link>
                    <Link to="/legal/terms" className="hover:text-foreground">{t.legal.terms}</Link>
                    <Link to="/legal/responsible" className="hover:text-foreground">{t.legal.help}</Link>
                </div>
            </div>
        </div>
    );
}
