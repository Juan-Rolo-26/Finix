import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { BarChart3, Users, DollarSign, Activity, FileText, Globe } from 'lucide-react';

interface StatsData {
    totalUsers: number;
    proUsers: number;
    totalPosts: number;
    totalCommunities: number;
    totalRevenue: number;
    usersLast7Days: number;
}

export default function Statistics() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminFetch('/admin/statistics');
                if (res.ok) {
                    const { data } = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando estadísticas...</div>;
    }

    if (!stats) {
        return <div className="text-red-500">Error al cargar las estadísticas.</div>;
    }

    const cards = [
        { label: 'Usuarios Totales', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
        { label: 'Usuarios PRO', value: stats.proUsers, icon: Activity, color: 'text-purple-500' },
        { label: 'Ingresos Totales', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
        { label: 'Nuevos (últimos 7 días)', value: stats.usersLast7Days, icon: BarChart3, color: 'text-orange-500' },
        { label: 'Comunidades', value: stats.totalCommunities, icon: Globe, color: 'text-indigo-500' },
        { label: 'Publicaciones', value: stats.totalPosts, icon: FileText, color: 'text-pink-500' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Estadísticas Avanzadas</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-secondary ${card.color}`}>
                                <card.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-12 bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Gráficos Detallados</h3>
                <p className="mt-2 text-sm">Más herramientas de visualización de datos estarán disponibles próximamente.</p>
            </div>
        </div>
    );
}
