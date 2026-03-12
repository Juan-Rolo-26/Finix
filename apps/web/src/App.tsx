import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { usePreferencesStore } from './stores/preferencesStore';
import { supabase } from './lib/supabase';
import DashboardLayout from './layouts/DashboardLayout';

// ─── Lazy Loaded Pages ────────────────────────────────────────────────────────
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PortfolioPage = lazy(() => import('./pages/Portfolio'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const ResponsibleUse = lazy(() => import('./pages/legal/ResponsibleUse'));
const About = lazy(() => import('./pages/About'));
const Help = lazy(() => import('./pages/Help'));
const Markets = lazy(() => import('./pages/Markets'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Explore = lazy(() => import('./pages/Explore'));
const Messages = lazy(() => import('./pages/Messages'));
const PostDetail = lazy(() => import('./pages/PostDetail'));

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
            <Suspense
                fallback={
                    <div className="flex h-screen w-screen items-center justify-center bg-background">
                        <div
                            className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"
                            role="status"
                            aria-label="Cargando"
                        />
                    </div>
                }
            >
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

                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

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
            </Suspense>
        </>
    );
}
