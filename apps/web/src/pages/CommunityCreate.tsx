import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ChevronRight, Sparkles, Shield,
    FolderKanban, Upload, AlertCircle,
    Loader2, Lock, Globe, Image as ImageIcon,
    DollarSign, CreditCard, Building, Wallet, Plus, X,
    Percent
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const STEPS = [
    'Identidad & Misión',
    'Apariencia & Marca',
    'Privacidad & Reglas',
    'Monetización & Planes',
    'Pasarela & Cobros',
    'Secciones Iniciales',
    'Revisión & Publicar',
];

const CATEGORIES = [
    'Acciones', 'Cripto', 'Bonos & Renta Fija', 'CEDEARs',
    'Finanzas personales', 'Macro & Economía', 'Trading & Opciones',
    'Educación Financiera', 'Tecnología & IA', 'Dividendos', 'Largo Plazo'
];

const EXPERIENCE_LEVELS = [
    { key: 'ALL', label: 'Todos los niveles', desc: 'Apto para cualquier interesado' },
    { key: 'BEGINNER', label: 'Principiante', desc: 'Desde cero, conceptos básicos' },
    { key: 'INTERMEDIATE', label: 'Intermedio', desc: 'Con nociones de análisis' },
    { key: 'ADVANCED', label: 'Avanzado', desc: 'Estrategias complejas y derivados' },
];

const SUGGESTED_BENEFITS = [
    'Alertas de compra/venta en tiempo real',
    'Acceso a mi Cartera de Inversión en vivo',
    'Chat privado y debates exclusivos con el creador',
    'Análisis fundamental de balances trimestrales',
    'Llamadas semanales en vivo vía Zoom o Meet',
    'Acceso al grupo privado de Telegram o Discord VIP',
    'Plantillas de valoración de empresas en Excel/Sheets',
];

const DEFAULT_RULES = [
    'Respeto y cordialidad en todas las interacciones.',
    'Prohibido el spam, publicidad no autorizada y autopromoción.',
    'Disclaimer: Todo el contenido tiene fines educativos y no constituye asesoramiento financiero regulado.',
    'No compartir enlaces sospechosos o de captación de fondos.',
    'Mantener los debates dentro de las temáticas de cada sección.',
];

const ACCENT_COLORS = [
    { label: 'Esmeralda Finix', hex: '#10B981' },
    { label: 'Azul Eléctrico', hex: '#3B82F6' },
    { label: 'Violeta Royal', hex: '#8B5CF6' },
    { label: 'Dorado Ámbar', hex: '#F59E0B' },
    { label: 'Rosa Neón', hex: '#EC4899' },
    { label: 'Cyan Tecnológico', hex: '#06B6D4' },
];

