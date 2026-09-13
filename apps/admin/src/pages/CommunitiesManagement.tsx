import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { Globe, Users, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface Community {
    id: string;
    name: string;
    category: string;
    privacyType: string;
    createdAt: string;
    creator: {
        id: string;
        username: string;
        email: string;
    };
    _count: {
        members: number;
        posts: number;
    };
}

export default function CommunitiesManagement() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    useEffect(() => {
        const fetchCommunities = async () => {
            setLoading(true);
            try {
                const res = await adminFetch(`/admin/communities?page=${page}&limit=${limit}`);
                if (res.ok) {
                    const { data, total: t } = await res.json();
                    setCommunities(data);
                    setTotal(t);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Globe className="h-6 w-6 text-primary" />
                    Comunidades
                </h1>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-secondary text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Categoría</th>
                                <th className="px-6 py-4 font-medium">Privacidad</th>
                                <th className="px-6 py-4 font-medium">Creador</th>
                                <th className="px-6 py-4 font-medium">Métricas</th>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        Cargando comunidades...
                                    </td>
                                </tr>
                            ) : communities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        No hay comunidades registradas
                                    </td>
                                </tr>
                            ) : (
                                communities.map((community) => (
                                    <tr key={community.id} className="hover:bg-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {community.name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {community.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium text-foreground">
                                                {community.privacyType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-foreground font-medium">{community.creator.username}</div>
                                            <div className="text-muted-foreground text-xs">{community.creator.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4" />
                                                    <span>{community._count.members}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-4 h-4" />
                                                    <span>{community._count.posts}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(community.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
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
