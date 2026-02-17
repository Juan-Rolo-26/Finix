import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
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
import { useTranslation } from '@/i18n';

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

export default function Settings() {
    const t = useTranslation();
    const { user, updateUser } = useAuthStore();
    const preferences = usePreferencesStore();
    const { setLanguage, setCurrency, toggleAutoRefresh, toggleCompactTables, toggleAdvancedMetrics } = preferences;

    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [profile, setProfile] = useState<SettingsProfile | null>(null);
    const [profileForm, setProfileForm] = useState<Partial<SettingsProfile>>({});

    const [profileMessage, setProfileMessage] = useState('');
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
        return date.toLocaleDateString(preferences.language, { year: 'numeric', month: 'long', day: 'numeric' });
    }, [profile?.createdAt, preferences.language]);

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
        document.documentElement.lang = preferences.language.startsWith('es') ? 'es' : (preferences.language.startsWith('pt') ? 'pt' : 'en');
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
                <h1 className="text-3xl font-bold">{t.settings.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t.settings.subtitle}
                </p>
                {accountAge && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Cuenta creada el {accountAge}
                    </p>
                )}
            </div>

            {(errorMessage || profileMessage || passwordMessage) && (
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
                    {passwordMessage && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {passwordMessage}
                        </div>
                    )}
                </div>
            )}

            <Tabs defaultValue="cuenta" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 p-2 md:grid-cols-4">
                    <TabsTrigger value="cuenta" className="py-2">{t.settings.tabs.account}</TabsTrigger>
                    <TabsTrigger value="privacidad" className="py-2">{t.settings.tabs.privacy}</TabsTrigger>
                    <TabsTrigger value="preferencias" className="py-2">{t.settings.tabs.preferences}</TabsTrigger>
                    <TabsTrigger value="seguridad" className="py-2">{t.settings.tabs.security}</TabsTrigger>
                </TabsList>

                <TabsContent value="cuenta" className="space-y-6">
                    <Card className="border-border/60 bg-card/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <User className="h-5 w-5 text-primary" />
                                {t.settings.tabs.account}
                            </CardTitle>
                            <CardDescription>
                                {t.settings.account.subtitle}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="username">{t.settings.account.username}</Label>
                                    <Input
                                        id="username"
                                        value={profileForm.username || ''}
                                        onChange={(e) => updateFormField('username', e.target.value)}
                                        placeholder={t.settings.account.usernamePlaceholder}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t.settings.account.email}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileForm.email || ''}
                                        onChange={(e) => updateFormField('email', e.target.value)}
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>
                            {/* Rest of profile form ... I'm keeping hardcoded labels for brevity but file structure is fixed */}

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="title">{t.settings.account.titleProf}</Label>
                                    <Input
                                        id="title"
                                        value={profileForm.title || ''}
                                        onChange={(e) => updateFormField('title', e.target.value)}
                                        placeholder={t.settings.account.titlePlaceholder}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company">{t.settings.account.company}</Label>
                                    <Input
                                        id="company"
                                        value={profileForm.company || ''}
                                        onChange={(e) => updateFormField('company', e.target.value)}
                                        placeholder={t.settings.account.company}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">{t.settings.account.location}</Label>
                                    <Input
                                        id="location"
                                        value={profileForm.location || ''}
                                        onChange={(e) => updateFormField('location', e.target.value)}
                                        placeholder={t.settings.account.location}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="yearsExperience">{t.settings.account.yearsExp}</Label>
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
                                    <Label htmlFor="website">{t.settings.account.website}</Label>
                                    <Input
                                        id="website"
                                        value={profileForm.website || ''}
                                        onChange={(e) => updateFormField('website', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">{t.settings.account.bioShort}</Label>
                                <Textarea
                                    id="bio"
                                    rows={3}
                                    value={profileForm.bio || ''}
                                    onChange={(e) => updateFormField('bio', e.target.value)}
                                    placeholder={t.settings.account.bioShort}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bioLong">{t.settings.account.bioLong}</Label>
                                <Textarea
                                    id="bioLong"
                                    rows={5}
                                    value={profileForm.bioLong || ''}
                                    onChange={(e) => updateFormField('bioLong', e.target.value)}
                                    placeholder={t.settings.account.bioLong}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl">{t.settings.account.avatarUrl}</Label>
                                    <Input
                                        id="avatarUrl"
                                        value={profileForm.avatarUrl || ''}
                                        onChange={(e) => updateFormField('avatarUrl', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bannerUrl">{t.settings.account.bannerUrl}</Label>
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
                                    {t.settings.account.saveBtn}
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
                                {t.settings.tabs.privacy}
                            </CardTitle>
                            <CardDescription>
                                {t.settings.privacy.subtitle}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">{t.settings.privacy.publicProfile}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.settings.privacy.publicProfileDesc}
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
                                        <p className="font-medium">{t.settings.privacy.showPortfolio}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.settings.privacy.showPortfolioDesc}
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
                                        <p className="font-medium">{t.settings.privacy.showStats}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.settings.privacy.showStatsDesc}
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
                                        <p className="font-medium">{t.settings.privacy.acceptFollowers}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.settings.privacy.acceptFollowersDesc}
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
                                    {t.settings.privacy.saveBtn}
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
                                {t.settings.tabs.preferences}
                            </CardTitle>
                            <CardDescription>
                                Estas preferencias se guardan automáticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t.settings.language}</Label>
                                    <Select
                                        value={preferences.language}
                                        onValueChange={(value: any) => setLanguage(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es-AR">Español (AR)</SelectItem>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                            <SelectItem value="pt-BR">Português (BR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.settings.currency}</Label>
                                    <Select
                                        value={preferences.currency}
                                        onValueChange={(value: any) => setCurrency(value)}
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
                                        <p className="font-medium">{t.settings.preferences.autoRefresh}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.settings.preferences.autoRefreshDesc}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.autoRefreshMarket}
                                        onCheckedChange={toggleAutoRefresh}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">{t.settings.preferences.compactTables}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t.settings.preferences.compactTablesDesc}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.compactTables}
                                        onCheckedChange={toggleCompactTables}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <BellRing className="mt-0.5 h-4 w-4 text-primary" />
                                        <div>
                                            <p className="font-medium">{t.settings.preferences.advancedMetrics}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t.settings.preferences.advancedMetricsDesc}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={preferences.showAdvancedMetrics}
                                        onCheckedChange={toggleAdvancedMetrics}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="seguridad" className="space-y-6">
                    <Card className="border-border/60 bg-card/40">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Lock className="h-5 w-5 text-primary" />
                                {t.settings.tabs.security}
                            </CardTitle>
                            <CardDescription>
                                {t.settings.security.subtitle}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">{t.settings.security.currentPwd}</Label>
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
                                <Label htmlFor="newPassword">{t.settings.security.newPwd}</Label>
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
                                <Label htmlFor="confirmPassword">{t.settings.security.confirmPwd}</Label>
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
                                {t.settings.security.minChars}
                            </p>

                            <div className="flex justify-end">
                                <Button onClick={changePassword} disabled={isChangingPassword}>
                                    {isChangingPassword ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Shield className="mr-2 h-4 w-4" />
                                    )}
                                    {t.settings.security.updateBtn}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