export default function CommunityCreate() {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});

    // Multi-step form state
    const [form, setForm] = useState({
        // Paso 1: Identidad & Misión
        name: '',
        slug: '',
        description: '',
        mission: '',
        experienceLevel: 'Todos los niveles',
        category: 'Acciones',
        tags: '',

        // Paso 2: Apariencia & Canales
        imageUrl: '',
        bannerUrl: '',
        accentColor: '#10B981',
        externalTelegram: '',
        externalDiscord: '',
        externalWhatsapp: '',

        // Paso 3: Privacidad & Reglas
        privacyType: 'PUBLIC',
        showContentBeforeJoin: true,
        rules: DEFAULT_RULES.join('\n'),

        // Paso 4: Monetización
        monetization: 'free', // 'free' | 'paid'
        planCurrency: 'ARS', // 'ARS' | 'USD'
        paidPlanPrice: 9500,
        paidPlanName: 'Membresía VIP',
        paidPlanInterval: 'monthly',
        paidPlanFeatures: [
            'Acceso a publicaciones privadas exclusivas',
            'Alertas de mercado en tiempo real',
            'Comentarios y debates directos con el creador',
        ],
        plans: [
            { name: 'Gratis', price: 0, interval: 'monthly', features: ['Acceso a publicaciones públicas', 'Comentarios'], tierLevel: 0 }
        ],

        // Paso 5: Pasarela de Cobro & Retiro de fondos (Donde te mandarán la plata)
        payoutProvider: 'transfer', // 'transfer' (CBU/Alias) | 'mercadopago' | 'stripe' | 'none'
        bankName: '',
        holderName: '',
        holderCuit: '',
        cbu: '',
        alias: '',
        mpEmail: '',
        mpPublicKey: '',
        mpAccessToken: '',
        stripeAccountId: '',

        // Paso 6: Secciones iniciales
        sections: ['General', 'Análisis & Tesis', 'Noticias de Mercado', 'Señales & Alertas'],
        newSectionInput: '',

        status: 'PUBLISHED', // 'DRAFT' | 'PUBLISHED'
    });

    /* Todas las cuentas autenticadas pueden crear comunidades. Las verificadas
       reciben automáticamente la insignia de comunidad verificada. */
    /*
        El antiguo bloqueo de Creator/asesor financiero fue eliminado.
    */
    // Media upload handler
    const handleUploadMedia = async (file: File, field: 'imageUrl' | 'bannerUrl') => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Formato no permitido. Usá JPG, PNG, WEBP o GIF.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen supera el máximo de 10 MB.');
            return;
        }
        setIsUploading(prev => ({ ...prev, [field]: true }));
        try {
            const formData = new FormData();
            formData.append('files', file);
            const res = await apiFetch('/posts/upload-media', { method: 'POST', body: formData });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || `No se pudo subir el archivo (${res.status})`);
            if (data?.[0]?.url) {
                setForm(f => ({ ...f, [field]: data[0].url }));
            }
        } catch (err: any) {
            alert(err?.message || 'No se pudo subir la imagen. Revisá el formato y el tamaño del archivo.');
        } finally {
            setIsUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    // Calculate Finix 5% platform fee vs Creator 95% net
    const priceNumber = Number(form.paidPlanPrice) || 0;
    const platformFee = Math.round(priceNumber * 0.05);
    const creatorNet = priceNumber - platformFee;

    // Form submission with safe JSON parsing and error handling
    const handleSubmit = async (publishStatus: 'DRAFT' | 'PUBLISHED') => {
        setLoading(true);
        setError('');
        try {
            // Build plans payload
            let plansPayload = form.plans;
            if (form.monetization === 'paid') {
                plansPayload = [
                    {
                        name: 'Gratis',
                        price: 0,
                        interval: 'monthly',
                        features: ['Acceso a publicaciones públicas', 'Vista previa'],
                        tierLevel: 0,
                    },
                    {
                        name: form.paidPlanName || 'Membresía VIP',
                        price: priceNumber,
                        interval: form.paidPlanInterval || 'monthly',
                        features: form.paidPlanFeatures.length > 0 ? form.paidPlanFeatures : ['Acceso total a contenidos exclusivos'],
                        tierLevel: 10,
                    }
                ];
            } else {
                plansPayload = [
                    {
                        name: 'Gratis',
                        price: 0,
                        interval: 'monthly',
                        features: ['Acceso total a publicaciones y debates', 'Comentarios'],
                        tierLevel: 0,
                    }
                ];
            }

            // Build payout / paymentGatewayConfig
            let paymentGatewayConfigStr: string | undefined = undefined;
            if (form.payoutProvider !== 'none') {
                paymentGatewayConfigStr = JSON.stringify({
                    provider: form.payoutProvider,
                    platformFeePercent: 5,
                    bankName: form.bankName.trim() || undefined,
                    holderName: form.holderName.trim() || undefined,
                    holderCuit: form.holderCuit.trim() || undefined,
                    cbu: form.cbu.trim() || undefined,
                    alias: form.alias.trim() || undefined,
                    mpEmail: form.mpEmail.trim() || undefined,
                    mpPublicKey: form.mpPublicKey.trim() || undefined,
                    stripeAccountId: form.stripeAccountId.trim() || undefined,
                    isEnabled: true,
                    currency: form.planCurrency,
                });
            }

            // Construct enriched description with mission and level
            let fullDescription = form.description.trim();
            if (form.mission.trim()) {
                fullDescription += `\n\n🎯 Misión: ${form.mission.trim()}`;
            }
            if (form.experienceLevel) {
                fullDescription += `\n📊 Nivel: ${form.experienceLevel}`;
            }
            if (form.externalTelegram || form.externalDiscord || form.externalWhatsapp) {
                const links: string[] = [];
                if (form.externalTelegram) links.push(`Telegram: ${form.externalTelegram.trim()}`);
                if (form.externalDiscord) links.push(`Discord: ${form.externalDiscord.trim()}`);
                if (form.externalWhatsapp) links.push(`WhatsApp: ${form.externalWhatsapp.trim()}`);
                fullDescription += `\n🔗 Canales VIP: ${links.join(' | ')}`;
            }

            const payload: any = {
                name: form.name.trim(),
                slug: form.slug.trim() || undefined,
                description: fullDescription,
                category: form.category,
                tags: form.tags.trim() || undefined,
                imageUrl: form.imageUrl || undefined,
                bannerUrl: form.bannerUrl || undefined,
                accentColor: form.accentColor,
                privacyType: form.privacyType,
                showContentBeforeJoin: form.showContentBeforeJoin,
                rules: form.rules || undefined,
                status: publishStatus,
                plans: plansPayload,
                paymentGatewayConfig: paymentGatewayConfigStr,
            };

            const res = await apiFetch('/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Read text safely to prevent JSON unexpected end of input syntax errors
            const text = await res.text();
            let data: any = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(data.message || (res.status >= 500 ? 'El servidor tardó en responder. Verifica si tu comunidad ya fue creada o reintenta.' : `Error al crear la comunidad (${res.status})`));
            }

            navigate(`/comunidades/${data.slug || data.id}`);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado al crear la comunidad.');
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        if (currentStep === 0) return Boolean(form.name.trim() && form.description.trim() && form.category);
        if (currentStep === 4 && form.monetization === 'paid' && form.payoutProvider === 'transfer') {
            return Boolean(form.cbu.trim() || form.alias.trim());
        }
        return true;
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => currentStep === 0 ? navigate('/comunidades') : setCurrentStep(s => s - 1)}
                        className="p-2 rounded-xl border hover:bg-muted transition-colors"
                        style={{ borderColor: 'hsl(var(--border))' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Crear Comunidad</h1>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Paso {currentStep + 1} de {STEPS.length}: {STEPS[currentStep]}
                        </p>
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-1">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            title={STEPS[idx]}
                            className={`h-1.5 rounded-full transition-all ${idx === currentStep ? 'w-6 bg-primary' : idx < currentStep ? 'w-3 bg-primary/40' : 'w-2 bg-muted'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Step content */}
            <div className="p-6 rounded-2xl border bg-card" style={{ borderColor: 'hsl(var(--border))' }}>
                <AnimatePresence mode="wait">
                    {/* PASO 1: IDENTIDAD & MISIÓN */}
                    {currentStep === 0 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-base font-bold">Identidad y Misión</h2>
                            <p className="text-xs text-muted-foreground">
                                Define la propuesta de valor, objetivos y temática central para atraer a los miembros ideales.
                            </p>

                            <div className="space-y-4 pt-1">
                                <div>
                                    <label className="text-xs font-semibold block mb-1">Nombre de la comunidad *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Inversores de Valor & CEDEARs"
                                        value={form.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                            setForm({ ...form, name: val, slug: form.slug ? form.slug : autoSlug });
                                        }}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Handle / Slug personalizado</label>
                                    <div className="flex items-center rounded-xl border bg-background px-3" style={{ borderColor: 'hsl(var(--border))' }}>
                                        <span className="text-xs text-muted-foreground mr-1">finixarg.com/comunidades/</span>
                                        <input
                                            type="text"
                                            placeholder="inversores-cedears"
                                            value={form.slug}
                                            onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                                            className="w-full py-2.5 text-xs bg-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Categoría Principal *</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setForm({ ...form, category: cat })}
                                                className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all ${form.category === cat ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Nivel de Experiencia Recomendado</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {EXPERIENCE_LEVELS.map(lvl => (
                                            <button
                                                key={lvl.key}
                                                type="button"
                                                onClick={() => setForm({ ...form, experienceLevel: lvl.label })}
                                                className={`p-2.5 text-left rounded-xl border transition-all ${form.experienceLevel === lvl.label ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}
                                            >
                                                <p className="text-xs font-bold">{lvl.label}</p>
                                                <p className="text-[10px] text-muted-foreground line-clamp-1">{lvl.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Descripción corta de presentación *</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Una síntesis atractiva para el feed de exploración y perfiles..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Misión y Tesis (¿Qué aprenderán o lograrán los miembros?)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ej: Ayudar a construir una cartera de dividendos sólida y analizar balances de empresas del S&P 500 semana a semana..."
                                        value={form.mission}
                                        onChange={e => setForm({ ...form, mission: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Tickers y Etiquetas clave (separadas por coma)</label>
                                    <input
                                        type="text"
                                        placeholder="SPY, AAPL, NVDA, AL30, CEDEARs, BTC"
                                        value={form.tags}
                                        onChange={e => setForm({ ...form, tags: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 2: APARIENCIA & MARCA */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-base font-bold">Apariencia, Marca y Canales VIP</h2>
                            <p className="text-xs text-muted-foreground">
                                Dale personalidad visual a tu espacio y comparte canales de mensajería externa si los utilizas.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold block mb-1">Logo / Avatar</label>
                                    <div className="relative rounded-2xl border border-dashed p-4 flex flex-col items-center justify-center min-h-[140px] text-center cursor-pointer hover:bg-muted/30 transition-colors"
                                        style={{ borderColor: 'hsl(var(--border))' }}>
                                        {isUploading['imageUrl'] ? (
                                            <div className="space-y-1">
                                                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                                                <p className="text-xs font-medium text-muted-foreground">Subiendo...</p>
                                            </div>
                                        ) : form.imageUrl ? (
                                            <img src={resolveMediaUrl(form.imageUrl)} alt="" className="w-20 h-20 rounded-full object-cover shadow" />
                                        ) : (
                                            <div className="space-y-1">
                                                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                                                <p className="text-xs font-medium text-muted-foreground">Subir Avatar</p>
                                                <p className="text-[10px] text-muted-foreground">PNG o JPG cuadrado recomendado</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleUploadMedia(f, 'imageUrl');
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold block mb-1">Banner de Portada</label>
                                    <div className="relative rounded-2xl border border-dashed p-4 flex flex-col items-center justify-center min-h-[140px] text-center cursor-pointer hover:bg-muted/30 transition-colors"
                                        style={{ borderColor: 'hsl(var(--border))' }}>
                                        {isUploading['bannerUrl'] ? (
                                            <div className="space-y-1">
                                                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                                                <p className="text-xs font-medium text-muted-foreground">Subiendo...</p>
                                            </div>
                                        ) : form.bannerUrl ? (
                                            <img src={resolveMediaUrl(form.bannerUrl)} alt="" className="w-full h-24 rounded-xl object-cover shadow" />
                                        ) : (
                                            <div className="space-y-1">
                                                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                                <p className="text-xs font-medium text-muted-foreground">Subir Banner</p>
                                                <p className="text-[10px] text-muted-foreground">1200x300 recomendado</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleUploadMedia(f, 'bannerUrl');
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color de acento */}
                            <div>
                                <label className="text-xs font-semibold block mb-1.5">Color de Identidad</label>
                                <div className="flex flex-wrap items-center gap-2">
                                    {ACCENT_COLORS.map(c => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            onClick={() => setForm({ ...form, accentColor: c.hex })}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${form.accentColor === c.hex ? 'border-foreground shadow-sm' : 'border-border opacity-80 hover:opacity-100'}`}
                                        >
                                            <span className="w-3.5 h-3.5 rounded-full" style={{ background: c.hex }} />
                                            <span>{c.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Enlaces a canales VIP */}
                            <div className="pt-2 border-t space-y-3" style={{ borderColor: 'hsl(var(--border))' }}>
                                <label className="text-xs font-semibold block">Canales Externos Exclusivos (Opcional)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block mb-0.5">Grupo Telegram VIP</span>
                                        <input
                                            type="text"
                                            placeholder="https://t.me/+invitacion"
                                            value={form.externalTelegram}
                                            onChange={e => setForm({ ...form, externalTelegram: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block mb-0.5">Servidor Discord</span>
                                        <input
                                            type="text"
                                            placeholder="https://discord.gg/invitacion"
                                            value={form.externalDiscord}
                                            onChange={e => setForm({ ...form, externalDiscord: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block mb-0.5">Comunidad WhatsApp</span>
                                        <input
                                            type="text"
                                            placeholder="https://chat.whatsapp.com/..."
                                            value={form.externalWhatsapp}
                                            onChange={e => setForm({ ...form, externalWhatsapp: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 3: PRIVACIDAD & REGLAS */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-base font-bold">Privacidad, Acceso y Normas de Convivencia</h2>
                            <p className="text-xs text-muted-foreground">
                                Establece las condiciones de admisión y las normas para mantener una comunidad de alto valor.
                            </p>

                            <div className="space-y-3">
                                {[
                                    { key: 'PUBLIC', label: 'Pública', desc: 'Cualquier usuario puede unirse libremente y ver las publicaciones.', icon: Globe },
                                    { key: 'PRIVATE', label: 'Privada con Admisión', desc: 'Los usuarios deben enviar una solicitud que tú o tus moderadores deben aprobar.', icon: Shield },
                                    { key: 'EXCLUSIVE', label: 'Exclusiva / Membresía Paga', desc: 'Solo ingresan miembros que abonen una suscripción mensual o cuota.', icon: Lock },
                                ].map(p => {
                                    const Icon = p.icon;
                                    const active = form.privacyType === p.key;
                                    return (
                                        <div
                                            key={p.key}
                                            onClick={() => setForm({ ...form, privacyType: p.key })}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}
                                        >
                                            <Icon className={`w-5 h-5 mt-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <div>
                                                <p className="text-xs font-bold">{p.label}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="p-3.5 rounded-2xl border bg-muted/20 space-y-1.5 mt-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="previewJoin"
                                            checked={form.showContentBeforeJoin}
                                            onChange={e => setForm({ ...form, showContentBeforeJoin: e.target.checked })}
                                        />
                                        <label htmlFor="previewJoin" className="text-xs font-semibold cursor-pointer">
                                            Permitir vista previa de publicaciones antes de unirse
                                        </label>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pl-5">
                                        Muestra titulares difuminados para incentivar a los curiosos a convertirse en miembros.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-semibold">Reglas y Disclaimer Financiero</label>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, rules: DEFAULT_RULES.join('\n') })}
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            Restablecer reglas sugeridas
                                        </button>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={form.rules}
                                        onChange={e => setForm({ ...form, rules: e.target.value })}
                                        placeholder="Ingresa una regla por línea..."
                                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background font-mono"
                                        style={{ borderColor: 'hsl(var(--border))' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 4: MONETIZACIÓN & PLANES */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-base font-bold">Monetización y Membresías</h2>
                            <p className="text-xs text-muted-foreground">
                                Elige si deseas ofrecer acceso 100% gratuito o cobrar una cuota mensual por tus análisis.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm({
                                        ...form,
                                        monetization: 'free',
                                        privacyType: form.privacyType === 'EXCLUSIVE' ? 'PUBLIC' : form.privacyType,
                                    })}
                                    className={`p-4 rounded-2xl border text-left transition-all ${form.monetization === 'free' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}
                                >
                                    <p className="text-xs font-bold">Comunidad Gratuita</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Acceso abierto sin cobro de cuotas.</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setForm({
                                        ...form,
                                        monetization: 'paid',
                                        privacyType: 'EXCLUSIVE',
                                    })}
                                    className={`p-4 rounded-2xl border text-left transition-all ${form.monetization === 'paid' ? 'border-primary bg-primary/5 text-primary' : 'border-border'}`}
                                >
                                    <p className="text-xs font-bold">Comunidad con Membresía Paga</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Cobra cuotas mensuales a tus miembros.</p>
                                </button>
                            </div>

                            {form.monetization === 'paid' && (
                                <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[11px] font-semibold block mb-1">Nombre de la Membresía</label>
                                            <input
                                                type="text"
                                                value={form.paidPlanName}
                                                onChange={e => setForm({ ...form, paidPlanName: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold block mb-1">Moneda</label>
                                            <select
                                                value={form.planCurrency}
                                                onChange={e => setForm({ ...form, planCurrency: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            >
                                                <option value="ARS">ARS ($ Pesos Argentinos)</option>
                                                <option value="USD">USD (Dólares)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold block mb-1">Precio Mensual</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={form.paidPlanPrice}
                                                    onChange={e => setForm({ ...form, paidPlanPrice: Number(e.target.value) || 0 })}
                                                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-bold"
                                                    style={{ borderColor: 'hsl(var(--border))' }}
                                                />
                                                <span className="absolute right-3 top-2 text-[10px] text-muted-foreground">/{form.paidPlanInterval === 'monthly' ? 'mes' : 'año'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Beneficios de la membresía */}
                                    <div>
                                        <label className="text-xs font-semibold block mb-1.5">Beneficios incluidos para los suscriptores</label>
                                        <div className="space-y-2">
                                            {form.paidPlanFeatures.map((feat, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={feat}
                                                        onChange={e => {
                                                            const copy = [...form.paidPlanFeatures];
                                                            copy[idx] = e.target.value;
                                                            setForm({ ...form, paidPlanFeatures: copy });
                                                        }}
                                                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border bg-background"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const copy = form.paidPlanFeatures.filter((_, i) => i !== idx);
                                                            setForm({ ...form, paidPlanFeatures: copy });
                                                        }}
                                                        className="p-1.5 rounded-lg border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, paidPlanFeatures: [...form.paidPlanFeatures, 'Nuevo beneficio exclusivo'] })}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Añadir otro beneficio</span>
                                            </button>
                                        </div>

                                        {/* Sugerencias de beneficios rápidos */}
                                        <div className="mt-3 p-3 rounded-xl border bg-muted/20 space-y-1.5">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Ideas de beneficios (Haz clic para agregar):</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {SUGGESTED_BENEFITS.map((sug, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!form.paidPlanFeatures.includes(sug)) {
                                                                setForm({ ...form, paidPlanFeatures: [...form.paidPlanFeatures, sug] });
                                                            }
                                                        }}
                                                        className="px-2 py-1 text-[11px] rounded-lg border hover:bg-muted transition-colors text-left"
                                                        style={{ borderColor: 'hsl(var(--border))' }}
                                                    >
                                                        + {sug}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* PASO 5: PASARELA & COBROS (A DÓNDE TE MANDARÁN LA PLATA & COMISIÓN 4%) */}
                    {currentStep === 4 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold">Pasarela de Pagos & Dónde Recibirás tu Dinero</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Configura la cuenta bancaria o pasarela donde se transferirán los ingresos de tus miembros.
                                    </p>
                                </div>
                                <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-black flex items-center gap-1.5">
                                    <Percent className="w-3.5 h-3.5" />
                                    <span>Comisión Finix: 4%</span>
                                </div>
                            </div>

                            {/* BANNER DETALLADO DE COMISIÓN 4% */}
                            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">
                                            Transparencia Total de Finix: 96% para vos, 4% de servicio
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                            Finix retiene únicamente un <strong>4% de comisión de servicio</strong> sobre cada cobro o suscripción para cubrir servidores de alta disponibilidad, seguridad financiera y mantenimiento continuo de la plataforma. <strong>El 96% neto restante es acreditado directamente a tu cuenta configurada.</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* SIMULADOR EN VIVO */}
                                {form.monetization === 'paid' && (
                                    <div className="p-3 rounded-xl bg-card border border-border/80 grid grid-cols-3 gap-2 text-center">
                                        <div className="border-r border-border/60 pr-2">
                                            <span className="text-[10px] text-muted-foreground block">Precio Cobrado</span>
                                            <span className="text-xs font-bold text-foreground">
                                                {form.planCurrency === 'ARS' ? `$${priceNumber.toLocaleString('es-AR')}` : `US$${priceNumber}`}
                                            </span>
                                        </div>
                                        <div className="border-r border-border/60 pr-2">
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Vos Recibís (96%)</span>
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                {form.planCurrency === 'ARS' ? `$${creatorNet.toLocaleString('es-AR')}` : `US$${creatorNet}`}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block">Comisión Finix (4%)</span>
                                            <span className="text-xs font-bold text-muted-foreground">
                                                {form.planCurrency === 'ARS' ? `$${platformFee.toLocaleString('es-AR')}` : `US$${platformFee}`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SELECCIÓN DE MÉTODO DE COBRO */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold block">Selecciona cómo te enviaremos la plata:</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    {[
                                        { key: 'transfer', label: 'Transferencia Bancaria', sub: 'CBU, CVU o Alias (Argentina)', icon: Building },
                                        { key: 'mercadopago', label: 'Mercado Pago', sub: 'Cobro automatizado o Alias MP', icon: Wallet },
                                        { key: 'stripe', label: 'Stripe', sub: 'Tarjetas internacionales y USD', icon: CreditCard },
                                    ].map(prov => {
                                        const Icon = prov.icon;
                                        const active = form.payoutProvider === prov.key;
                                        return (
                                            <button
                                                key={prov.key}
                                                type="button"
                                                onClick={() => setForm({ ...form, payoutProvider: prov.key })}
                                                className={`p-3 rounded-2xl border text-left transition-all ${active ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border hover:bg-muted'}`}
                                            >
                                                <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <p className="text-xs font-bold">{prov.label}</p>
                                                <p className="text-[10px] text-muted-foreground">{prov.sub}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CAMPOS ESPECÍFICOS DEL MÉTODO */}
                            {form.payoutProvider === 'transfer' && (
                                <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                                    <h3 className="text-xs font-bold flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-primary" />
                                        <span>Datos Bancarios para Transferencia Directa</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold block mb-1">CBU o CVU (22 dígitos) *</label>
                                            <input
                                                type="text"
                                                maxLength={22}
                                                placeholder="0000003100010000000000"
                                                value={form.cbu}
                                                onChange={e => setForm({ ...form, cbu: e.target.value.replace(/\D/g, '') })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-semibold block mb-1">Alias Bancario *</label>
                                            <input
                                                type="text"
                                                placeholder="inversor.finix.mp"
                                                value={form.alias}
                                                onChange={e => setForm({ ...form, alias: e.target.value.toLowerCase() })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-semibold block mb-1">Nombre y Apellido del Titular</label>
                                            <input
                                                type="text"
                                                placeholder="Juan Pablo Rolo"
                                                value={form.holderName}
                                                onChange={e => setForm({ ...form, holderName: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-semibold block mb-1">CUIT / CUIL del Titular</label>
                                            <input
                                                type="text"
                                                placeholder="20-44123456-9"
                                                value={form.holderCuit}
                                                onChange={e => setForm({ ...form, holderCuit: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="text-[10px] font-semibold block mb-1">Banco o Entidad Financiera</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Banco Santander, Mercado Pago Billetera, BBVA, Galicia, etc."
                                                value={form.bankName}
                                                onChange={e => setForm({ ...form, bankName: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {form.payoutProvider === 'mercadopago' && (
                                <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                                    <h3 className="text-xs font-bold flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5 text-primary" />
                                        <span>Configuración de Mercado Pago</span>
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-semibold block mb-1">Email o Alias asociado a tu cuenta de Mercado Pago</label>
                                            <input
                                                type="text"
                                                placeholder="tu-email@gmail.com o tu.alias.mp"
                                                value={form.mpEmail}
                                                onChange={e => setForm({ ...form, mpEmail: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border bg-background"
                                                style={{ borderColor: 'hsl(var(--border))' }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-semibold block mb-1">Public Key (Opcional checkout)</label>
                                                <input
                                                    type="text"
                                                    placeholder="APP_USR-..."
                                                    value={form.mpPublicKey}
                                                    onChange={e => setForm({ ...form, mpPublicKey: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono text-[11px]"
                                                    style={{ borderColor: 'hsl(var(--border))' }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold block mb-1">Access Token (Opcional checkout)</label>
                                                <input
                                                    type="password"
                                                    placeholder="APP_USR-..."
                                                    value={form.mpAccessToken}
                                                    onChange={e => setForm({ ...form, mpAccessToken: e.target.value })}
                                                    className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono text-[11px]"
                                                    style={{ borderColor: 'hsl(var(--border))' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {form.payoutProvider === 'stripe' && (
                                <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                                    <h3 className="text-xs font-bold flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-primary" />
                                        <span>Configuración de Stripe (Cobros Internacionales en USD)</span>
                                    </h3>
                                    <div>
                                        <label className="text-[10px] font-semibold block mb-1">Stripe Account ID o Email de cuenta conectada</label>
                                        <input
                                            type="text"
                                            placeholder="acct_1XXXXXXXXX"
                                            value={form.stripeAccountId}
                                            onChange={e => setForm({ ...form, stripeAccountId: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border bg-background font-mono text-[11px]"
                                            style={{ borderColor: 'hsl(var(--border))' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setForm({ ...form, payoutProvider: 'none' })}
                                className="text-[11px] text-muted-foreground hover:text-foreground underline pt-1 block"
                            >
                                Configurar pasarela más tarde desde el panel de administración
                            </button>
                        </motion.div>
                    )}

                    {/* PASO 6: SECCIONES INICIALES */}
                    {currentStep === 5 && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-base font-bold">Secciones Temáticas</h2>
                            <p className="text-xs text-muted-foreground">
                                Organiza las publicaciones de tu comunidad por áreas de interés. Podrás crear más luego.
                            </p>

                            <div className="space-y-2">
                                {form.sections.map((sec, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                                        <div className="flex items-center gap-2.5">
                                            <FolderKanban className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-semibold">{sec}</span>
                                        </div>
                                        {form.sections.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, sections: form.sections.filter((_, i) => i !== idx) })}
                                                className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    placeholder="Ej: Análisis de Criptomonedas..."
                                    value={form.newSectionInput}
                                    onChange={e => setForm({ ...form, newSectionInput: e.target.value })}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && form.newSectionInput.trim()) {
                                            e.preventDefault();
                                            setForm({ ...form, sections: [...form.sections, form.newSectionInput.trim()], newSectionInput: '' });
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 text-xs rounded-xl border bg-background"
                                    style={{ borderColor: 'hsl(var(--border))' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (form.newSectionInput.trim()) {
                                            setForm({ ...form, sections: [...form.sections, form.newSectionInput.trim()], newSectionInput: '' });
                                        }
                                    }}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-muted"
                                >
                                    Añadir
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 7: REVISIÓN & PUBLICAR */}
                    {currentStep === 6 && (
                        <motion.div
                            key="step7"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="text-center space-y-1">
                                <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 text-primary mb-2">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h2 className="text-lg font-bold">¡Tu comunidad está lista para nacer!</h2>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                    Revisa el resumen antes de publicarla. Podrás editar todos los detalles en cualquier momento.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl border space-y-2.5 bg-muted/20 text-xs">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Comunidad:</span>
                                    <span className="font-bold">{form.name}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Slug / URL:</span>
                                    <span className="font-mono text-[11px] text-primary">/comunidades/{form.slug || 'auto'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Categoría & Nivel:</span>
                                    <span className="font-semibold">{form.category} · {form.experienceLevel}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Acceso:</span>
                                    <span className="font-semibold">{form.privacyType}</span>
                                </div>
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Monetización:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        {form.monetization === 'paid' ? `${form.paidPlanName}: ${form.planCurrency} $${priceNumber.toLocaleString('es-AR')}/mes` : '100% Gratuita'}
                                    </span>
                                </div>
                                {form.monetization === 'paid' && (
                                    <div className="flex items-center justify-between border-b pb-2 bg-emerald-500/10 p-2 rounded-xl">
                                        <span className="text-muted-foreground">Desglose de Pago:</span>
                                        <span className="font-bold text-foreground">
                                            Tu ganancia neta: 95% (${creatorNet.toLocaleString('es-AR')}) · Finix fee: 5% (${platformFee.toLocaleString('es-AR')})
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cuenta de Cobro / Retiro:</span>
                                    <span className="font-semibold">
                                        {form.payoutProvider === 'transfer' ? `Transferencia (Alias: ${form.alias || 'Configurado'})` : form.payoutProvider === 'mercadopago' ? `Mercado Pago (${form.mpEmail || 'Configurado'})` : form.payoutProvider === 'stripe' ? 'Stripe' : 'A configurar luego'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleSubmit('DRAFT')}
                                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl border hover:bg-muted transition-colors disabled:opacity-40"
                                >
                                    Guardar como Borrador
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleSubmit('PUBLISHED')}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl btn-primary-glow"
                                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Publicar Comunidad</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Navigation */}
                {currentStep < STEPS.length - 1 && (
                    <div className="flex items-center justify-between pt-6 mt-6 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                        <button
                            type="button"
                            onClick={() => currentStep === 0 ? navigate('/comunidades') : setCurrentStep(s => s - 1)}
                            className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-muted transition-colors"
                            style={{ borderColor: 'hsl(var(--border))' }}
                        >
                            {currentStep === 0 ? 'Cancelar' : 'Anterior'}
                        </button>

                        <button
                            type="button"
                            disabled={!isStepValid()}
                            onClick={() => setCurrentStep(s => s + 1)}
                            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl btn-primary-glow disabled:opacity-40"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        >
                            <span>Siguiente</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
