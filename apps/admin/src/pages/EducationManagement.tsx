import { useState, useEffect, useCallback } from 'react';
import {
    GraduationCap, Plus, Search, Edit3, Trash2,
    CheckCircle2, Sparkles, RefreshCw,
    BookOpen, AlertCircle
} from 'lucide-react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';

interface Category {
    id: string;
    slug: string;
    name: string;
    description?: string;
    subcategories?: { id: string; slug: string; name: string }[];
}

interface ArticleItem {
    id: string;
    slug: string;
    title: string;
    summary: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    readTimeMinutes: number;
    order: number;
    isFeatured: boolean;
    viewsCount: number;
    interactiveWidget?: string | null;
    formula?: string | null;
    category?: { id: string; name: string; slug: string };
    subcategory?: { id: string; name: string; slug: string };
    updatedAt: string;
}

const inputClass = 'w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all';
const labelClass = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block';

export default function EducationManagement() {
    const [tab, setTab] = useState<'articles' | 'create' | 'categories'>('articles');
    const [articles, setArticles] = useState<ArticleItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
    const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Formulario de artículo
    const [form, setForm] = useState({
        title: '',
        slug: '',
        summary: '',
        content: '',
        categoryId: '',
        subcategoryId: '',
        level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        isFeatured: false,
        readTimeMinutes: 5,
        order: 1,
        formula: '',
        interactiveWidget: '',
        practicalExample: '',
        keyTakeaways: '',
        commonMistakes: '',
        sources: '',
    });

    // Cargar datos
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [artRes, catRes] = await Promise.all([
                adminFetch('/education/admin/articles'),
                adminFetch('/education/categories'),
            ]);

            if (artRes.ok) {
                const arts = await artRes.json();
                setArticles(Array.isArray(arts) ? arts : []);
            }
            if (catRes.ok) {
                const cats = await catRes.json();
                setCategories(Array.isArray(cats) ? cats : []);
                if (cats.length > 0 && !form.categoryId) {
                    setForm(f => ({ ...f, categoryId: cats[0].id }));
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error al cargar contenido educativo');
        } finally {
            setLoading(false);
        }
    }, [form.categoryId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleEdit = (article: ArticleItem) => {
        setEditingArticleId(article.id);
        setForm({
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            content: (article as any).content || '',
            categoryId: article.category?.id || '',
            subcategoryId: article.subcategory?.id || '',
            level: article.level,
            status: article.status,
            isFeatured: article.isFeatured,
            readTimeMinutes: article.readTimeMinutes,
            order: article.order,
            formula: article.formula || '',
            interactiveWidget: article.interactiveWidget || '',
            practicalExample: (article as any).practicalExample || '',
            keyTakeaways: Array.isArray((article as any).keyTakeaways) ? (article as any).keyTakeaways.join('\n') : '',
            commonMistakes: Array.isArray((article as any).commonMistakes) ? (article as any).commonMistakes.join('\n') : '',
            sources: Array.isArray((article as any).sources) ? (article as any).sources.map((s: any) => s.title || s).join('\n') : '',
        });
        setTab('create');
    };

    const handleResetForm = () => {
        setEditingArticleId(null);
        setForm({
            title: '',
            slug: '',
            summary: '',
            content: '',
            categoryId: categories[0]?.id || '',
            subcategoryId: '',
            level: 'BEGINNER',
            status: 'PUBLISHED',
            isFeatured: false,
            readTimeMinutes: 5,
            order: 1,
            formula: '',
            interactiveWidget: '',
            practicalExample: '',
            keyTakeaways: '',
            commonMistakes: '',
            sources: '',
        });
    };

    const handleSaveArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            const payload = {
                ...form,
                keyTakeaways: form.keyTakeaways.split('\n').map(s => s.trim()).filter(Boolean),
                commonMistakes: form.commonMistakes.split('\n').map(s => s.trim()).filter(Boolean),
                sources: form.sources.split('\n').map(s => ({ title: s.trim() })).filter(s => Boolean(s.title)),
                subcategoryId: form.subcategoryId || undefined,
                interactiveWidget: form.interactiveWidget || undefined,
                formula: form.formula || undefined,
            };

            const url = editingArticleId
                ? `/education/admin/articles/${editingArticleId}`
                : '/education/admin/articles';
            const method = editingArticleId ? 'PUT' : 'POST';

            const res = await adminFetch(url, {
                method,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await readAdminErrorMessage(res, 'Error al guardar artículo'));
            }

            setNotice(editingArticleId ? 'Artículo actualizado con éxito' : 'Artículo creado exitosamente');
            handleResetForm();
            setTab('articles');
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Error al guardar el artículo');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteArticle = async (id: string, title: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el artículo "${title}"?`)) return;

        try {
            const res = await adminFetch(`/education/admin/articles/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await readAdminErrorMessage(res, 'Error al eliminar artículo'));
            setNotice('Artículo eliminado correctamente');
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar');
        }
    };

    const filteredArticles = articles.filter(art => {
        const matchesSearch = !search.trim() ||
            art.title.toLowerCase().includes(search.toLowerCase()) ||
            art.summary.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || art.category?.slug === selectedCategory;
        const matchesLevel = selectedLevel === 'ALL' || art.level === selectedLevel;
        return matchesSearch && matchesCategory && matchesLevel;
    });

    return (
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                        <GraduationCap className="w-4 h-4" />
                        Finix Academy &amp; Library
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        Gestión Educativa
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Biblioteca institucional, artículos técnicos, modelos fundamentales y rutas de aprendizaje.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (tab === 'create') handleResetForm();
                            setTab(tab === 'create' ? 'articles' : 'create');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        {tab === 'create' ? <BookOpen className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {tab === 'create' ? 'Ver Biblioteca' : 'Nuevo Artículo'}
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition-all"
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Notificaciones */}
            {notice && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {notice}
                    </span>
                    <button type="button" onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100">✕</button>
                </div>
            )}
            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </span>
                    <button type="button" onClick={() => setError(null)} className="opacity-70 hover:opacity-100">✕</button>
                </div>
            )}

            {/* TAB: LISTADO DE ARTÍCULOS */}
            {tab === 'articles' && (
                <div className="space-y-6">
                    {/* Filtros y Búsqueda */}
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border/80">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar artículos o conceptos..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className={`${inputClass} pl-10`}
                            />
                        </div>

                        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
                            >
                                <option value="ALL">Todas las Categorías</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.slug}>{c.name}</option>
                                ))}
                            </select>

                            <select
                                value={selectedLevel}
                                onChange={e => setSelectedLevel(e.target.value)}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
                            >
                                <option value="ALL">Todos los Niveles</option>
                                <option value="BEGINNER">Principiante</option>
                                <option value="INTERMEDIATE">Intermedio</option>
                                <option value="ADVANCED">Avanzado</option>
                            </select>
                        </div>
                    </div>

                    {/* Tabla de Artículos */}
                    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="p-4">Artículo</th>
                                        <th className="p-4">Categoría</th>
                                        <th className="p-4">Nivel</th>
                                        <th className="p-4">Widget Interactivo</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4">Lectura</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredArticles.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No se encontraron artículos con los filtros aplicados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredArticles.map(art => (
                                            <tr key={art.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-semibold text-foreground max-w-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        {art.isFeatured && (
                                                            <span title="Destacado">
                                                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                            </span>
                                                        )}
                                                        <span className="truncate">{art.title}</span>
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                                                        /{art.slug}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    <span className="inline-block px-2.5 py-1 rounded-md bg-secondary text-[11px] font-medium">
                                                        {art.category?.name || '—'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        art.level === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                        art.level === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                        'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                    }`}>
                                                        {art.level === 'BEGINNER' ? 'Principiante' : art.level === 'INTERMEDIATE' ? 'Intermedio' : 'Avanzado'}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-[11px] text-muted-foreground">
                                                    {art.interactiveWidget ? (
                                                        <span className="text-primary font-semibold">⚡ {art.interactiveWidget}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                                        art.status === 'PUBLISHED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                                                    }`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {art.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {art.readTimeMinutes} min
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(art)}
                                                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all"
                                                            title="Editar artículo"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteArticle(art.id, art.title)}
                                                            className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all"
                                                            title="Eliminar artículo"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: CREAR / EDITAR ARTÍCULO */}
            {tab === 'create' && (
                <form onSubmit={handleSaveArticle} className="space-y-6 bg-card p-6 rounded-2xl border border-border/80">
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                        <h2 className="text-lg font-bold text-foreground">
                            {editingArticleId ? 'Editar Artículo' : 'Nuevo Artículo Educativo'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => { handleResetForm(); setTab('articles'); }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancelar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Título del Concepto</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: ¿Qué es el ROIC?"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Slug URL (Opcional, autogenerado si queda vacío)</label>
                            <input
                                type="text"
                                placeholder="que-es-el-roic"
                                value={form.slug}
                                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Categoría</label>
                            <select
                                required
                                value={form.categoryId}
                                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))}
                                className={inputClass}
                            >
                                <option value="">Seleccionar categoría...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Nivel de Dificultad</label>
                            <select
                                value={form.level}
                                onChange={e => setForm(f => ({ ...f, level: e.target.value as any }))}
                                className={inputClass}
                            >
                                <option value="BEGINNER">Principiante</option>
                                <option value="INTERMEDIATE">Intermedio</option>
                                <option value="ADVANCED">Avanzado</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Estado</label>
                            <select
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                                className={inputClass}
                            >
                                <option value="PUBLISHED">Publicado</option>
                                <option value="DRAFT">Borrador</option>
                                <option value="ARCHIVED">Archivado</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Widget Interactivo</label>
                            <select
                                value={form.interactiveWidget}
                                onChange={e => setForm(f => ({ ...f, interactiveWidget: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="">Ninguno</option>
                                <option value="roic_wacc">ROIC vs WACC (Creación de Valor)</option>
                                <option value="rsi">Oscilador RSI (Bandas 30 / 70)</option>
                                <option value="macd">Indicador MACD (Líneas e Histograma)</option>
                                <option value="trend">Estructura de Tendencia (HH / HL)</option>
                                <option value="support_resistance">Soportes &amp; Resistencias</option>
                                <option value="candles">Anatomía de Velas Japonesas</option>
                                <option value="per">Simulador de PER &amp; Retorno</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Tiempo de Lectura (Minutos)</label>
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={form.readTimeMinutes}
                                onChange={e => setForm(f => ({ ...f, readTimeMinutes: Number(e.target.value) }))}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                                <input
                                    type="checkbox"
                                    checked={form.isFeatured}
                                    onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                                    className="rounded border-border w-4 h-4 text-primary"
                                />
                                Destacar en la portada educativa
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Resumen Ejecutivo (2-3 líneas)</label>
                        <textarea
                            required
                            rows={2}
                            placeholder="Explicación clara y concisa del concepto..."
                            value={form.summary}
                            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Fórmula Matemática (Opcional)</label>
                        <textarea
                            rows={2}
                            placeholder="ROIC = NOPAT / Capital Invertido"
                            value={form.formula}
                            onChange={e => setForm(f => ({ ...f, formula: e.target.value }))}
                            className={`${inputClass} font-mono text-xs`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Contenido Completo del Artículo (Markdown)</label>
                        <textarea
                            required
                            rows={12}
                            placeholder="Escribe el desarrollo completo en Markdown..."
                            value={form.content}
                            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                            className={`${inputClass} font-mono text-xs`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Puntos Clave (Un punto por línea)</label>
                            <textarea
                                rows={3}
                                placeholder="El ROIC mide la rentabilidad del negocio..."
                                value={form.keyTakeaways}
                                onChange={e => setForm(f => ({ ...f, keyTakeaways: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Errores Frecuentes (Un error por línea)</label>
                            <textarea
                                rows={3}
                                placeholder="Confundir ROIC con ROE..."
                                value={form.commonMistakes}
                                onChange={e => setForm(f => ({ ...f, commonMistakes: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Fuentes Bibliográficas (Una por línea)</label>
                        <textarea
                            rows={2}
                            placeholder="Michael Mauboussin — Measuring the Moat"
                            value={form.sources}
                            onChange={e => setForm(f => ({ ...f, sources: e.target.value }))}
                            className={inputClass}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                        <button
                            type="button"
                            onClick={() => { handleResetForm(); setTab('articles'); }}
                            className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : editingArticleId ? 'Actualizar Artículo' : 'Publicar Artículo'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
