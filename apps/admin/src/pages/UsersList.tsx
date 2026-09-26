import { FormEvent, useEffect, useState } from 'react';
import { adminFetch, readAdminErrorMessage } from '../lib/api';
import { BadgeCheck, RefreshCw, RotateCcw, Search, ShieldAlert, Star, Trash2, UserMinus, Users } from 'lucide-react';

type AdminUserRow = {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    shadowbanned: boolean;
    isVerified: boolean;
    plan: string;
    accountType: string;
    subscriptionStatus: string;
    proAccessOverride: boolean | null;
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h1>
                    <p className="text-sm text-muted-foreground">
                        Ban, shadowban o eliminación permanente con confirmación fuerte y auditoría.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                    <form onSubmit={handleSearch} className="relative w-full xl:w-96">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por email o username..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div key={card.label} className="rounded-2xl border border-border bg-card/90 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{card.label}</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
                            </div>
                            <div className={`rounded-2xl border p-3 ${card.tone}`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-2 text-sm">
                        <span className="text-muted-foreground">Rol</span>
                        <select
                            value={roleFilter}
                            onChange={(event) => {
                                setPage(1);
                                setRoleFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:border-emerald-500 focus:outline-none"
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
                        <span className="text-muted-foreground">Estado</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setPage(1);
                                setStatusFilter(event.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:border-emerald-500 focus:outline-none"
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
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground/90 transition-colors hover:bg-secondary"
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

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-foreground/90">
                        <thead className="sticky top-0 bg-secondary/60 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Usuario</th>
                                <th className="px-6 py-4 font-semibold">Rol</th>
                                <th className="px-6 py-4 font-semibold">Estado</th>
                                <th className="px-6 py-4 font-semibold">Distintivos</th>
                                <th className="px-6 py-4 font-semibold">Actividad</th>
                                <th className="px-6 py-4 font-semibold">Flags</th>
                                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {users.map((user) => {
                                const isPending = pendingUserId === user.id;
                                const hasAutomaticPro = user.plan === 'PRO'
                                    || user.plan === 'CREATOR'
                                    || user.plan === 'PRO_CREATOR'
                                    || user.accountType === 'PRO'
                                    || user.accountType === 'CREATOR'
                                    || user.subscriptionStatus === 'ACTIVE';
                                const hasEffectivePro = user.proAccessOverride === true
                                    || (user.proAccessOverride == null && hasAutomaticPro);

                                return (
                                    <tr key={user.id} className="transition-colors hover:bg-secondary/20">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-foreground">{user.username}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                                <span className="text-[11px] text-muted-foreground">
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
                                                            : 'border-border bg-secondary text-muted-foreground'
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
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${user.isVerified
                                                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                                                    : 'border-border bg-secondary text-muted-foreground'
                                                }`}>
                                                    <BadgeCheck className="h-3.5 w-3.5" />
                                                    {user.isVerified ? 'Verificado' : 'No verificado'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${hasEffectivePro
                                                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                                                    : 'border-border bg-secondary text-muted-foreground'
                                                }`}>
                                                    <Star className="h-3.5 w-3.5" />
                                                    {hasEffectivePro ? 'PRO' : 'Free'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            Último login: {formatDate(user.lastLogin)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {user.flags?.trim() || 'Ninguno'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handlePatchAction(
                                                        user.id,
                                                        { isVerified: !user.isVerified },
                                                        user.isVerified ? `${user.username} dejó de estar verificado.` : `${user.username} ahora está verificado.`,
                                                        user.isVerified ? `¿Quitar la verificación de ${user.username}?` : `¿Verificar a ${user.username}?`,
                                                    )}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${user.isVerified
                                                        ? 'bg-slate-500/10 text-slate-300 hover:bg-slate-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                                    }`}
                                                    title="Controlar insignia pública de verificado"
                                                >
                                                    <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                                                    {user.isVerified ? 'Quitar verificado' : 'Verificar'}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => handlePatchAction(
                                                        user.id,
                                                        { proAccessOverride: hasEffectivePro },
                                                        hasEffectivePro ? `${user.username} quedó sin acceso PRO manual.` : `${user.username} recibió acceso PRO manual.`,
                                                        hasEffectivePro ? `¿Quitar PRO a ${user.username}?` : `¿Dar PRO a ${user.username}?`,
                                                    )}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${hasEffectivePro
                                                        ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                                        : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                                                    }`}
                                                    title="Conceder o revocar acceso PRO sin modificar el pago"
                                                >
                                                    <Star className="mr-1 inline h-3.5 w-3.5" />
                                                    {hasEffectivePro ? 'Quitar PRO' : 'Dar PRO'}
                                                </button>

                                                {user.proAccessOverride !== null && user.proAccessOverride !== undefined && (
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handlePatchAction(
                                                            user.id,
                                                            { proAccessOverride: null },
                                                            `El acceso PRO de ${user.username} volvió a modo automático.`,
                                                            `¿Restaurar el PRO automático para ${user.username}?`,
                                                        )}
                                                        className="rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="Volver a decidir PRO según el pago"
                                                    >
                                                        <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
                                                        Automático
                                                    </button>
                                                )}

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
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No se encontraron usuarios con esos filtros.
                                    </td>
                                </tr>
                            )}

                            {loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Página {page} de {totalPages}. Total: {total.toLocaleString()} usuarios.
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
