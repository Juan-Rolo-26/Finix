import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BackButton from '@/components/BackButton';
import { useTranslation } from '@/i18n';
import {
    Mail,
    Lock,
    User,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
    TrendingUp,
    Users,
    BarChart3,
    Wallet,
    Sparkles,
    Shield,
    Zap,
} from 'lucide-react';

// ─── Feature pill ─────────────────────────────────────────────────────────────
const FeaturePill = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
        <Icon className="w-3 h-3 text-primary" />
        {label}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthPage() {
    const t = useTranslation();
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [authError, setAuthError] = useState('');

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
            try {
                const res = await apiFetch('/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (res.ok) {
                    setResetSent(true);
                } else {
                    const data = await res.json();
                    setAuthError(data?.message || t.auth.errors.connectionError);
                }
            } catch {
                setAuthError(t.auth.errors.connectionError);
            } finally {
                setIsLoading(false);
            }
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
                // Redirect to onboarding if not completed, else dashboard
                if (data.user?.isVerified === false) {
                    navigate('/verify-email');
                } else if (data.user?.onboardingCompleted === false) {
                    navigate('/onboarding');
                } else {
                    navigate('/dashboard');
                }
                return;
            }

            setAuthError(data?.message || t.auth.errors.invalidCredentials);
        } catch {
            setAuthError(t.auth.errors.connectionError);
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: TrendingUp, label: 'Feed Social' },
        { icon: Wallet, label: 'Portafolios' },
        { icon: Sparkles, label: 'Herramientas' },
        { icon: BarChart3, label: 'Mercados' },
    ];

    const highlights = [
        { icon: Shield, title: 'Seguro y privado', desc: 'Tus datos financieros siempre protegidos.' },
        { icon: Zap, title: 'Tiempo real', desc: 'Datos de mercado actualizados al instante.' },
        { icon: Users, title: 'Red de inversores', desc: 'Conectá con miles de inversores.' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Main Content */}
            <div className="flex-1 grid lg:grid-cols-2">

                {/* ── LEFT SIDE: Brand & Visuals ── */}
                <div className="relative hidden lg:flex flex-col justify-center items-center p-12 overflow-hidden bg-[#070b0f]">
                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
                            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 70%)' }}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
                            style={{ background: 'radial-gradient(circle, hsl(160 80% 40% / 0.12) 0%, transparent 70%)' }}
                            animate={{ scale: [1.1, 1, 1.1] }}
                            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        {/* Grid */}
                        <div
                            className="absolute inset-0 opacity-[0.025]"
                            style={{
                                backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                                backgroundSize: '50px 50px',
                            }}
                        />
                    </div>

                    <div className="relative z-10 max-w-md w-full space-y-10">
                        {/* Logo + Tagline */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="flex items-center gap-4"
                        >
                            <div className="relative">
                                <div className="absolute -inset-3 rounded-2xl bg-primary/20 blur-xl" />
                                <img src="/logo.png" alt="Finix" className="relative h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight">Finix</h1>
                                <p className="text-sm text-primary font-medium tracking-widest uppercase">Finanzas Sociales</p>
                            </div>
                        </motion.div>

                        {/* Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.7 }}
                        >
                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white leading-tight mb-4">
                                Invertí mejor.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                    Conectá con inversores.
                                </span>
                            </h2>
                            <p className="text-white/50 text-base leading-relaxed">
                                La red social financiera donde compartís análisis, gestionás tu portafolio y aprendés de los mejores inversores.
                            </p>
                        </motion.div>

                        {/* Highlights */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-3"
                        >
                            {highlights.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{title}</p>
                                        <p className="text-xs text-white/40">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Feature Pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-wrap gap-2"
                        >
                            {features.map(({ icon, label }) => (
                                <FeaturePill key={label} icon={icon} label={label} />
                            ))}
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.85 }}
                            className="w-fit rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                        >
                            Finix es 100% gratis y te podés registrar gratis.
                        </motion.p>
                    </div>
                </div>

                {/* ── RIGHT SIDE: Auth Form ── */}
                <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative min-h-screen lg:min-h-0">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <img src="/logo.png" alt="Finix" className="h-12 w-12 object-contain" />
                        <span className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Finix</span>
                    </div>

                    <div className="w-full max-w-sm space-y-6">
                        {/* Title */}
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-heading font-bold tracking-tight">
                                {view === 'login' && t.auth.loginTitle}
                                {view === 'register' && t.auth.registerTitle}
                                {view === 'forgot' && t.auth.forgotTitle}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {view === 'login' && t.auth.loginDesc}
                                {view === 'register' && t.auth.registerDesc}
                                {view === 'forgot' && t.auth.forgotDesc}
                            </p>
                        </div>

                        {/* Form */}
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
                                    <BackButton
                                        onClick={() => { setView('login'); setResetSent(false); }}
                                        label={t.auth.backLogin}
                                        className="mt-4 w-full justify-center"
                                    />
                                </motion.div>
                            ) : (
                                <motion.form
                                    key={view}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-3"
                                >
                                    {view === 'register' && (
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
                                    )}

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

                                    {view !== 'forgot' && (
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
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

                                    <div className="relative my-2">
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

                        {/* Switch login/register */}
                        <div className="text-center text-sm border-t border-border/30 pt-4">
                            {view === 'login' ? (
                                <p className="text-muted-foreground">
                                    {t.auth.noAccount}{' '}
                                    <button onClick={() => setView('register')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                        {t.auth.register}
                                    </button>
                                </p>
                            ) : view === 'register' ? (
                                <p className="text-muted-foreground">
                                    {t.auth.hasAccount}{' '}
                                    <button onClick={() => setView('login')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                        {t.auth.login}
                                    </button>
                                </p>
                            ) : (
                                <BackButton
                                    onClick={() => { setView('login'); setResetSent(false); }}
                                    label={t.auth.backToLogin}
                                    className="w-full justify-center"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER ── */}
            <footer className="border-t border-border/20 py-6 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
                        {[
                            { label: 'Características', href: '/info/features' },
                            { label: 'Cómo funciona', href: '/info/how' },
                            { label: 'Sobre nosotros', href: '/info/about' },
                        ].map(({ label, href }) => (
                            <Link key={label} to={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                {label}
                            </Link>
                        ))}
                        <span className="text-xs text-muted-foreground">•</span>
                        <Link to="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            {t.legal.privacy}
                        </Link>
                        <Link to="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            {t.legal.terms}
                        </Link>
                        <a href="https://instagram.com/fiinixarg" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Instagram
                        </a>
                        <a href="mailto:finixarg@gmail.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Contacto
                        </a>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                        <Sparkles className="w-3 h-3" />
                        <span>© 2026 Finix · Finanzas Sociales</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
