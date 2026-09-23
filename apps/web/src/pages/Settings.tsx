import { useEffect, useCallback, useRef, useState } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import PushSettings from '@/components/PushSettings';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Globe,
    Loader2,
    Lock,
    Save,
    Shield,
    User,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    LogOut,
    Trash2,
    Download,
    Bell,
    Clock,
    ImagePlus,
    BadgeCheck,
    Mail,
    Crown,
    Zap,
    CreditCard,
    Sparkles,
    Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import AvatarUpload from '@/components/AvatarUpload';
import LocationQuickSelect from '@/components/LocationQuickSelect';
import FinancialVerificationTab from '@/components/settings/FinancialVerificationTab';
import { uploadProfileImage } from '@/lib/profileMedia';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullSettings {
    id: string;
    username: string;
    email: string;
    bio: string | null;
    bioLong: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    title: string | null;
    company: string | null;
    location: string | null;
    website: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    youtubeUrl: string | null;
    instagramUrl: string | null;
    yearsExperience: number | null;
    isInfluencer: boolean;
    isVerified: boolean;
    isCreator: boolean;
    accountType: string;
    plan?: string;
    subscriptionStatus?: string;
    // Notifications
    notificationPrefs?: { email: boolean; push: boolean };
    // Privacy
    isProfilePublic: boolean;
    showPortfolio: boolean;
    showStats: boolean;
    acceptingFollowers: boolean;
    showActivity: boolean;
    showExactReturns: boolean;
    returnsVisibilityMode: string;
    // Preferences
    language: string;
    currency: string;
    autoRefreshMarket: boolean;
    compactTables: boolean;
    showAdvancedMetrics: boolean;
    theme: string;
    chartDensity: string;
    marketNotifications: boolean;
    investmentEmailNotifications: boolean;
    timezone: string;
    createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Toast = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
    >
        {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
        {message}
    </motion.div>
);

const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
    disabled,
    icon,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    icon?: React.ReactNode;
}) => (
    <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${disabled ? 'border-border/30 opacity-50' : 'border-border/60 bg-card/20 hover:border-primary/30 hover:bg-card/40'}`}>
        <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-primary">{icon}</div>}
            <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
);

const SectionHeader = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5 text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {icon}
            </div>
            {title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
    </CardHeader>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
    const navigate = useNavigate();
    const { user, updateUser, syncFromSession, logout } = useAuthStore();
    const { setTheme: setGlobalTheme, setLanguage: setGlobalLanguage, updatePreferences: setGlobalPreferences } = usePreferencesStore();

    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<FullSettings | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>();

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    // ── Profile form state ──
    const [profileForm, setProfileForm] = useState<Partial<FullSettings>>({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [bannerUploadError, setBannerUploadError] = useState('');

    const [notificationPrefs, setNotificationPrefs] = useState({ email: true, push: true });
    const [isSavingInvestmentEmails, setIsSavingInvestmentEmails] = useState(false);


    // ── Privacy form state ──
    const [privacyForm, setPrivacyForm] = useState({
        isProfilePublic: true,
        showPortfolio: false,
        showStats: false,
        acceptingFollowers: true,
        showActivity: true,
        showExactReturns: true,
        returnsVisibilityMode: 'exact',
    });
    const [privacyDirty, setPrivacyDirty] = useState(false);
    const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

    // ── Preferences state (autosave) ──
    const [prefs, setPrefs] = useState({
        language: 'es-AR',
        currency: 'USD',
        autoRefreshMarket: true,
        compactTables: false,
        showAdvancedMetrics: false,
        theme: 'dark',
        chartDensity: 'normal',
        marketNotifications: false,
        timezone: 'America/Argentina/Cordoba',
    });
    const [prefsSaveStatus, setPrefsSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const prefsDebounce = useRef<ReturnType<typeof setTimeout>>();

    // ── Password form state ──
    const [passwordForm, setPasswordForm] = useState({ current: '', newPwd: '', confirm: '' });
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
    const [pwdErrors, setPwdErrors] = useState<string[]>([]);
    const [isSavingPwd, setIsSavingPwd] = useState(false);

    // ── Delete account ──
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'ELIMINAR') return;
        setIsDeletingAccount(true);
        try {
            const res = await apiFetch('/me/account', { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || 'Error al eliminar la cuenta');
            }
            showToast('Tu cuenta ha sido eliminada.');
            logout();
            navigate('/auth');
        } catch (e: any) {
            showToast(e.message || 'No se pudo eliminar la cuenta', 'error');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    // ─── Load settings ────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch('/me/settings');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: FullSettings = await res.json();
                if (!cancelled) {
                    setSettings(data);
                    setProfileForm(data);
                    if (data.notificationPrefs) {
                        setNotificationPrefs(data.notificationPrefs);
                    }
                    setPrivacyForm({
                        isProfilePublic: data.isProfilePublic,
                        showPortfolio: data.showPortfolio,
                        showStats: data.showStats,
                        acceptingFollowers: data.acceptingFollowers,
                        showActivity: data.showActivity ?? true,
                        showExactReturns: data.showExactReturns ?? true,
                        returnsVisibilityMode: data.returnsVisibilityMode ?? 'exact',
                    });
                    setPrefs({
                        language: data.language ?? 'es-AR',
                        currency: data.currency ?? 'USD',
                        autoRefreshMarket: data.autoRefreshMarket ?? true,
                        compactTables: data.compactTables ?? false,
                        showAdvancedMetrics: data.showAdvancedMetrics ?? false,
                        theme: data.theme ?? 'dark',
                        chartDensity: data.chartDensity ?? 'normal',
                        marketNotifications: data.marketNotifications ?? false,
                        timezone: data.timezone ?? 'America/Argentina/Cordoba',
                    });
                }
            } catch {
                // Fallback from auth store
                if (!cancelled && user) {
                    const fallback: Partial<FullSettings> = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        bio: user.bio || null,
                        avatarUrl: user.avatarUrl || null,
                        isProfilePublic: true,
                        showPortfolio: false,
                        showStats: false,
                        acceptingFollowers: true,
                        showActivity: true,
                        showExactReturns: true,
                        returnsVisibilityMode: 'exact',
                        language: 'es-AR',
                        currency: 'USD',
                        autoRefreshMarket: true,
                        compactTables: false,
                        showAdvancedMetrics: false,
                        theme: 'dark',
                        chartDensity: 'normal',
                        marketNotifications: false,
                        investmentEmailNotifications: false,
                        timezone: 'America/Argentina/Cordoba',
                        createdAt: new Date().toISOString(),
                    };
                    setSettings(fallback as FullSettings);
                    setProfileForm(fallback);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [user]);

    // ─── Profile save ─────────────────────────────────────────────────────────
    const saveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const payload: any = {
                username: profileForm.username,
                bio: profileForm.bio,
                bioLong: profileForm.bioLong,
                avatarUrl: profileForm.avatarUrl,
                bannerUrl: profileForm.bannerUrl,
                title: profileForm.title,
                company: profileForm.company,
                location: profileForm.location,
                website: profileForm.website,
                linkedinUrl: profileForm.linkedinUrl,
                twitterUrl: profileForm.twitterUrl,
                youtubeUrl: profileForm.youtubeUrl,
                instagramUrl: profileForm.instagramUrl,
                notificationPrefs,
            };
            if (profileForm.yearsExperience !== undefined && profileForm.yearsExperience !== null && (profileForm.yearsExperience as any) !== '') {
                const num = Number(profileForm.yearsExperience);
                if (!isNaN(num)) {
                    payload.yearsExperience = num;
                }
            }

            const res = await apiFetch('/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                const errMsg = Array.isArray(d?.message) ? d.message.join(', ') : (d?.message || `HTTP ${res.status}`);
                throw new Error(errMsg);
            }
            const updated = await res.json();
            setSettings(updated);
            setProfileForm(updated);
            if (updated.notificationPrefs) {
                setNotificationPrefs(updated.notificationPrefs);
            }
            updateUser({ username: updated.username, bio: updated.bio, avatarUrl: updated.avatarUrl });
            showToast('Perfil guardado correctamente');
        } catch (e: any) {
            showToast(e.message || 'No se pudo guardar el perfil', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleBannerUpload = async (file: File) => {
        setIsUploadingBanner(true);
        setBannerUploadError('');

        try {
            const { bannerUrl } = await uploadProfileImage('banner', file);
            if (!bannerUrl) {
                throw new Error('No se recibió la URL del banner');
            }

            setProfileForm((prev) => ({ ...prev, bannerUrl }));
            setSettings((prev) => (prev ? { ...prev, bannerUrl } : prev));
        } catch (e: any) {
            setBannerUploadError(e.message || 'No se pudo subir el banner');
        } finally {
            setIsUploadingBanner(false);
        }
    };

    // ─── Privacy save ─────────────────────────────────────────────────────────
    const updatePrivacy = (key: keyof typeof privacyForm, value: any) => {
        setPrivacyForm((prev) => {
            const next = { ...prev, [key]: value };
            // Rule: if profile is private, disable portfolio/stats
            if (key === 'isProfilePublic' && !value) {
                next.showPortfolio = false;
                next.showStats = false;
            }
            return next;
        });
        setPrivacyDirty(true);
    };

    const savePrivacy = async () => {
        setIsSavingPrivacy(true);
        try {
            const res = await apiFetch('/me/privacy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(privacyForm),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setPrivacyDirty(false);
            showToast('Privacidad guardada correctamente');
        } catch {
            showToast('No se pudo guardar la privacidad', 'error');
        } finally {
            setIsSavingPrivacy(false);
        }
    };

    // ─── Preferences autosave ─────────────────────────────────────────────────
    const updatePref = (key: keyof typeof prefs, value: any) => {
        setPrefs((prev) => ({ ...prev, [key]: value }));
        // Apply theme immediately to the global store so the UI reflects it at once
        if (key === 'theme') {
            setGlobalTheme(value as 'dark' | 'light' | 'system');
        }
        if (key === 'language') {
            setGlobalLanguage(value as 'es-AR' | 'en-US' | 'pt-BR');
        }
        setGlobalPreferences({ [key]: value });
        setPrefsSaveStatus('saving');
        clearTimeout(prefsDebounce.current);
        prefsDebounce.current = setTimeout(async () => {
            try {
                const res = await apiFetch('/users/me/preferences', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...prefs, [key]: value }),
                });
                if (!res.ok) throw new Error();
                setPrefsSaveStatus('saved');
                setTimeout(() => setPrefsSaveStatus('idle'), 2000);
            } catch {
                setPrefsSaveStatus('error');
                setTimeout(() => setPrefsSaveStatus('idle'), 3000);
            }
        }, 700);
    };

    const isProActive = Boolean(
        ((settings?.plan === 'PRO' || settings?.plan === 'CREATOR') && settings?.subscriptionStatus === 'ACTIVE') ||
        ((['PRO', 'CREATOR'].includes(String((user as any)?.plan || '')) && user?.subscriptionStatus === 'ACTIVE')) ||
        user?.role === 'ADMIN' ||
        (user as any)?.isPro
    );

    const isCreatorActive = Boolean(
        (user?.isCreator && user?.subscriptionStatus === 'ACTIVE') ||
        (settings?.isCreator && settings?.subscriptionStatus === 'ACTIVE') ||
        ((user?.accountType === 'CREATOR' || settings?.accountType === 'CREATOR') && (user?.subscriptionStatus === 'ACTIVE' || settings?.subscriptionStatus === 'ACTIVE')) ||
        user?.role === 'ADMIN'
    );

    // ─── Subscription management ─────────────────────────────────────────────
    const [billingOverview, setBillingOverview] = useState<any>(null);
    const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [planToCancel, setPlanToCancel] = useState<'PRO' | 'CREATOR'>('PRO');
    const proBilling = billingOverview?.subscriptions?.PRO;
    const creatorBilling = billingOverview?.subscriptions?.CREATOR;

    const fetchBillingOverview = useCallback(async () => {
        try {
            const res = await apiFetch('/billing/overview');
            if (res.ok) {
                const data = await res.json();
                setBillingOverview(data);
            }
        } catch {
            // best effort
        }
    }, []);

    useEffect(() => {
        fetchBillingOverview();
    }, [fetchBillingOverview]);

    const handleConfirmCancel = async () => {
        setIsCancelingSubscription(true);
        try {
            const res = await apiFetch('/billing/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: planToCancel }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || 'Error al cancelar la suscripción');
            }

            const data = await res.json();

            if (data.user) {
                (updateUser as any)(data.user);
                setSettings((p) => (p ? { ...p, ...data.user } : p));
            }

            await syncFromSession?.();
            await fetchBillingOverview();
            setCancelModalOpen(false);
            showToast(data.message || 'Suscripción dada de baja correctamente.');
        } catch (error: any) {
            showToast(error.message || 'No se pudo cancelar la suscripción', 'error');
        } finally {
            setIsCancelingSubscription(false);
        }
    };

    const updateInvestmentEmailNotifications = async (enabled: boolean) => {
        if (!isProActive) {
            showToast('Las alertas por email de inversiones son exclusivas para Finix PRO', 'error');
            return;
        }

        setIsSavingInvestmentEmails(true);
        try {
            const res = await apiFetch('/me/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ investmentEmailNotifications: enabled }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || 'No se pudo guardar la preferencia');
            }
            setSettings((previous) => previous ? { ...previous, investmentEmailNotifications: enabled } : previous);
            showToast(enabled ? 'Emails de inversiones activados' : 'Emails de inversiones desactivados');
        } catch (error: any) {
            showToast(error.message || 'No se pudo guardar la preferencia', 'error');
        } finally {
            setIsSavingInvestmentEmails(false);
        }
    };

    // ─── Password change ──────────────────────────────────────────────────────
    const changePassword = async () => {
        const errors: string[] = [];
        if (!passwordForm.current) errors.push('Ingresá tu contraseña actual');
        if (passwordForm.newPwd.length < 8) errors.push('La nueva contraseña debe tener al menos 8 caracteres');
        if (passwordForm.newPwd !== passwordForm.confirm) errors.push('Las contraseñas no coinciden');
        if (passwordForm.newPwd === passwordForm.current) errors.push('La nueva contraseña debe ser diferente a la actual');
        setPwdErrors(errors);
        if (errors.length > 0) return;

        setIsSavingPwd(true);
        try {
            const res = await apiFetch('/users/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPwd }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d?.message || `HTTP ${res.status}`);
            }
            setPasswordForm({ current: '', newPwd: '', confirm: '' });
            showToast('Contraseña actualizada correctamente');
        } catch (e: any) {
            showToast(e.message || 'No se pudo actualizar la contraseña', 'error');
        } finally {
            setIsSavingPwd(false);
        }
    };

    // ─── Logout all ───────────────────────────────────────────────────────────
    const logoutAll = async () => {
        try {
            await apiFetch('/me/logout-all', { method: 'POST' });
            showToast('Sesiones cerradas correctamente');
        } catch {
            showToast('No se pudo cerrar las sesiones', 'error');
        }
    };

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="space-y-3 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    const accountAge = settings?.createdAt
        ? new Date(settings.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <div className="p-4 md:p-6 lg:p-8 w-full space-y-6 pb-16">
            {/* Header */}
            <div className="rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold tracking-tight">Configuración</h1>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                            Gestioná tu cuenta, privacidad, preferencias de la app y seguridad.
                        </p>
                        {accountAge && (
                            <p className="mt-1 text-xs text-muted-foreground/60">
                                Cuenta creada el {accountAge}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {settings?.isVerified && <Badge className="bg-emerald-500/15 text-emerald-300 text-xs">✓ Verificado</Badge>}
                        {settings?.isCreator && <Badge className="bg-primary/15 text-primary text-xs">Creador</Badge>}
                    </div>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>

            {/* Tabs */}
            <Tabs defaultValue="cuenta" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1.5 bg-card/40 border border-border/40 rounded-2xl sm:grid-cols-4 lg:grid-cols-7">
                    {[
                        { value: 'cuenta', label: 'Cuenta', icon: <User className="w-3.5 h-3.5" /> },
                        { value: 'suscripcion', label: 'Planes PRO y Creador', icon: <Crown className="w-3.5 h-3.5 text-amber-500" /> },
                        { value: 'privacidad', label: 'Privacidad', icon: <Shield className="w-3.5 h-3.5" /> },
                        { value: 'preferencias', label: 'Preferencias', icon: <Globe className="w-3.5 h-3.5" /> },
                        { value: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-3.5 h-3.5" /> },
                        { value: 'seguridad', label: 'Seguridad', icon: <Lock className="w-3.5 h-3.5" /> },
                        { value: 'verificacion', label: 'Verificación', icon: <BadgeCheck className="w-3.5 h-3.5" /> },
                    ].map(({ value, label, icon }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className="flex items-center gap-1.5 py-2.5 rounded-xl text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                        >
                            {icon}
                            <span className="hidden sm:inline">{label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="verificacion">
                    <FinancialVerificationTab />
                </TabsContent>

                {/* ── CUENTA ── */}
                <TabsContent value="cuenta" className="space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<User className="w-4 h-4" />}
                            title="Cuenta"
                            description="Editá tu información pública y datos de perfil."
                        />
                        <CardContent className="space-y-5">
                            {/* Avatar preview */}
                            {settings?.avatarUrl && (
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/20">
                                    <img
                                        src={resolveMediaUrl(settings.avatarUrl)}
                                        alt="Avatar"
                                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                                    />
                                    <div>
                                        <p className="font-semibold">{settings.username}</p>
                                        <p className="text-sm text-muted-foreground">{settings.email}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="s-username">Usuario</Label>
                                    <Input
                                        id="s-username"
                                        value={profileForm.username || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                                        placeholder="tu_usuario"
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-email">Correo electronico (solo lectura)</Label>
                                    <Input
                                        id="s-email"
                                        type="email"
                                        value={profileForm.email || ''}
                                        readOnly
                                        className="bg-secondary/20 opacity-70 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="s-title">Título profesional</Label>
                                    <Input
                                        id="s-title"
                                        value={profileForm.title || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="Ej: Inversor en tecnología"
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-company">Empresa</Label>
                                    <Input
                                        id="s-company"
                                        value={profileForm.company || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, company: e.target.value }))}
                                        placeholder="Empresa"
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-location">Ciudad / País</Label>
                                    <LocationQuickSelect
                                        id="s-location"
                                        value={profileForm.location || ''}
                                        onChange={(value) => setProfileForm((p) => ({ ...p, location: value }))}
                                        placeholder="Buenos Aires, AR"
                                        className="bg-secondary/30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="s-bio">Bio corta</Label>
                                <Textarea
                                    id="s-bio"
                                    rows={3}
                                    value={profileForm.bio || ''}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                                    placeholder="Contá algo sobre vos..."
                                    maxLength={300}
                                    className="bg-secondary/30 resize-none"
                                />
                                <p className="text-xs text-muted-foreground text-right">{(profileForm.bio || '').length}/300</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="s-biolong">Bio extendida (para creadores)</Label>
                                <Textarea
                                    id="s-biolong"
                                    rows={5}
                                    value={profileForm.bioLong || ''}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, bioLong: e.target.value }))}
                                    placeholder="Descripción detallada de tu experiencia..."
                                    maxLength={2000}
                                    className="bg-secondary/30 resize-none"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Foto de perfil</Label>
                                    <div className="flex justify-center py-2">
                                        <AvatarUpload
                                            currentUrl={profileForm.avatarUrl || null}
                                            onUploaded={(url) => {
                                                setProfileForm((p) => ({ ...p, avatarUrl: url }));
                                                updateUser({ avatarUrl: url || undefined });
                                            }}
                                            size="md"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Banner del perfil</Label>
                                    <div className="space-y-3">
                                        <div className="relative h-28 overflow-hidden rounded-2xl border border-border/50 bg-secondary/30">
                                            {profileForm.bannerUrl ? (
                                                <img
                                                    src={resolveMediaUrl(profileForm.bannerUrl)}
                                                    alt="Banner del perfil"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted-foreground">
                                                    <ImagePlus className="h-4 w-4" />
                                                    Sin banner cargado
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="gap-2 border-border/60"
                                                disabled={isUploadingBanner}
                                                onClick={() => bannerInputRef.current?.click()}
                                            >
                                                {isUploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                                                {isUploadingBanner ? 'Subiendo...' : (profileForm.bannerUrl ? 'Cambiar banner' : 'Subir banner')}
                                            </Button>
                                            <span className="text-xs text-muted-foreground">JPG, PNG, WEBP o GIF · Máx 5 MB</span>
                                        </div>

                                        {bannerUploadError ? (
                                            <p className="text-xs text-red-400">{bannerUploadError}</p>
                                        ) : null}

                                        <input
                                            ref={bannerInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    void handleBannerUpload(file);
                                                }
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="s-website">Sitio web</Label>
                                    <Input
                                        id="s-website"
                                        value={profileForm.website || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
                                        placeholder="https://..."
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-years">Años de experiencia</Label>
                                    <Input
                                        id="s-years"
                                        type="number"
                                        min={0}
                                        max={80}
                                        value={profileForm.yearsExperience ?? ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, yearsExperience: e.target.value === '' ? null : Number(e.target.value) }))}
                                        placeholder="0"
                                        className="bg-secondary/30"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {[
                                    { id: 's-linkedin', key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
                                    { id: 's-twitter', key: 'twitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/...' },
                                    { id: 's-youtube', key: 'youtubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/...' },
                                    { id: 's-instagram', key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                                ].map(({ id, key, label, placeholder }) => (
                                    <div key={id} className="space-y-2">
                                        <Label htmlFor={id}>{label}</Label>
                                        <Input
                                            id={id}
                                            value={(profileForm as any)[key] || ''}
                                            onChange={(e) => setProfileForm((p) => ({ ...p, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="bg-secondary/30"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1.5 border-border/50"
                                        onClick={() => {
                                            const data = JSON.stringify(settings, null, 2);
                                            const blob = new Blob([data], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'finix-datos.json';
                                            a.click();
                                        }}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Exportar datos
                                    </Button>
                                </div>
                                <Button onClick={saveProfile} disabled={isSavingProfile} className="gap-2">
                                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Guardar Cuenta
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger zone */}
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-red-400 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />
                                Zona de peligro
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!showDeleteConfirm ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Eliminar cuenta
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-red-300">
                                        Esta acción es <strong>irreversible</strong>. Escribí <code className="bg-red-500/20 px-1 rounded">ELIMINAR</code> para confirmar.
                                    </p>
                                    <Input
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        placeholder="ELIMINAR"
                                        className="bg-red-500/10 border-red-500/30 text-red-300 placeholder:text-red-500/40"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            disabled={deleteConfirm !== 'ELIMINAR' || isDeletingAccount}
                                            className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                                            onClick={handleDeleteAccount}
                                        >
                                            {isDeletingAccount ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Eliminando...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Confirmar eliminación
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── SUSCRIPCIÓN ── */}
                <TabsContent value="suscripcion" className="space-y-6">
                    {/* Recurring Billing Notice Banner */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        Administrá tus renovaciones
                                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10">
                                            Garantía Finix
                                        </Badge>
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                                        La renovación automática depende de la opción que elegiste al contratar. Desde acá podés consultar la fecha del próximo cobro o vencimiento y detener los cobros futuros.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finix PRO Card */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-amber-500/15 p-2 text-amber-500">
                                    <Crown className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Finix PRO
                                        {isProActive ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                                Activo
                                            </Badge>
                                        ) : proBilling?.status === 'PENDING' ? (
                                            <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-xs">Pago pendiente</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground text-xs">
                                                Plan Gratuito
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Acceso sin restricciones a herramientas financieras avanzadas y señales exclusivas.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold tracking-tight text-foreground">
                                    ${Number(billingOverview?.proPriceArs || 8500).toLocaleString('es-AR')} ARS
                                </span>
                                <span className="text-xs text-muted-foreground block">/ mes contratado</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Features list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-xl border border-border/40 bg-card/20">
                                {[
                                    'Acceso ilimitado a todas las secciones y métricas PRO',
                                    'Alertas en tiempo real por Gmail y notificaciones push',
                                    'Análisis de ballenas y movimientos institucionales',
                                    'Filtros técnicos avanzados y gráficos sin límites',
                                    'Badge exclusivo Finix PRO en la comunidad',
                                    'Elección entre renovación automática o pago mensual único',
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="rounded-full bg-emerald-500/20 p-0.5 text-emerald-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Billing details / Renewal */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/30 bg-muted/20 text-xs">
                                <div className="space-y-0.5">
                                    <span className="text-muted-foreground">Ciclo de facturación:</span>
                                    <p className="font-medium text-foreground">
                                        {proBilling?.status === 'PENDING'
                                            ? 'Esperando que completes la autorización de pago en Mercado Pago.'
                                            : isProActive && !proBilling
                                                ? 'Acceso activo sin una suscripción facturable asociada.'
                                                : isProActive
                                            ? proBilling?.cancelAtPeriodEnd
                                                ? `Renovación cancelada. Mantenés acceso hasta ${proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString('es-AR') : 'el fin del período pago'}.`
                                                : proBilling?.autoRenew
                                                    ? `Renovación automática mensual. Próximo cobro: ${proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString('es-AR') : 'según Mercado Pago'}.`
                                                    : `Sin renovación automática. Acceso hasta ${proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString('es-AR') : 'el fin del período pago'}.`
                                            : 'No hay un plan PRO activo.'}
                                    </p>
                                </div>
                                <div className="space-y-0.5 sm:text-right">
                                    <span className="text-muted-foreground">Estado del plan:</span>
                                    <p className="font-medium capitalize text-foreground">
                                        {proBilling?.status === 'PENDING' ? 'Pendiente' : isProActive ? (proBilling?.status || settings?.subscriptionStatus || 'Activo') : 'Inactivo'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/30">
                                        {proBilling?.status === 'PENDING' ? (
                                            <>
                                                <p className="text-xs text-muted-foreground">La autorización de pago todavía está pendiente.</p>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => { setPlanToCancel('PRO'); setCancelModalOpen(true); }} className="w-full sm:w-auto text-xs font-semibold">Cancelar solicitud</Button>
                                            </>
                                        ) : isProActive ? (
                                    <>
                                        {!proBilling && isProActive ? (
                                            <p className="text-xs text-muted-foreground">No hay una renovación PRO separada registrada para cancelar. Si tenés Creador, sus herramientas PRO se gestionan desde esa tarjeta.</p>
                                        ) : proBilling?.cancelAtPeriodEnd ? (
                                            <p className="text-xs text-muted-foreground">La renovación ya está cancelada. Podés volver a contratar PRO cuando termine el período vigente.</p>
                                        ) : !proBilling?.autoRenew ? (
                                            <p className="text-xs text-muted-foreground">Este pago no se renueva automáticamente. El acceso termina en la fecha indicada y no habrá otro cobro.</p>
                                        ) : (
                                            <>
                                                <p className="text-xs text-muted-foreground">Al cancelar se detienen los próximos cobros; conservás el acceso hasta el fin del período ya pagado.</p>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => { setPlanToCancel('PRO'); setCancelModalOpen(true); }} className="w-full sm:w-auto text-xs font-semibold gap-1.5">
                                                    Cancelar renovación PRO
                                                </Button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-muted-foreground">
                                            Subí a PRO para acceder a todas las secciones bloqueadas y alertas por Gmail.
                                        </p>
                                        <Link to="/pricing" className="w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold gap-1.5 shadow-lg shadow-amber-500/20"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                Mejorar a Finix PRO
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Creador Card */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-lg bg-blue-500/15 p-2 text-blue-400">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        Plan Creador de Contenido
                                        {creatorBilling?.status === 'PENDING' ? (
                                            <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-xs">Pago pendiente</Badge>
                                        ) : isCreatorActive ? (
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                                Creador Activo
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground text-xs">
                                                Básico
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Monetizá análisis, administrá comunidades pagas y creá publicaciones destacadas.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold tracking-tight text-foreground">${Number(billingOverview?.creatorPriceArs || 29900).toLocaleString('es-AR')} ARS</span>
                                <span className="block text-xs text-muted-foreground">/ mes contratado</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4 rounded-xl border border-border/40 bg-card/20">
                                {[
                                    'Creación y monetización de comunidades exclusivas',
                                    'Cobro de membresías a tus seguidores',
                                    'Herramientas avanzadas de publicación y gráficos',
                                    'Badge de Creador Verificado en tu perfil',
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <div className="rounded-full bg-blue-500/20 p-0.5 text-blue-400 shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-xl border border-border/30 bg-muted/20 p-3.5 text-xs">
                                <span className="text-muted-foreground">Facturación:</span>
                                <p className="mt-0.5 font-medium text-foreground">
                                    {isCreatorActive && !creatorBilling
                                        ? 'Acceso Creador activo sin una suscripción facturable asociada.'
                                        : isCreatorActive
                                        ? creatorBilling?.cancelAtPeriodEnd
                                            ? `Renovación cancelada. Acceso hasta ${creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString('es-AR') : 'el fin del período pago'}.`
                                            : creatorBilling?.autoRenew
                                                ? `Renovación automática mensual. Próximo cobro: ${creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString('es-AR') : 'según Mercado Pago'}.`
                                                : `Sin renovación automática. Acceso hasta ${creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString('es-AR') : 'el fin del período pago'}.`
                                        : 'No hay un plan Creador activo.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/30">
                                {creatorBilling?.status === 'PENDING' ? (
                                    <>
                                        <p className="text-xs text-muted-foreground">La autorización de pago todavía está pendiente.</p>
                                        <Button type="button" variant="destructive" size="sm" onClick={() => { setPlanToCancel('CREATOR'); setCancelModalOpen(true); }} className="w-full sm:w-auto text-xs font-semibold">Cancelar solicitud</Button>
                                    </>
                                ) : isCreatorActive ? (
                                    <>
                                        {!creatorBilling ? (
                                            <p className="text-xs text-muted-foreground">No hay una renovación Creador registrada para cancelar desde acá.</p>
                                        ) : creatorBilling?.cancelAtPeriodEnd ? (
                                            <p className="text-xs text-muted-foreground">La renovación ya está cancelada. Podés volver a contratar Creador cuando termine el período vigente.</p>
                                        ) : !creatorBilling?.autoRenew ? (
                                            <p className="text-xs text-muted-foreground">Este pago no se renueva automáticamente. El acceso Creador termina en la fecha indicada y no habrá otro cobro.</p>
                                        ) : (
                                            <>
                                                <p className="text-xs text-muted-foreground">Al cancelar se detienen los próximos cobros; conservás las herramientas hasta el fin del período pago. Las funciones de creador terminan entonces.</p>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => { setPlanToCancel('CREATOR'); setCancelModalOpen(true); }} className="w-full sm:w-auto text-xs font-semibold gap-1.5">
                                                    Cancelar renovación Creador
                                                </Button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-muted-foreground">
                                            ¿Querés monetizar tus análisis y crear tu comunidad en Finix?
                                        </p>
                                        <Link to="/creator" className="w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full sm:w-auto text-xs font-medium"
                                            >
                                                Contratar Plan Creador
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── PRIVACIDAD ── */}
                <TabsContent value="privacidad" className="space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<Shield className="w-4 h-4" />}
                            title="Privacidad"
                            description="Definí qué información pública puede ver el resto de usuarios."
                        />
                        <CardContent className="space-y-3">
                            <ToggleRow
                                label="Perfil público"
                                description="Permite que otros usuarios encuentren y vean tu perfil."
                                checked={privacyForm.isProfilePublic}
                                onChange={(v) => updatePrivacy('isProfilePublic', v)}
                            />
                            <ToggleRow
                                label="Aceptar seguidores"
                                description="Permite que otros usuarios te sigan para recibir tus publicaciones."
                                checked={privacyForm.acceptingFollowers}
                                onChange={(v) => updatePrivacy('acceptingFollowers', v)}
                            />
                            <ToggleRow
                                label="Mostrar estadísticas"
                                description="Publica métricas agregadas como rendimiento y riesgo."
                                checked={privacyForm.showStats}
                                onChange={(v) => updatePrivacy('showStats', v)}
                                disabled={!privacyForm.isProfilePublic}
                            />
                            <ToggleRow
                                label="Mostrar actividad reciente"
                                description="Muestra tus últimos movimientos y publicaciones en tu perfil."
                                checked={privacyForm.showActivity}
                                onChange={(v) => updatePrivacy('showActivity', v)}
                            />

                            <div className="rounded-xl border border-border/60 bg-card/20 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-sm">Mostrar rendimiento exacto</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Si está OFF, se mostrará un rango (ej: 0–5%) en vez del número exacto.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={privacyForm.showExactReturns}
                                        onCheckedChange={(v) => {
                                            updatePrivacy('showExactReturns', v);
                                            if (!v) updatePrivacy('returnsVisibilityMode', 'range');
                                            else updatePrivacy('returnsVisibilityMode', 'exact');
                                        }}
                                    />
                                </div>
                                {!privacyForm.showExactReturns && (
                                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                                        <Eye className="w-3.5 h-3.5 shrink-0" />
                                        Los visitantes verán rangos como "5–10%" en lugar de valores exactos.
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30">
                                <Button
                                    onClick={savePrivacy}
                                    disabled={isSavingPrivacy || !privacyDirty}
                                    className="gap-2"
                                >
                                    {isSavingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    Guardar Privacidad
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── PREFERENCIAS ── */}
                <TabsContent value="preferencias" className="space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<Globe className="w-4 h-4" />}
                            title="Preferencias"
                            description="Estas preferencias se guardan automáticamente."
                        />
                        <CardContent className="space-y-4">
                            {/* Autosave status */}
                            <div className="flex items-center justify-end gap-2 text-xs">
                                {prefsSaveStatus === 'saving' && (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                                    </span>
                                )}
                                {prefsSaveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-emerald-400">
                                        <CheckCircle2 className="w-3 h-3" /> Guardado
                                    </span>
                                )}
                                {prefsSaveStatus === 'error' && (
                                    <span className="flex items-center gap-1 text-red-400">
                                        <AlertCircle className="w-3 h-3" /> Error al guardar
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Idioma</Label>
                                    <Select value={prefs.language} onValueChange={(v) => updatePref('language', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es-AR">🇦🇷 Español (AR)</SelectItem>
                                            <SelectItem value="en-US">🇺🇸 Ingles (EE. UU.)</SelectItem>
                                            <SelectItem value="pt-BR">🇧🇷 Português (BR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Moneda</Label>
                                    <Select value={prefs.currency} onValueChange={(v) => updatePref('currency', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">💵 USD – Dólar</SelectItem>
                                            <SelectItem value="ARS">🇦🇷 ARS – Peso AR</SelectItem>
                                            <SelectItem value="EUR">💶 EUR – Euro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Tema</Label>
                                    <Select value={prefs.theme} onValueChange={(v) => updatePref('theme', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dark">🌙 Oscuro</SelectItem>
                                            <SelectItem value="light">☀️ Claro</SelectItem>
                                            <SelectItem value="system">💻 Sistema</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Densidad de gráficos</Label>
                                    <Select value={prefs.chartDensity} onValueChange={(v) => updatePref('chartDensity', v)}>
                                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">Básica</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="advanced">Avanzada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    Zona horaria
                                </Label>
                                <Select value={prefs.timezone} onValueChange={(v) => updatePref('timezone', v)}>
                                    <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/Argentina/Cordoba">🇦🇷 Argentina (Córdoba)</SelectItem>
                                        <SelectItem value="America/Argentina/Buenos_Aires">🇦🇷 Argentina (Buenos Aires)</SelectItem>
                                        <SelectItem value="America/Sao_Paulo">🇧🇷 Brasil (São Paulo)</SelectItem>
                                        <SelectItem value="America/New_York">🇺🇸 Nueva York (ET)</SelectItem>
                                        <SelectItem value="America/Chicago">🇺🇸 Chicago (CT)</SelectItem>
                                        <SelectItem value="America/Los_Angeles">🇺🇸 Los Ángeles (PT)</SelectItem>
                                        <SelectItem value="Europe/Madrid">🇪🇸 España (Madrid)</SelectItem>
                                        <SelectItem value="UTC">🌐 UTC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <ToggleRow
                                    label="Auto refresco de mercado"
                                    description="Mantener los widgets de mercado actualizados automáticamente."
                                    checked={prefs.autoRefreshMarket}
                                    onChange={(v) => updatePref('autoRefreshMarket', v)}
                                />
                                <ToggleRow
                                    label="Notificaciones de mercado"
                                    description="Alertas de precio y noticias relevantes."
                                    checked={prefs.marketNotifications}
                                    onChange={(v) => updatePref('marketNotifications', v)}
                                    icon={<Bell className="w-4 h-4" />}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── NOTIFICACIONES ── */}
                <TabsContent value="notificaciones" className="space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<Bell className="w-4 h-4" />}
                            title="Notificaciones"
                            description="Configurá cómo y cuándo querés que Finix se contacte con vos."
                        />
                        <CardContent className="space-y-4">
                            <PushSettings />
                            <ToggleRow
                                label="Notificaciones por Email"
                                description="Recibe resúmenes semanales, actualizaciones de seguridad y noticias importantes."
                                checked={notificationPrefs.email}
                                onChange={(v) => {
                                    setNotificationPrefs((p) => ({ ...p, email: v }));
                                }}
                            />

                            {/* PRO Email / Gmail Notifications Banner Card */}
                            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card/50 to-primary/5 p-5 space-y-4 backdrop-blur-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="mt-0.5 rounded-xl bg-amber-500/20 p-2.5 text-amber-500 shadow-sm shadow-amber-500/10">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-sm text-foreground">
                                                    Alertas y Reportes Premium a tu Gmail / Email
                                                </p>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/30">
                                                    <Crown className="h-3 w-3" /> EXCLUSIVO PRO
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-muted-foreground max-w-xl">
                                                Recibí análisis de mercado urgentes, señales técnicas de alta convicción, movimientos de ballenas y resúmenes ejecutivos directamente en tu casilla de Gmail seleccionadas por el equipo de Finix.
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={settings?.investmentEmailNotifications ?? false}
                                        onCheckedChange={updateInvestmentEmailNotifications}
                                        disabled={isSavingInvestmentEmails || !isProActive}
                                    />
                                </div>

                                {isProActive ? (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs text-emerald-400">
                                        <Check className="h-4 w-4 shrink-0" />
                                        <span>Tu suscripción Finix PRO está activa. Tenés acceso total a las notificaciones y reportes directos en tu casilla.</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-background/80 p-3.5">
                                        <div className="space-y-0.5 text-xs text-muted-foreground">
                                            <p className="font-medium text-amber-400 flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5" /> Función bloqueada para cuentas gratuitas
                                            </p>
                                            <p>
                                                Finix PRO se renueva de manera automática cada mes al mismo precio pactado ($19 USD/mes). Podés cancelarlo cuando quieras.
                                            </p>
                                        </div>
                                        <Link to="/pricing" className="shrink-0 w-full sm:w-auto">
                                            <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20">
                                                <Zap className="h-3.5 w-3.5" /> Obtener Finix PRO
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2 border-t border-border/30">
                                <Button onClick={saveProfile} disabled={isSavingProfile} className="gap-2">
                                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Guardar Notificaciones
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── SEGURIDAD ── */}
                <TabsContent value="seguridad" className="space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<Lock className="w-4 h-4" />}
                            title="Seguridad"
                            description="Actualizá tu contraseña para proteger tu cuenta."
                        />
                        <CardContent className="space-y-4">
                            {[
                                { id: 'pwd-current', key: 'current', label: 'Contraseña actual', show: showPwd.current, toggle: () => setShowPwd((p) => ({ ...p, current: !p.current })) },
                                { id: 'pwd-new', key: 'newPwd', label: 'Nueva contraseña', show: showPwd.new, toggle: () => setShowPwd((p) => ({ ...p, new: !p.new })) },
                                { id: 'pwd-confirm', key: 'confirm', label: 'Confirmar nueva contraseña', show: showPwd.confirm, toggle: () => setShowPwd((p) => ({ ...p, confirm: !p.confirm })) },
                            ].map(({ id, key, label, show, toggle }) => (
                                <div key={id} className="space-y-2">
                                    <Label htmlFor={id}>{label}</Label>
                                    <div className="relative">
                                        <Input
                                            id={id}
                                            type={show ? 'text' : 'password'}
                                            value={(passwordForm as any)[key]}
                                            onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                                            className="bg-secondary/30 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={toggle}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <p className="text-xs text-muted-foreground">
                                Requisito mínimo: 8 caracteres.
                            </p>

                            {pwdErrors.length > 0 && (
                                <div className="space-y-1">
                                    {pwdErrors.map((e) => (
                                        <p key={e} className="text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            {e}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={changePassword} disabled={isSavingPwd} className="gap-2">
                                    {isSavingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    Actualizar Contraseña
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sessions */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <LogOut className="w-4 h-4 text-primary" />
                                Sesiones activas
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Cerrá sesión en todos los dispositivos donde hayas iniciado sesión.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={logoutAll}
                                className="gap-2 border-border/50 hover:border-primary/30"
                            >
                                <LogOut className="w-4 h-4" />
                                Cerrar sesión en todos los dispositivos
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Cancelación de Suscripción */}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-card p-6 shadow-2xl space-y-5">
                        <div className="flex items-start gap-3.5">
                            <div className="rounded-xl bg-red-500/20 p-2.5 text-red-500 shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">
                                    {planToCancel === 'PRO' ? '¿Dar de baja Finix PRO?' : '¿Dar de baja Plan Creador?'}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {planToCancel === 'PRO'
                                    ? 'Se detendrán los próximos cobros. Conservás el acceso PRO hasta el final del período que ya pagaste.'
                                    : 'Se detendrán los próximos cobros. Conservás el acceso Creador hasta el final del período pago; después, las herramientas de creador dejarán de estar disponibles.'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 text-foreground font-medium">
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span>Detalles de facturación:</span>
                            </div>
                            <p>
                                {planToCancel === 'PRO'
                                    ? 'No habrá nuevos cargos. El acceso continúa hasta la fecha de vencimiento que ves en esta pantalla.'
                                    : 'No habrá nuevos cargos. El acceso Creador continúa hasta la fecha de vencimiento que ves en esta pantalla.'}
                            </p>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={isCancelingSubscription}
                                className="w-full sm:w-auto text-xs"
                            >
                                Conservar suscripción
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleConfirmCancel}
                                disabled={isCancelingSubscription}
                                className="w-full sm:w-auto text-xs font-semibold gap-1.5"
                            >
                                {isCancelingSubscription ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Cancelando...
                                    </>
                                ) : (
                                    'Cancelar renovación'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
