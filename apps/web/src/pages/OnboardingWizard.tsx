import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AvatarUpload from '@/components/AvatarUpload';
import BackButton from '@/components/BackButton';
import LocationQuickSelect from '@/components/LocationQuickSelect';
import {
    CheckCircle2,
    ChevronRight,
    Sparkles,
    User,
    Shield,
    Globe,
    Wallet,
    Rocket,
    Loader2,
    SkipForward,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingData {
    // Step 2: Profile
    bio: string;
    location: string;
    avatarUrl: string;
    // Step 3: Privacy
    isProfilePublic: boolean;
    acceptingFollowers: boolean;
    showPortfolio: boolean;
    showStats: boolean;
    // Step 4: Preferences
    language: string;
    currency: string;
    autoRefreshMarket: boolean;
    compactTables: boolean;
    showAdvancedMetrics: boolean;
    // Step 5: Portfolio
    portfolioName: string;
    portfolioCurrency: string;
}

const STEPS = [
    { id: 0, title: 'Bienvenido a Finix', icon: Sparkles, optional: false },
    { id: 1, title: 'Tu Perfil', icon: User, optional: false },
    { id: 2, title: 'Privacidad', icon: Shield, optional: true },
    { id: 3, title: 'Preferencias', icon: Globe, optional: true },
    { id: 4, title: 'Primer Portafolio', icon: Wallet, optional: true },
    { id: 5, title: '¡Listo!', icon: Rocket, optional: false },
];

// ─── Toggle Row ───────────────────────────────────────────────────────────────

const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) => (
    <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${disabled ? 'border-border/30 opacity-50' : 'border-border/60 bg-card/30 hover:border-primary/30'}`}>
        <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
    <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
            <span>Paso {current + 1} de {total}</span>
            <span>{Math.round(((current + 1) / total) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${((current + 1) / total) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
        </div>
        <div className="flex gap-1.5 justify-center">
            {STEPS.map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i <= current ? 'bg-primary w-6' : 'bg-secondary w-3'}`}
                />
            ))}
        </div>
    </div>
);

// ─── Step Components ──────────────────────────────────────────────────────────

const StepWelcome = ({ username }: { username: string }) => (
    <div className="text-center space-y-6 py-4">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-400/20 border border-primary/30 flex items-center justify-center"
        >
            <img src="/logo.png" alt="Finix" className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
        </motion.div>

        <div className="space-y-3">
            <h2 className="text-2xl font-heading font-bold">
                ¡Hola, <span className="text-primary">{username}</span>! 👋
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Te damos la bienvenida a <strong>Finix</strong>, la red social financiera.
                En 2 minutos vas a configurar tu perfil y estar listo para invertir mejor.
            </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[
                { emoji: '📊', label: 'Portafolio' },
                { emoji: '💬', label: 'Comunidad' },
                { emoji: '🌐', label: 'Mercado' },
            ].map(({ emoji, label }) => (
                <div key={label} className="rounded-xl border border-border/50 bg-card/30 p-3 text-center">
                    <div className="text-2xl mb-1">{emoji}</div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            ))}
        </div>
    </div>
);

const StepProfile = ({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (key: keyof OnboardingData, value: any) => void;
}) => (
    <div className="space-y-4">
        <div className="flex justify-center">
            <AvatarUpload
                currentUrl={data.avatarUrl || null}
                onUploaded={(url) => onChange('avatarUrl', url)}
                size="lg"
            />
        </div>

        <div className="space-y-2">
            <Label htmlFor="ob-bio">Bio corta</Label>
            <Textarea
                id="ob-bio"
                rows={3}
                placeholder="Ej: Inversor en tecnología y criptomonedas. Apasionado por el análisis fundamental."
                value={data.bio}
                onChange={(e) => onChange('bio', e.target.value)}
                maxLength={300}
                className="bg-secondary/30 border-border/50 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{data.bio.length}/300</p>
        </div>

        <div className="space-y-2">
            <Label htmlFor="ob-location">Ciudad / País (opcional)</Label>
            <LocationQuickSelect
                id="ob-location"
                placeholder="Ej: Buenos Aires, Argentina"
                value={data.location}
                onChange={(value) => onChange('location', value)}
                className="bg-secondary/30 border-border/50"
            />
        </div>
    </div>
);

