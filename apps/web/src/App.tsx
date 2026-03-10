import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import PortfolioPage from './pages/Portfolio';
import { useAuthStore } from './stores/authStore';
import { usePreferencesStore } from './stores/preferencesStore';
import { supabase } from './lib/supabase';

import InfoPage from './pages/InfoPage';
import OnboardingWizard from './pages/OnboardingWizard';

import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import ResponsibleUse from './pages/legal/ResponsibleUse';
import About from './pages/About';
import Help from './pages/Help';
import Markets from './pages/Markets';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

import Explore from './pages/Explore';
import Messages from './pages/Messages';
import PostDetail from './pages/PostDetail';
import DashboardLayout from './layouts/DashboardLayout';

// ─── Theme Applier ────────────────────────────────────────────────────────────

function ThemeApplier() {
    const { theme } = usePreferencesStore();

    useEffect(() => {
        const root = document.documentElement;
        const resolveTheme = () => {
            if (theme === 'system') {
                return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            }
            return theme;
        };

        const apply = () => {
            const resolved = resolveTheme();
            if (resolved === 'light') {
                root.classList.add('light');
            } else {
                root.classList.remove('light');
            }
        };

        apply();

        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: light)');
            mq.addEventListener('change', apply);
            return () => mq.removeEventListener('change', apply);
        }
    }, [theme]);

    return null;
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

function RequireOnboarding({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuthStore();
    if (!token) return <Navigate to="/" replace />;
    if (user && (user as any).onboardingCompleted === false) {
        return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
    const { token, user, syncFromSession } = useAuthStore();

    // Restore session on app load and keep token in sync
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'TOKEN_REFRESHED' && session) {
                localStorage.setItem('token', session.access_token);
                useAuthStore.setState({ token: session.access_token });
            }
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                useAuthStore.setState({ token: null, user: null });
            }
        });

        // On first load, sync user from existing Supabase session
        syncFromSession();

        return () => subscription.unsubscribe();
    }, []);

    const onboardingCompleted = !user || (user as any).onboardingCompleted !== false;

    return (
        <>
            <ThemeApplier />
            <Routes>
                {/* Root: auth page. If logged in → onboarding or dashboard */}
                <Route
                    path="/"
                    element={
                        !token
                            ? <AuthPage />
                            : onboardingCompleted
                                ? <Navigate to="/dashboard" replace />
                                : <Navigate to="/onboarding" replace />
                    }
                />

                {/* Supabase auth callback (email verification + OAuth) */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Legacy routes now fold back into the main auth screen */}
                <Route path="/verify-email" element={<Navigate to="/" replace />} />
                <Route path="/reset-password" element={<Navigate to="/" replace />} />

                {/* Onboarding wizard (requires auth, skips if already completed) */}
                <Route
                    path="/onboarding"
                    element={
                        !token
                            ? <Navigate to="/" replace />
                            : onboardingCompleted
                                ? <Navigate to="/dashboard" replace />
                                : <OnboardingWizard />
                    }
                />

                {/* Info page: simple info with back button, no landing */}
                <Route path="/info" element={<InfoPage />} />
                <Route path="/info/:section" element={<InfoPage />} />

                {/* Protected Routes (require auth + completed onboarding) */}
                <Route
                    element={
                        <RequireOnboarding>
                            <DashboardLayout />
                        </RequireOnboarding>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route path="/market" element={<Markets />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/posts/:id" element={<PostDetail />} />
                    <Route path="/messages" element={<Messages />} />
                </Route>

                {/* Info & Legal Routes */}
                <Route path="/about" element={<About />} />
                <Route path="/help" element={<Help />} />
                <Route path="/legal/privacy" element={<Privacy />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/legal/terms" element={<Terms />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/legal/responsible" element={<ResponsibleUse />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
