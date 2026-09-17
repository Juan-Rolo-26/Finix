import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ChevronDown, ChevronUp, Shield } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CookiePreferences {
    necessary: boolean;   // Always true, cannot be disabled
    preferences: boolean; // UI preferences (theme, sidebar)
}

const STORAGE_KEY = 'finix_cookie_consent';
const CONSENT_VERSION = '1';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function loadSavedConsent(): { decided: boolean; prefs: CookiePreferences } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.version !== CONSENT_VERSION) return null;
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
        <div className="flex items-start justify-between gap-4 py-3 border-b border-border/30 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {label}
                    {disabled && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                            Siempre activo
                        </span>
                    )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
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
    const [visible, setVisible] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [prefs, setPrefs] = useState<CookiePreferences>({
        necessary: true,
        preferences: true,
    });

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
        const all: CookiePreferences = { necessary: true, preferences: true };
        saveConsent(all);
        setVisible(false);
    };

    const handleNecessaryOnly = () => {
        const minimal: CookiePreferences = { necessary: true, preferences: false };
        saveConsent(minimal);
        setVisible(false);
    };

    const handleSaveConfig = () => {
        saveConsent({ ...prefs, necessary: true });
        setVisible(false);
    };

    if (!visible) return null;

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
                aria-label="Preferencias de cookies"
                className={`fixed z-[999] transition-all duration-500 ${
                    showConfig
                        ? 'inset-0 flex items-end sm:items-center justify-center p-4'
                        : 'bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm'
                }`}
            >
                <div className={`relative bg-card border border-border/60 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${showConfig ? 'w-full max-w-md' : 'w-full'}`}>

                    {/* ── Header ── */}
                    <div className="p-5 pb-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                    <Cookie className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Configuración de cookies</p>
                                    <p className="text-[10px] text-muted-foreground">Finix · {new Date().getFullYear()}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                            Usamos almacenamiento local necesario para que Finix funcione correctamente. No usamos cookies de publicidad ni rastreo.{' '}
                            <Link to="/cookies" className="text-primary hover:underline" tabIndex={0}>
                                Política de Cookies
                            </Link>
                        </p>
                    </div>

                    {/* ── Config panel (expandable) ── */}
                    {showConfig && (
                        <div className="px-5 mt-4 border-t border-border/40 pt-4">
                            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-primary" />
                                Personalizar preferencias
                            </p>
                            <div className="space-y-0">
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
                            </div>
                            <div className="mt-1 p-3 rounded-xl bg-muted/20 border border-border/30">
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">Nota:</strong> Finix no utiliza cookies de analítica, publicidad ni rastreo de terceros. TradingView (widgets de gráficos) puede establecer sus propias cookies según sus políticas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Action buttons ── */}
                    <div className={`p-4 ${showConfig ? 'pt-3' : 'pt-3'}`}>
                        {!showConfig ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={handleAcceptAll}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
                                >
                                    Aceptar todas
                                </button>
                                <button
                                    onClick={() => setShowConfig(true)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-foreground border border-border/60 text-xs font-semibold hover:bg-muted/80 transition-all flex items-center justify-center gap-1"
                                >
                                    Configurar
                                    <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={handleNecessaryOnly}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-border/60 text-muted-foreground text-xs font-semibold hover:text-foreground hover:border-border transition-all"
                                >
                                    Solo necesarias
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={handleSaveConfig}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
                                >
                                    Guardar preferencias
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border/60 text-foreground text-xs font-semibold hover:bg-muted/80 transition-all"
                                >
                                    Aceptar todas
                                </button>
                                <button
                                    onClick={() => setShowConfig(false)}
                                    aria-label="Cerrar configuración"
                                    className="sm:flex-none px-3 py-2.5 rounded-xl border border-border/60 text-muted-foreground text-xs hover:text-foreground transition-all flex items-center gap-1"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                    <span className="sm:hidden">Volver</span>
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
    return saved?.prefs ?? { necessary: true, preferences: true };
}