const StepPrivacy = ({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (key: keyof OnboardingData, value: any) => void;
}) => (
    <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
            Podés cambiar estas opciones en cualquier momento desde Configuración.
        </p>

        <ToggleRow
            label="Perfil público"
            description="Permite que otros usuarios encuentren y vean tu perfil."
            checked={data.isProfilePublic}
            onChange={(v) => {
                onChange('isProfilePublic', v);
                if (!v) {
                    onChange('showPortfolio', false);
                    onChange('showStats', false);
                }
            }}
        />
        <ToggleRow
            label="Aceptar seguidores"
            description="Permite que otros usuarios te sigan."
            checked={data.acceptingFollowers}
            onChange={(v) => onChange('acceptingFollowers', v)}
        />
        <ToggleRow
            label="Mostrar portafolio"
            description="Expone tu composición de cartera en el perfil público."
            checked={data.showPortfolio}
            onChange={(v) => onChange('showPortfolio', v)}
            disabled={!data.isProfilePublic}
        />
        <ToggleRow
            label="Mostrar estadísticas"
            description="Publica métricas como rendimiento y riesgo."
            checked={data.showStats}
            onChange={(v) => onChange('showStats', v)}
            disabled={!data.isProfilePublic}
        />
    </div>
);

const StepPreferences = ({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (key: keyof OnboardingData, value: any) => void;
}) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={data.language} onValueChange={(v) => onChange('language', v)}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="es-AR">Español (AR)</SelectItem>
                        <SelectItem value="en-US">Ingles (EE. UU.)</SelectItem>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={data.currency} onValueChange={(v) => onChange('currency', v)}>
                    <SelectTrigger className="bg-secondary/30 border-border/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD – Dólar</SelectItem>
                        <SelectItem value="ARS">ARS – Peso AR</SelectItem>
                        <SelectItem value="EUR">EUR – Euro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <ToggleRow
            label="Auto refresco de mercado"
            description="Mantener los widgets de mercado actualizados automáticamente."
            checked={data.autoRefreshMarket}
            onChange={(v) => onChange('autoRefreshMarket', v)}
        />
    </div>
);

const StepPortfolio = ({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (key: keyof OnboardingData, value: any) => void;
}) => (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            Creá tu primer portafolio para empezar a trackear tus inversiones. Podés saltear este paso.
        </p>

        <div className="space-y-2">
            <Label htmlFor="ob-portfolio-name">Nombre del portafolio</Label>
            <Input
                id="ob-portfolio-name"
                placeholder="Ej: Mi Portafolio Principal"
                value={data.portfolioName}
                onChange={(e) => onChange('portfolioName', e.target.value)}
                className="bg-secondary/30 border-border/50"
            />
        </div>

        <div className="space-y-2">
            <Label>Moneda base</Label>
            <Select value={data.portfolioCurrency} onValueChange={(v) => onChange('portfolioCurrency', v)}>
                <SelectTrigger className="bg-secondary/30 border-border/50">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="USD">USD – Dólar</SelectItem>
                    <SelectItem value="ARS">ARS – Peso AR</SelectItem>
                    <SelectItem value="EUR">EUR – Euro</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            💡 Podés agregar activos a tu portafolio desde la sección <strong className="text-foreground">Portafolio</strong> una vez que ingreses.
        </div>
    </div>
);

const StepDone = ({ username }: { username: string }) => (
    <div className="text-center space-y-6 py-4">
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]"
        >
            <CheckCircle2 className="w-12 h-12 text-black" />
        </motion.div>

        <div className="space-y-3">
            <h2 className="text-2xl font-heading font-bold">
                ¡Todo listo, <span className="text-primary">{username}</span>!
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Tu cuenta esta configurada. Ahora podes explorar la actividad, gestionar tu portafolio y conectar con otros inversores.
            </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-left">
            {[
                { emoji: '📊', title: 'Resumen', desc: 'Tu resumen financiero' },
                { emoji: '💼', title: 'Portafolio', desc: 'Tus inversiones' },
                { emoji: '🌐', title: 'Mercados', desc: 'Datos en tiempo real' },
                { emoji: '💬', title: 'Comunidad', desc: 'Ideas de inversion' },
            ].map(({ emoji, title, desc }) => (
                <div key={title} className="rounded-xl border border-border/50 bg-card/30 p-3">
                    <div className="text-xl mb-1">{emoji}</div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
            ))}
        </div>
    </div>
);

// ─── Main Onboarding Component ────────────────────────────────────────────────

