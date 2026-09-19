import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { Globe, Users, FileText, ChevronLeft, ChevronRight, Eye, PauseCircle, Archive, Star } from 'lucide-react';

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
        reports?: number;
    };
    status?: string;
    isFeatured?: boolean;
}

export default function CommunitiesManagement() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;
    const [selected, setSelected] = useState<Community | null>(null);
    const [busy, setBusy] = useState(false);

    const refresh = async () => {
        const res = await adminFetch(`/admin/communities?page=${page}&limit=${limit}`);
        if (res.ok) { const data = await res.json(); setCommunities(data.data); setTotal(data.total); }
    };

    const action = async (id: string, endpoint: string, options: RequestInit) => {
        setBusy(true);
        try {
            const res = await adminFetch(`/admin/communities/${id}${endpoint}`, options);
            if (!res.ok) throw new Error('No se pudo completar la acción');
            await refresh();
            setSelected(null);
        } catch (error: any) { window.alert(error.message); } finally { setBusy(false); }
    };

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
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                        Cargando comunidades...
                                    </td>
                                </tr>
                            ) : communities.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
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
                                        <td className="px-6 py-4 text-muted-foreground">{community.status || 'PUBLISHED'}</td>
                                        <td className="px-6 py-4"><button onClick={() => setSelected(community)} className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-secondary"><Eye className="mr-1 inline h-3.5 w-3.5" /> Gestionar</button></td>
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

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{selected.name}</h2><p className="text-sm text-muted-foreground">Creada el {new Date(selected.createdAt).toLocaleDateString()}</p></div><button onClick={() => setSelected(null)} className="text-muted-foreground">✕</button></div>
                        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-secondary p-3"><Users className="mx-auto mb-1 h-4 w-4" />{selected._count.members} miembros</div><div className="rounded-xl bg-secondary p-3"><FileText className="mx-auto mb-1 h-4 w-4" />{selected._count.posts} publicaciones</div><div className="rounded-xl bg-secondary p-3">{selected._count.reports || 0} reportes</div></div>
                        <div className="mt-5 grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => action(selected.id, '/status', { method: 'PATCH', body: JSON.stringify({ status: selected.status === 'SUSPENDED' ? 'PUBLISHED' : 'SUSPENDED' }) })} className="rounded-xl border border-amber-500/40 px-3 py-2 text-xs font-bold"><PauseCircle className="mr-1 inline h-4 w-4" />{selected.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'}</button><button disabled={busy} onClick={() => action(selected.id, '/feature', { method: 'PATCH', body: JSON.stringify({ isFeatured: !selected.isFeatured }) })} className="rounded-xl border border-primary/40 px-3 py-2 text-xs font-bold"><Star className="mr-1 inline h-4 w-4" />{selected.isFeatured ? 'Quitar destacado' : 'Destacar'}</button><button disabled={busy} onClick={() => { if (window.confirm('¿Archivar esta comunidad? Dejará de estar publicada.')) action(selected.id, '', { method: 'DELETE' }); }} className="col-span-2 rounded-xl border border-red-500/40 px-3 py-2 text-xs font-bold text-red-500"><Archive className="mr-1 inline h-4 w-4" />Archivar comunidad</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
