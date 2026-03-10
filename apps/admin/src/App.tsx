import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import AdminLayout from './layouts/AdminLayout';
import PostsList from './pages/PostsList';
import ReportsList from './pages/ReportsList';
import { adminFetch } from './lib/api';

const RequireAdminAuth = ({ children }: { children: JSX.Element }) => {
    const [status, setStatus] = useState<'loading' | 'ok' | 'unauthorized'>('loading');

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const res = await adminFetch('/admin/auth/me');
                if (!mounted) return;
                setStatus(res.ok ? 'ok' : 'unauthorized');
            } catch {
                if (!mounted) return;
                setStatus('unauthorized');
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

    return children;
};

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/posts" element={<PostsList />} />
                <Route path="/reports" element={<ReportsList />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
