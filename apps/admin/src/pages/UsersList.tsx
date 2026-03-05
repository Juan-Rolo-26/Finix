import { useEffect, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';

export default function UsersList() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth-token');
            const res = await fetch(`/api/admin/users?page=${page}&limit=50&search=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const handleAction = async (id: string, updates: any) => {
        if (!confirm('¿Confirmas esta acción de moderación?')) return;

        try {
            const token = localStorage.getItem('auth-token');
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                loadUsers(); // refresh data
            } else {
                alert('No se pudo aplicar la acción.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Usuarios</h1>

                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por email o username..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </form>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-500 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Rol</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Flags</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-zinc-100">{u.username}</span>
                                            <span className="text-xs text-zinc-500">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${u.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                u.role === 'CREATOR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                {u.role}
                                            </span>
                                            {u.shadowbanned && (
                                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    SHADOW
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">
                                        {u.flags ? u.flags : 'Ninguno'}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">

                                        {u.status === 'ACTIVE' ? (
                                            <button
                                                onClick={() => handleAction(u.id, { status: 'BANNED' })}
                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md text-xs font-semibold transition-colors"
                                                title="Banear usuario"
                                            >
                                                Ban
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(u.id, { status: 'ACTIVE' })}
                                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-md text-xs font-semibold transition-colors"
                                            >
                                                Unban
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleAction(u.id, { shadowbanned: !u.shadowbanned })}
                                            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-md text-xs font-semibold transition-colors"
                                            title="Activar/Desactivar Shadowban"
                                        >
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                        </button>

                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm text-zinc-500">
                <p>Mostrando {users.length} resultados.</p>
                <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-zinc-800 rounded bg-zinc-900 disabled:opacity-50 hover:bg-zinc-800">Ant</button>
                    <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800">Sig</button>
                </div>
            </div>
        </div>
    );
}
