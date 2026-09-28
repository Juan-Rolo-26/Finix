import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Loader2, UserPlus, UserRoundCheck, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ConnectionsListType = 'followers' | 'following';

interface ConnectionUser {
    id: string;
    username: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    isInfluencer?: boolean;
    title?: string | null;
    company?: string | null;
    bio?: string | null;
    isFollowedByMe: boolean;
}

interface UserConnectionsDialogProps {
    open: boolean;
    username: string;
    listType: ConnectionsListType;
    counts: { followers?: number; following?: number };
    onListTypeChange: (type: ConnectionsListType) => void;
    onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 20;

function formatCount(count?: number) {
    return typeof count === 'number' ? count.toLocaleString('es-AR') : '—';
}

export function UserConnectionsDialog({
    open,
    username,
    listType,
    counts,
    onListTypeChange,
    onOpenChange,
}: UserConnectionsDialogProps) {
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);
    const [users, setUsers] = useState<ConnectionUser[]>([]);
    const [total, setTotal] = useState<number | null>(null);
    const [canView, setCanView] = useState<boolean | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [reloadVersion, setReloadVersion] = useState(0);

    useEffect(() => {
        if (!open || !username) return;
        let cancelled = false;
        const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: '0' });

        setUsers([]);
        setTotal(null);
        setCanView(null);
        setHasMore(false);
        setError('');
        setLoading(true);

        apiFetch(`/users/${encodeURIComponent(username)}/${listType}?${query.toString()}`)
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data?.message || 'No se pudo cargar la lista.');
                if (cancelled) return;
                setUsers(Array.isArray(data.users) ? data.users : []);
                setTotal(typeof data.total === 'number' ? data.total : null);
                setCanView(data.canView !== false);
                setHasMore(Boolean(data.hasMore));
            })
            .catch((requestError) => {
                if (!cancelled) setError(requestError?.message || 'No se pudo cargar la lista.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [open, username, listType, reloadVersion]);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        setError('');
        try {
            const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(users.length) });
            const response = await apiFetch(`/users/${encodeURIComponent(username)}/${listType}?${query.toString()}`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || 'No se pudieron cargar más personas.');
            setUsers((current) => [...current, ...(Array.isArray(data.users) ? data.users : [])]);
            setHasMore(Boolean(data.hasMore));
        } catch (requestError: any) {
            setError(requestError?.message || 'No se pudieron cargar más personas.');
        } finally {
            setLoadingMore(false);
        }
    };

    const toggleFollow = async (person: ConnectionUser) => {
        if (!currentUser || busyUserId) return;
        setBusyUserId(person.id);
        setError('');
        try {
            const response = await apiFetch(`/users/${encodeURIComponent(person.username)}/follow`, { method: 'PATCH' });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || 'No se pudo actualizar el seguimiento.');
            setUsers((current) => current.map((user) => user.id === person.id
                ? { ...user, isFollowedByMe: Boolean(data.following) }
                : user));
        } catch (requestError: any) {
            setError(requestError?.message || 'No se pudo actualizar el seguimiento.');
        } finally {
            setBusyUserId(null);
        }
    };

    const openProfile = (personUsername: string) => {
        onOpenChange(false);
        navigate(`/profile/${encodeURIComponent(personUsername)}`);
    };

    const title = listType === 'followers' ? 'Seguidores' : 'Siguiendo';
    const description = listType === 'followers'
        ? `Personas que siguen a @${username}`
        : `Personas a las que sigue @${username}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b border-border/70 px-5 pb-4 pt-5 text-left sm:px-6">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        {title} de @{username}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-1 border-b border-border/60 bg-muted/30 p-2">
                    {(['followers', 'following'] as const).map((type) => {
                        const selected = listType === type;
                        const label = type === 'followers' ? 'Seguidores' : 'Siguiendo';
                        const count = type === 'followers' ? counts.followers : counts.following;
                        return (
                            <button
                                key={type}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                onClick={() => onListTypeChange(type)}
                                className={cn(
                                    'rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                                    selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                                )}
                            >
                                {label} <span className="ml-1 tabular-nums text-muted-foreground">{formatCount(count)}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="max-h-[min(60vh,440px)] min-h-48 overflow-y-auto p-3 sm:p-4" role="tabpanel">
                    {loading ? (
                        <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando {title.toLowerCase()}…
                        </div>
                    ) : canView === false ? (
                        <div className="flex min-h-40 flex-col items-center justify-center px-5 text-center">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <LockKeyhole className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">Esta lista es privada</p>
                            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                                Solo la persona dueña del perfil y sus seguidores pueden verla.
                            </p>
                        </div>
                    ) : error && users.length === 0 ? (
                        <div className="flex min-h-40 flex-col items-center justify-center text-center">
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <button
                                type="button"
                                onClick={() => setReloadVersion((version) => version + 1)}
                                className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex min-h-40 flex-col items-center justify-center text-center">
                            <Users className="mb-3 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm font-semibold text-foreground">
                                {listType === 'followers' ? 'Todavía no tiene seguidores' : 'Todavía no sigue a nadie'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {users.map((person) => {
                                const busy = busyUserId === person.id;
                                const isOwnAccount = person.id === currentUser?.id;
                                return (
                                    <div key={person.id} className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-muted/50">
                                        <button
                                            type="button"
                                            onClick={() => openProfile(person.username)}
                                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                                        >
                                            <Avatar className="h-11 w-11 border border-border/70">
                                                <AvatarImage src={person.avatarUrl || undefined} alt={`Foto de ${person.username}`} />
                                                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                                                    {person.username.slice(0, 1).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="truncate text-sm font-bold text-foreground">@{person.username}</span>
                                                    <VerifiedBadge isVerified={person.isVerified} size="xs" />
                                                </span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {[person.title, person.company].filter(Boolean).join(' · ') || person.bio || 'Perfil de Finix'}
                                                </span>
                                            </span>
                                        </button>

                                        {currentUser && !isOwnAccount && (
                                            <button
                                                type="button"
                                                disabled={busy || busyUserId !== null}
                                                onClick={() => void toggleFollow(person)}
                                                className={cn(
                                                    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60',
                                                    person.isFollowedByMe
                                                        ? 'border-border bg-muted text-foreground hover:bg-muted/70'
                                                        : 'border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90',
                                                )}
                                                aria-label={`${person.isFollowedByMe ? 'Dejar de seguir a' : 'Seguir a'} @${person.username}`}
                                            >
                                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : person.isFollowedByMe ? <UserRoundCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                                                <span className="hidden sm:inline">{person.isFollowedByMe ? 'Siguiendo' : 'Seguir'}</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {error && users.length > 0 && (
                        <p className="px-2 pt-2 text-xs text-destructive" role="alert">{error}</p>
                    )}
                    {hasMore && canView && (
                        <button
                            type="button"
                            onClick={() => void loadMore()}
                            disabled={loadingMore}
                            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                        >
                            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loadingMore ? 'Cargando…' : 'Cargar más'}
                        </button>
                    )}
                    {total !== null && canView && users.length > 0 && (
                        <p className="pt-3 text-center text-[11px] text-muted-foreground">
                            {users.length.toLocaleString('es-AR')} de {total.toLocaleString('es-AR')}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
