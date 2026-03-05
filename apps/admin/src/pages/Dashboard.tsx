import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
    const [kpis, setKpis] = useState<any>(null);

    useEffect(() => {
        const fetchKpis = async () => {
            const token = localStorage.getItem('auth-token');
            const res = await fetch('/api/admin/kpis', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setKpis(data.kpis);
            }
        };
        fetchKpis();
    }, []);

    const stats = [
        { title: 'Usuarios Totales', value: kpis?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Usuarios Activos', value: kpis?.activeUsersCount || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: 'Publicaciones Activas', value: kpis?.totalPosts || 0, icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { title: 'Reportes Pendientes', value: kpis?.pendingReports || 0, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800/60 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-sm mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions / Info Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-zinc-900 border border-zinc-800/60 p-6 rounded-2xl">
                    <h3 className="font-semibold text-white mb-4">Avisos del Sistema</h3>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                        Semilla de AdminBootstrapper cargada. Base de datos segura. Allowlist activa.
                    </div>
                </div>
            </div>
        </div>
    );
}
