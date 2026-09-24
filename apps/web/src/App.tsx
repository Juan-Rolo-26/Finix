import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { setAccessToken } from './lib/api';
import { usePreferencesStore } from './stores/preferencesStore';
import { supabase } from './lib/supabase';
import DashboardLayout from './layouts/DashboardLayout';
import InstallBanner from './components/InstallBanner';
import CookieConsent from './components/CookieConsent';

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
const Cookies = lazy(() => import('./pages/legal/Cookies'));
const About = lazy(() => import('./pages/About'));
const Help = lazy(() => import('./pages/Help'));
const Markets = lazy(() => import('./pages/Markets'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const ProUpgrade = lazy(() => import('./pages/ProUpgrade'));
const Explore = lazy(() => import('./pages/Explore'));
const Messages = lazy(() => import('./pages/Messages'));
const Comunidades = lazy(() => import('./pages/Comunidades'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const CommunityCreate = lazy(() => import('./pages/CommunityCreate'));
const CommunityAdmin = lazy(() => import('./pages/CommunityAdmin'));
const NewsPage = lazy(() => import('./pages/News'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const Pricing = lazy(() => import('./pages/Pricing'));
const AnalysisPage = lazy(() => import('./pages/Analysis'));
const TopGainersPage = lazy(() => import('./pages/TopGainersPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CreatorPage = lazy(() => import('./pages/CreatorPage'));

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
            const resolved = resolveTheme() || 'light';
            if (resolved === 'light') {
                root.classList.add('light');
                root.classList.remove('dark');
            } else {
                root.classList.add('dark');
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
    if (!token && !user) return <Navigate to="/" replace />;
    // Guard removed: users who skipped onboarding can use the app and edit from profile
    return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
    const { token, user, syncFromSession } = useAuthStore();

    // Restore session on app load and keep token in sync
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'TOKEN_REFRESHED' && session) {
                setAccessToken(session.access_token);
                useAuthStore.setState({ token: session.access_token });
            }
            if (event === 'SIGNED_OUT') {
                setAccessToken(null);
                localStorage.removeItem('user');
                useAuthStore.setState({ token: null, user: null });
            }
        });

        // On first load, sync user from existing Supabase session
        syncFromSession();

        return () => subscription.unsubscribe();
    }, []);

    return (
        <>
            <InstallBanner />
            <CookieConsent />
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
                    {/* Root route: Login/Registration. If logged in → dashboard */}
                    <Route
                        path="/"
                        element={
                            !token && !user
                                ? <AuthPage />
                                : <Navigate to="/dashboard" replace />
                        }
                    />

                    <Route
                        path="/auth"
                        element={<Navigate to="/" replace />}
                    />

                    {/* Supabase auth callback (email verification + OAuth) */}
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Onboarding wizard (requires auth) */}
                    <Route
                        path="/onboarding"
                        element={
                            !token && !user
                                ? <Navigate to="/" replace />
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
                        <Route path="/mercado/mejores-rendimientos" element={<TopGainersPage />} />
                        <Route path="/market/top-gainers" element={<TopGainersPage />} />
                        <Route path="/calendario" element={<CalendarPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:username" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/plan" element={<ProUpgrade />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/comunidades" element={<Comunidades />} />
                        <Route path="/comunidades/crear" element={<CommunityCreate />} />
                        <Route path="/comunidades/:id" element={<CommunityDetail />} />
                        <Route path="/comunidades/:id/admin" element={<CommunityAdmin />} />
                        <Route path="/comunidades/:id/moderacion" element={<CommunityAdmin />} />
                        <Route path="/comunidades/:id/admin/finanzas" element={<CommunityAdmin />} />
                        <Route path="/comunidades/:id/admin/configuracion" element={<CommunityAdmin />} />
                        <Route path="/news" element={<NewsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/analysis" element={<AnalysisPage />} />
                        <Route path="/analysis/:slug" element={<AnalysisPage />} />
                        <Route path="/analisis" element={<AnalysisPage />} />
                        <Route path="/analisis/:slug" element={<AnalysisPage />} />
                    </Route>

                    {/* Info & Legal Routes */}
                    <Route path="/pro" element={<Pricing />} />
                    <Route path="/payment-result" element={<PaymentResult />} />
                    <Route path="/creator" element={<CreatorPage />} />
                    <Route path="/creador" element={<CreatorPage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/legal/privacy" element={<Privacy />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/legal/terms" element={<Terms />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/legal/cookies" element={<Cookies />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/legal/responsible" element={<ResponsibleUse />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </>
    );
}
