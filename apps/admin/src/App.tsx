import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/UsersList';
import AdminLayout from './layouts/AdminLayout';
import PostsList from './pages/PostsList';
import ReportsList from './pages/ReportsList';

// Basic Auth Guard relying on localStorage token
const RequireAdminAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('auth-token');
  if (!token) {
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
