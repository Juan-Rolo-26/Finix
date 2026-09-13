import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { Star, Zap, CreditCard, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface Subscription {
    id: string;
    status: string;
    planType: string;
}

interface ProUser {
    id: string;
    username: string;
    email: string;
    accountType: string;
    plan: string;
    aiUsageThisMonth: number;
    aiUsageLimit: number;
    createdAt: string;
    subscriptions: Subscription[];
}

export default function ProUsersManagement() {
    const [users, setUsers] = useState<ProUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        const fetchProUsers = async () => {
            setLoading(true);
            try {
                const res = await adminFetch(`/admin/pro-users?page=${page}&limit=${limit}`);
                if (res.ok) {
                    const { data, total: t } = await res.json();
                    setUsers(data);
                    setTotal(t);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProUsers();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500" />
                    Usuarios PRO / Suscripciones
                </h1>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-secondary text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">Usuario</th>
                                <th className="px-6 py-4 font-medium">Tipo de Cuenta</th>
                                <th className="px-6 py-4 font-medium">Estado Plan</th>
                                <th className="px-6 py-4 font-medium">Uso IA Mensual</th>
                                <th className="px-6 py-4 font-medium">Registrado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        Cargando usuarios PRO...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No se encontraron usuarios PRO
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const hasActiveSub = user.subscriptions.length > 0;
                                    const usagePercent = user.aiUsageLimit > 0 
                                        ? Math.min(100, Math.round((user.aiUsageThisMonth / user.aiUsageLimit) * 100)) 
                                        : 0;

                                    return (
                                        <tr key={user.id} className="hover:bg-secondary/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-foreground font-medium">{user.username}</div>
                                                <div className="text-muted-foreground text-xs">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.accountType === 'PRO' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-secondary text-foreground'}`}>
                                                        {user.accountType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasActiveSub ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                                        <Activity className="w-3.5 h-3.5" />
                                                        Suscripción Activa
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-orange-500 text-xs font-medium bg-orange-500/10 px-2 py-1 rounded w-fit">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                        {user.plan}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 max-w-[120px]">
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Zap className="w-3.5 h-3.5 text-primary" />
                                                            <span>{user.aiUsageThisMonth}</span>
                                                        </div>
                                                        <span>/ {user.aiUsageLimit}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${usagePercent > 80 ? 'bg-red-500' : 'bg-primary'}`} 
                                                            style={{ width: `${usagePercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30">
                        <span className="text-sm text-muted-foreground">
                            Página <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-border bg-card text-foreground disabled:opacity-50 hover:bg-secondary"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border border-border bg-card text-foreground disabled:opacity-50 hover:bg-secondary"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
