import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { Search, EyeOff, Trash2 } from 'lucide-react';

export default function PostsList() {
    const [posts, setPosts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/admin/posts?page=${page}&limit=50&search=${search}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadPosts();
    };

    const handleAction = async (id: string, updates: any) => {
        if (!confirm('¿Confirmas esta acción sobre el post?')) return;

        try {
            const res = await adminFetch(`/admin/posts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                loadPosts(); // refresh data
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Publicaciones</h1>

                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar en contenido..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                    <div key={post.id} className="bg-zinc-900 border border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-zinc-700 transition-colors relative">
                        {post.visibility === 'HIDDEN' && (
                            <span className="absolute top-2 right-2 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">OCULTO</span>
                        )}
                        <div className="flex items-center gap-3">
                            {post.author.avatarUrl ? (
                                <img src={post.author.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border border-zinc-800" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 border border-zinc-700">
                                    {post.author.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-zinc-100 text-sm">{post.author.username}</p>
                                <p className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-300 line-clamp-4 leading-relaxed bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                            {post.content || <span className="text-zinc-500 italic">Sin texto (Media post)</span>}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex gap-4 text-xs font-medium text-zinc-500">
                                <span>♥ {post._count.likes}</span>
                                <span>💬 {post._count.comments}</span>
                                <span className={post._count.reports > 0 ? "text-red-400" : ""}>🚨 {post._count.reports}</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(post.id, { visibility: post.visibility === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN' })}
                                    className={`p-2 rounded-lg transition-colors ${post.visibility === 'HIDDEN'
                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                        }`}
                                    title={post.visibility === 'HIDDEN' ? "Mostrar" : "Ocultar / Shadowban post"}
                                >
                                    <EyeOff className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => handleAction(post.id, { deleted: true })}
                                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Borrar post"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {posts.length === 0 && !loading && (
                <div className="py-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800/60 rounded-2xl">
                    No hay publicaciones que revisar.
                </div>
            )}

            <div className="flex items-center justify-between text-sm text-zinc-500 mt-4">
                <p>Mostrando {posts.length} resultados.</p>
                <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800">Anterior</button>
                    <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800">Siguiente</button>
                </div>
            </div>
        </div>
    );
}
