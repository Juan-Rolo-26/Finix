import { useState, useEffect } from 'react';
import { Newspaper, Trash2, Plus, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { adminFetch } from '../lib/api';

export default function NewsManagement() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [url, setUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const res = await adminFetch('/admin/news');
            const data = await res.json();
            setNews(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const res = await adminFetch('/admin/news/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al agregar noticia');
            }
            setUrl('');
            fetchNews();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro quieres eliminar esta noticia?')) return;
        try {
            const res = await adminFetch(`/admin/news/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNews(news.filter(n => n.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-emerald-500" />
                        Noticias (Manuales)
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Sube noticias usando un Link. Estas serán las únicas que aparecerán en la web.
                    </p>
                </div>
            </div>

            <div className="bg-[#121214] border border-zinc-800/60 rounded-xl p-5">
                <form onSubmit={handleAddNews} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">URL de la noticia</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://ejemplo.com/noticia-1"
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !url}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Extraer y Guardar
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </form>
            </div>

            <div className="bg-[#121214] border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#09090b] border-b border-zinc-800/60 text-zinc-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Noticia</th>
                                <th className="px-6 py-4 whitespace-nowrap">Fecha de Recopilación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                            {news.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                                        No has subido ninguna noticia aún.
                                    </td>
                                </tr>
                            ) : (
                                news.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded object-cover shrink-0 bg-zinc-800" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                                                        <Newspaper className="w-5 h-5 text-zinc-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-zinc-100 font-medium line-clamp-1">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                                            Ver original <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                title="Eliminar Noticia"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
