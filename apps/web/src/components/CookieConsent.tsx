import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ChevronDown, ChevronUp, Shield } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CookiePreferences {
    necessary: boolean;   // Always true, cannot be disabled
    preferences: boolean; // UI preferences (theme, sidebar)
    analytics: boolean; // First-party anonymous site analytics
}

const STORAGE_KEY = 'finix_cookie_consent';
const CONSENT_VERSION = '2';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function loadSavedConsent(): { decided: boolean; prefs: CookiePreferences } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.version !== CONSENT_VERSION) return null;
        const savedAt = Date.parse(parsed.timestamp || '');
        if (!Number.isFinite(savedAt) || Date.now() - savedAt > 365 * 24 * 60 * 60 * 1000) return null;
        return { decided: true, prefs: parsed.prefs };
    } catch {
        return null;
    }
}

function saveConsent(prefs: CookiePreferences) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            prefs,
        }));
        window.dispatchEvent(new Event('finix-consent-updated'));
    } catch {
        // localStorage might be unavailable
    }
}

// ─── Cookie toggle item ────────────────────────────────────────────────────────
function CookieToggle({
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange?: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/75 px-4 py-4 shadow-sm">
            <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground flex items-center gap-2">
                    {label}
                    {disabled && (
                        <span className="text-xs font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                            {" "}<FinixUiText text={"Siempre activo"} />{" "}</span>
                    )}
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            </div>
            <button
                role="switch"
                aria-checked={checked}
                aria-label={`${label}: ${checked ? 'activado' : 'desactivado'}`}
                disabled={disabled}
                onClick={() => !disabled && onChange?.(!checked)}
                className={`relative flex-shrink-0 w-10 h-5.5 rounded-full border transition-all duration-200 ${
                    checked
                        ? 'bg-primary border-primary'
                        : 'bg-muted border-border'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                style={{ minWidth: '2.5rem', height: '1.375rem' }}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        checked ? 'translate-x-[1.125rem]' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
}

// ─── Main Banner ───────────────────────────────────────────────────────────────
export default function CookieConsent() {
    const { ui: finixUi } = useFinixUiTranslation();

    const [visible, setVisible] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [prefs, setPrefs] = useState<CookiePreferences>(() =>
        loadSavedConsent()?.prefs ?? { necessary: true, preferences: true, analytics: false }
    );

    useEffect(() => {
        // Delay slightly so it doesn't flash on first paint
        const t = setTimeout(() => {
            const saved = loadSavedConsent();
            if (!saved) {
                setVisible(true);
            }
        }, 800);
        return () => clearTimeout(t);
    }, []);

    const handleAcceptAll = () => {
        const all: CookiePreferences = { necessary: true, preferences: true, analytics: true };
        saveConsent(all);
        setPrefs(all);
        setVisible(false);
    };

    const handleNecessaryOnly = () => {
        const minimal: CookiePreferences = { necessary: true, preferences: false, analytics: false };
        saveConsent(minimal);
        setPrefs(minimal);
        setVisible(false);
    };

    const handleSaveConfig = () => {
        const selected = { ...prefs, necessary: true };
        saveConsent(selected);
        setPrefs(selected);
        setVisible(false);
    };

    if (!visible) return (
        <button
            type="button"
            onClick={() => { setShowConfig(true); setVisible(true); }}
            className="fixed bottom-20 left-3 z-[998] sm:bottom-3 flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-2 text-[11px] font-medium text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
            aria-label={finixUi("Abrir preferencias de cookies")}
        >
            <Cookie className="h-3.5 w-3.5" />
            <FinixUiText text={"Cookies"} />
        </button>
    );

    return (
        <>
            {/* ── Backdrop (only when config panel open) ── */}
            {showConfig && (
                <div
                    className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowConfig(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Main banner ── */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={finixUi("Preferencias de cookies")}
                className={`fixed z-[999] transition-all duration-500 ${
                    showConfig
                        ? 'inset-0 flex items-end sm:items-center justify-center p-4'
                        : 'bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm'
                }`}
            >
                <div className={`relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl transition-all duration-300 max-h-[calc(100dvh-2rem)] ${showConfig ? 'w-full max-w-2xl overflow-y-auto overscroll-contain' : 'w-full overflow-hidden'}`}>

                    {/* ── Header ── */}
                    <div className="bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-6 text-white sm:p-8">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner">
                                    <Cookie className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white sm:text-xl">{""}<FinixUiText text={"Configuración de cookies"} />{""}</p>
                                    <p className="text-xs text-emerald-50/75">{""}<FinixUiText text={"Finix ·"} />{" "}{new Date().getFullYear()}</p>
                                </div>
                            </div>
                        </div>

                        <p className="mb-1 text-base leading-relaxed text-emerald-50/90">
                            {" "}<FinixUiText text={"Usamos almacenamiento local necesario para el funcionamiento de Finix. La analítica anónima es opcional y solo se activa si la aceptás."} />{""}{' '}
                            <Link to="/cookies" className="font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white" tabIndex={0}>
                                {" "}<FinixUiText text={"Política de Cookies"} />{" "}</Link>
                        </p>
                    </div>

                    {/* ── Config panel (expandable) ── */}
                    {showConfig && (
                        <div className="space-y-3 px-5 pb-2 pt-5 sm:px-7">
                            <p className="mb-3 flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
                                <Shield className="w-3.5 h-3.5 text-primary" />
                                {" "}<FinixUiText text={"Personalizar preferencias"} />{" "}</p>
                            <div className="space-y-2">
                                <CookieToggle
                                    label="Estrictamente necesario"
                                    description="Autenticación de sesión y funcionamiento básico de la plataforma. No puede deshabilitarse."
                                    checked={true}
                                    disabled={true}
                                />
                                <CookieToggle
                                    label="Preferencias de interfaz"
                                    description="Recuerda tu tema preferido (oscuro/claro), configuración del sidebar y otras preferencias visuales."
                                    checked={prefs.preferences}
                                    onChange={v => setPrefs(p => ({ ...p, preferences: v }))}
                                />
                                <CookieToggle
                                    label="Analítica anónima"
                                    description="Mide visitas, páginas consultadas y tiempo visible para mejorar Finix. Usa un identificador aleatorio propio; no guarda IP, nombre ni contenido."
                                    checked={prefs.analytics}
                                    onChange={v => setPrefs(p => ({ ...p, analytics: v }))}
                                />
                            </div>
                            <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">{""}<FinixUiText text={"Nota:"} />{""}</strong> {" "}<FinixUiText text={"La analítica propia es anónima y opcional. Finix no usa cookies de publicidad ni rastreo entre sitios. TradingView puede establecer sus propias cookies según sus políticas."} />{" "}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Action buttons ── */}
                    <div className={`p-5 sm:px-6 ${showConfig ? 'pt-4' : 'pt-3'}`}>
                        {!showConfig ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={handleAcceptAll}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
                                >
                                    {" "}<FinixUiText text={"Aceptar todas"} />{" "}</button>
                                <button
                                    onClick={() => setShowConfig(true)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground border border-border/60 text-sm font-semibold hover:bg-muted/80 transition-all flex items-center justify-center gap-1"
                                >
                                    {" "}<FinixUiText text={"Configurar"} />{" "}<ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleNecessaryOnly}
                                    className="flex-1 px-4 py-3 rounded-xl border border-border/60 text-muted-foreground text-sm font-semibold hover:text-foreground hover:border-border transition-all"
                                >
                                    {" "}<FinixUiText text={"Solo necesarias"} />{" "}</button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={handleSaveConfig}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
                                >
                                    {" "}<FinixUiText text={"Guardar preferencias"} />{" "}</button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border/60 text-foreground text-sm font-semibold hover:bg-muted/80 transition-all"
                                >
                                    {" "}<FinixUiText text={"Aceptar todas"} />{" "}</button>
                                <button
                                    onClick={() => setShowConfig(false)}
                                    aria-label={finixUi("Cerrar configuración")}
                                    className="sm:flex-none px-4 py-3 rounded-xl border border-border/60 text-muted-foreground text-sm hover:text-foreground transition-all flex items-center gap-1"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                    <span className="sm:hidden">{""}<FinixUiText text={"Volver"} />{""}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Hook to access consent preferences ───────────────────────────────────────
export function useCookieConsent(): CookiePreferences {
    const saved = loadSavedConsent();
    return saved?.prefs ?? { necessary: true, preferences: true, analytics: false };
}
