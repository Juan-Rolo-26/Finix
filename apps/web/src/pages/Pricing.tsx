import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock,
    Loader2,
    Lock,
    Shield,
    ShieldCheck,
    Sparkles,
    Tag,
    X,
    Zap,
    ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { FinixPlan, PLAN_NAMES, subscribedPlan } from '@/lib/plans';
import { usePlanCheckout } from '@/hooks/usePlanCheckout';
import { PlanCheckoutDialog } from '@/components/PlanCheckoutDialog';
import { InvestorQuote } from '@/components/common/InvestorQuote';
import './pricing.css';

interface PlanFeature {
    text: string;
    included: boolean;
}

interface PlanItem {
    id: FinixPlan;
    title: string;
    badge?: string;
    description: string;
    icon?: typeof Sparkles;
    priceAmount: string;
    priceCurrency: string;
    priceNote?: string | null;
    features: PlanFeature[];
}

const PLANS: PlanItem[] = [
    {
        id: 'FREE',
        title: 'Free',
        badge: undefined,
        description: 'Para empezar a descubrir el mundo de las inversiones.',
        icon: undefined,
        priceAmount: '$0',
        priceCurrency: '',
        priceNote: null,
        features: [
            { text: 'Perfil público y feed social', included: true },
            { text: 'Seguir a otros inversores', included: true },
            { text: 'Unite a comunidades gratuitas', included: true },
            { text: 'Ver portafolios públicos', included: true },
            { text: 'Cotizaciones en tiempo real y Pre-Market', included: false },
            { text: 'Modelos de Valuación DCF & ROIC vs WACC', included: false },
            { text: 'Métricas TWR/XIRR y Benchmark SPY', included: false },
            { text: 'Alertas de mercado 24/7 multicanal', included: false },
        ],
    },
    {
        id: 'PRO',
        title: 'PRO',
        badge: 'MÁS ELEGIDO',
        description: 'Para inversores que quieren maximizar retornos con la suite cuantitativa completa de Finix.',
        icon: Sparkles,
        priceAmount: '$6.300',
        priceCurrency: 'ARS/mes',
        priceNote: 'Precio mensual informado antes del checkout',
        features: [
            { text: 'Todo lo del plan Free', included: true },
            { text: 'Mercados en Vivo & Pre-Market: Cotizaciones en tiempo real y precios congelados a las 10:30 hs', included: true },
            { text: 'Mapa de Calor Institucional S&P 500 y CEDEARs con filtros sectoriales GICS', included: true },
            { text: 'Lentes Técnicas Semanales Multimétricas (MACD impulso, RSI Semanal 45/55, ADX)', included: true },
            { text: 'Portafolios múltiples ilimitados con retornos TWR y XIRR, Sharpe Ratio y Benchmark SPY', included: true },
            { text: 'Modelos de Valuación Cuantitativa DCF de Fair Value y Mapa de Creación de Valor (ROIC vs WACC)', included: true },
            { text: 'Histórico auditado de balances de 10 años y scores de calidad Piotroski / Altman', included: true },
            { text: 'Noticias financieras en vivo con análisis algorítmico de sentimiento e impacto por ticker', included: true },
            { text: 'Calendario oficial TradingView con fechas ex-dividend y sorpresas de earnings', included: true },
        ],
    },
    {
        id: 'CREATOR',
        title: 'Creador',
        badge: undefined,
        description: 'Para líderes de opinión, educadores y analistas financieros profesionales.',
        icon: Zap,
        priceAmount: '$29.900',
        priceCurrency: 'ARS/mes',
        priceNote: 'Precio mensual informado antes del checkout',
        features: [
            { text: 'Todo lo del plan PRO incluido al 100%', included: true },
            { text: 'Creación y gestión de comunidades propias (Públicas y Privadas VIP)', included: true },
            { text: 'Cobros mensuales automáticos a suscriptores en ARS vía Mercado Pago', included: true },
            { text: 'Herramientas avanzadas de moderación y canales temáticos exclusivos', included: true },
            { text: 'Insignia dorada oficial de Creador Verificado', included: true },
            { text: 'Publicación de tesis con integración de balances y gráficos interactivos de Finix', included: true },
            { text: 'Métricas detalladas de retención, ingresos recurrentes y audiencia', included: true },
        ],
    },
];

