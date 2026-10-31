// ─── Types ─────────────────────────────────────────────────────────────────────
export interface CookiePreferences {
    necessary: boolean;   // Always true, cannot be disabled
    preferences: boolean; // UI preferences (theme, sidebar)
    analytics: boolean;   // Optional first-party site analytics
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
        if (!Number.isFinite(savedAt) || !parsed.prefs) return null;
        return {
            decided: true,
            prefs: {
                necessary: true,
                preferences: parsed.prefs.preferences === true,
                analytics: parsed.prefs.analytics === true,
            },
        };
    } catch {
        return null;
    }
}

export function saveCookieConsent(customPrefs?: Partial<CookiePreferences>) {
    saveConsent({
        necessary: true,
        preferences: true,
        analytics: true,
        ...customPrefs,
    });
}

function saveConsent(prefs: CookiePreferences) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: CONSENT_VERSION,
                timestamp: new Date().toISOString(),
                prefs,
            })
        );
        window.dispatchEvent(new Event('finix-consent-updated'));
    } catch {
        // localStorage might be unavailable
    }
}

// ─── Main Banner (Cartel eliminado; el consentimiento se gestiona al registrarse/iniciar sesión) ──
export default function CookieConsent() {
    return null;
}

// ─── Hook to access consent preferences ───────────────────────────────────────
export function useCookieConsent(): CookiePreferences {
    const saved = loadSavedConsent();
    return saved?.prefs ?? { necessary: true, preferences: true, analytics: false };
}
