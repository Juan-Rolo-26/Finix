import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
    Search, Plus, Users, TrendingUp, Sparkles, Lock,
    Crown, ChevronRight, X, Check, ArrowLeft, Loader2,
    Globe, BookOpen, BarChart3, Cpu, Building2, Coins,
    Leaf, Flame, DollarSign, Shield, Hash, BadgeCheck,
    Heart, MessageCircle,
    AlertCircle, Upload, Image as ImageIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import CommunityDetail from './CommunityDetail';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommunityPlan {
    id: string; name: string; price: number; interval: string;
    features: string | string[]; tierLevel: number;
}

interface Community {
    id: string; name: string; description: string; category: string;
    imageUrl?: string; bannerUrl?: string; privacyType: string;
    createdAt: string; rules?: string;
    creator: { id: string; username: string; avatarUrl?: string; isVerified: boolean };
    plans: CommunityPlan[];
    _count: { members: number; posts: number; resources: number; events?: number };
    isMember: boolean; tierLevel: number;
}

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
    { key: 'all', label: 'Todo', icon: Sparkles },
    { key: 'Acciones', label: 'Acciones', icon: TrendingUp },
    { key: 'Cripto', label: 'Cripto', icon: Hash },
    { key: 'Bonos', label: 'Bonos', icon: Coins },
    { key: 'Finanzas personales', label: 'Finanzas', icon: DollarSign },
    { key: 'Macro', label: 'Macro', icon: Globe },
    { key: 'Trading', label: 'Trading', icon: BarChart3 },
    { key: 'Educación', label: 'Educación', icon: BookOpen },
    { key: 'Tecnología', label: 'Tecnología', icon: Cpu },
    { key: 'Empresas', label: 'Empresas', icon: Building2 },
    { key: 'Dividendos', label: 'Dividendos', icon: Leaf },
    { key: 'Largo plazo', label: 'Largo plazo', icon: Flame },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMinPrice(plans: CommunityPlan[]): number | null {
    const paid = plans.filter(p => p.price > 0);
    if (paid.length === 0) return null;
    return Math.min(...paid.map(p => Number(p.price)));
}