const FAQS = [
    [
        '¿Qué incluye el acceso gratuito temporal?',
        'Actualmente, todas las herramientas avanzadas de Finix PRO y Creador están momentáneamente abiertas y 100% bonificadas para todos los usuarios. Podés disfrutar de todas las funcionalidades sin costo por tiempo limitado. Una vez finalizada esta etapa promocional de lanzamiento, el plan PRO volverá a requerir suscripción de pago.',
    ],
    [
        '¿Cómo se abona un plan cuando esté disponible?',
        'Los pagos son mensuales. Mercado Pago permite abonar mes a mes en pesos argentinos (ARS) sin renovación obligatoria o activar cobros automáticos recurrentes. Stripe permite suscribirse de forma mensual automática con cargo en moneda internacional.',
    ],
    [
        '¿Cómo cancelo o administro mi suscripción?',
        'Podés cancelar en cualquier momento con un solo clic desde Configuración → Suscripción. Conservarás todos los beneficios PRO hasta que finalice el período que ya hayas abonado, sin penalizaciones ni letras chicas.',
    ],
    [
        '¿PRO incluye todas las comunidades de pago?',
        'El plan PRO te da acceso a explorar e interactuar en la plataforma de comunidades. Sin embargo, si un creador decide cobrar una membresía de suscripción para su comunidad privada, esta se abona por separado a dicho creador.',
    ],
    [
        '¿Cómo funciona la monetización del plan Creador?',
        'El plan Creador te permite fijar tus propios precios de membresía mensual para tu comunidad. Los ingresos, comisiones aplicables y el saldo disponible para retiro se gestionan de forma clara desde el panel de facturación del creador.',
    ],
];

