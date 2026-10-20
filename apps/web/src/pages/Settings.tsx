import { useTranslation } from '@/i18n';
import WatchlistLimitsSummary from '@/components/watchlist/WatchlistLimitsSummary';
import { formatArs } from '@/lib/plans';
import FreeAccessNotice from '@/components/FreeAccessNotice';
import { usePlatformAccessStore } from '@/stores/platformAccessStore';
import { useEffect, useCallback, useRef, useState } from 'react';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { isProUser, useAuthStore } from '@/stores/authStore';
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
    Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
    proAccessOverride?: boolean | null;
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
}) => {
    const id = `setting-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return (
        <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${disabled ? 'border-border/30 opacity-50' : 'border-border/60 bg-card/20 hover:border-primary/30 hover:bg-card/40'}`}>
            <div className="flex items-start gap-3">
                {icon && <div className="mt-0.5 text-primary">{icon}</div>}
                <div>
                    <label htmlFor={id} className="font-medium text-sm cursor-pointer">{label}</label>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
        </div>
    );
};

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
    const { ui, locale } = useTranslation();
    const freeAccess = usePlatformAccessStore(state => state.freeAccessEnabled);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const validTabs = ['cuenta', 'suscripcion', 'privacidad', 'preferencias', 'notificaciones', 'seguridad', 'verificacion'];
    const activeTab = validTabs.includes(searchParams.get('tab') || '') ? searchParams.get('tab')! : 'cuenta';
    const { user, updateUser, syncFromSession, logout } = useAuthStore();
    const { updatePreferences: setGlobalPreferences } = usePreferencesStore();

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [settings, setSettings] = useState<FullSettings | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>();

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message: ui(message), type });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, [locale]);

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
    const privacyVersion = useRef(0);
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
    const pendingPrefs = useRef<Record<string, unknown>>({});
    const savingPrefs = useRef(false);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(toastTimer.current); clearTimeout(prefsDebounce.current); void flushPreferences(); }; }, []);

    // ── Password form state ──
    const [passwordForm, setPasswordForm] = useState({ current: '', newPwd: '', confirm: '' });
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
    const [pwdErrors, setPwdErrors] = useState<string[]>([]);
    const [isSavingPwd, setIsSavingPwd] = useState(false);
    const [googleAvailable, setGoogleAvailable] = useState(false);
    useEffect(() => {
        let active = true;
        void apiFetch('/auth/providers').then(async response => {
            const providers = response.ok ? await response.json() : {};
            if (active) setGoogleAvailable(providers.google === true);
        }).catch(() => {});
        return () => { active = false; };
    }, []);

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
                throw new Error(err?.message || ui("Error al eliminar la cuenta"));
            }
            showToast(ui("Tu cuenta ha sido eliminada."));
            logout();
            navigate('/auth');
        } catch (e: any) {
            showToast(e.message || ui("No se pudo eliminar la cuenta"), 'error');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    // ─── Load settings ────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setLoadError(false);
            try {
                const res = await apiFetch('/me/settings');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: FullSettings = await res.json();
                if (!cancelled) {
                    setSettings(data);
                    setProfileForm(data);
                    setGlobalPreferences({ chartDensity: ['basic', 'normal', 'advanced'].includes(data.chartDensity) ? data.chartDensity as 'basic' | 'normal' | 'advanced' : 'normal', marketNotifications: data.marketNotifications ?? false, timezone: data.timezone || 'America/Argentina/Buenos_Aires', language: data.language === 'en-US' ? 'en-US' : 'es-AR', currency: data.currency === 'ARS' ? 'ARS' : 'USD', theme: ['dark', 'light', 'system'].includes(data.theme) ? data.theme as 'dark' | 'light' | 'system' : 'light', autoRefreshMarket: data.autoRefreshMarket ?? true, compactTables: data.compactTables ?? false, showAdvancedMetrics: data.showAdvancedMetrics ?? false });
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
                        language: data.language === 'en-US' ? 'en-US' : 'es-AR',
                        currency: data.currency === 'ARS' ? 'ARS' : 'USD',
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
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [user?.id, reloadKey]);

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
            setSettings(previous => previous ? { ...previous, ...updated } : updated);
            setProfileForm(previous => ({ ...previous, ...updated }));
            if (updated.notificationPrefs) {
                setNotificationPrefs(updated.notificationPrefs);
            }
            updateUser({ username: updated.username, bio: updated.bio, avatarUrl: updated.avatarUrl });
            showToast(ui("Perfil guardado correctamente"));
        } catch (e: any) {
            showToast(e.message || ui("No se pudo guardar el perfil"), 'error');
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
                throw new Error(ui("No se recibió la URL del banner"));
            }

            setProfileForm((prev) => ({ ...prev, bannerUrl }));
            setSettings((prev) => (prev ? { ...prev, bannerUrl } : prev));
        } catch (e: any) {
            setBannerUploadError(e.message || ui("No se pudo subir el banner"));
        } finally {
            setIsUploadingBanner(false);
        }
    };

    // ─── Privacy save ─────────────────────────────────────────────────────────
    const updatePrivacy = (key: keyof typeof privacyForm, value: any) => {
        privacyVersion.current += 1;
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
        const version = privacyVersion.current;
        setIsSavingPrivacy(true);
        try {
            const res = await apiFetch('/me/privacy', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(privacyForm),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            if (privacyVersion.current === version) setPrivacyDirty(false);
            showToast(ui("Privacidad guardada correctamente"));
        } catch {
            showToast(ui("No se pudo guardar la privacidad"), 'error');
        } finally {
            setIsSavingPrivacy(false);
        }
    };

    // Send only changed fields, serialize requests, and retain failed patches for retry.
    const flushPreferences = async () => {
        if (savingPrefs.current || !Object.keys(pendingPrefs.current).length) return;
        savingPrefs.current = true;
        let failed = false;
        try {
            while (Object.keys(pendingPrefs.current).length) {
                const patch = pendingPrefs.current;
                pendingPrefs.current = {};
                try {
                    const res = await apiFetch('/me/preferences', {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(patch),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                } catch {
                    pendingPrefs.current = { ...patch, ...pendingPrefs.current };
                    failed = true;
                    break;
                }
            }
        } finally {
            savingPrefs.current = false;
            if (mounted.current) setPrefsSaveStatus(failed ? 'error' : 'saved');
        }
    };
    const updatePref = (key: keyof typeof prefs, value: any) => {
        setPrefs(previous => ({ ...previous, [key]: value }));
        // updatePreferences applies the local theme without a duplicate HTTP request.
        setGlobalPreferences({ [key]: value });
        pendingPrefs.current = { ...pendingPrefs.current, [key]: value };
        setPrefsSaveStatus('saving');
        clearTimeout(prefsDebounce.current);
        prefsDebounce.current = setTimeout(() => { void flushPreferences(); }, 700);
    };

    const saveNotifications = async () => {
        setIsSavingProfile(true);
        try {
            const res = await apiFetch('/users/me', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationPrefs }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            showToast(ui("Notificaciones guardadas correctamente"));
        } catch { showToast(ui("No se pudieron guardar las notificaciones"), 'error'); }
        finally { setIsSavingProfile(false); }
    };

    const effectiveUser = settings ? { ...(user || {}), ...settings } : user;
    const isExplicitlyFree = (effectiveUser as any)?.proAccessOverride === false || effectiveUser?.plan === 'FREE' || (effectiveUser as any)?.isPro === false;
    const isExplicitlyNoCreator = (effectiveUser as any)?.proAccessOverride === false || user?.isCreator === false || settings?.isCreator === false;

    const isProActive = freeAccess || (!isExplicitlyFree && isProUser(effectiveUser));

    const isCreatorActive = freeAccess || (!isExplicitlyNoCreator && Boolean(
        (user?.isCreator && user?.subscriptionStatus === 'ACTIVE') ||
        (settings?.isCreator && settings?.subscriptionStatus === 'ACTIVE') ||
        ((user?.accountType === 'CREATOR' || settings?.accountType === 'CREATOR') && (user?.subscriptionStatus === 'ACTIVE' || settings?.subscriptionStatus === 'ACTIVE')) ||
        user?.role === 'ADMIN'
    ));

    // ─── Subscription management ─────────────────────────────────────────────
    const [billingOverview, setBillingOverview] = useState<any>(null);
    const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [planToCancel, setPlanToCancel] = useState<'PRO' | 'CREATOR'>('PRO');
    const [proPriceArs, setProPriceArs] = useState<number | null>(null);
    const [creatorPriceArs, setCreatorPriceArs] = useState<number | null>(null);
    const [billingError, setBillingError] = useState<string | null>(null);
    const proBilling = billingOverview?.subscriptions?.PRO;
    const creatorBilling = billingOverview?.subscriptions?.CREATOR;

    const fetchBillingOverview = useCallback(async () => {
        try {
            const res = await apiFetch('/billing/overview');
            if (!res.ok) throw new Error(ui("No pudimos consultar tu facturación."));
            const data = await res.json();
            setBillingOverview(data);
            setBillingError(null);
        } catch {
            setBillingError(ui("No pudimos consultar tu facturación. Reintentá antes de gestionar una suscripción."));
        }
    }, []);

    useEffect(() => {
        fetchBillingOverview();
    }, [fetchBillingOverview]);

    useEffect(() => {
        apiFetch('/mercadopago/config')
            .then((res) => { if (!res.ok) throw new Error(ui("Precios no disponibles")); return res.json(); })
            .then((data) => {
                if (Number(data?.proPriceArs) > 0) setProPriceArs(Number(data.proPriceArs));
                if (Number(data?.creatorPriceArs) > 0) setCreatorPriceArs(Number(data.creatorPriceArs));
            })
            .catch(() => {});
    }, []);

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
                throw new Error(err?.message || ui("Error al cancelar la suscripción"));
            }

            const data = await res.json();

            if (data.user) {
                (updateUser as any)(data.user);
                setSettings((p) => (p ? { ...p, ...data.user } : p));
            }

            await syncFromSession?.();
            await fetchBillingOverview();
            setCancelModalOpen(false);
            showToast(locale === 'en-US' ? `The ${planToCancel} plan was cancelled successfully.` : data.message || `El plan ${planToCancel === 'PRO' ? 'Finix PRO' : ui("Plan Creador")} fue dado de baja correctamente.`, 'success');
        } catch (error: any) {
            showToast(error.message || ui("No se pudo cancelar la suscripción"), 'error');
        } finally {
            setIsCancelingSubscription(false);
        }
    };

    const updateInvestmentEmailNotifications = async (enabled: boolean) => {
        if (!isProActive) {
            showToast(ui("Las alertas por email de inversiones son exclusivas para Finix PRO"), 'error');
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
                throw new Error(data?.message || ui("No se pudo guardar la preferencia"));
            }
            setSettings((previous) => previous ? { ...previous, investmentEmailNotifications: enabled } : previous);
            showToast(enabled ? ui("Emails de inversiones activados") : ui("Emails de inversiones desactivados"));
        } catch (error: any) {
            showToast(error.message || ui("No se pudo guardar la preferencia"), 'error');
        } finally {
            setIsSavingInvestmentEmails(false);
        }
    };

    // ─── Password change ──────────────────────────────────────────────────────
    const changePassword = async () => {
        const errors: string[] = [];
        if (!passwordForm.current) errors.push(ui("Ingresá tu contraseña actual"));
        if (passwordForm.newPwd.length < 8) errors.push(ui("La nueva contraseña debe tener al menos 8 caracteres"));
        if (passwordForm.newPwd !== passwordForm.confirm) errors.push(ui("Las contraseñas no coinciden"));
        if (passwordForm.newPwd === passwordForm.current) errors.push(ui("La nueva contraseña debe ser diferente a la actual"));
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
            showToast(ui("Contraseña actualizada correctamente"));
        } catch (e: any) {
            showToast(e.message || ui("No se pudo actualizar la contraseña"), 'error');
        } finally {
            setIsSavingPwd(false);
        }
    };

    // ─── Logout all ───────────────────────────────────────────────────────────
    const logoutAll = async () => {
        try {
            const response = await apiFetch('/me/logout-all', { method: 'POST' });
            if (!response.ok) throw new Error(ui("No se pudo cerrar las sesiones"));
            await useAuthStore.getState().logout();
            navigate('/login', { replace: true });
        } catch {
            showToast(ui("No se pudo cerrar las sesiones"), 'error');
        }
    };

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="space-y-3 text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground">{ui("Cargando configuración...")} </p>
                </div>
            </div>
        );
    }

    if (loadError) return <div role="alert" className="p-6 space-y-4"><p>{ui("No se pudo cargar tu configuración. Reintentá antes de modificar tu cuenta.")} </p><Button onClick={() => setReloadKey(key => key + 1)}>{ui("Reintentar")} </Button></div>;

    const accountAge = settings?.createdAt
        ? new Date(settings.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    return (
        <div className="settings-page mx-auto w-full max-w-[1080px] p-4 md:p-6 lg:p-8 space-y-5 pb-16">
            <FreeAccessNotice />
            {/* Header */}
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-7 shadow-xs">
                <div className="desktop-page-heading flex flex-col items-center justify-center text-center gap-4 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center text-center">
                        <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-foreground text-center">{ui("Configuración")} </h1>
                        <p className="mt-1.5 text-sm sm:text-base text-muted-foreground leading-relaxed font-normal text-center">{ui("Gestioná tu cuenta, privacidad, preferencias de la app y seguridad.")} </p>
                        {accountAge && (
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground/75 font-medium text-center">{ui("Cuenta creada el")} {accountAge}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2.5 shrink-0">
                        {settings?.isVerified && <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1">{ui("✓ Verificado")} </Badge>}
                        {settings?.isCreator && <Badge className="bg-primary/15 text-primary border border-primary/30 text-xs font-bold px-3 py-1">{ui("Creador")} </Badge>}
                    </div>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={tab => setSearchParams({ tab })} className="space-y-6">
                <div className="w-full pb-2 flex justify-center">
                    <TabsList className="is-centered justify-center mx-auto inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-secondary/40 border border-border/60 rounded-2xl min-w-0">
                        {[
                            { value: 'cuenta', label: ui("Cuenta"), icon: <User className="w-4 h-4 shrink-0" /> },
                            { value: 'suscripcion', label: ui("Planes PRO"), icon: <Crown className="w-4 h-4 text-amber-500 shrink-0" /> },
                            { value: 'privacidad', label: ui("Privacidad"), icon: <Shield className="w-4 h-4 shrink-0" /> },
                            { value: 'preferencias', label: ui("Preferencias"), icon: <Globe className="w-4 h-4 shrink-0" /> },
                            { value: 'notificaciones', label: ui("Notificaciones"), icon: <Bell className="w-4 h-4 shrink-0" /> },
                            { value: 'seguridad', label: ui("Seguridad"), icon: <Lock className="w-4 h-4 shrink-0" /> },
                            { value: 'verificacion', label: ui("Verificación"), icon: <BadgeCheck className="w-4 h-4 shrink-0" /> },
                        ].map(({ value, label, icon }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="flex items-center justify-center gap-2 py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-secondary/70 transition-all text-muted-foreground shrink-0"
                            >
                                {icon}
                                <span className="whitespace-nowrap">{label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="verificacion">
                    <FinancialVerificationTab />
                </TabsContent>

                {/* ── CUENTA ── */}
                <TabsContent value="cuenta" className="space-y-4"><fieldset disabled={isSavingProfile || isDeletingAccount} className="min-w-0 space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<User className="w-4 h-4" />}
                            title={ui("Cuenta")}
                            description={ui("Editá tu información pública y datos de perfil.")}
                        />
                        <CardContent className="space-y-5">
                            {/* Avatar preview and quick change */}
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-card/20 flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 flex items-center justify-center text-xl font-bold bg-secondary/50 shrink-0">
                                        {(profileForm.avatarUrl || settings?.avatarUrl) ? (
                                            <img
                                                src={resolveMediaUrl(profileForm.avatarUrl || settings?.avatarUrl || '')}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span>{(profileForm.username || settings?.username || 'U')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">{profileForm.username || settings?.username || ui("Usuario")}</p>
                                        <p className="text-xs text-muted-foreground">{settings?.email || profileForm.email}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                try {
                                                    const res = await uploadProfileImage('avatar', file);
                                                    if (res.avatarUrl) {
                                                        setProfileForm((p) => ({ ...p, avatarUrl: res.avatarUrl }));
                                                        updateUser({ avatarUrl: res.avatarUrl });
                                                        showToast(ui("Foto de perfil actualizada correctamente"));
                                                    }
                                                } catch (err: any) {
                                                    showToast(err.message || ui("Error al subir imagen"), 'error');
                                                }
                                            }
                                        };
                                        input.click();
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-xs active:scale-95"
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>{ui("Cambiar foto de perfil")} </span>
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="s-username">{ui("Usuario")} </Label>
                                    <Input
                                        id="s-username"
                                        value={profileForm.username || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                                        placeholder={ui("tu_usuario")}
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-email">{ui("Correo electronico (solo lectura)")} </Label>
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
                                    <Label htmlFor="s-title">{ui("Título profesional")} </Label>
                                    <Input
                                        id="s-title"
                                        value={profileForm.title || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder={ui("Ej: Inversor en tecnología")}
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-company">{ui("Empresa")} </Label>
                                    <Input
                                        id="s-company"
                                        value={profileForm.company || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, company: e.target.value }))}
                                        placeholder={ui("Empresa")}
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-location">{ui("Ciudad / País")} </Label>
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
                                <Label htmlFor="s-bio">{ui("Bio corta")} </Label>
                                <Textarea
                                    id="s-bio"
                                    rows={3}
                                    value={profileForm.bio || ''}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                                    placeholder={ui("Contá algo sobre vos...")}
                                    maxLength={300}
                                    className="bg-secondary/30 resize-none"
                                />
                                <p className="text-xs text-muted-foreground text-right">{(profileForm.bio || '').length}/300</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="s-biolong">{ui("Bio extendida (para creadores)")} </Label>
                                <Textarea
                                    id="s-biolong"
                                    rows={5}
                                    value={profileForm.bioLong || ''}
                                    onChange={(e) => setProfileForm((p) => ({ ...p, bioLong: e.target.value }))}
                                    placeholder={ui("Descripción detallada de tu experiencia...")}
                                    maxLength={2000}
                                    className="bg-secondary/30 resize-none"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{ui("Foto de perfil")} </Label>
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
                                    <Label>{ui("Banner del perfil")} </Label>
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
                                                    <ImagePlus className="h-4 w-4" />{ui("Sin banner cargado")} </div>
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
                                                {isUploadingBanner ? 'Subiendo...' : (profileForm.bannerUrl ? ui("Cambiar banner") : ui("Subir banner"))}
                                            </Button>
                                            <span className="text-xs text-muted-foreground">{ui("JPG, PNG, WEBP o GIF · Máx 5 MB")} </span>
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
                                    <Label htmlFor="s-website">{ui("Sitio web")} </Label>
                                    <Input
                                        id="s-website"
                                        value={profileForm.website || ''}
                                        onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
                                        placeholder="https://..."
                                        className="bg-secondary/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="s-years">{ui("Años de experiencia")} </Label>
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
                                            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                                        }}
                                    >
                                        <Download className="w-3.5 h-3.5" />{ui("Exportar datos")} </Button>
                                </div>
                                <Button onClick={saveProfile} disabled={isSavingProfile} className="gap-2">
                                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{ui("Guardar Cuenta")} </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger zone */}
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-red-400 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" />{ui("Zona de peligro")} </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!showDeleteConfirm ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />{ui("Eliminar cuenta")} </Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-red-300">{ui("Esta acción es")} <strong>{ui("irreversible")} </strong>{ui(". Escribí")} <code className="bg-red-500/20 px-1 rounded">ELIMINAR</code>{ui("para confirmar.")} </p>
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
                                        >{ui("Cancelar")} </Button>
                                        <Button
                                            size="sm"
                                            disabled={deleteConfirm !== 'ELIMINAR' || isDeletingAccount}
                                            className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                                            onClick={handleDeleteAccount}
                                        >
                                            {isDeletingAccount ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />{ui("Eliminando...")} </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-3.5 h-3.5" />{ui("Confirmar eliminación")} </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </fieldset></TabsContent>

                {/* ── SUSCRIPCIÓN ── */}
                <TabsContent value="suscripcion" className="space-y-6">
                    <WatchlistLimitsSummary />
                    {billingError && <div role="alert" className="rounded-xl border border-border bg-card p-4">{billingError}<button className="ml-3 text-primary underline" onClick={() => { void fetchBillingOverview(); }}>{ui("Reintentar")} </button></div>}
                    {!billingOverview && !billingError && <p role="status">{ui("Consultando tu suscripción…")} </p>}
                    {freeAccess && <p className="text-sm text-muted-foreground">{ui("Precios mensuales configurados: PRO")} {formatArs(proPriceArs)}{ui("· Creador")} {formatArs(creatorPriceArs)}{ui(". Hoy el acceso a estas funciones es gratuito temporalmente.")} </p>}
                    {/* Recurring Billing Notice Banner */}
                    <div className="relative overflow-hidden rounded-3xl border border-amber-500/35 bg-gradient-to-br from-amber-500/15 via-amber-500/8 to-card p-5 sm:p-6 shadow-xs backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="rounded-2xl bg-amber-500/20 p-3 text-amber-600 dark:text-amber-400 shrink-0 shadow-xs border border-amber-500/30">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h4 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{ui("Administrá tus renovaciones")} </h4>
                                        <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 rounded-full border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/15">{ui("Garantía Finix")} </Badge>
                                    </div>
                                    <p className="text-sm text-foreground/80 dark:text-muted-foreground mt-1.5 max-w-3xl leading-relaxed font-normal">{ui("Desde acá podés consultar la fecha del próximo cobro o vencimiento y detener los cobros futuros en cualquier momento.")} </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finix PRO Card */}
                    <Card className="rounded-3xl border-2 border-amber-500/30 bg-card/90 dark:bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 p-6 sm:p-7 border-b border-border/50 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-500/10 p-3 text-amber-500 border border-amber-500/30 shrink-0 shadow-xs">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <CardTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                                            Finix PRO
                                        </CardTitle>
                                        {isProActive ? (
                                            <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{ui("Activo")} </Badge>
                                        ) : proBilling?.status === 'PENDING' ? (
                                            <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10">{ui("Pago pendiente")} </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">{ui("Plan Gratuito")} </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground mt-1 font-medium">{ui("Herramientas de análisis, portafolios y seguimiento de inversiones.")} </CardDescription>
                                </div>
                            </div>
                            <div className="sm:text-right shrink-0">
                                <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground tabular-nums">
                                    {freeAccess ? 'Gratis' : formatArs(proPriceArs)}

                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-muted-foreground block mt-0.5">{freeAccess ? ui("durante esta etapa") : ui("/ mes contratado")}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 sm:p-7">
                            {/* Features list */}
                            <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{ui("Beneficios incluidos en tu membresía")} </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5 rounded-2xl border border-border/60 bg-secondary/30 dark:bg-card/50">
                                    {[
                                        ui("Portafolios personales ilimitados"),
                                        ui("Finanzas Personales: gastos, tarjetas, cuentas y presupuestos"),
                                        ui("Alertas avanzadas de tus listas de seguimiento"),
                                        ui("Seguimiento de ideas e importación CSV"),
                                        ui("Mercados, análisis, noticias y calendario"),
                                        ui("Acceso a la sección de comunidades"),
                                        ui("Pago mensual en ARS mediante Mercado Pago, con renovación opcional"),
                                    ].map((feature) => (
                                        <div key={feature} className="flex items-center gap-3">
                                            <div className="rounded-full bg-emerald-500/15 p-1 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/25">
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                            </div>
                                            <span className="text-sm sm:text-base font-semibold text-foreground/90 leading-snug">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Billing details / Renewal */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 rounded-2xl border border-border/70 bg-secondary/40 dark:bg-card/60">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ui("Ciclo de facturación")} </span>
                                    <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                                        {proBilling?.status === 'PENDING'
                                            ? ui("Esperando que completes la autorización de pago en Mercado Pago.")
                                            : isProActive && !proBilling
                                                ? ui("Acceso activo sin una suscripción facturable asociada.")
                                                : isProActive
                                            ? proBilling?.cancelAtPeriodEnd
                                                ? `${ui('Renovación cancelada. Mantenés acceso hasta el')} ${proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString(locale) : ui("fin del período pago")}.`
                                                : proBilling?.autoRenew
                                                    ? `${ui('Renovación automática mensual. Próximo cobro:')} ${proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString(locale) : ui("según Mercado Pago")}.`
                                                    : `${ui('Sin renovación automática. Acceso hasta el')} ${proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString(locale) : ui("fin del período pago")}.`
                                            : ui("No hay un plan PRO activo actualmente.")}
                                    </p>
                                </div>
                                <div className="space-y-1 md:text-right shrink-0">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{ui("Estado del plan")} </span>
                                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide bg-background border border-border/80 shadow-2xs text-foreground">
                                        {freeAccess && !proBilling ? ui("Acceso gratuito") : proBilling?.status === 'PENDING' ? 'Pendiente' : isProActive ? (proBilling?.status || settings?.subscriptionStatus || ui("Activo")) : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border/40">
                                {freeAccess && !proBilling ? <p className="text-sm font-medium">{ui("PRO está incluido gratis. No necesitás contratar una suscripción.")} </p> : proBilling?.status === 'PENDING' ? (
                                    <>
                                        <p className="text-sm text-muted-foreground font-medium">{ui("La autorización de pago todavía está pendiente.")} </p>
                                        <Button type="button" variant="destructive" size="sm" disabled={!!billingError || !proBilling} onClick={() => { setPlanToCancel('PRO'); setCancelModalOpen(true); }} className="w-full sm:w-auto text-sm font-bold py-2.5 px-5 rounded-xl shadow-xs">{ui("Cancelar solicitud")} </Button>
                                    </>
                                ) : isProActive ? (
                                    <>
                                        {proBilling?.cancelAtPeriodEnd ? (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{ui("La baja del plan ya fue solicitada. Conservás acceso hasta el")} {proBilling?.endDate ? new Date(proBilling.endDate).toLocaleDateString(locale) : ui("fin del período")}.
                                                </p>
                                                <Link to="/pricing#planes" className="w-full sm:w-auto">
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto font-bold text-sm rounded-xl border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10">{ui("Ver planes disponibles")} </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                                                <p className="text-sm text-muted-foreground font-medium max-w-xl">
                                                    {proBilling?.autoRenew
                                                        ? ui("Renovación automática mensual activa. Podés dar de baja el plan en cualquier momento.")
                                                        : ui("Acceso PRO activo en tu cuenta. Podés dar de baja tu plan cuando quieras.")}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!!billingError || !proBilling} onClick={() => { setPlanToCancel('PRO'); setCancelModalOpen(true); }}
                                                    className="w-full sm:w-auto text-sm font-bold py-2.5 px-5 rounded-xl border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/60 shadow-xs gap-2 shrink-0 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />{ui("Dar de baja Finix PRO")} </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground font-medium">{ui("Subí a PRO para acceder a todas las secciones bloqueadas y alertas por Gmail.")} </p>
                                                <Link to="/pricing#planes" className="w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold text-sm py-2.5 px-6 rounded-xl gap-2 shadow-lg shadow-amber-500/20"
                                            >
                                                <Zap className="w-4 h-4 fill-black" />{ui("Mejorar a Finix PRO")} </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Creador Card */}
                    <Card className="rounded-3xl border-2 border-blue-500/30 bg-card/90 dark:bg-card/40 backdrop-blur-md shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 p-6 sm:p-7 border-b border-border/50 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent">
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/10 p-3 text-blue-500 border border-blue-500/30 shrink-0 shadow-xs">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <CardTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{ui("Plan Creador de Contenido")} </CardTitle>
                                        {creatorBilling?.status === 'PENDING' ? (
                                            <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10">{ui("Pago pendiente")} </Badge>
                                        ) : isCreatorActive ? (
                                            <Badge className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />{ui("Creador Activo")} </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">{ui("Básico")} </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="text-sm text-muted-foreground mt-1 font-medium">{ui("Monetizá análisis, administrá comunidades pagas y creá publicaciones destacadas.")} </CardDescription>
                                </div>
                            </div>
                            <div className="sm:text-right shrink-0">
                                <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground tabular-nums">
                                    {freeAccess ? 'Gratis' : formatArs(creatorPriceArs)}

                                </span>
                                <span className="block text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">{freeAccess ? ui("durante esta etapa") : ui("/ mes contratado")}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6 sm:p-7">
                            <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{ui("Herramientas incluidas para Creadores")} </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5 rounded-2xl border border-border/60 bg-secondary/30 dark:bg-card/50">
                                    {[
                                        ui("Creación y monetización de comunidades exclusivas"),
                                        ui("Cobro de membresías a tus seguidores"),
                                        ui("Herramientas avanzadas de publicación y gráficos"),
                                        ui("Gestión de miembros y salas de la comunidad"),
                                    ].map((feature) => (
                                        <div key={feature} className="flex items-center gap-3">
                                            <div className="rounded-full bg-blue-500/15 p-1 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/25">
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                            </div>
                                            <span className="text-sm sm:text-base font-semibold text-foreground/90 leading-snug">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 rounded-2xl border border-border/70 bg-secondary/40 dark:bg-card/60">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ui("Facturación del Creador")} </span>
                                    <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                                        {isCreatorActive && !creatorBilling
                                            ? ui("Acceso Creador activo sin una suscripción facturable asociada.")
                                            : isCreatorActive
                                            ? creatorBilling?.cancelAtPeriodEnd
                                                ? `${ui('Renovación cancelada. Acceso hasta el')} ${creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString(locale) : ui("fin del período pago")}.`
                                                : creatorBilling?.autoRenew
                                                    ? `${ui('Renovación automática mensual. Próximo cobro:')} ${creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString(locale) : ui("según Mercado Pago")}.`
                                                    : `${ui('Sin renovación automática. Acceso hasta el')} ${creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString(locale) : ui("fin del período pago")}.`
                                            : ui("No hay un plan Creador activo actualmente.")}
                                    </p>
                                </div>
                                <div className="space-y-1 md:text-right shrink-0">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">{ui("Estado")} </span>
                                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide bg-background border border-border/80 shadow-2xs text-foreground">
                                        {creatorBilling?.status === 'PENDING' ? 'Pendiente' : creatorBilling?.status || (freeAccess ? ui("Acceso gratuito") : isCreatorActive ? ui("Acceso especial activo") : 'Inactivo')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border/40">
                                {freeAccess && !creatorBilling ? <p className="text-sm font-medium">{ui("Creador está incluido gratis. Podés crear tu comunidad sin pagar.")} </p> : creatorBilling?.status === 'PENDING' ? (
                                    <>
                                        <p className="text-sm text-muted-foreground font-medium">{ui("La autorización de pago todavía está pendiente.")} </p>
                                        <Button type="button" variant="destructive" size="sm" disabled={!!billingError || !creatorBilling} onClick={() => { setPlanToCancel('CREATOR'); setCancelModalOpen(true); }} className="w-full sm:w-auto text-sm font-bold py-2.5 px-5 rounded-xl shadow-xs">{ui("Cancelar solicitud")} </Button>
                                    </>
                                ) : isCreatorActive ? (
                                    <>
                                        {creatorBilling?.cancelAtPeriodEnd ? (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{ui("La baja del plan ya fue solicitada. Conservás tus herramientas hasta el")} {creatorBilling?.endDate ? new Date(creatorBilling.endDate).toLocaleDateString(locale) : ui("fin del período")}.
                                                </p>
                                                <Link to="/pricing#planes" className="w-full sm:w-auto">
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto font-bold text-sm rounded-xl border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10">{ui("Ver planes disponibles")} </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                                                <p className="text-sm text-muted-foreground font-medium max-w-xl">
                                                    {creatorBilling?.autoRenew
                                                        ? ui("Renovación automática mensual activa. Podés dar de baja el plan en cualquier momento.")
                                                        : ui("Acceso Creador activo en tu cuenta. Podés dar de baja tu plan cuando quieras.")}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!!billingError || !creatorBilling} onClick={() => { setPlanToCancel('CREATOR'); setCancelModalOpen(true); }}
                                                    className="w-full sm:w-auto text-sm font-bold py-2.5 px-5 rounded-xl border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/60 shadow-xs gap-2 shrink-0 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />{ui("Dar de baja Plan Creador")} </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground font-medium">{ui("¿Querés monetizar tus análisis y crear tu comunidad en Finix?")} </p>
                                        <Link to="/pricing#planes" className="w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full sm:w-auto text-sm font-bold py-2.5 px-5 rounded-xl border-blue-500/40 text-blue-600 hover:bg-blue-500/10"
                                            >{ui("Contratar Plan Creador")} </Button>
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
                            title={ui("Privacidad")}
                            description={ui("Definí qué información pública puede ver el resto de usuarios.")}
                        />
                        <CardContent className="space-y-3">
                            <ToggleRow
                                label={ui("Perfil público")}
                                description={ui("Permite que otros usuarios encuentren y vean tu perfil.")}
                                checked={privacyForm.isProfilePublic}
                                onChange={(v) => updatePrivacy('isProfilePublic', v)}
                            />
                            <ToggleRow
                                label={ui("Aceptar seguidores")}
                                description={ui("Permite que otros usuarios te sigan para recibir tus publicaciones.")}
                                checked={privacyForm.acceptingFollowers}
                                onChange={(v) => updatePrivacy('acceptingFollowers', v)}
                            />
                            <ToggleRow
                                label={ui("Mostrar estadísticas")}
                                description={ui("Publica métricas agregadas como rendimiento y riesgo.")}
                                checked={privacyForm.showStats}
                                onChange={(v) => updatePrivacy('showStats', v)}
                                disabled={!privacyForm.isProfilePublic}
                            />
                            <ToggleRow
                                label={ui("Mostrar actividad reciente")}
                                description={ui("Muestra tus últimos movimientos y publicaciones en tu perfil.")}
                                checked={privacyForm.showActivity}
                                onChange={(v) => updatePrivacy('showActivity', v)}
                            />

                            <div className="rounded-xl border border-border/60 bg-card/20 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-sm">{ui("Mostrar rendimiento exacto")} </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{ui("Si está OFF, se mostrará un rango (ej: 0–5%) en vez del número exacto.")} </p>
                                    </div>
                                    <Switch
                                        id="privacy-exact-returns"
                                        aria-label={ui("Mostrar rendimiento exacto")}
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
                                        <Eye className="w-3.5 h-3.5 shrink-0" />{ui("Los visitantes verán rangos como \"5–10%\" en lugar de valores exactos.")} </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30">
                                <Button
                                    onClick={savePrivacy}
                                    disabled={isSavingPrivacy || !privacyDirty}
                                    className="gap-2"
                                >
                                    {isSavingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}{ui("Guardar Privacidad")} </Button>
                                <Button variant="outline" onClick={() => window.dispatchEvent(new Event('finix-open-cookie-preferences'))}>
                                    {ui("Preferencias de cookies")}
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
                            title={ui("Preferencias")}
                            description={ui("Estas preferencias se guardan automáticamente.")}
                        />
                        <CardContent className="space-y-4">
                            {/* Autosave status */}
                            <div className="flex items-center justify-end gap-2 text-xs">
                                {prefsSaveStatus === 'saving' && (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Loader2 className="w-3 h-3 animate-spin" />{ui("Guardando...")} </span>
                                )}
                                {prefsSaveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-emerald-400">
                                        <CheckCircle2 className="w-3 h-3" />{ui("Guardado")} </span>
                                )}
                                {prefsSaveStatus === 'error' && (
                                    <span className="flex items-center gap-1 text-red-400">
                                        <AlertCircle className="w-3 h-3" />{ui("Error al guardar")} <Button size="sm" variant="outline" onClick={() => { setPrefsSaveStatus('saving'); void flushPreferences(); }}>{ui("Reintentar")} </Button>
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{ui("Idioma")} </Label>
                                    <Select value={prefs.language} onValueChange={(v) => updatePref('language', v)}>
                                        <SelectTrigger aria-label={ui("Idioma")} className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es-AR">{ui("🇦🇷 Español (AR)")} </SelectItem>
                                            <SelectItem value="en-US">{ui("🇺🇸 Ingles (EE. UU.)")} </SelectItem>

                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{ui("Moneda")} </Label>
                                    <Select value={prefs.currency} onValueChange={(v) => updatePref('currency', v)}>
                                        <SelectTrigger aria-label={ui("Moneda principal")} className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">{ui("💵 USD – Dólar")} </SelectItem>
                                            <SelectItem value="ARS">{ui("🇦🇷 ARS – Peso AR")} </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{ui("Tema")} </Label>
                                    <Select value={prefs.theme} onValueChange={(v) => updatePref('theme', v)}>
                                        <SelectTrigger aria-label={ui("Tema visual")} className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dark">{ui("🌙 Oscuro")} </SelectItem>
                                            <SelectItem value="light">{ui("☀️ Claro")} </SelectItem>
                                            <SelectItem value="system">{ui("💻 Sistema")} </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{ui("Densidad de gráficos")} </Label>
                                    <Select value={prefs.chartDensity} onValueChange={(v) => updatePref('chartDensity', v)}>
                                        <SelectTrigger aria-label={ui("Densidad de gráficos")} className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">{ui("Básica")} </SelectItem>
                                            <SelectItem value="normal">{ui("Normal")} </SelectItem>
                                            <SelectItem value="advanced">{ui("Avanzada")} </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" />{ui("Zona horaria")} </Label>
                                <Select value={prefs.timezone} onValueChange={(v) => updatePref('timezone', v)}>
                                    <SelectTrigger aria-label={ui("Zona horaria")} className="bg-secondary/30"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/Argentina/Cordoba">{ui("🇦🇷 Argentina (Córdoba)")} </SelectItem>
                                        <SelectItem value="America/Argentina/Buenos_Aires">{ui("🇦🇷 Argentina (Buenos Aires)")} </SelectItem>
                                        <SelectItem value="America/Sao_Paulo">{ui("🇧🇷 Brasil (São Paulo)")} </SelectItem>
                                        <SelectItem value="America/New_York">{ui("🇺🇸 Nueva York (ET)")} </SelectItem>
                                        <SelectItem value="America/Chicago">{ui("🇺🇸 Chicago (CT)")} </SelectItem>
                                        <SelectItem value="America/Los_Angeles">{ui("🇺🇸 Los Ángeles (PT)")} </SelectItem>
                                        <SelectItem value="Europe/Madrid">{ui("🇪🇸 España (Madrid)")} </SelectItem>
                                        <SelectItem value="UTC">{ui("🌐 UTC")} </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <ToggleRow
                                    label={ui("Auto refresco de mercado")}
                                    description={ui("Actualizar automáticamente cotizaciones y datos de mercado de Finix.")}
                                    checked={prefs.autoRefreshMarket}
                                    onChange={(v) => updatePref('autoRefreshMarket', v)}
                                />
                                <ToggleRow
                                    label={ui("Notificaciones de mercado")}
                                    description={ui("Alertas de precio y noticias relevantes.")}
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
                            title={ui("Notificaciones")}
                            description={ui("Configurá cómo y cuándo querés que Finix se contacte con vos.")}
                        />
                        <CardContent className="space-y-4">
                            <PushSettings />
                            <ToggleRow
                                label={ui("Notificaciones por Email")}
                                description={ui("Recibí resúmenes y novedades por email. Los avisos de seguridad siguen activos.")}
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
                                                <p className="font-semibold text-sm text-foreground">{ui("Alertas y Reportes Premium a tu Gmail / Email")} </p>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/30">
                                                    <Crown className="h-3 w-3" />{ui("EXCLUSIVO PRO")} </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-muted-foreground max-w-xl">{ui("Recibí análisis de mercado urgentes, señales técnicas de alta convicción, movimientos de ballenas y resúmenes ejecutivos directamente en tu casilla de Gmail seleccionadas por el equipo de Finix.")} </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="investment-email-notifications"
                                        aria-label={ui("Notificaciones de inversión exclusivas por email")}
                                        checked={settings?.investmentEmailNotifications ?? false}
                                        onCheckedChange={updateInvestmentEmailNotifications}
                                        disabled={isSavingInvestmentEmails || !isProActive}
                                    />
                                </div>

                                {isProActive ? (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs text-emerald-400">
                                        <Check className="h-4 w-4 shrink-0" />
                                        <span>{freeAccess ? ui("Las notificaciones y reportes están incluidos gratis durante esta etapa.") : ui("Tu suscripción Finix PRO está activa. Tenés acceso total a las notificaciones y reportes directos en tu casilla.")}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-background/80 p-3.5">
                                        <div className="space-y-0.5 text-xs text-muted-foreground">
                                            <p className="font-medium text-amber-400 flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5" />{ui("Función bloqueada para cuentas gratuitas")} </p>
                                            <p>{ui("Finix PRO:")} {formatArs(proPriceArs)}{ui("por mes. Podés pagar un mes o renovarlo automáticamente y cancelarlo cuando quieras.")} </p>
                                        </div>
                                        <Link to="/pro" className="shrink-0 w-full sm:w-auto">
                                            <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20">
                                                <Zap className="h-3.5 w-3.5" />{ui("Obtener Finix PRO")} </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2 border-t border-border/30">
                                <Button onClick={saveNotifications} disabled={isSavingProfile} className="gap-2">
                                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{ui("Guardar Notificaciones")} </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── SEGURIDAD ── */}
                <TabsContent value="seguridad" className="space-y-4">
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <SectionHeader
                            icon={<Lock className="w-4 h-4" />}
                            title={ui("Seguridad")}
                            description={ui("Actualizá tu contraseña para proteger tu cuenta.")}
                        />
                        <CardContent className="space-y-4">
                            {googleAvailable && (
                                <Button type="button" variant="outline" onClick={() => window.location.assign('/api/auth/google/link')}>{ui("Vincular mi cuenta de Google")} </Button>
                            )}
                            {[
                                { id: 'pwd-current', key: 'current', label: ui("Contraseña actual"), show: showPwd.current, toggle: () => setShowPwd((p) => ({ ...p, current: !p.current })) },
                                { id: 'pwd-new', key: 'newPwd', label: ui("Nueva contraseña"), show: showPwd.new, toggle: () => setShowPwd((p) => ({ ...p, new: !p.new })) },
                                { id: 'pwd-confirm', key: 'confirm', label: ui("Confirmar nueva contraseña"), show: showPwd.confirm, toggle: () => setShowPwd((p) => ({ ...p, confirm: !p.confirm })) },
                            ].map(({ id, key, label, show, toggle }) => (
                                <div key={id} className="space-y-2">
                                    <Label htmlFor={id}>{label}</Label>
                                    <div className="relative">
                                        <Input
                                            id={id}
                                            type={show ? 'text' : 'password'}
                                            value={(passwordForm as any)[key]}
                                            onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                                            className="bg-secondary/30 pr-12 min-h-[44px]"
                                        />
                                        <button
                                            type="button"
                                            onClick={toggle}
                                            aria-label={`${ui(show ? "Ocultar" : "Mostrar")} ${label.toLowerCase()}`}
                                            className="absolute right-0 top-0 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-r-md"
                                        >
                                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <p className="text-xs text-muted-foreground">{ui("Requisito mínimo: 8 caracteres.")} </p>

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
                                    {isSavingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}{ui("Actualizar Contraseña")} </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sessions */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <LogOut className="w-4 h-4 text-primary" />{ui("Sesiones activas")} </CardTitle>
                            <CardDescription className="text-sm">{ui("Cerrá sesión en todos los dispositivos donde hayas iniciado sesión.")} </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                onClick={logoutAll}
                                className="gap-2 border-border/50 hover:border-primary/30"
                            >
                                <LogOut className="w-4 h-4" />{ui("Cerrar sesión en todos los dispositivos")} </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Cancelación de Suscripción */}
            {cancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg rounded-3xl border border-red-500/30 bg-card p-6 sm:p-7 shadow-2xl space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-red-500/15 p-3.5 text-red-600 dark:text-red-400 shrink-0 border border-red-500/30 shadow-xs">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                    {planToCancel === 'PRO' ? ui("¿Dar de baja Finix PRO?") : ui("¿Dar de baja Plan Creador?")}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed font-normal">
                                    {planToCancel === 'PRO'
                                        ? ui("Al confirmar, se cancelarán las renovaciones automáticas y los cobros futuros de tu suscripción.")
                                        : ui("Al confirmar, se detendrán los cobros futuros. Conservás las herramientas durante el período ya pagado.")}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4 sm:p-5 space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-foreground font-bold text-sm sm:text-base">
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span>{ui("Información sobre la baja:")} </span>
                            </div>
                            <ul className="text-xs sm:text-sm text-foreground/80 dark:text-muted-foreground space-y-2 list-disc pl-5 font-medium leading-relaxed">
                                {planToCancel === 'PRO' ? (
                                    <>
                                        <li>{ui("No se generará ningún cobro adicional en tu medio de pago.")} </li>
                                        <li>{ui("Conservás las funciones hasta el final del ciclo si ya estaba pagado.")} </li>
                                        <li>{ui("Después del vencimiento podés volver a contratar un plan sin perder tus publicaciones.")} </li>
                                    </>
                                ) : (
                                    <>
                                        <li>{ui("No se generará ningún cobro adicional en tu medio de pago.")} </li>
                                        <li>{ui("Conservás las herramientas de Creador hasta el final del período ya pagado.")} </li>
                                        <li>{ui("La suscripción de Creador es independiente de las membresías de tus comunidades.")} </li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={isCancelingSubscription}
                                className="w-full sm:w-auto text-sm font-semibold rounded-xl py-2.5 px-5"
                            >{ui("Conservar mi plan")} </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleConfirmCancel}
                                disabled={isCancelingSubscription}
                                className="w-full sm:w-auto text-sm font-black rounded-xl py-2.5 px-6 gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                            >
                                {isCancelingSubscription ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />{ui("Dando de baja...")} </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />{ui("Confirmar baja del plan")} </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