function formatMembers(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
}

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({ community, onOpen }: { community: Community; onOpen: () => void }) {
    const minPrice = getMinPrice(community.plans);
    const hasFree = community.plans.some(p => Number(p.price) === 0);
    const CategoryIcon = CATEGORIES.find(c => c.key === community.category)?.icon ?? Users;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
            style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 1px 3px hsl(0 0% 0% / 0.06)',
            }}
            onClick={onOpen}
        >
            {/* Banner */}
            <div className="relative h-28 overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                {community.bannerUrl ? (
                    <img
                        src={resolveMediaUrl(community.bannerUrl)}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.15) 0%, hsl(var(--primary)/0.05) 100%)' }}>
                        <CategoryIcon className="w-8 h-8" style={{ color: 'hsl(var(--primary)/0.3)' }} />
                    </div>
                )}
                {/* Privacy badge */}
                {community.privacyType !== 'PUBLIC' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
                        style={{ background: 'hsl(0 0% 0% / 0.5)', color: '#fff' }}>
                        <Lock className="w-2.5 h-2.5" />
                        {community.privacyType === 'PRIVATE' ? 'Privada' : 'Exclusiva'}
                    </div>
                )}
                {community.isMember && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                        <Check className="w-2.5 h-2.5" /> Miembro
                    </div>
                )}
            </div>

            {/* Avatar overlap */}
            <div className="relative px-4 -mt-6">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 shadow-lg"
                    style={{ borderColor: 'hsl(var(--card))', background: 'hsl(var(--muted))' }}>
                    {community.imageUrl ? (
                        <img src={resolveMediaUrl(community.imageUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold"
                            style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}>
                            {community.name[0]}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col px-4 pb-4 pt-2 gap-2">
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">
                            {community.name}
                        </h3>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        @{community.creator.username}
                        {community.creator.isVerified && (
                            <BadgeCheck className="inline w-3 h-3 ml-0.5" style={{ color: 'hsl(var(--primary))' }} />
                        )}
                    </p>
                </div>

                <p className="text-[12px] line-clamp-2 leading-relaxed flex-1"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {community.description}
                </p>

                {/* Category chip */}
                <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                        <CategoryIcon className="w-2.5 h-2.5" />
                        {community.category}
                    </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />
                            {formatMembers(community._count.members)}
                        </span>
                        <span className="flex items-center gap-0.5">
                            <MessageCircle className="w-3 h-3" />
                            {community._count.posts}
                        </span>
                    </div>
                    <div className="text-[11px] font-semibold">
                        {minPrice === null ? (
                            <span style={{ color: 'hsl(145 65% 36%)' }}>Gratis</span>
                        ) : hasFree ? (
                            <span style={{ color: 'hsl(var(--primary))' }}>Desde ${minPrice}/mes</span>
                        ) : (
                            <span style={{ color: 'hsl(var(--primary))' }}>${minPrice}/mes</span>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <button
                    className="w-full rounded-xl py-2 text-[12px] font-semibold transition-all mt-1"
                    style={{
                        background: community.isMember ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                        color: community.isMember ? 'hsl(var(--foreground))' : 'hsl(var(--primary-foreground))',
                    }}
                    onClick={e => { e.stopPropagation(); onOpen(); }}
                >
                    {community.isMember ? 'Ver comunidad' : 'Unirse'}
                </button>
            </div>
        </motion.div>
    );
}

// ─── Create Community Modal ───────────────────────────────────────────────────

const CREATION_STEPS = ['Información', 'Privacidad', 'Monetización', 'Planes', 'Revisión'];

const DEFAULT_PLAN = { name: '', price: 0, interval: 'monthly', features: [''], tierLevel: 1 };

function CreateCommunityModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (c: Community) => void;
}) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isUploadingObj, setIsUploadingObj] = useState<{ [key: string]: boolean }>({});

    const handleUploadMedia = async (file: File, field: 'imageUrl' | 'bannerUrl') => {
        setIsUploadingObj(prev => ({ ...prev, [field]: true }));
        try {
            const formData = new FormData();
            formData.append('files', file);
            const res = await apiFetch('/posts/upload-media', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Error al subir imagen');
            const data = await res.json();
            if (data?.[0]?.url) {
                setForm(f => ({ ...f, [field]: data[0].url }));
            }
        } catch (e) {
            console.error(e);
            alert('No se pudo subir la imagen');
        } finally {
            setIsUploadingObj(prev => ({ ...prev, [field]: false }));
        }
    };

    const [form, setForm] = useState({
        name: '', description: '', category: 'Acciones',
        imageUrl: '', bannerUrl: '', privacyType: 'PUBLIC',
        monetization: 'free', // 'free' | 'paid' | 'freemium'
        plans: [] as typeof DEFAULT_PLAN[],
        rules: '',
    });

    const addPlan = () => setForm(f => ({
        ...f,
        plans: [...f.plans, { ...DEFAULT_PLAN, tierLevel: f.plans.length + 1 }],
    }));
    const removePlan = (i: number) => setForm(f => ({
        ...f, plans: f.plans.filter((_, idx) => idx !== i),
    }));
    const updatePlan = (i: number, key: string, val: any) => setForm(f => ({
        ...f,
        plans: f.plans.map((p, idx) => idx === i ? { ...p, [key]: val } : p),
    }));

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            const plansToSend = form.monetization === 'free' ? [] :
                form.plans.map(p => ({
                    ...p,
                    price: Number(p.price),
                    features: p.features.filter(Boolean),
                }));

            const res = await apiFetch('/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    category: form.category,
                    privacyType: form.privacyType,
                    imageUrl: form.imageUrl || undefined,
                    bannerUrl: form.bannerUrl || undefined,
                    rules: form.rules || undefined,
                    plans: plansToSend.length > 0 ? plansToSend : undefined,
                }),
            });

            const textResponse = await res.text();
            let data: any = {};
            if (textResponse) {
                try { data = JSON.parse(textResponse); }
                catch (e) { data = { message: textResponse }; }
            }

            if (!res.ok) {
                throw new Error(data.message || 'Error al crear comunidad');
            }

            onCreate(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const canNext = [
        form.name.trim().length >= 3 && form.description.trim().length >= 10,
        true, // privacy always valid
        true, // monetization always valid
        form.monetization === 'free' || form.plans.every(p => p.name.trim()),
        true,
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'hsl(0 0% 0% / 0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <div>
                        <h2 className="font-bold text-base">Crear comunidad</h2>
                        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Paso {step + 1} de {CREATION_STEPS.length} — {CREATION_STEPS[step]}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex gap-1 px-6 py-3">
                    {CREATION_STEPS.map((_, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= step ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
                    ))}
                </div>

                {/* Step content */}
                <div className="px-6 pb-2 max-h-[60vh] overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.18 }}
                        >
                            {/* Step 0: Info */}
                            {step === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block"
                                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Nombre de la comunidad *
                                        </label>
                                        <input
                                            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                                            style={{
                                                background: 'hsl(var(--muted))',
                                                border: '1px solid hsl(var(--border))',
                                                '--tw-ring-color': 'hsl(var(--primary))',
                                            } as any}
                                            placeholder="ej: Inversión Inteligente"
                                            value={form.name}
                                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            maxLength={60}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block"
                                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Descripción *
                                        </label>
                                        <textarea
                                            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:ring-2"
                                            style={{
                                                background: 'hsl(var(--muted))',
                                                border: '1px solid hsl(var(--border))',
                                                '--tw-ring-color': 'hsl(var(--primary))',
                                            } as any}
                                            placeholder="Describí tu comunidad..."
                                            rows={3}
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold mb-1 block"
                                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Categoría
                                        </label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {CATEGORIES.filter(c => c.key !== 'all').map(cat => {
                                                const Icon = cat.icon;
                                                const active = form.category === cat.key;
                                                return (
                                                    <button
                                                        key={cat.key}
                                                        onClick={() => setForm(f => ({ ...f, category: cat.key }))}
                                                        className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
                                                        style={{
                                                            background: active ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted))',
                                                            border: `1px solid ${active ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border))'}`,
                                                            color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                        }}
                                                    >
                                                        <Icon className="w-3 h-3" /> {cat.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold mb-2 block"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Imagen de Avatar
                                            </label>
                                            <div
                                                className="w-full relative rounded-xl border border-dashed flex flex-col items-center justify-center p-4 transition-colors cursor-pointer group"
                                                style={{
                                                    background: form.imageUrl ? 'transparent' : 'hsl(var(--muted))',
                                                    borderColor: form.imageUrl ? 'transparent' : 'hsl(var(--border))',
                                                    minHeight: '120px'
                                                }}
                                            >
                                                {form.imageUrl ? (
                                                    <>
                                                        <img src={resolveMediaUrl(form.imageUrl)} alt="Avatar" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Upload className="w-5 h-5 text-white" />
                                                        </div>
                                                    </>
                                                ) : isUploadingObj.imageUrl ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-6 h-6 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                        <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Subir imagen</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleUploadMedia(f, 'imageUrl');
                                                        e.target.value = '';
                                                    }}
                                                    disabled={isUploadingObj.imageUrl}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold mb-2 block"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Imagen de Banner
                                            </label>
                                            <div
                                                className="w-full relative rounded-xl border border-dashed flex flex-col items-center justify-center p-4 transition-colors cursor-pointer group"
                                                style={{
                                                    background: form.bannerUrl ? 'transparent' : 'hsl(var(--muted))',
                                                    borderColor: form.bannerUrl ? 'transparent' : 'hsl(var(--border))',
                                                    minHeight: '120px'
                                                }}
                                            >
                                                {form.bannerUrl ? (
                                                    <>
                                                        <img src={resolveMediaUrl(form.bannerUrl)} alt="Banner" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Upload className="w-5 h-5 text-white" />
                                                        </div>
                                                    </>
                                                ) : isUploadingObj.bannerUrl ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-6 h-6 mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
                                                        <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Subir banner</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleUploadMedia(f, 'bannerUrl');
                                                        e.target.value = '';
                                                    }}
                                                    disabled={isUploadingObj.bannerUrl}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Privacy */}
                            {step === 1 && (
                                <div className="space-y-3 py-2">
                                    {[
                                        { value: 'PUBLIC', label: 'Pública', icon: Globe, desc: 'Cualquiera puede encontrarla y unirse.' },
                                        { value: 'PRIVATE', label: 'Privada', icon: Lock, desc: 'Se puede encontrar pero requiere aprobación.' },
                                        { value: 'EXCLUSIVE', label: 'Exclusiva', icon: Shield, desc: 'Solo usuarios invitados pueden acceder.' },
                                    ].map(opt => {
                                        const Icon = opt.icon;
                                        const active = form.privacyType === opt.value;
                                        return (
                                            <button key={opt.value}
                                                onClick={() => setForm(f => ({ ...f, privacyType: opt.value }))}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                                                style={{
                                                    background: active ? 'hsl(var(--primary)/0.08)' : 'hsl(var(--muted))',
                                                    border: `1px solid ${active ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border))'}`,
                                                }}
                                            >
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: active ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted))' }}>
                                                    <Icon className="w-4 h-4" style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{opt.label}</p>
                                                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{opt.desc}</p>
                                                </div>
                                                {active && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Step 2: Monetization */}
                            {step === 2 && (
                                <div className="space-y-3 py-2">
                                    <p className="text-sm font-semibold">¿Querés monetizar tu comunidad?</p>
                                    {[
                                        { value: 'free', label: 'Gratis', icon: Heart, desc: 'Tu comunidad es completamente gratuita.' },
                                        { value: 'paid', label: 'Suscripción paga', icon: Crown, desc: 'Los miembros pagan para acceder.' },
                                        { value: 'freemium', label: 'Gratis + Premium', icon: Sparkles, desc: 'Contenido público y planes pagos.' },
                                    ].map(opt => {
                                        const Icon = opt.icon;
                                        const active = form.monetization === opt.value;
                                        return (
                                            <button key={opt.value}
                                                onClick={() => setForm(f => ({ ...f, monetization: opt.value }))}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                                                style={{
                                                    background: active ? 'hsl(var(--primary)/0.08)' : 'hsl(var(--muted))',
                                                    border: `1px solid ${active ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border))'}`,
                                                }}
                                            >
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: active ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted))' }}>
                                                    <Icon className="w-4 h-4" style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{opt.label}</p>
                                                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{opt.desc}</p>
                                                </div>
                                                {active && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Step 3: Plans */}
                            {step === 3 && (
                                <div className="space-y-3 py-2">
                                    {form.monetization === 'free' ? (
                                        <div className="flex flex-col items-center py-6 gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            <Heart className="w-8 h-8" />
                                            <p className="text-sm">Tu comunidad será gratuita.</p>
                                            <p className="text-xs">Se creará un plan gratuito automáticamente.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {form.plans.map((plan, i) => (
                                                <div key={i} className="rounded-xl p-3 space-y-2"
                                                    style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold" style={{ color: 'hsl(var(--primary))' }}>
                                                            Plan {i + 1}
                                                        </p>
                                                        <button onClick={() => removePlan(i)}
                                                            className="rounded p-1 hover:bg-destructive/10 transition-colors">
                                                            <X className="w-3 h-3 text-destructive" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            className="rounded-lg px-2 py-1.5 text-xs outline-none"
                                                            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                                            placeholder="Nombre (ej: Pro)"
                                                            value={plan.name}
                                                            onChange={e => updatePlan(i, 'name', e.target.value)}
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-bold">$</span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                className="rounded-lg px-2 py-1.5 text-xs outline-none flex-1"
                                                                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                                                placeholder="9.99"
                                                                value={plan.price || ''}
                                                                onChange={e => updatePlan(i, 'price', parseFloat(e.target.value) || 0)}
                                                            />
                                                            <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>/mes</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {plan.features.map((feat, fi) => (
                                                            <div key={fi} className="flex items-center gap-1">
                                                                <input
                                                                    className="flex-1 rounded px-2 py-1 text-xs outline-none"
                                                                    style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                                                    placeholder="Beneficio del plan"
                                                                    value={feat}
                                                                    onChange={e => updatePlan(i, 'features', plan.features.map((f2, i2) => i2 === fi ? e.target.value : f2))}
                                                                />
                                                                {plan.features.length > 1 && (
                                                                    <button onClick={() => updatePlan(i, 'features', plan.features.filter((_, i2) => i2 !== fi))}>
                                                                        <X className="w-3 h-3 text-destructive" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            className="text-[10px] font-medium mt-1"
                                                            style={{ color: 'hsl(var(--primary))' }}
                                                            onClick={() => updatePlan(i, 'features', [...plan.features, ''])}>
                                                            + Agregar beneficio
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={addPlan}
                                                className="w-full rounded-xl py-2.5 text-sm font-medium border-dashed border-2 transition-colors"
                                                style={{ borderColor: 'hsl(var(--primary)/0.4)', color: 'hsl(var(--primary))' }}>
                                                <Plus className="w-4 h-4 inline mr-1" /> Agregar plan
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {step === 4 && (
                                <div className="space-y-4 py-2">
                                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
                                        <div className="h-20 relative" style={{ background: 'hsl(var(--muted))' }}>
                                            {form.bannerUrl && (
                                                <img src={form.bannerUrl} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="px-4 pb-4 -mt-5">
                                            <div className="w-10 h-10 rounded-xl border-2 overflow-hidden mb-2"
                                                style={{ borderColor: 'hsl(var(--card))', background: 'hsl(var(--primary)/0.12)' }}>
                                                {form.imageUrl
                                                    ? <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    : <span className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>{form.name[0]}</span>
                                                }
                                            </div>
                                            <p className="font-bold text-sm">{form.name || 'Sin nombre'}</p>
                                            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {form.category} · {form.privacyType === 'PUBLIC' ? 'Pública' : form.privacyType === 'PRIVATE' ? 'Privada' : 'Exclusiva'}
                                            </p>
                                            <p className="text-xs mt-2 line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {form.description}
                                            </p>
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                                            style={{ background: 'hsl(0 60% 50% / 0.08)', color: 'hsl(0 68% 55%)' }}>
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4"
                    style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <button
                        onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
                        className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors hover:bg-muted"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {step === 0 ? 'Cancelar' : 'Anterior'}
                    </button>
                    <button
                        disabled={!canNext[step] || loading}
                        onClick={() => step < CREATION_STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
                        className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl transition-all disabled:opacity-40"
                        style={{
                            background: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {step < CREATION_STEPS.length - 1 ? 'Siguiente' : loading ? 'Creando...' : 'Crear comunidad'}
                        {!loading && step < CREATION_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Comunidades() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('members');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

    // Open community from URL param
    const communityIdParam = searchParams.get('c');

    const fetchCommunities = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);
            if (activeCategory !== 'all') params.set('category', activeCategory);
            params.set('sort', sortBy);
            params.set('limit', '30');

            const res = await apiFetch(`/communities?${params}`);
            if (res.ok) {
                const data = await res.json();
                setCommunities(Array.isArray(data) ? data : []);
            }
        } catch { }
        finally { setLoading(false); }
    }, [searchQuery, activeCategory, sortBy]);

    useEffect(() => {
        const t = setTimeout(fetchCommunities, searchQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [fetchCommunities]);

    // Load community from URL
    useEffect(() => {
        if (!communityIdParam) { setSelectedCommunity(null); return; }
        apiFetch(`/communities/${communityIdParam}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setSelectedCommunity(d))
            .catch(() => { });
    }, [communityIdParam]);

    const openCommunity = (c: Community) => {
        setSelectedCommunity(c);
        setSearchParams({ c: c.id });
    };

    const closeCommunity = () => {
        setSelectedCommunity(null);
        setSearchParams({});
    };

    // If a community is selected, show its detail
    if (selectedCommunity) {
        return (
            <CommunityDetail
                community={selectedCommunity}
                onBack={closeCommunity}
                onRefresh={c => setSelectedCommunity(c)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-4 sm:px-6 pt-5 pb-0"
                style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Comunidades</h1>
                        <p className="text-[12px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Aprendé, compartí y conectate con inversores que piensan como vos.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all btn-primary-glow shrink-0"
                        style={{
                            background: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Crear comunidad</span>
                        <span className="sm:hidden">Crear</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <input
                        className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
                        style={{
                            background: 'hsl(var(--muted))',
                            border: '1px solid hsl(var(--border))',
                        }}
                        placeholder="Buscar comunidades, inversores o temas..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const active = activeCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
                                style={{
                                    background: active ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                                    color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                                }}
                            >
                                <Icon className="w-3 h-3" /> {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
                {/* Sort bar */}
                <div className="flex items-center gap-3">
                    <p className="text-[11px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {loading ? 'Cargando...' : `${communities.length} comunidades`}
                    </p>
                    <div className="ml-auto flex items-center gap-1">
                        {['members', 'recent', 'posts'].map(s => (
                            <button key={s}
                                onClick={() => setSortBy(s)}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                                style={{
                                    background: sortBy === s ? 'hsl(var(--primary)/0.12)' : 'transparent',
                                    color: sortBy === s ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                }}>
                                {s === 'members' ? 'Populares' : s === 'recent' ? 'Nuevas' : 'Activas'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                                style={{ background: 'hsl(var(--muted))' }}>
                                <div className="h-28" style={{ background: 'hsl(var(--muted))' }} />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 w-1/2 rounded" style={{ background: 'hsl(var(--border))' }} />
                                    <div className="h-3 w-3/4 rounded" style={{ background: 'hsl(var(--border))' }} />
                                    <div className="h-3 w-full rounded" style={{ background: 'hsl(var(--border))' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : communities.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-3"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <Users className="w-12 h-12 opacity-30" />
                        <p className="font-semibold">No hay comunidades</p>
                        <p className="text-sm">
                            {searchQuery ? `Sin resultados para "${searchQuery}"` : '¡Sé el primero en crear una!'}
                        </p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold mt-2"
                            style={{
                                background: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                            }}
                        >
                            <Plus className="w-4 h-4" /> Crear comunidad
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {communities.map(c => (
                            <CommunityCard
                                key={c.id}
                                community={c}
                                onOpen={() => openCommunity(c)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            <AnimatePresence>
                {showCreate && (
                    <CreateCommunityModal
                        onClose={() => setShowCreate(false)}
                        onCreate={c => {
                            setShowCreate(false);
                            setCommunities(prev => [c as any, ...prev]);
                            openCommunity(c as any);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