export default function OnboardingWizard() {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [data, setData] = useState<OnboardingData>({
        bio: '',
        location: '',
        avatarUrl: '',
        isProfilePublic: true,
        acceptingFollowers: true,
        showPortfolio: false,
        showStats: false,
        language: 'es-AR',
        currency: 'USD',
        autoRefreshMarket: true,
        compactTables: false,
        showAdvancedMetrics: false,
        portfolioName: '',
        portfolioCurrency: 'USD',
    });

    const handleChange = useCallback((key: keyof OnboardingData, value: any) => {
        setData((prev) => ({ ...prev, [key]: value }));
    }, []);

    const saveStep = async (step: number, completed = false) => {
        setIsSaving(true);
        setSaveError('');
        try {
            const payload: any = { step, completed };

            if (step >= 1) {
                payload.bio = data.bio;
                payload.location = data.location;
                payload.avatarUrl = data.avatarUrl;
            }
            if (step >= 2) {
                // Privacy saved via /me/privacy
                await apiFetch('/me/privacy', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        isProfilePublic: data.isProfilePublic,
                        acceptingFollowers: data.acceptingFollowers,
                        showPortfolio: data.showPortfolio,
                        showStats: data.showStats,
                    }),
                });
            }
            if (step >= 3) {
                await apiFetch('/me/preferences', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: data.language,
                        currency: data.currency,
                        autoRefreshMarket: data.autoRefreshMarket,
                        compactTables: data.compactTables,
                        showAdvancedMetrics: data.showAdvancedMetrics,
                    }),
                });
            }
            if (step >= 4 && data.portfolioName) {
                payload.portfolioName = data.portfolioName;
                payload.portfolioCurrency = data.portfolioCurrency;
            }

            await apiFetch('/me/onboarding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (completed) {
                updateUser({ onboardingCompleted: true } as any);
            }
        } catch {
            setSaveError('No se pudo guardar. Reintentando...');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = async () => {
        await saveStep(currentStep + 1);
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((s) => s + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep((s) => s - 1);
    };

    const handleSkip = async () => {
        await saveStep(currentStep + 1);
        setCurrentStep((s) => s + 1);
    };

    const handleFinish = async () => {
        await saveStep(STEPS.length - 1, true);
        navigate('/dashboard');
    };

    const isLastStep = currentStep === STEPS.length - 1;
    const step = STEPS[currentStep];
    const StepIcon = step.icon;

    return (
        <div className="min-h-screen finix-unified-bg flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-400/5 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-lg"
            >
                {/* Card */}
                <div className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border/30">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <StepIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-heading font-bold text-lg leading-tight">{step.title}</h1>
                                <p className="text-xs text-muted-foreground">Configuración de cuenta</p>
                            </div>
                            <div className="ml-auto">
                                <img src="/logo.png" alt="Finix" className="h-7 w-7 object-contain opacity-60" />
                            </div>
                        </div>
                        <ProgressBar current={currentStep} total={STEPS.length} />
                    </div>

                    {/* Step Content */}
                    <div className="px-8 py-6 min-h-[320px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                {currentStep === 0 && <StepWelcome username={user?.username || 'Inversor'} />}
                                {currentStep === 1 && <StepProfile data={data} onChange={handleChange} />}
                                {currentStep === 2 && <StepPrivacy data={data} onChange={handleChange} />}
                                {currentStep === 3 && <StepPreferences data={data} onChange={handleChange} />}
                                {currentStep === 4 && <StepPortfolio data={data} onChange={handleChange} />}
                                {currentStep === 5 && <StepDone username={user?.username || 'Inversor'} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-8 pb-8 pt-4 border-t border-border/30 space-y-3">
                        {saveError && (
                            <p className="text-xs text-red-400 text-center">{saveError}</p>
                        )}

                        <div className="flex items-center gap-3">
                            {currentStep > 0 && !isLastStep && (
                                <BackButton
                                    onClick={handleBack}
                                    disabled={isSaving}
                                    label="Volver"
                                />
                            )}

                            <div className="flex-1" />

                            {step.optional && !isLastStep && (
                                <Button
                                    variant="ghost"
                                    onClick={handleSkip}
                                    disabled={isSaving}
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                    Saltar
                                </Button>
                            )}

                            {isLastStep ? (
                                <Button
                                    onClick={handleFinish}
                                    disabled={isSaving}
                                    size="lg"
                                    className="bg-gradient-to-r from-primary to-emerald-400 text-black font-bold px-8 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Rocket className="w-4 h-4 mr-2" />
                                    )}
                                    Ir a Finix
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 px-6"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Avanzar
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
