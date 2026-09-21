import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { supabase } from '@/lib/supabase';

import { normalizeAuthError } from '@/lib/api-errors';
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
    Eye,
    EyeOff,
    TrendingUp,
    Users,
    BarChart3,
    Wallet,
    Sparkles,
    Shield,
    Zap,
    CheckCircle2,
    Instagram,
} from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

const FeaturePill = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <div className="auth-feature-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs">
        <Icon className="w-3 h-3 text-primary" />
        {label}
    </div>
);

export default function AuthPage() {
    const t = useTranslation();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const redirectTarget = searchParams.get('redirect') || searchParams.get('returnUrl') || '/dashboard';
    const planRequested = searchParams.get('plan');

    const [view, setView] = useState<AuthView>(mode === 'register' ? 'register' : 'login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authError, setAuthError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loginCodeStep, setLoginCodeStep] = useState(false);
    const [loginCode, setLoginCode] = useState('');
    const [forgotCodeStep, setForgotCodeStep] = useState(false);
    const [forgotCode, setForgotCode] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
    const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

    const { } = useAuthStore();
    const navigate = useNavigate();

    const features = [
        { icon: TrendingUp, label: 'Comunidad social' },
        { icon: Wallet, label: 'Portafolios' },
        { icon: Sparkles, label: 'Herramientas' },
        { icon: BarChart3, label: 'Mercados' },
    ];

    const infoLinks = [
        { label: 'Características', to: '/info/features' },
        { label: 'Cómo funciona', to: '/info/how' },
        { label: 'Sobre Finix', to: '/info/about' },
        { label: 'Contacto', to: '/info/contact' },
        { label: 'Planes', to: '/pro' },
    ];

    const legalAndSocialLinks = [
        { label: t.legal.privacy, to: '/legal/privacy' },
        { label: t.legal.terms, to: '/legal/terms' },
    ];

    const highlights = [
        { icon: Shield, title: 'Seguro y privado', desc: 'Tus datos financieros siempre protegidos.' },
        { icon: Zap, title: 'Tiempo real', desc: 'Datos de mercado actualizados al instante.' },
        { icon: Users, title: 'Red de inversores', desc: 'Conectá con miles de inversores.' },
    ];

    const clearMessages = () => {
        setAuthError('');
        setInfoMessage('');
        setSuccessMessage('');
    };

    const switchView = (nextView: AuthView) => {
        setView(nextView);
        setIsLoading(false);
        clearMessages();
        setLoginCodeStep(false);
        setLoginCode('');
        setForgotCodeStep(false);
        setForgotCode('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');

        if (nextView !== 'register') {
            setUsername('');
        }
        if (nextView === 'forgot') {
            setPassword('');
        }
    };

    const loginGoogle = async () => {
        if (view === 'register' && username.trim().length < 3) {
            setAuthError('Por favor ingresá un nombre de usuario (mínimo 3 letras) en el campo de arriba antes de registrarte con Google.');
            return;
        }

        if (view === 'register') {
            localStorage.setItem('pendingUsername', username.trim());
        }

        setIsLoading(true);
        clearMessages();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    prompt: 'select_account',
                    access_type: 'online',
                },
            },
        });

        if (error) {
            setAuthError(normalizeAuthError(error.message, t.auth.errors.googleNotConfigured));
            setIsLoading(false);
        }
    };



    const handleLogin = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        const response = await apiFetch(loginCodeStep ? '/auth/login/verify-code' : '/auth/login/request-code', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginCodeStep ? { email: normalizedEmail, code: loginCode } : { email: normalizedEmail, password }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || 'No se pudo iniciar sesión.');
        if (!loginCodeStep) {
            setLoginCodeStep(true);
            setInfoMessage('Te enviamos un código de acceso a tu correo.');
            return;
        }
        if (!data.token || !data.user) throw new Error('No se pudo completar el inicio de sesión.');
        useAuthStore.getState().login(data.token, data.user);
    };

    const handleRegister = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        try {
            const response = await apiFetch('/auth/register/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: normalizedEmail,
                    username: normalizedUsername,
                    password,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || 'No se pudo enviar el código de verificación.');

            navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}&sent=1`);
        } catch (err: any) {
            setAuthError(normalizeAuthError(err.message, 'Error de conexión'));
        }
    };

    const handleResendForgotCode = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setAuthError('Ingresá tu correo electrónico.');
            return;
        }
        setIsLoading(true);
        clearMessages();
        try {
            const response = await apiFetch('/auth/forgot/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || 'No se pudo reenviar el código.');
            setSuccessMessage('Te reenviamos un nuevo código a tu correo.');
        } catch (err: any) {
            setAuthError(err.message || 'Error al reenviar el código.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setAuthError('Ingresá tu correo electrónico.');
            return;
        }

        if (!forgotCodeStep) {
            const response = await apiFetch('/auth/forgot/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || 'No se pudo enviar el código.');
            setForgotCodeStep(true);
            setInfoMessage('Te enviamos un código de 6 dígitos a tu correo. Ingresalo abajo junto a tu nueva contraseña.');
            return;
        }

        const cleanCode = forgotCode.trim().replace(/\D/g, '');
        if (cleanCode.length !== 6) {
            throw new Error('Ingresá el código de 6 dígitos que recibiste.');
        }
        if (forgotNewPassword.length < 8) {
            throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        }
        if (forgotNewPassword !== forgotConfirmPassword) {
            throw new Error('Las contraseñas no coinciden.');
        }

        const response = await apiFetch('/auth/forgot/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: normalizedEmail,
                code: cleanCode,
                newPassword: forgotNewPassword,
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || 'El código es inválido o expiró.');

        switchView('login');
        setPassword('');
        setSuccessMessage(data.message || 'Tu contraseña fue actualizada con éxito. Ya podés iniciar sesión.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (view === 'register' && username.trim().length < 3) {
            setAuthError('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }
        if (view !== 'forgot' && password.length < 6) {
            setAuthError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (view === 'login' && loginCodeStep && loginCode.length !== 6) {
            setAuthError('Ingresá el código de 6 dígitos que recibiste por correo.');
            return;
        }
        if (view === 'forgot' && forgotCodeStep) {
            const cleanCode = forgotCode.trim().replace(/\D/g, '');
            if (cleanCode.length !== 6) {
                setAuthError('Ingresá el código de 6 dígitos.');
                return;
            }
            if (forgotNewPassword.length < 8) {
                setAuthError('La nueva contraseña debe tener al menos 8 caracteres.');
                return;
            }
            if (forgotNewPassword !== forgotConfirmPassword) {
                setAuthError('Las contraseñas no coinciden.');
                return;
            }
        }

        setIsLoading(true);
        clearMessages();

        try {
            if (view === 'login') {
                await handleLogin();
                setIsLoading(false);
                navigate(redirectTarget);
                return;
            }

            if (view === 'register') {
                await handleRegister();
                return;
            }

            await handleForgotPassword();
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : t.auth.errors.connectionError);
        } finally {
            setIsLoading(false);
        }
    };

    const title = view === 'login'
        ? t.auth.loginTitle
        : view === 'register'
            ? t.auth.registerTitle
            : (forgotCodeStep ? 'Nueva contraseña' : t.auth.forgotTitle);

    const description = view === 'login'
        ? 'Ingresá con tu correo y contraseña para entrar a Finix.'
        : view === 'register'
            ? 'Creá tu cuenta y te mandamos un codigo de verificacion por correo.'
            : (forgotCodeStep ? 'Ingresá el código de 6 dígitos que te enviamos y creá tu nueva contraseña.' : 'Te enviaremos un código para restablecer tu contraseña.');

    return (
        <LazyMotion features={domAnimation}>
            <div className="auth-shell relative overflow-hidden min-h-screen flex flex-col bg-background">
                <div className="absolute inset-0 pointer-events-none z-0">
                    <m.div
                        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
                        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.28) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <m.div
                        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
                        style={{ background: 'radial-gradient(circle, hsl(160 80% 40% / 0.22) 0%, transparent 70%)' }}
                        animate={{ scale: [1.1, 1.25, 1.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
                            backgroundSize: '50px 50px',
                        }}
                    />
                </div>

                <div className="flex-1 grid lg:grid-cols-2 relative z-10">
                    <div className="auth-hero-panel relative hidden lg:flex flex-col justify-center items-center p-12">
                        <div className="relative z-10 max-w-md w-full space-y-10">
                            <m.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="flex items-center gap-4"
                            >
                                <div className="relative">
                                    <div className="absolute -inset-3 rounded-2xl bg-primary/20 blur-xl" />
                                    <img src="/logo.png" alt="Finix" className="relative h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-heading font-extrabold text-foreground tracking-tight">Finix</h1>
                                    <p className="text-sm text-primary font-medium tracking-widest uppercase">Finanzas Sociales</p>
                                </div>
                            </m.div>

                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.7 }}
                            >
                                <h2 className="text-3xl lg:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
                                    Invertí mejor.<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                                        Conectá con inversores.
                                    </span>
                                </h2>
                                <p className="auth-hero-copy text-base leading-relaxed">
                                    La red social financiera donde compartís análisis, gestionás tu portafolio y aprendés de los mejores inversores.
                                </p>
                            </m.div>

                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-3"
                            >
                                {highlights.map(({ icon: Icon, title: highlightTitle, desc }) => (
                                    <div key={highlightTitle} className="auth-hero-card flex items-start gap-3 rounded-xl p-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="auth-hero-card-title text-sm font-semibold">{highlightTitle}</p>
                                            <p className="auth-hero-card-copy text-xs">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </m.div>

                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="flex flex-wrap gap-2"
                            >
                                {features.map(({ icon, label }) => (
                                    <FeaturePill key={label} icon={icon} label={label} />
                                ))}
                            </m.div>

                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative min-h-screen lg:min-h-0">
                        <div className="lg:hidden flex items-center gap-3 mb-10">
                            <img src="/logo.png" alt="Finix" className="h-12 w-12 object-contain" />
                            <span className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Finix</span>
                        </div>

                        <div className="auth-form-panel w-full max-w-sm space-y-6 rounded-[2rem] border p-6 shadow-[var(--shadow-card)] backdrop-blur-xl lg:max-w-md lg:p-8">
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-heading font-bold tracking-tight">{title}</h2>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>

                            {planRequested && (
                                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary font-bold flex items-center gap-2.5">
                                    <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                                    <span>Iniciá sesión o registrate para continuar con la suscripción a {planRequested === 'Creador' ? 'Finix Creador' : 'Finix PRO'}.</span>
                                </div>
                            )}

                            <m.form
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                onSubmit={handleSubmit}
                                className="space-y-3"
                                key={view}
                            >
                                {successMessage ? (
                                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 flex gap-3">
                                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                        <span>{successMessage}</span>
                                    </div>
                                ) : null}

                                {infoMessage ? (
                                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
                                        {infoMessage}
                                    </div>
                                ) : null}

                                {view === 'register' ? (
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
                                ) : null}

                                {view === 'forgot' && forgotCodeStep ? (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/40 px-3.5 py-2.5 rounded-xl border border-input/40">
                                        <span>Código enviado a: <strong className="text-foreground">{email}</strong></span>
                                        <button
                                            type="button"
                                            onClick={() => setForgotCodeStep(false)}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
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
                                )}

                                {view !== 'forgot' && (!loginCodeStep || view !== 'login') ? (
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
                                            onClick={() => setShowPassword((current) => !current)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                ) : null}

                                {view === 'login' && loginCodeStep ? (
                                    <Input inputMode="numeric" placeholder="Código de 6 dígitos" className="h-11 text-center text-lg tracking-[0.35em]" value={loginCode} onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                                ) : null}

                                {view === 'forgot' && forgotCodeStep ? (
                                    <>
                                        <div>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="Código de 6 dígitos"
                                                className="h-11 text-center text-lg tracking-[0.35em] font-mono font-bold bg-secondary/50 border-input/50 focus:border-primary/50"
                                                value={forgotCode}
                                                onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                required
                                                maxLength={6}
                                            />
                                        </div>

                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Nueva contraseña (mínimo 8 caracteres)"
                                                className="pl-10 pr-10 h-11 bg-secondary/50 border-input/50 focus:border-primary/50"
                                                value={forgotNewPassword}
                                                onChange={(e) => setForgotNewPassword(e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((current) => !current)}
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type={showForgotConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirmar nueva contraseña"
                                                className="pl-10 pr-10 h-11 bg-secondary/50 border-input/50 focus:border-primary/50"
                                                value={forgotConfirmPassword}
                                                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowForgotConfirmPassword((current) => !current)}
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                                            >
                                                {showForgotConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </>
                                ) : null}

                                {view === 'login' ? (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => switchView('forgot')}
                                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                            {t.auth.forgotPassword}
                                        </button>
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 px-5 rounded-xl font-bold text-sm tracking-normal flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/25"
                                    style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff' }}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2" style={{ color: '#ffffff' }}>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="font-semibold text-sm">
                                                {view === 'forgot'
                                                    ? (forgotCodeStep ? 'Guardando...' : 'Enviando...')
                                                    : 'Ingresando...'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2" style={{ color: '#ffffff' }}>
                                            <span className="font-bold text-sm">
                                                {view === 'login' && (loginCodeStep ? 'Confirmar código' : t.auth.loginBtn)}
                                                {view === 'register' && t.auth.createAccountBtn}
                                                {view === 'forgot' && (forgotCodeStep ? 'Guardar nueva contraseña' : 'Enviar código')}
                                            </span>
                                            <ArrowRight className="w-4 h-4 stroke-[2.2]" style={{ color: '#ffffff' }} />
                                        </div>
                                    )}
                                </button>

                                {view === 'forgot' && forgotCodeStep ? (
                                    <div className="flex justify-between items-center text-xs pt-1">
                                        <button
                                            type="button"
                                            onClick={handleResendForgotCode}
                                            disabled={isLoading}
                                            className="text-muted-foreground hover:text-foreground underline transition-colors disabled:opacity-50"
                                        >
                                            Reenviar código
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => switchView('login')}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            Volver a iniciar sesión
                                        </button>
                                    </div>
                                ) : null}

                                {authError ? (
                                    <p className="text-sm text-destructive font-medium text-center">{authError}</p>
                                ) : null}

                                {view !== 'forgot' ? (
                                    <>
                                        <div className="relative my-1.5">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-muted/30" />
                                            </div>
                                            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                                                <span className="bg-card px-2 text-muted-foreground/60">{t.auth.orContinue}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full">
                                            <Button
                                                variant="outline"
                                                type="button"
                                                className="w-full h-11 rounded-xl relative border-muted/40 hover:bg-muted/50 transition-all font-medium text-sm"
                                                onClick={loginGoogle}
                                                disabled={isLoading}
                                            >
                                                <div className="absolute left-4">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                </div>
                                                <span className="flex-1 text-center">Google</span>
                                            </Button>
                                        </div>
                                    </>
                                ) : null}
                            </m.form>

                            <div className="text-center text-sm border-t border-border/30 pt-4">
                                {view === 'login' ? (
                                    <p className="text-muted-foreground">
                                        {t.auth.noAccount}{' '}
                                        <button onClick={() => switchView('register')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                            {t.auth.register}
                                        </button>
                                    </p>
                                ) : view === 'register' ? (
                                    <p className="text-muted-foreground">
                                        {t.auth.hasAccount}{' '}
                                        <button onClick={() => switchView('login')} className="font-bold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                                            {t.auth.login}
                                        </button>
                                    </p>
                                ) : (
                                    <BackButton
                                        onClick={() => switchView('login')}
                                        label={t.auth.backToLogin}
                                        className="w-full justify-center"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>



                <footer className="auth-footer border-t border-border/30 px-4 py-6 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4 lg:flex-nowrap lg:items-center lg:gap-x-8">
                            {infoLinks.map(({ label, to }) => (
                                <Link key={label} to={to} className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                                    {label}
                                </Link>
                            ))}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">•</span>
                            {legalAndSocialLinks.map(({ label, to }) => (
                                <Link key={label} to={to} className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                                    {label}
                                </Link>
                            ))}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                            <Sparkles className="w-3 h-3" />
                            <span>© 2026 Finix · Finanzas Sociales</span>
                            <span className="mx-1">•</span>
                            <a href="https://t.me/Finixcomunidad" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" title="Telegram oficial">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                                </svg>
                            </a>
                            <span className="opacity-40">•</span>
                            <a href="https://instagram.com/finixarg_" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" title="Instagram oficial">
                                <Instagram className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </LazyMotion>
    );
}
