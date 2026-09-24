import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import AdminLayout from './layouts/AdminLayout';
import PostsList from './pages/PostsList';
import ReportsList from './pages/ReportsList';
import AuditLogs from './pages/AuditLogs';
import NewsManagement from './pages/NewsManagement';
import VerificationsManagement from './pages/VerificationsManagement';
import Statistics from './pages/Statistics';
import CommunitiesManagement from './pages/CommunitiesManagement';
import ProUsersManagement from './pages/ProUsersManagement';
import AnalysisManagement from './pages/AnalysisManagement';
import MarketRankingsManagement from './pages/MarketRankingsManagement';
import CalendarManagement from './pages/CalendarManagement';
import EmailMarketing from './pages/EmailMarketing';
import { adminFetch, readAdminErrorMessage } from './lib/api';

const RequireAdminAuth = ({ children }: { children: JSX.Element }) => {
    const [status, setStatus] = useState<'loading' | 'ok' | 'unauthorized' | 'forbidden' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const res = await adminFetch('/admin/auth/me');
                if (!mounted) return;

                if (res.ok) {
                    setStatus('ok');
                    return;
                }

                const errorMessage = await readAdminErrorMessage(res, 'No se pudo validar la sesión del administrador.');
                setMessage(errorMessage);
                setStatus(res.status === 403 ? 'forbidden' : 'unauthorized');
            } catch {
                if (!mounted) return;
                setMessage('No se pudo conectar con la API del administrador.');
                setStatus('error');
            }
        };

        checkSession();

        return () => {
            mounted = false;
        };
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400 text-sm">
                Verificando sesión segura...
            </div>
        );
    }

    if (status === 'unauthorized') {
        return <Navigate to="/login" replace />;
    }

    if (status === 'forbidden' || status === 'error') {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-100 p-6">
                <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-7 text-center shadow-2xl">
                    <h1 className="text-xl font-bold">No se pudo abrir el admin</h1>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{message}</p>
                    <button
                        type="button"
                        onClick={() => window.location.assign('/login')}
                        className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/pro-users" element={<ProUsersManagement />} />
                <Route path="/pro-emails" element={<EmailMarketing />} />
                <Route path="/email-alertas" element={<EmailMarketing />} />
                <Route path="/communities" element={<CommunitiesManagement />} />
                <Route path="/posts" element={<PostsList />} />
                <Route path="/news" element={<NewsManagement />} />
                <Route path="/market-rankings" element={<MarketRankingsManagement />} />
                <Route path="/calendar" element={<CalendarManagement />} />
                <Route path="/analysis" element={<AnalysisManagement />} />
                <Route path="/verifications" element={<VerificationsManagement />} />
                <Route path="/reports" element={<ReportsList />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
