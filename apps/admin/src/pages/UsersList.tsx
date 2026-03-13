import { FormEvent, useEffect, useState } from 'react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import { RefreshCw, Search, ShieldAlert, Trash2, UserMinus, Users } from 'lucide-react';

type AdminUserRow = {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    shadowbanned: boolean;
    lastLogin: string | null;
    createdAt: string;
    flags: string | null;
};

type FeedbackState = {
    tone: 'success' | 'error';
    message: string;
} | null;

const PAGE_SIZE = 50;

export default function UsersList() {
    const [users, setUsers] = useState<AdminUserRow[]>([]);
    const [search, setSearch] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackState>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshTick, setRefreshTick] = useState(0);
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const activeOnPage = users.filter((user) => user.status === 'ACTIVE').length;
    const bannedOnPage = users.filter((user) => user.status === 'BANNED').length;
    const adminsOnPage = users.filter((user) => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN').length;
    const shadowOnPage = users.filter((user) => user.shadowbanned).length;

    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(PAGE_SIZE),
                });

                if (submittedSearch) {
                    params.set('search', submittedSearch);
                }
                if (roleFilter) {
                    params.set('role', roleFilter);
                }
                if (statusFilter) {
                    params.set('status', statusFilter);
                }

                const res = await adminFetch(`/admin/users?${params.toString()}`);
                if (!res.ok) {
                    throw new Error(await readAdminErrorMessage(res, 'No se pudieron cargar los usuarios'));
                }

                const data = await res.json();
                if (cancelled) {
                    return;
                }

                setUsers(data.data || []);
                setTotal(data.total || 0);
            } catch (error: any) {
                if (!cancelled) {
                    setFeedback({
                        tone: 'error',
                        message: error?.message || 'No se pudieron cargar los usuarios',
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadUsers();

        return () => {
            cancelled = true;
        };
    }, [page, refreshTick, roleFilter, statusFilter, submittedSearch]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFeedback(null);
        setPage(1);
        setSubmittedSearch(search.trim());
        setRefreshTick((current) => current + 1);
    };

    const handleRefresh = () => {
        setFeedback(null);
        setRefreshTick((current) => current + 1);
    };

    const handlePatchAction = async (
        userId: string,
        updates: Record<string, unknown>,
        successMessage: string,
        confirmationMessage: string,
    ) => {
        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setFeedback(null);
        setPendingUserId(userId);

        try {
            const res = await adminFetch(`/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                throw new Error(await readAdminErrorMessage(res, 'No se pudo aplicar la acción'));
            }

            setFeedback({ tone: 'success', message: successMessage });
            setRefreshTick((current) => current + 1);
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: error?.message || 'No se pudo aplicar la acción',
            });
        } finally {
            setPendingUserId(null);
        }
    };

    const handlePermanentDelete = async (user: AdminUserRow) => {
        const expectedConfirmation = `ELIMINAR ${user.username}`;
        const typedConfirmation = window.prompt(
            `Esta acción borra al usuario para siempre.\n\nEscribe exactamente:\n${expectedConfirmation}`,
            '',
        );

        if (typedConfirmation === null) {
            return;
        }

        if (typedConfirmation.trim() !== expectedConfirmation) {
            setFeedback({
                tone: 'error',
                message: `Confirmación inválida. Debes escribir exactamente "${expectedConfirmation}".`,
            });
            return;
        }

        setFeedback(null);
        setPendingUserId(user.id);

        try {
            const res = await adminFetch(`/admin/users/${user.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error(await readAdminErrorMessage(res, 'No se pudo eliminar el usuario'));
            }

            setFeedback({
                tone: 'success',
                message: `El usuario ${user.username} fue eliminado permanentemente.`,
            });
            setRefreshTick((current) => current + 1);
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: error?.message || 'No se pudo eliminar el usuario',
            });
        } finally {
            setPendingUserId(null);
        }
    };

    const formatDate = (value: string | null) => {
        if (!value) {
            return 'Nunca';
        }

        return new Date(value).toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-white">Gestión de Usuarios</h1>
                    <p className="text-sm text-zinc-500">
                        Ban, shadowban o eliminación permanente con confirmación fuerte y auditoría.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                    <form onSubmit={handleSearch} className="relative w-full xl:w-96">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por email o username..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Resultados', value: total, icon: Users, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                    { label: 'Activos en página', value: activeOnPage, icon: UserMinus, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Admins en página', value: adminsOnPage, icon: ShieldAlert, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    { label: 'Moderados en página', value: shadowOnPage + bannedOnPage, icon: Trash2, tone: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/90 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{card.label}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                            </div>
                            <div className={`rounded-2xl border p-3 ${card.tone}`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-2 text-sm">
                        <span className="text-zinc-500">Rol</span>
                        <select
                            value={roleFilter}
                            onChange={(event) => {
                                setPage(1);
                                setRoleFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">Todos los roles</option>
                            <option value="USER">USER</option>
                            <option value="CREATOR">CREATOR</option>
                            <option value="MODERATOR">MODERATOR</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                    </label>

                    <label className="space-y-2 text-sm">
                        <span className="text-zinc-500">Estado</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setPage(1);
                                setStatusFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">Todos los estados</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="BANNED">BANNED</option>
                        </select>
                    </label>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSubmittedSearch('');
                                setRoleFilter('');
                                setStatusFilter('');
                                setPage(1);
                                setFeedback(null);
                                setRefreshTick((current) => current + 1);
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            {feedback && (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                        feedback.tone === 'success'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : 'border-red-500/20 bg-red-500/10 text-red-300'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="sticky top-0 bg-zinc-800/60 text-xs uppercase text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Usuario</th>
                                <th className="px-6 py-4 font-semibold">Rol</th>
                                <th className="px-6 py-4 font-semibold">Estado</th>
                                <th className="px-6 py-4 font-semibold">Actividad</th>
                                <th className="px-6 py-4 font-semibold">Flags</th>
                                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {users.map((user) => {
                                const isPending = pendingUserId === user.id;

                                return (
                                    <tr key={user.id} className="transition-colors hover:bg-zinc-800/20">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-zinc-100">{user.username}</span>
                                                <span className="text-xs text-zinc-500">{user.email}</span>
                                                <span className="text-[11px] text-zinc-600">
                                                    Alta: {formatDate(user.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                    user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                                                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                        : user.role === 'CREATOR'
                                                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                                                            : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                                                }`}>
                                                    {user.role}
                                                </span>
                                                {user.shadowbanned && (
                                                    <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">
                                                        SHADOW
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                                user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-zinc-500">
                                            Último login: {formatDate(user.lastLogin)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-zinc-500">
                                            {user.flags?.trim() || 'Ninguno'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {user.status === 'ACTIVE' ? (
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handlePatchAction(
                                                            user.id,
                                                            { status: 'BANNED' },
                                                            `${user.username} quedó baneado.`,
                                                            `¿Banear a ${user.username}?`,
                                                        )}
                                                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Ban
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handlePatchAction(
                                                            user.id,
                                                            { status: 'ACTIVE' },
                                                            `${user.username} volvió a ACTIVE.`,
                                                            `¿Quitar el ban a ${user.username}?`,
                                                        )}
                                                        className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Unban
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handlePatchAction(
                                                        user.id,
                                                        { shadowbanned: !user.shadowbanned },
                                                        user.shadowbanned
                                                            ? `${user.username} salió de shadowban.`
                                                            : `${user.username} quedó en shadowban.`,
                                                        user.shadowbanned
                                                            ? `¿Quitar shadowban a ${user.username}?`
                                                            : `¿Aplicar shadowban a ${user.username}?`,
                                                    )}
                                                    className="rounded-lg bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Activar o desactivar shadowban"
                                                >
                                                    <ShieldAlert className="h-3.5 w-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handlePermanentDelete(user)}
                                                    className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        No se encontraron usuarios con esos filtros.
                                    </td>
                                </tr>
                            )}

                            {loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Página {page} de {totalPages}. Total: {total.toLocaleString()} usuarios.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
