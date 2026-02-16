import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BellRing, Globe, Loader2, Lock, Save, Shield, User } from 'lucide-react';

interface SettingsProfile {
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
    accountType: string;
    isProfilePublic: boolean;
    showPortfolio: boolean;
    showStats: boolean;
    acceptingFollowers: boolean;
    createdAt: string;
}

interface AppPreferences {
    language: 'es-AR' | 'en-US';
    currency: 'USD' | 'ARS' | 'EUR';
    autoRefreshMarket: boolean;
    compactTables: boolean;
    showAdvancedMetrics: boolean;
}

const APP_PREFS_KEY = 'finix_app_preferences_v1';

const defaultPreferences: AppPreferences = {
    language: 'es-AR',
    currency: 'USD',
    autoRefreshMarket: true,
    compactTables: false,
    showAdvancedMetrics: true,
};

function loadPreferences(): AppPreferences {
    try {
        const raw = localStorage.getItem(APP_PREFS_KEY);
        if (!raw) return defaultPreferences;
        const parsed = JSON.parse(raw) as Partial<AppPreferences>;
        return {
            ...defaultPreferences,
            ...parsed,
        };
    } catch {
        return defaultPreferences;
    }
}

export default function Settings() {
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [profile, setProfile] = useState<SettingsProfile | null>(null);
    const [profileForm, setProfileForm] = useState<Partial<SettingsProfile>>({});
    const [preferences, setPreferences] = useState<AppPreferences>(loadPreferences);

    const [profileMessage, setProfileMessage] = useState('');
    const [prefsMessage, setPrefsMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const accountAge = useMemo(() => {
        if (!profile?.createdAt) return '';
        const date = new Date(profile.createdAt);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    }, [profile?.createdAt]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setErrorMessage('');
            try {
                const response = await apiFetch('/users/me');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json() as SettingsProfile;
                if (!cancelled) {
                    setProfile(data);
                    setProfileForm(data);
                }
            } catch (error) {
                if (!cancelled) {
                    if (user) {
                        const fallback: SettingsProfile = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            bio: user.bio || null,
                            bioLong: null,
                            avatarUrl: user.avatarUrl || null,
                            bannerUrl: null,
                            title: null,
                            company: null,
                            location: null,
                            website: null,
                            linkedinUrl: null,
                            twitterUrl: null,
                            youtubeUrl: null,
                            instagramUrl: null,
                            yearsExperience: null,
                            isInfluencer: Boolean(user.isInfluencer),
                            isVerified: false,
                            accountType: 'BASIC',
                            isProfilePublic: true,
                            showPortfolio: false,
                            showStats: false,
                            acceptingFollowers: true,
                            createdAt: new Date().toISOString(),
                        };
                        setProfile(fallback);
                        setProfileForm(fallback);
                    }
                    setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la configuración');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        document.documentElement.lang = preferences.language.startsWith('es') ? 'es' : 'en';
    }, [preferences.language]);

    const updateFormField = <K extends keyof SettingsProfile>(field: K, value: SettingsProfile[K]) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
    };

    const saveProfile = async () => {
        setIsSavingProfile(true);
        setProfileMessage('');
        setErrorMessage('');
        try {
            const payload = {
                username: profileForm.username,
                email: profileForm.email,
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
                yearsExperience: profileForm.yearsExperience,
                isProfilePublic: profileForm.isProfilePublic,
                showPortfolio: profileForm.showPortfolio,
                showStats: profileForm.showStats,
                acceptingFollowers: profileForm.acceptingFollowers,
            };

            const response = await apiFetch('/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || `HTTP ${response.status}`);
            }

            const updated = data as SettingsProfile;
            setProfile(updated);
            setProfileForm(updated);
            updateUser({
                username: updated.username,
                email: updated.email,
                bio: updated.bio || undefined,
                avatarUrl: updated.avatarUrl || undefined,
            });
            setProfileMessage('Configuración de cuenta guardada correctamente.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuración');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const savePreferences = async () => {
        setIsSavingPrefs(true);
        setPrefsMessage('');
        setErrorMessage('');
        try {
            localStorage.setItem(APP_PREFS_KEY, JSON.stringify(preferences));
            setPrefsMessage('Preferencias guardadas en este navegador.');
        } catch {
            setErrorMessage('No se pudieron guardar las preferencias locales');
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const changePassword = async () => {
        setPasswordMessage('');
        setErrorMessage('');

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setErrorMessage('Completá todos los campos de contraseña.');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setErrorMessage('La confirmación de contraseña no coincide.');
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await apiFetch('/users/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || `HTTP ${response.status}`);
            }

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordMessage('Contraseña actualizada correctamente.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-16">
            <div className="rounded-2xl border border-primary/20 bg-card/40 p-6 backdrop-blur-sm">
                <h1 className="text-3xl font-bold">Configuración</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Gestioná tu cuenta, privacidad, preferencias de la app y seguridad.
                </p>
                {accountAge && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Cuenta creada el {accountAge}
                    </p>
                )}
            </div>

            {(errorMessage || profileMessage || prefsMessage || passwordMessage) && (
                <div className="space-y-2">
                    {errorMessage && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {errorMessage}
                        </div>
                    )}
                    {profileMessage && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {profileMessage}
                        </div>
                    )}
                    {prefsMessage && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {prefsMessage}
                        </div>
                    )}
                    {passwordMessage && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {passwordMessage}
                        </div>
                    )}
                </div>
            )}

            <Tabs defaultValue="cuenta" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 p-2 md:grid-cols-4">
                    <TabsTrigger value="cuenta" className="py-2">Cuenta</TabsTrigger>
                    <TabsTrigger value="privacidad" className="py-2">Privacidad</TabsTrigger>
                    <TabsTrigger value="preferencias" className="py-2">Preferencias</TabsTrigger>
                    <TabsTrigger value="seguridad" className="py-2">Seguridad</TabsTrigger>
                </TabsList>

                <TabsContent value="cuenta" className="space-y-6">
                    <Card className="border-border/60 bg-card/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <User className="h-5 w-5 text-primary" />
                                Datos Personales
                            </CardTitle>
                            <CardDescription>
                                Información principal de tu cuenta y perfil público.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Usuario</Label>
                                    <Input
                                        id="username"
                                        value={profileForm.username || ''}
                                        onChange={(e) => updateFormField('username', e.target.value)}
                                        placeholder="Tu nombre de usuario"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileForm.email || ''}
                                        onChange={(e) => updateFormField('email', e.target.value)}
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título profesional</Label>
                                    <Input
                                        id="title"
                                        value={profileForm.title || ''}
                                        onChange={(e) => updateFormField('title', e.target.value)}
                                        placeholder="Ej: Trading Analyst"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company">Compañía</Label>
                                    <Input
                                        id="company"
                                        value={profileForm.company || ''}
                                        onChange={(e) => updateFormField('company', e.target.value)}
                                        placeholder="Empresa"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Ubicación</Label>
                                    <Input
                                        id="location"
                                        value={profileForm.location || ''}
                                        onChange={(e) => updateFormField('location', e.target.value)}
                                        placeholder="Ciudad, país"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="yearsExperience">Años de experiencia</Label>
                                    <Input
                                        id="yearsExperience"
                                        type="number"
                                        min={0}
                                        max={80}
                                        value={profileForm.yearsExperience ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            updateFormField('yearsExperience', value === '' ? null : Number(value));
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">Sitio web</Label>
                                    <Input
                                        id="website"
                                        value={profileForm.website || ''}
                                        onChange={(e) => updateFormField('website', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio corta</Label>
                                <Textarea
                                    id="bio"
                                    rows={3}
                                    value={profileForm.bio || ''}
                                    onChange={(e) => updateFormField('bio', e.target.value)}
                                    placeholder="Resumen breve de tu perfil"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bioLong">Bio extendida</Label>
                                <Textarea
                                    id="bioLong"
                                    rows={5}
                                    value={profileForm.bioLong || ''}
                                    onChange={(e) => updateFormField('bioLong', e.target.value)}
                                    placeholder="Descripción detallada de tu experiencia y enfoque"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl">URL de avatar</Label>
                                    <Input
                                        id="avatarUrl"
                                        value={profileForm.avatarUrl || ''}
                                        onChange={(e) => updateFormField('avatarUrl', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bannerUrl">URL de banner</Label>
                                    <Input
                                        id="bannerUrl"
                                        value={profileForm.bannerUrl || ''}
                                        onChange={(e) => updateFormField('bannerUrl', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="linkedinUrl">LinkedIn</Label>
                                    <Input
                                        id="linkedinUrl"
                                        value={profileForm.linkedinUrl || ''}
                                        onChange={(e) => updateFormField('linkedinUrl', e.target.value)}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitterUrl">X / Twitter</Label>
                                    <Input
                                        id="twitterUrl"
                                        value={profileForm.twitterUrl || ''}
                                        onChange={(e) => updateFormField('twitterUrl', e.target.value)}
                                        placeholder="https://x.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="youtubeUrl">YouTube</Label>
                                    <Input
                                        id="youtubeUrl"
                                        value={profileForm.youtubeUrl || ''}
                                        onChange={(e) => updateFormField('youtubeUrl', e.target.value)}
                                        placeholder="https://youtube.com/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagramUrl">Instagram</Label>
                                    <Input
                                        id="instagramUrl"
                                        value={profileForm.instagramUrl || ''}
                                        onChange={(e) => updateFormField('instagramUrl', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={saveProfile} disabled={isSavingProfile}>
                                    {isSavingProfile ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar Cuenta
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacidad" className="space-y-6">
                    <Card className="border-border/60 bg-card/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Shield className="h-5 w-5 text-primary" />
                                Privacidad y visibilidad
                            </CardTitle>
                            <CardDescription>
                                Definí qué información pública puede ver el resto de usuarios.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">Perfil público</p>
                                        <p className="text-sm text-muted-foreground">
                                            Permite que otros usuarios encuentren y vean tu perfil.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={Boolean(profileForm.isProfilePublic)}
                                        onCheckedChange={(checked) => updateFormField('isProfilePublic', checked)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">Mostrar portfolio</p>
                                        <p className="text-sm text-muted-foreground">
                                            Expone tu composición de cartera en el perfil público.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={Boolean(profileForm.showPortfolio)}
                                        onCheckedChange={(checked) => updateFormField('showPortfolio', checked)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">Mostrar estadísticas</p>
                                        <p className="text-sm text-muted-foreground">
                                            Publica métricas agregadas como rendimiento y riesgo.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={Boolean(profileForm.showStats)}
                                        onCheckedChange={(checked) => updateFormField('showStats', checked)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">Aceptar seguidores</p>
                                        <p className="text-sm text-muted-foreground">
                                            Permite que otros usuarios te sigan para recibir tus publicaciones.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={Boolean(profileForm.acceptingFollowers)}
                                        onCheckedChange={(checked) => updateFormField('acceptingFollowers', checked)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">Tipo: {profile?.accountType || 'BASIC'}</Badge>
                                {profile?.isVerified && <Badge className="bg-emerald-500/15 text-emerald-300">Verificado</Badge>}
                                {profile?.isInfluencer && <Badge className="bg-primary/15 text-primary">Influencer</Badge>}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={saveProfile} disabled={isSavingProfile}>
                                    {isSavingProfile ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar Privacidad
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferencias" className="space-y-6">
                    <Card className="border-border/60 bg-card/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Globe className="h-5 w-5 text-primary" />
                                Preferencias de la aplicación
                            </CardTitle>
                            <CardDescription>
                                Estas preferencias se guardan en este navegador y afectan tu experiencia local.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Idioma de interfaz</Label>
                                    <Select
                                        value={preferences.language}
                                        onValueChange={(value: 'es-AR' | 'en-US') => {
                                            setPreferences((prev) => ({ ...prev, language: value }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es-AR">Español (AR)</SelectItem>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Moneda por defecto</Label>
                                    <Select
                                        value={preferences.currency}
                                        onValueChange={(value: 'USD' | 'ARS' | 'EUR') => {
                                            setPreferences((prev) => ({ ...prev, currency: value }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">Auto refresco de mercado</p>
                                        <p className="text-sm text-muted-foreground">
                                            Mantener los widgets de mercado actualizados automáticamente.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.autoRefreshMarket}
                                        onCheckedChange={(checked) => {
                                            setPreferences((prev) => ({ ...prev, autoRefreshMarket: checked }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">Tablas compactas</p>
                                        <p className="text-sm text-muted-foreground">
                                            Reduce espaciado en tablas para ver más información en pantalla.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.compactTables}
                                        onCheckedChange={(checked) => {
                                            setPreferences((prev) => ({ ...prev, compactTables: checked }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <BellRing className="mt-0.5 h-4 w-4 text-primary" />
                                        <div>
                                            <p className="font-medium">Métricas avanzadas visibles</p>
                                            <p className="text-sm text-muted-foreground">
                                                Muestra indicadores técnicos y métricas extendidas cuando estén disponibles.
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={preferences.showAdvancedMetrics}
                                        onCheckedChange={(checked) => {
                                            setPreferences((prev) => ({ ...prev, showAdvancedMetrics: checked }));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={savePreferences} disabled={isSavingPrefs}>
                                    {isSavingPrefs ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar Preferencias
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seguridad" className="space-y-6">
                    <Card className="border-border/60 bg-card/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Lock className="h-5 w-5 text-primary" />
                                Seguridad de acceso
                            </CardTitle>
                            <CardDescription>
                                Actualizá tu contraseña para proteger tu cuenta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Contraseña actual</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => {
                                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva contraseña</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => {
                                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }));
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => {
                                        setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                                    }}
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Requisito mínimo: 8 caracteres.
                            </p>

                            <div className="flex justify-end">
                                <Button onClick={changePassword} disabled={isChangingPassword}>
                                    {isChangingPassword ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Shield className="mr-2 h-4 w-4" />
                                    )}
                                    Actualizar Contraseña
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
