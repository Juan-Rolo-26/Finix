import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, LayoutDashboard, FileText, FolderKanban, Users,
    ShieldAlert, CreditCard, Settings, AlertTriangle,
    Plus, Trash2, Pin, PinOff, Check, Loader2,
    DollarSign, TrendingUp, BarChart3, UserCheck, Shield,
    UserMinus, ExternalLink, Wallet, CheckCircle2,
    Building2, Sparkles, Globe,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useAuthStore, isCreatorUser } from '@/stores/authStore';

export default function CommunityAdmin() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [community, setCommunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'sections' | 'members' | 'moderation' | 'finance' | 'settings'>('overview');

    // Overview data
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Posts data
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    // Sections data
    const [sections, setSections] = useState<any[]>([]);
    const [loadingSections, setLoadingSections] = useState(false);
    const [showCreateSection, setShowCreateSection] = useState(false);
    const [newSection, setNewSection] = useState({ name: '', description: '', icon: 'Hash', visibility: 'PUBLIC' });

    // Members data
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberRoleFilter, setMemberRoleFilter] = useState('');

    // Moderation data
    const [reports, setReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [reportStatus, setReportStatus] = useState('PENDING');

    // Financial & Payment Gateway data
    const [finances, setFinances] = useState<any>(null);
    const [loadingFinances, setLoadingFinances] = useState(false);
    const [gatewayForm, setGatewayForm] = useState<any>({
        provider: 'stripe',
        isEnabled: true,
        currency: 'USD',
        stripeAccountId: '',
        stripePublishableKey: '',
        mpPublicKey: '',
        mpAccessToken: '',
        mpEmail: '',
        bankName: '',
        holderName: '',
        cbu: '',
        alias: '',
        cuit: '',
        customInstructions: '',
    });
    const [savingGateway, setSavingGateway] = useState(false);
    const [gatewaySuccess, setGatewaySuccess] = useState(false);

    // Settings state
    const [settingsForm, setSettingsForm] = useState<any>({});
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState(false);

    // Danger zone
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Load initial community data
    const fetchCommunity = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await apiFetch(`/communities/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCommunity(data);
                setSettingsForm({
                    name: data.name,
                    slug: data.slug || '',
                    description: data.description,
                    category: data.category,
                    privacyType: data.privacyType,
                    rules: data.rules || '',
                    imageUrl: data.imageUrl || '',
                    bannerUrl: data.bannerUrl || '',
                    accentColor: data.accentColor || '#10B981',
                    tags: data.tags || '',
                    showContentBeforeJoin: data.showContentBeforeJoin ?? true,
                    status: data.status || 'PUBLISHED',
                });
            } else {
                navigate('/comunidades');
            }
        } catch {
            navigate('/comunidades');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchCommunity();
    }, [fetchCommunity]);

    // Check creator permissions
    useEffect(() => {
        if (community && !community.canManage && !isCreatorUser(user)) {
            navigate(`/comunidades/${community.slug || community.id}`);
        }
    }, [community, user, navigate]);

    // Tab-specific data fetchers
    const fetchAnalytics = useCallback(async () => {
        if (!community?.id) return;
        setLoadingAnalytics(true);
        try {
            const res = await apiFetch(`/communities/${community.id}/analytics`);
            if (res.ok) setAnalytics(await res.json());
        } finally {
            setLoadingAnalytics(false);
        }
    }, [community?.id]);

    const fetchPosts = useCallback(async () => {
        if (!community?.id) return;
        setLoadingPosts(true);
        try {
            const res = await apiFetch(`/communities/${community.id}/posts?limit=50`);
            if (res.ok) setPosts(await res.json());
        } finally {
            setLoadingPosts(false);
        }
    }, [community?.id]);

    const fetchSections = useCallback(async () => {
        if (!community?.id) return;
        setLoadingSections(true);
        try {
            const res = await apiFetch(`/communities/${community.id}/sections`);
            if (res.ok) setSections(await res.json());
        } finally {
            setLoadingSections(false);
        }
    }, [community?.id]);

    const fetchMembers = useCallback(async () => {
        if (!community?.id) return;
        setLoadingMembers(true);
        try {
            const params = new URLSearchParams();
            if (memberSearch) params.set('search', memberSearch);
            if (memberRoleFilter) params.set('role', memberRoleFilter);
            const res = await apiFetch(`/communities/${community.id}/members?${params}`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } finally {
            setLoadingMembers(false);
        }
    }, [community?.id, memberSearch, memberRoleFilter]);

    const fetchReports = useCallback(async () => {
        if (!community?.id) return;
        setLoadingReports(true);
        try {
            const res = await apiFetch(`/communities/${community.id}/reports?status=${reportStatus}`);
            if (res.ok) setReports(await res.json());
        } finally {
            setLoadingReports(false);
        }
    }, [community?.id, reportStatus]);

    const fetchFinances = useCallback(async () => {
        if (!community?.id) return;
        setLoadingFinances(true);
        try {
            const res = await apiFetch(`/communities/${community.id}/finances`);
            if (res.ok) {
                const data = await res.json();
                setFinances(data);
                if (data.paymentGatewayConfig) {
                    setGatewayForm((prev: any) => ({ ...prev, ...data.paymentGatewayConfig }));
                }
            }
        } finally {
            setLoadingFinances(false);
        }
    }, [community?.id]);

    const handleSaveGateway = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!community?.id) return;
        setSavingGateway(true);
        setGatewaySuccess(false);
        try {
            const res = await apiFetch(`/communities/${community.id}/payment-gateway`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gatewayForm),
            });
            if (res.ok) {
                const data = await res.json();
                setGatewaySuccess(true);
                setTimeout(() => setGatewaySuccess(false), 4000);
                if (data.paymentGatewayConfig) {
                    setGatewayForm((prev: any) => ({ ...prev, ...data.paymentGatewayConfig }));
                }
            }
        } catch (err) {
            console.error('Error guardando pasarela de pagos:', err);
        } finally {
            setSavingGateway(false);
        }
    };

    useEffect(() => {
        if (!community) return;
        if (activeTab === 'overview') fetchAnalytics();
        if (activeTab === 'posts') fetchPosts();
        if (activeTab === 'sections') fetchSections();
        if (activeTab === 'members') fetchMembers();
        if (activeTab === 'moderation') fetchReports();
        if (activeTab === 'finance') fetchFinances();
    }, [activeTab, community, fetchAnalytics, fetchPosts, fetchSections, fetchMembers, fetchReports, fetchFinances]);

    // Section actions
    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSection.name.trim()) return;
        try {
            const res = await apiFetch(`/communities/${community.id}/sections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSection),
            });
            if (res.ok) {
                setNewSection({ name: '', description: '', icon: 'Hash', visibility: 'PUBLIC' });
                setShowCreateSection(false);
                fetchSections();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        if (!confirm('¿Eliminar esta sección? Las publicaciones no se borrarán pero quedarán sin sección.')) return;
        try {
            const res = await apiFetch(`/communities/${community.id}/sections/${sectionId}`, { method: 'DELETE' });
            if (res.ok) fetchSections();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        const newOrder = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;
        const [moved] = newOrder.splice(index, 1);
        newOrder.splice(targetIndex, 0, moved);
        setSections(newOrder);
        try {
            await apiFetch(`/communities/${community.id}/sections/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionIds: newOrder.map(s => s.id) }),
            });
        } catch (err) {
            console.error(err);
            fetchSections();
        }
    };

    // Post actions
    const handleTogglePin = async (postId: string, isPinned: boolean) => {
        try {
            const res = await apiFetch(`/communities/${community.id}/posts/${postId}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !isPinned }),
            });
            if (res.ok) fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('¿Eliminar esta publicación de forma permanente?')) return;
        try {
            const res = await apiFetch(`/communities/${community.id}/posts/${postId}`, { method: 'DELETE' });
            if (res.ok) fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    // Member actions
    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            const res = await apiFetch(`/communities/${community.id}/members/${memberId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) fetchMembers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('¿Estás seguro de expulsar a este miembro de la comunidad?')) return;
        try {
            const res = await apiFetch(`/communities/${community.id}/members/${memberId}`, { method: 'DELETE' });
            if (res.ok) fetchMembers();
        } catch (err) {
            console.error(err);
        }
    };

    // Moderation report actions
    const handleResolveReport = async (reportId: string, actionTaken: string, status: string = 'RESOLVED') => {
        try {
            const res = await apiFetch(`/communities/${community.id}/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionTaken, status }),
            });
            if (res.ok) fetchReports();
        } catch (err) {
            console.error(err);
        }
    };

    // Settings save
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        setSettingsSuccess(false);
        try {
            const res = await apiFetch(`/communities/${community.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsForm),
            });
            if (res.ok) {
                const updated = await res.json();
                setCommunity(updated);
                setSettingsSuccess(true);
                setTimeout(() => setSettingsSuccess(false), 3000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingSettings(false);
        }
    };

    // Delete community
    const handleDeleteCommunity = async () => {
        if (deleteConfirmText !== community.name) {
            alert('Por favor escribe el nombre exacto de la comunidad para confirmar.');
            return;
        }
        setIsDeleting(true);
        try {
            const res = await apiFetch(`/communities/${community.id}`, { method: 'DELETE' });
            if (res.ok) {
                navigate('/comunidades');
            }
        } catch (err) {
            console.error(err);
            alert('Error al eliminar la comunidad');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            </div>
        );
    }

    if (!community) return null;

    const navItems = [
        { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
        { key: 'posts', label: 'Publicaciones', icon: FileText },
        { key: 'sections', label: 'Secciones', icon: FolderKanban },
        { key: 'members', label: 'Miembros', icon: Users },
        { key: 'moderation', label: 'Moderación', icon: ShieldAlert },
        { key: 'finance', label: 'Finanzas & Pagos', icon: CreditCard },
        { key: 'settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/comunidades/${community.slug || community.id}`)}
                        className="p-2 rounded-xl border hover:bg-muted transition-colors"
                        style={{ borderColor: 'hsl(var(--border))' }}
                        title="Volver a la comunidad"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{community.name}</h1>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                Creator Studio
                            </span>
                            {community.status === 'DRAFT' && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-500">
                                    Borrador
                                </span>
                            )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            @{community.slug || community.id} · {community._count?.members || 0} miembros
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/comunidades/${community.slug || community.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border hover:bg-muted transition-colors"
                        style={{ borderColor: 'hsl(var(--border))' }}
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver comunidad pública
                    </Link>
                </div>
            </div>

            {/* Layout: Sidebar Tabs + Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Navigation Sidebar */}
                <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide md:space-y-1">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => setActiveTab(item.key as any)}
                                className="shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-left"
                                style={{
                                    background: active ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted)/0.4)',
                                    color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                    border: active ? '1px solid hsl(var(--primary)/0.3)' : '1px solid hsl(var(--border)/0.5)',
                                }}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-6">
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {loadingAnalytics && (
                                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            )}
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <span>Miembros Totales</span>
                                        <Users className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold mt-2">{analytics?.membersCount ?? community._count?.members ?? 0}</p>
                                    <span className="text-[11px] text-emerald-500 font-medium">+{analytics?.newMembersThisMonth ?? 0} este mes</span>
                                </div>

                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <span>Miembros de Pago</span>
                                        <UserCheck className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-2xl font-bold mt-2">{analytics?.activePaidMembers ?? 0}</p>
                                    <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Suscripciones activas</span>
                                </div>

                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <span>MRR Estimado</span>
                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-2xl font-bold mt-2">${analytics?.monthlyRecurringRevenue?.toFixed(2) ?? '0.00'}</p>
                                    <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Ingreso mensual recurrente</span>
                                </div>

                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <span>Ingresos Netos Totales</span>
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold mt-2">${analytics?.netCreatorRevenue?.toFixed(2) ?? '0.00'}</p>
                                    <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Neto después de comisiones</span>
                                </div>

                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <span>Publicaciones</span>
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold mt-2">{analytics?.postsCount ?? community._count?.posts ?? 0}</p>
                                    <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>En todas las secciones</span>
                                </div>

                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <span>Tasa de Crecimiento</span>
                                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-2xl font-bold mt-2">+{analytics?.memberGrowthRate ?? 0}%</p>
                                    <span className="text-[11px] text-emerald-500 font-medium">Comparado al mes anterior</span>
                                </div>
                            </div>

                            {/* Plans breakdown */}
                            {analytics?.plans?.length > 0 && (
                                <div className="p-5 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <h3 className="text-sm font-bold mb-3">Distribución por Planes</h3>
                                    <div className="space-y-2">
                                        {analytics.plans.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                                                <div>
                                                    <p className="text-xs font-semibold">{p.name}</p>
                                                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        ${p.price}/{p.interval === 'monthly' ? 'mes' : 'año'}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-bold">{p.membersCount} miembros</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Audit Log */}
                            {analytics?.recentAudit?.length > 0 && (
                                <div className="p-5 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <h3 className="text-sm font-bold mb-3">Registro de Actividad Administrativa</h3>
                                    <div className="space-y-2">
                                        {analytics.recentAudit.map((log: any) => (
                                            <div key={log.id} className="flex items-center justify-between text-xs py-2 border-b last:border-0"
                                                style={{ borderColor: 'hsl(var(--border))' }}>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted font-semibold">
                                                        {log.action}
                                                    </span>
                                                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        por @{log.actor?.username || 'admin'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    {new Date(log.createdAt).toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: SECTIONS */}
                    {activeTab === 'sections' && (
                        <div className="space-y-4">
                            {loadingSections && (
                                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            )}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold">Secciones de la Comunidad</h2>
                                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Organiza tus publicaciones por temáticas para facilitar la lectura de tus miembros.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateSection(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl btn-primary-glow"
                                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    <Plus className="w-4 h-4" /> Nueva sección
                                </button>
                            </div>

                            {/* Create Section Modal */}
                            {showCreateSection && (
                                <form onSubmit={handleCreateSection} className="p-4 rounded-2xl border space-y-3"
                                    style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Crear nueva sección</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[11px] font-medium block mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej: Análisis Fundamental"
                                                value={newSection.name}
                                                onChange={e => setNewSection(s => ({ ...s, name: e.target.value }))}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium block mb-1">Visibilidad</label>
                                            <select
                                                value={newSection.visibility}
                                                onChange={e => setNewSection(s => ({ ...s, visibility: e.target.value }))}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            >
                                                <option value="PUBLIC">Pública</option>
                                                <option value="MEMBERS_ONLY">Solo Miembros</option>
                                                <option value="PREMIUM">Solo Planes de Pago</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-medium block mb-1">Descripción</label>
                                        <input
                                            type="text"
                                            placeholder="Breve descripción del propósito de esta sección"
                                            value={newSection.description}
                                            onChange={e => setNewSection(s => ({ ...s, description: e.target.value }))}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateSection(false)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-muted"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 text-xs font-semibold rounded-xl"
                                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                        >
                                            Crear Sección
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Sections list */}
                            <div className="space-y-2">
                                {sections.map((section, idx) => (
                                    <div
                                        key={section.id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl border"
                                        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs">{section.name}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                    style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                                    {section.visibility === 'PUBLIC' ? 'Pública' : section.visibility === 'MEMBERS_ONLY' ? 'Solo Miembros' : 'Premium'}
                                                </span>
                                            </div>
                                            {section.description && (
                                                <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={idx === 0}
                                                onClick={() => handleMoveSection(idx, 'up')}
                                                className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-30"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                                title="Mover arriba"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                disabled={idx === sections.length - 1}
                                                onClick={() => handleMoveSection(idx, 'down')}
                                                className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-30"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                                title="Mover abajo"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSection(section.id)}
                                                className="p-1.5 rounded-lg border text-red-500 hover:bg-red-500/10 ml-2"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                                title="Eliminar sección"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB: POSTS */}
                    {activeTab === 'posts' && (
                        <div className="space-y-4">
                            {loadingPosts && (
                                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            )}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold">Gestión de Publicaciones</h2>
                                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Administra, fija y modera las publicaciones de tu comunidad.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {posts.map(post => (
                                    <div
                                        key={post.id}
                                        className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    >
                                        <div className="space-y-1 max-w-xl">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs">@{post.author?.username}</span>
                                                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    {new Date(post.createdAt).toLocaleDateString('es-AR')}
                                                </span>
                                                {post.isPinned && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 flex items-center gap-1">
                                                        <Pin className="w-3 h-3" /> Fijada
                                                    </span>
                                                )}
                                                {post.section && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">
                                                        {post.section.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--foreground))' }}>
                                                {post.content || '(Contenido multimedia o exclusivo)'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleTogglePin(post.id, post.isPinned)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${post.isPinned ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'hover:bg-muted'}`}
                                                style={{ borderColor: !post.isPinned ? 'hsl(var(--border))' : undefined }}
                                            >
                                                {post.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                                {post.isPinned ? 'Desfijar' : 'Fijar'}
                                            </button>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="p-1.5 rounded-xl border text-red-500 hover:bg-red-500/10"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                                title="Eliminar publicación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {posts.length === 0 && (
                                    <div className="text-center py-12 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        No hay publicaciones en esta comunidad todavía.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: MEMBERS */}
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            {loadingMembers && (
                                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold">Gestión de Miembros</h2>
                                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Administra permisos, roles de moderación y acceso a la comunidad.
                                    </p>
                                </div>
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        placeholder="Buscar por username..."
                                        value={memberSearch}
                                        onChange={e => setMemberSearch(e.target.value)}
                                        className="flex-1 sm:w-48 px-3 py-1.5 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                    <select
                                        value={memberRoleFilter}
                                        onChange={e => setMemberRoleFilter(e.target.value)}
                                        className="px-3 py-1.5 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    >
                                        <option value="">Todos los roles</option>
                                        <option value="MODERATOR">Moderadores</option>
                                        <option value="MEMBER">Miembros</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {members.map(m => {
                                    const isOwner = m.role === 'OWNER' || m.userId === community.creatorId;
                                    return (
                                        <div
                                            key={m.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border gap-3"
                                            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-xs">
                                                    {m.user?.avatarUrl ? (
                                                        <img src={resolveMediaUrl(m.user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        m.user?.username?.[0]?.toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-xs truncate">@{m.user?.username}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isOwner ? 'bg-primary/10 text-primary' : m.role === 'MODERATOR' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground'}`}>
                                                             {isOwner ? 'OWNER' : m.role}
                                                        </span>
                                                        {m.plan && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium truncate max-w-[120px]">
                                                                Plan: {m.plan.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        Miembro desde {new Date(m.joinedAt).toLocaleDateString('es-AR')}
                                                    </span>
                                                </div>
                                            </div>

                                            {!isOwner && (
                                                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0" style={{ borderColor: 'hsl(var(--border))' }}>
                                                    {m.role === 'MODERATOR' ? (
                                                        <button
                                                            onClick={() => handleRoleChange(m.userId, 'MEMBER')}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-xl border hover:bg-muted"
                                                            style={{ borderColor: 'hsl(var(--border))' }}
                                                        >
                                                            Quitar Moderador
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRoleChange(m.userId, 'MODERATOR')}
                                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl border text-indigo-500 hover:bg-indigo-500/10"
                                                            style={{ borderColor: 'hsl(var(--border))' }}
                                                        >
                                                            <Shield className="w-3 h-3" /> Hacer Moderador
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveMember(m.userId)}
                                                        className="p-1.5 rounded-xl border text-red-500 hover:bg-red-500/10"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                        title="Expulsar miembro"
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB: MODERATION & REPORTS */}
                    {activeTab === 'moderation' && (
                        <div className="space-y-4">
                            {loadingReports && (
                                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold">Cola de Moderación</h2>
                                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Revisa reportes enviados por miembros de la comunidad sobre spam, acoso o contenido inapropiado.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto">
                                    <button
                                        onClick={() => setReportStatus('PENDING')}
                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${reportStatus === 'PENDING' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        Pendientes
                                    </button>
                                    <button
                                        onClick={() => setReportStatus('RESOLVED')}
                                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${reportStatus === 'RESOLVED' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        Resueltos
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {reports.map(report => (
                                    <div
                                        key={report.id}
                                        className="p-4 rounded-2xl border space-y-2"
                                        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                    {report.reason}
                                                </span>
                                                <span className="text-xs font-semibold">Tipo: {report.targetType}</span>
                                            </div>
                                            <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {new Date(report.createdAt).toLocaleString('es-AR')}
                                            </span>
                                        </div>

                                        {report.details && (
                                            <p className="text-xs bg-muted/30 p-2.5 rounded-xl font-mono">
                                                "{report.details}"
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                                            <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Reportado por @{report.reporter?.username || 'usuario'}
                                            </span>

                                            {report.status === 'PENDING' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleResolveReport(report.id, 'NONE', 'DISMISSED')}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border hover:bg-muted"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    >
                                                        Descartar
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolveReport(report.id, 'DELETED', 'RESOLVED')}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600"
                                                    >
                                                        Eliminar Contenido
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {reports.length === 0 && (
                                    <div className="text-center py-12 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        No hay reportes {reportStatus === 'PENDING' ? 'pendientes' : 'resueltos'}.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: FINANCES */}
                    {activeTab === 'finance' && (
                        <div className="space-y-6">
                            {loadingFinances && (
                                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            )}
                            <div>
                                <h2 className="text-base font-bold">Finanzas y Pasarela de Pagos</h2>
                                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Configura tu pasarela de cobro para recibir pagos de tus miembros y supervisa tus ingresos y comisiones.
                                </p>
                            </div>

                            {/* Resumen de ingresos */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Ingresos Brutos</span>
                                    <p className="text-2xl font-bold mt-1 text-primary">${finances?.summary?.gross?.toFixed(2) ?? '0.00'}</p>
                                </div>
                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Comisión Finix (10%)</span>
                                    <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        ${finances?.summary?.commissions?.toFixed(2) ?? '0.00'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Ingresos Netos del Creador</span>
                                    <p className="text-2xl font-bold mt-1 text-emerald-500">${finances?.summary?.net?.toFixed(2) ?? '0.00'}</p>
                                </div>
                            </div>

                            {/* CONFIGURACIÓN DE PASARELA DE PAGO */}
                            <div className="p-6 rounded-2xl border space-y-5"
                                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
                                    style={{ borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold">Pasarela de Cobro para Miembros</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Elegí cómo querés que tus miembros te paguen las membresías de la comunidad.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                            gatewayForm.isEnabled
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full ${gatewayForm.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                            {gatewayForm.isEnabled ? 'Pasarela Activa (Cobros Habilitados)' : 'Pasarela en Pausa'}
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveGateway} className="space-y-5">
                                    {/* Selector de Proveedor */}
                                    <div>
                                        <label className="text-xs font-bold block mb-2 text-foreground">
                                            Método de Cobro Principal
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            {[
                                                { id: 'stripe', title: 'Stripe Global', desc: 'Tarjetas Visa, Mastercard, AMEX (USD)', icon: Globe },
                                                { id: 'mercadopago', title: 'Mercado Pago', desc: 'Tarjetas, Débito, Dinero en cuenta (ARS)', icon: Wallet },
                                                { id: 'bank_transfer', title: 'Transferencia Directa', desc: 'CBU, CVU o Alias bancario local', icon: Building2 },
                                                { id: 'both', title: 'Híbrido (Stripe + MP)', desc: 'Permite pagar con tarjeta o Mercado Pago', icon: Sparkles },
                                            ].map((provider) => {
                                                const Icon = provider.icon;
                                                const selected = gatewayForm.provider === provider.id;
                                                return (
                                                    <button
                                                        key={provider.id}
                                                        type="button"
                                                        onClick={() => setGatewayForm({ ...gatewayForm, provider: provider.id })}
                                                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                                                            selected
                                                                ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                                                                : 'border-border/60 hover:border-zinc-500 bg-background/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <Icon className={`w-4 h-4 ${selected ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                                                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-foreground">{provider.title}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{provider.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Campos específicos según proveedor */}
                                    {(gatewayForm.provider === 'stripe' || gatewayForm.provider === 'both') && (
                                        <div className="p-4 rounded-xl border border-border/70 bg-background/50 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-primary" />
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Configuración de Stripe</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Stripe Account ID o Email de Cuenta
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="acct_1XXXXXXXXX o creador@stripe.com"
                                                        value={gatewayForm.stripeAccountId || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, stripeAccountId: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Stripe Publishable Key (Opcional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="pk_live_..."
                                                        value={gatewayForm.stripePublishableKey || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, stripePublishableKey: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground font-mono"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(gatewayForm.provider === 'mercadopago' || gatewayForm.provider === 'both') && (
                                        <div className="p-4 rounded-xl border border-border/70 bg-background/50 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-emerald-400" />
                                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Configuración de Mercado Pago</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Public Key de Mercado Pago
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="APP_USR-XXXXXX o TEST-XXXXXX"
                                                        value={gatewayForm.mpPublicKey || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, mpPublicKey: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground font-mono"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Email de tu Cuenta Mercado Pago
                                                    </label>
                                                    <input
                                                        type="email"
                                                        placeholder="creador@mercadopago.com"
                                                        value={gatewayForm.mpEmail || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, mpEmail: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {(gatewayForm.provider === 'bank_transfer' || gatewayForm.provider === 'both') && (
                                        <div className="p-4 rounded-xl border border-border/70 bg-background/50 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-primary" />
                                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Datos para Transferencia Bancaria (CBU / Alias)</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Alias Bancario / CVU
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="MI.COMUNIDAD.MP"
                                                        value={gatewayForm.alias || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, alias: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground uppercase font-bold"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        CBU o CVU (22 dígitos)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        maxLength={22}
                                                        placeholder="00000031000XXXXXXXXXXX"
                                                        value={gatewayForm.cbu || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, cbu: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground font-mono"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Banco o Billetera
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Mercado Pago / Santander / Brubank"
                                                        value={gatewayForm.bankName || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, bankName: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        Nombre del Titular de la Cuenta
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre y Apellido"
                                                        value={gatewayForm.holderName || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, holderName: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-semibold block mb-1 text-muted-foreground">
                                                        CUIT / CUIL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="20-XXXXXXXX-X"
                                                        value={gatewayForm.cuit || ''}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, cuit: e.target.value })}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground font-mono"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Moneda y Switch de activación */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="text-xs font-bold block mb-1 text-foreground">
                                                Moneda de Cobro Predeterminada
                                            </label>
                                            <select
                                                value={gatewayForm.currency || 'USD'}
                                                onChange={e => setGatewayForm({ ...gatewayForm, currency: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background text-foreground"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            >
                                                <option value="USD">USD ($ Dólares Estadounidenses) - Internacional</option>
                                                <option value="ARS">ARS ($ Pesos Argentinos) - Mercado Pago / Local</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold block mb-1 text-foreground">
                                                Estado de Cobros
                                            </label>
                                            <div className="flex items-center gap-3 mt-2">
                                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={gatewayForm.isEnabled}
                                                        onChange={e => setGatewayForm({ ...gatewayForm, isEnabled: e.target.checked })}
                                                        className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                    <span>Habilitar pasarela y aceptar pagos de nuevos miembros</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feedback de guardado */}
                                    {gatewaySuccess && (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                                            <span>¡Pasarela de pagos configurada con éxito! Tus miembros ya pueden pagar sus membresías.</span>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={savingGateway}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
                                        >
                                            {savingGateway && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Guardar Pasarela de Pago
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* HISTORIAL DE TRANSACCIONES */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Historial de Transacciones</h3>
                                <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: 'hsl(var(--border))' }}>
                                    <table className="w-full text-xs text-left min-w-[500px]">
                                        <thead className="bg-muted/50 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                                            <tr>
                                                <th className="p-3">Fecha</th>
                                                <th className="p-3">Usuario</th>
                                                <th className="p-3">Monto</th>
                                                <th className="p-3">Neto Creador</th>
                                                <th className="p-3">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                                            {finances?.payments?.map((payment: any) => (
                                                <tr key={payment.id} className="hover:bg-muted/30">
                                                    <td className="p-3">{new Date(payment.createdAt).toLocaleDateString('es-AR')}</td>
                                                    <td className="p-3 font-semibold">@{payment.user?.username}</td>
                                                    <td className="p-3 font-bold">${Number(payment.amount).toFixed(2)}</td>
                                                    <td className="p-3 text-emerald-500 font-bold">${Number(payment.creatorAmount).toFixed(2)}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!finances?.payments || finances.payments.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        No hay pagos registrados todavía.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SETTINGS & DANGER ZONE */}
                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl border space-y-4"
                                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                <h2 className="text-base font-bold">Configuración General</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Nombre de la Comunidad</label>
                                        <input
                                            type="text"
                                            required
                                            value={settingsForm.name || ''}
                                            onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Handle / Slug</label>
                                        <input
                                            type="text"
                                            value={settingsForm.slug || ''}
                                            onChange={e => setSettingsForm({ ...settingsForm, slug: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Descripción</label>
                                    <textarea
                                        rows={3}
                                        value={settingsForm.description || ''}
                                        onChange={e => setSettingsForm({ ...settingsForm, description: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Categoría</label>
                                        <input
                                            type="text"
                                            value={settingsForm.category || ''}
                                            onChange={e => setSettingsForm({ ...settingsForm, category: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Privacidad</label>
                                        <select
                                            value={settingsForm.privacyType || 'PUBLIC'}
                                            onChange={e => setSettingsForm({ ...settingsForm, privacyType: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        >
                                            <option value="PUBLIC">Pública</option>
                                            <option value="PRIVATE">Privada (Requiere aprobación)</option>
                                            <option value="EXCLUSIVE">Exclusiva (Solo pago)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Estado</label>
                                        <select
                                            value={settingsForm.status || 'PUBLISHED'}
                                            onChange={e => setSettingsForm({ ...settingsForm, status: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        >
                                            <option value="PUBLISHED">Publicada</option>
                                            <option value="DRAFT">Borrador</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Reglas de la Comunidad</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Pautas de convivencia, normas de participación, etc."
                                        value={settingsForm.rules || ''}
                                        onChange={e => setSettingsForm({ ...settingsForm, rules: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="showContentBeforeJoin"
                                        checked={Boolean(settingsForm.showContentBeforeJoin)}
                                        onChange={e => setSettingsForm({ ...settingsForm, showContentBeforeJoin: e.target.checked })}
                                        className="rounded border"
                                    />
                                    <label htmlFor="showContentBeforeJoin" className="text-xs font-medium cursor-pointer">
                                        Mostrar vista previa del contenido antes de unirse
                                    </label>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                                    {settingsSuccess ? (
                                        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                                            <Check className="w-4 h-4" /> Cambios guardados correctamente
                                        </span>
                                    ) : <div />}

                                    <button
                                        type="submit"
                                        disabled={savingSettings}
                                        className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl btn-primary-glow"
                                        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                    >
                                        {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Guardar Configuración
                                    </button>
                                </div>
                            </form>

                            {/* DANGER ZONE */}
                            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-4">
                                <div className="flex items-center gap-2 text-red-500">
                                    <AlertTriangle className="w-5 h-5" />
                                    <h3 className="text-sm font-bold">Zona de Peligro</h3>
                                </div>
                                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Eliminar la comunidad borrará de manera irreversible todas las secciones, miembros, suscripciones e historial asociado.
                                </p>

                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-semibold block text-red-500">
                                        Para confirmar, escribe "{community.name}":
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={community.name}
                                        value={deleteConfirmText}
                                        onChange={e => setDeleteConfirmText(e.target.value)}
                                        className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>

                                <button
                                    onClick={handleDeleteCommunity}
                                    disabled={deleteConfirmText !== community.name || isDeleting}
                                    className="px-5 py-2 text-xs font-bold rounded-xl bg-red-500 text-white disabled:opacity-40 hover:bg-red-600 transition-colors"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Eliminar Comunidad Definitivamente'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
