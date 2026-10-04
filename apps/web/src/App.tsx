import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { hasCommunityAccess, hasCommunityCreatorAccess, useAuthStore } from './stores/authStore';
import { usePreferencesStore } from './stores/preferencesStore';
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
import InstallBanner from './components/InstallBanner';
const CookieConsent = lazy(() => import('./components/CookieConsent'));
import { usePlatformAccessStore } from './stores/platformAccessStore';

// ─── Lazy Loaded Pages ────────────────────────────────────────────────────────
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SocialDashboard = lazy(() => import('./pages/Dashboard'));
const FinanceWorkspace = lazy(() => import('./pages/FinanceWorkspace'));

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
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));

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
    const accessLoaded = usePlatformAccessStore(state => state.loaded);
    const location = useLocation();
    if (!token && !user) return <Navigate to="/" replace />;
    if (!accessLoaded && location.pathname !== '/dashboard') return <div className="min-h-screen grid place-items-center" role="status">Cargando Finix…</div>;
    // Guard removed: users who skipped onboarding can use the app and edit from profile
    return <>{children}</>;
}

function RequireCommunityAccess({
    children,
    creatorOnly = false,
}: {
    children: React.ReactNode;
    creatorOnly?: boolean;
}) {
    const { user } = useAuthStore();

    if (creatorOnly ? !hasCommunityCreatorAccess(user) : !hasCommunityAccess(user)) {
        return <Navigate to={creatorOnly ? '/creator' : '/settings/plan'} replace />;
    }

    return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
    const loadAccess = usePlatformAccessStore(state => state.load);
    const { token, user, syncFromSession } = useAuthStore();

    // Restore the Finix session on app load. Auth token ownership and provider
    // refresh handling live in authStore so Supabase cannot replace the API token.
    useEffect(() => {
        void loadAccess();
        syncFromSession();
    }, [loadAccess, syncFromSession]);


    return (
        <>
            <InstallBanner />
            <Suspense fallback={null}><CookieConsent /></Suspense>
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
                        <Route path="/dashboard" element={<SocialDashboard />} />
                        <Route path="/social" element={<SocialDashboard />} />
                        <Route path="/finanzas/*" element={<FinanceWorkspace />} />
                        <Route path="/finanzas-personales" element={<Navigate to="/finanzas" replace />} />
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/market" element={<Markets />} />
                        <Route path="/mercado/seguimiento" element={<WatchlistPage />} />
                        <Route path="/market/seguimiento" element={<WatchlistPage />} />
                        <Route path="/market/watchlist" element={<WatchlistPage />} />
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
                        <Route path="/comunidades" element={<RequireCommunityAccess><Comunidades /></RequireCommunityAccess>} />
                        <Route path="/comunidades/crear" element={<RequireCommunityAccess creatorOnly><CommunityCreate /></RequireCommunityAccess>} />
                        <Route path="/comunidades/:id" element={<RequireCommunityAccess><CommunityDetail /></RequireCommunityAccess>} />
                        <Route path="/comunidades/:id/admin" element={<RequireCommunityAccess creatorOnly><CommunityAdmin /></RequireCommunityAccess>} />
                        <Route path="/comunidades/:id/moderacion" element={<RequireCommunityAccess creatorOnly><CommunityAdmin /></RequireCommunityAccess>} />
                        <Route path="/comunidades/:id/admin/finanzas" element={<RequireCommunityAccess creatorOnly><CommunityAdmin /></RequireCommunityAccess>} />
                        <Route path="/comunidades/:id/admin/configuracion" element={<RequireCommunityAccess creatorOnly><CommunityAdmin /></RequireCommunityAccess>} />
                        <Route path="/news" element={<NewsPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/analysis" element={<AnalysisPage />} />
                        <Route path="/analysis/:slug" element={<AnalysisPage />} />
                        <Route path="/analisis" element={<AnalysisPage />} />
                        <Route path="/analisis/:slug" element={<AnalysisPage />} />
                    </Route>

                    {/* Info & Legal Routes */}
                    <Route path="/pro" element={<Pricing />} />
                    {/* Alias kept for all existing upgrade buttons and deep links. */}
                    <Route path="/pricing" element={<Pricing />} />
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