export default function Pricing() {
    const user = useAuthStore((state) => state.user);
    const checkout = usePlanCheckout();
    const { catalog, loading, configError } = checkout;
    const current = subscribedPlan(user);
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const limits = catalog?.planLimits;

    const [openFaqs, setOpenFaqs] = useState<number[]>([0]);

    const toggleFaq = (index: number) => {
        setOpenFaqs((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    useEffect(() => {
        if (
            params.has('status') ||
            params.has('payment_id') ||
            params.has('session_id') ||
            params.has('reference')
        ) {
            navigate(`/payment-result?${params.toString()}`, { replace: true });
        }
    }, [params, navigate]);

    useEffect(() => {
        if (location.hash === '#planes' && !loading) {
            document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash, loading]);

    const capacity = (
        plan: FinixPlan,
        key: 'maxWatchlists' | 'maxItemsPerList' | 'maxNotesPerItem'
    ) => limits?.[plan]?.[key]?.toLocaleString('es-AR') ?? '—';

    const yes = (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary">
            <Check size={15} />
        </span>
    );
    const no = <span className="text-muted-foreground/60 font-semibold">—</span>;

    const rows = [
        { label: 'Portafolios personales', values: ['1', 'Ilimitados', 'Ilimitados'] },
        { label: 'Listas de seguimiento', values: PLANS.map((plan) => capacity(plan.id, 'maxWatchlists')) },
        { label: 'Activos por lista', values: PLANS.map((plan) => capacity(plan.id, 'maxItemsPerList')) },
        { label: 'Notas por activo', values: PLANS.map((plan) => capacity(plan.id, 'maxNotesPerItem')) },
        { label: 'Objetivos de precio y notas', values: [yes, yes, yes] },
        { label: 'Importar listas desde CSV', values: [no, yes, yes] },
        { label: 'Seguimiento de ideas y alertas avanzadas', values: [no, yes, yes] },
        { label: 'Acceso a la sección de comunidades', values: [no, yes, yes] },
        { label: 'Crear y monetizar comunidades', values: [no, no, yes] },
    ];

    return (
        <div className="finix-pricing min-h-screen">
            {/* Ambient Background Lights */}
            <div className="pricing-ambient">
                <div className="pricing-ambient-orb-1" />
                <div className="pricing-ambient-orb-2" />
            </div>

            {/* Mobile Navigation Header */}
            <nav className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-20">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={18} />
                    <span>Inicio</span>
                </Link>
                <Link to="/dashboard" className="font-extrabold tracking-widest text-base">
                    FINIX
                </Link>
            </nav>

            <main className="pricing-main">
                {/* Hero Header */}
                <header className="pricing-heading">
                    <div className="pricing-eyebrow-badge">
                        <Sparkles size={14} className="text-primary" />
                        <span>PLANES &amp; SUSCRIPCIONES</span>
                    </div>

                    <h1>
                        Invertí con herramientas de{' '}
                        <span className="pricing-heading-gradient">nivel profesional</span>
                    </h1>

                    <p>
                        Elegí la potencia que necesitás para tus análisis, portafolios y comunidad.
                        Precios transparentes, sin contratos forzosos ni comisiones ocultas.
                    </p>

                    {user && (
                        <div className="pricing-user-status">
                            <div className="pricing-user-badge">
                                <span className="pricing-user-dot" />
                                <span>Tu plan actual: <strong>{PLAN_NAMES[current]}</strong></span>
                            </div>
                            <Link className="pricing-user-link" to="/settings?tab=suscripcion">
                                Gestionar suscripción <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </header>

                {/* Notifications & Status Banners */}
                {loading && (
                    <div className="pricing-notice" role="status">
                        <Loader2 size={20} className="animate-spin text-primary" />
                        <span>Consultando disponibilidad y precios actualizados…</span>
                    </div>
                )}

                {configError && (
                    <div className="pricing-notice border-red-500/30 bg-red-500/10 text-red-600" role="alert">
                        <p>{configError}</p>
                        <button
                            type="button"
                            className="font-bold underline ml-auto"
                            onClick={() => { void checkout.reload(); }}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {catalog?.freeAccessEnabled && (
                    <div className="pricing-notice pricing-notice--free" role="status">
                        <ShieldCheck size={28} />
                        <div>
                            <strong>Finix PRO y sus funcionalidades están momentáneamente abiertas</strong>
                            <p>
                                Actualmente todas las funciones avanzadas de PRO y Creador están 100% bonificadas para todos los usuarios. Aprovechá este período de acceso libre; más adelante las herramientas PRO volverán a ser de pago bajo suscripción.
                            </p>
                        </div>
                        <span className="pricing-free-tag">Acceso Libre Temporal</span>
                    </div>
                )}

                {catalog?.purchasesPaused && !catalog.freeAccessEnabled && (
                    <div className="pricing-notice" role="status">
                        <Clock size={20} className="text-amber-500" />
                        <span>Las nuevas compras están pausadas momentáneamente. Podés seguir gestionando tus suscripciones existentes.</span>
                    </div>
                )}

                {checkout.error && !checkout.selectedPlan && (
                    <div className="pricing-notice border-red-500/30 bg-red-500/10 text-red-600" role="alert">
                        <span>{checkout.error}</span>
                    </div>
                )}

                {/* The 3 Cards */}
                <section id="planes" className="pricing-plans" aria-label="Planes de Finix">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const included = current === 'CREATOR' && plan.id === 'PRO';
                        const contracted = current === plan.id && !!user;
                        const unavailable =
                            plan.id !== 'FREE' &&
                            (!catalog ||
                                loading ||
                                (!catalog.freeAccessEnabled &&
                                    !contracted &&
                                    !included &&
                                    (catalog.purchasesPaused ||
                                        (!catalog.mercadoPagoAvailable && !catalog.stripeAvailable))));

                        let displayPrice = plan.priceAmount;
                        let displayCurrency = plan.priceCurrency;
                        if (loading && plan.id !== 'FREE') {
                            displayPrice = '…';
                        } else if (plan.id === 'PRO') {
                            if (catalog?.proPriceArs != null) {
                                displayPrice = `$${catalog.proPriceArs.toLocaleString('es-AR')}`;
                                displayCurrency = 'ARS/mes';
                            } else if (catalog?.proPriceUsd != null && !catalog?.mercadoPagoAvailable) {
                                displayPrice = `$${catalog.proPriceUsd.toFixed(2)}`;
                                displayCurrency = 'USD/mes';
                            } else {
                                displayPrice = '$6.300';
                                displayCurrency = 'ARS/mes';
                            }
                        } else if (plan.id === 'CREATOR' && catalog?.creatorPriceArs != null) {
                            displayPrice = `$${catalog.creatorPriceArs.toLocaleString('es-AR')}`;
                            displayCurrency = 'ARS/mes';
                        }

                        let buttonLabel = '';
                        if (plan.id === 'FREE') {
                            buttonLabel = user ? 'Ir a mi inicio' : 'Crear cuenta gratis';
                        } else if (!user) {
                            buttonLabel = 'Iniciar sesión para comprar';
                        } else if (catalog?.freeAccessEnabled) {
                            buttonLabel = `Usar ${plan.id === 'PRO' ? 'PRO' : 'Creador'} gratis`;
                        } else if (contracted) {
                            buttonLabel = `Gestionar plan ${plan.title}`;
                        } else if (included) {
                            buttonLabel = 'Incluido en tu suscripción';
                        } else if (plan.id === 'PRO') {
                            buttonLabel = 'Comenzar con PRO';
                        } else {
                            buttonLabel = 'Elegir Plan Creador';
                        }

                        const handleAction = () => {
                            if (plan.id === 'FREE') {
                                navigate(user ? '/dashboard' : '/auth?mode=register&redirect=%2Fdashboard');
                                return;
                            }
                            if (!user) {
                                navigate('/auth?mode=login&redirect=%2Fpricing%23planes');
                                return;
                            }
                            if (contracted || included) {
                                navigate('/settings?tab=suscripcion');
                                return;
                            }
                            checkout.choose(plan.id);
                        };

                        const isFeatured = plan.id === 'PRO';

                        return (
                            <article
                                key={plan.id}
                                className={`pricing-plan pricing-plan--${plan.id.toLowerCase()} ${isFeatured ? 'pricing-plan--featured' : ''}`}
                                data-plan={plan.id}
                            >
                                {plan.badge && (
                                    <div className="pricing-popular-badge">
                                        <span>{plan.badge}</span>
                                    </div>
                                )}

                                {/* Header */}
                                <div className="pricing-plan__header">
                                    <h2 className="pricing-plan__title">
                                        {Icon && <Icon size={20} className="pricing-plan__title-icon" />}
                                        <span>{plan.title}</span>
                                    </h2>
                                    <p className="pricing-plan__description">{plan.description}</p>
                                </div>

                                {/* Price Box */}
                                <div className="pricing-plan__price-box">
                                    <div className="pricing-plan__price">
                                        <span className="pricing-plan__amount">{displayPrice}</span>
                                        {displayCurrency && (
                                            <span className="pricing-plan__period">{displayCurrency}</span>
                                        )}
                                    </div>
                                    {plan.priceNote && (
                                        <div className="pricing-plan__price-note">
                                            <Tag size={13} className="shrink-0" />
                                            <span>{plan.priceNote}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action CTA Button */}
                                <button
                                    type="button"
                                    className={`pricing-button pricing-button--${plan.id.toLowerCase()}`}
                                    disabled={unavailable || checkout.busy}
                                    onClick={handleAction}
                                >
                                    <span>{buttonLabel}</span>
                                    <ArrowRight size={16} />
                                </button>

                                {/* Features List */}
                                <ul className="pricing-plan__features">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature.text}
                                            className={`pricing-feature-item ${!feature.included ? 'pricing-feature-item--disabled' : ''}`}
                                        >
                                            <span
                                                className={`pricing-feature-icon ${
                                                    feature.included
                                                        ? 'pricing-feature-icon--check'
                                                        : 'pricing-feature-icon--cross'
                                                }`}
                                            >
                                                {feature.included ? (
                                                    <Check size={12} strokeWidth={3} />
                                                ) : (
                                                    <X size={12} strokeWidth={2.5} />
                                                )}
                                            </span>
                                            <span className="pricing-feature-text">{feature.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </section>

                {/* Trust & Guarantee Banner */}
                <div className="pricing-trust-bar">
                    <div className="pricing-trust-item">
                        <div className="pricing-trust-icon">
                            <Lock size={22} />
                        </div>
                        <div>
                            <h3>Pagos 100% Seguros</h3>
                            <p>Procesamiento encriptado de nivel bancario mediante Mercado Pago y Stripe.</p>
                        </div>
                    </div>

                    <div className="pricing-trust-item">
                        <div className="pricing-trust-icon">
                            <Shield size={22} />
                        </div>
                        <div>
                            <h3>Sin Permanencia</h3>
                            <p>Cancelá tu renovación en cualquier momento con un solo clic desde tu cuenta.</p>
                        </div>
                    </div>

                    <div className="pricing-trust-item">
                        <div className="pricing-trust-icon">
                            <Zap size={22} />
                        </div>
                        <div>
                            <h3>Activación Inmediata</h3>
                            <p>Acceso instantáneo a todas las herramientas PRO en cuanto se confirma el pago.</p>
                        </div>
                    </div>
                </div>

                {/* Feature Comparison Matrix */}
                <section className="pricing-comparison" aria-labelledby="pricing-comparison-title">
                    <div className="pricing-section-heading">
                        <h2 id="pricing-comparison-title">Compará lo que incluye cada plan</h2>
                        <p>
                            {catalog?.freeAccessEnabled
                                ? 'Estos son los límites habituales de cada plan. El acceso temporal bonificado habilita las funciones de Creador.'
                                : 'Detalle comparativo de capacidades y herramientas disponibles en Finix.'}
                        </p>
                    </div>

                    <div className="pricing-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Herramienta o límite</th>
                                    {PLANS.map((plan) => (
                                        <th
                                            scope="col"
                                            key={plan.id}
                                            className={plan.id === 'PRO' ? 'col-pro' : ''}
                                        >
                                            {PLAN_NAMES[plan.id]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.label}>
                                        <th scope="row">{row.label}</th>
                                        {row.values.map((value, index) => (
                                            <td
                                                key={index}
                                                className={index === 1 ? 'col-pro' : ''}
                                            >
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="pricing-footnote">
                        * Las membresías fijadas por creadores de comunidades privadas se contratan por separado.
                    </p>
                </section>

                {/* Interactive FAQ */}
                <section className="pricing-faq" aria-labelledby="pricing-faq-title">
                    <div className="pricing-section-heading">
                        <h2 id="pricing-faq-title">Preguntas frecuentes</h2>
                        <p>Todo lo que necesitás saber sobre pagos, renovaciones y acceso.</p>
                    </div>

                    <div className="pricing-faq-list">
                        {FAQS.map(([question, answer], index) => {
                            const isOpen = openFaqs.includes(index);
                            return (
                                <div
                                    key={question}
                                    className="pricing-faq-item"
                                    data-open={isOpen}
                                >
                                    <button
                                        type="button"
                                        className="pricing-faq-question"
                                        onClick={() => toggleFaq(index)}
                                    >
                                        <span>{question}</span>
                                        <ChevronDown size={18} className="pricing-faq-chevron" />
                                    </button>
                                    {isOpen && (
                                        <div className="pricing-faq-answer">
                                            <p>{answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Investor Wisdom Quote */}
                <InvestorQuote investorId="charlie-munger" showBackToTop />

                {/* Footer Links */}
                <footer className="pricing-footer">
                    <Link to="/terms">Términos y condiciones</Link>
                    <Link to="/privacy">Política de privacidad</Link>
                    <Link to="/help">Centro de ayuda</Link>
                </footer>
            </main>

            <PlanCheckoutDialog checkout={checkout} />
        </div>
    );
}
