import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PortfolioPage from './pages/Portfolio';
import { useAuthStore } from './stores/authStore';

import Landing from './pages/Landing';

import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import ResponsibleUse from './pages/legal/ResponsibleUse';
import Markets from './pages/Markets';
import News from './pages/News';
import Profile from './pages/Profile';
import FundamentalAnalysis from './pages/FundamentalAnalysis';
import Settings from './pages/Settings';

import DashboardLayout from './layouts/DashboardLayout';

export default function App() {
    const { token } = useAuthStore();

    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={!token ? <AuthPage /> : <Navigate to="/dashboard" />} />

            {/* Protected Routes */}
            <Route element={token ? <DashboardLayout /> : <Navigate to="/auth" />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/market" element={<Markets />} />
                <Route path="/analysis" element={<FundamentalAnalysis />} />
                <Route path="/analysis/:ticker" element={<FundamentalAnalysis />} />
                <Route path="/news" element={<News />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                {/* Fallback for other protected routes if needed */}
            </Route>

            {/* Legal Routes */}
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/responsible" element={<ResponsibleUse />} />
        </Routes>
    );
}
