import { useState, useMemo } from 'react';
import { Search, HelpCircle, Mail, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import { LEGAL_NAV } from '@/components/legal/LegalPageLayout';

// ─── FAQ Data ──────────────────────────────────────────────────────────────────

const CONTACT_EMAIL = 'finiixarg@gmail.com';

interface FaqItem {
    id: string;
    categoryId: string;
    question: string;
    answer: React.ReactNode;
}

const FAQS: FaqItem[] = [
    // ── FINIX ──────────────────────────────────────────────────────────────
    {
        id: 'f-01', categoryId: 'finix',
        question: '¿Qué es Finix?',
        answer: 'Finix es una plataforma digital orientada a finanzas, mercados, economía e inversiones. Combina información financiera, herramientas tecnológicas, contenido educativo, datos de mercado y funcionalidades de comunidad en un solo lugar.',
    },
    {
        id: 'f-02', categoryId: 'finix',
        question: '¿Qué puedo hacer en Finix?',
        answer: 'Podés acceder a datos de mercado, armar y seguir tu portafolio de activos, explorar noticias y análisis financieros, interactuar con la comunidad de usuarios, seguir un calendario financiero curado, y acceder a funcionalidades avanzadas con Finix Pro.',
    },
    {
        id: 'f-03', categoryId: 'finix',
        question: '¿Finix es un asesor financiero?',
        answer: 'No. Finix no es un asesor financiero ni actúa como tal. La plataforma proporciona información general, herramientas tecnológicas y contenido educativo. La información disponible en Finix no constituye asesoramiento financiero, de inversión, legal, contable ni fiscal. Las decisiones de inversión son exclusiva responsabilidad de cada usuario.',
    },
    {
        id: 'f-04', categoryId: 'finix',
        question: '¿Finix recomienda inversiones?',
        answer: 'No. Finix no recomienda comprar, vender ni mantener ningún activo financiero determinado. Los datos, análisis, rankings, señales, publicaciones de otros usuarios o cualquier contenido disponible en la plataforma tienen carácter informativo y educativo, y nunca deben interpretarse como una recomendación personalizada.',
    },
    {
        id: 'f-05', categoryId: 'finix',
        question: '¿Finix ejecuta operaciones financieras?',
        answer: 'No. Finix no es un broker, no ejecuta órdenes de compra o venta de activos, no custodia dinero, no gestiona fondos y no está habilitado como ALYC (Agente de Liquidación y Compensación) ni como ninguna entidad financiera regulada.',
    },
    {
        id: 'f-06', categoryId: 'finix',
        question: '¿De dónde obtiene Finix sus datos?',
        answer: 'Finix obtiene datos de mercado de proveedores externos especializados. El proveedor principal de datos fundamentales y de mercado es Financial Modeling Prep (FMP). Para widgets y gráficos de precios en tiempo real, se utilizan herramientas de TradingView. Estas fuentes tienen sus propios términos y condiciones.',
    },
    {
        id: 'f-07', categoryId: 'finix',
        question: '¿Los datos de mercado están en tiempo real?',
        answer: 'Depende de la fuente y del tipo de dato. Algunos datos pueden tener demoras de 15 a 20 minutos o más, según el proveedor y el activo. Finix no garantiza que todos los datos estén actualizados en tiempo real. Si una decisión financiera depende de un dato concreto, debés verificarlo por canales adicionales.',
    },
    {
        id: 'f-08', categoryId: 'finix',
        question: '¿Qué significa que un dato sea "estimado"?',
        answer: 'Los datos marcados como "estimado" o "estimación" son proyecciones calculadas a partir de modelos, consensos de analistas u otras fuentes, y no representan resultados confirmados. Pueden cambiar con el tiempo y diferir de los valores reales cuando estos se publiquen.',
    },
    {
        id: 'f-09', categoryId: 'finix',
        question: '¿Qué significa que un dato esté "confirmado"?',
        answer: 'Un dato marcado como "confirmado" proviene de fuentes que reportan el valor oficial publicado por la empresa o entidad correspondiente. Aun así, Finix no garantiza que todos los datos confirmados estén libres de errores o retrasos.',
    },
    {
        id: 'f-10', categoryId: 'finix',
        question: '¿Por qué algunos datos pueden tener retrasos?',
        answer: 'Los retrasos pueden deberse a: los términos de los proveedores de datos (muchos datos de bolsa tienen demoras por defecto), limitaciones técnicas del plan de suscripción con las fuentes, tiempo de procesamiento del sistema, o interrupciones temporales en las APIs externas.',
    },
    {
        id: 'f-11', categoryId: 'finix',
        question: '¿Finix garantiza la exactitud de la información?',
        answer: 'No. Finix hace su mejor esfuerzo para ofrecer información de calidad, pero no puede garantizar la exactitud, integridad o actualización permanente de los datos. La información puede contener errores u omisiones provenientes de las fuentes externas. Nunca debés tomar decisiones financieras importantes basándote únicamente en datos de Finix sin verificarlos por otras vías.',
    },

    // ── CUENTA ─────────────────────────────────────────────────────────────
    {
        id: 'c-01', categoryId: 'cuenta',
        question: '¿Cómo creo una cuenta?',
        answer: 'Podés registrarte en Finix con tu dirección de email o con tu cuenta de Google. En la pantalla inicial, elegí "Crear cuenta", completá los datos requeridos y confirmá tu dirección de email cuando recibas el correo de verificación.',
    },
    {
        id: 'c-02', categoryId: 'cuenta',
        question: '¿Cómo inicio sesión?',
        answer: 'Ingresá a Finix con tu email y contraseña, o usando tu cuenta de Google. Si ya tenés una sesión activa, el sistema te redirigirá automáticamente al dashboard.',
    },
    {
        id: 'c-03', categoryId: 'cuenta',
        question: '¿Cómo cambio mi contraseña?',
        answer: 'Desde Configuración > Seguridad podés cambiar tu contraseña. También podés hacerlo desde la pantalla de inicio de sesión usando la opción "¿Olvidaste tu contraseña?".',
    },
    {
        id: 'c-04', categoryId: 'cuenta',
        question: '¿Qué hago si olvidé mi contraseña?',
        answer: 'En la pantalla de inicio de sesión, hacé clic en "¿Olvidaste tu contraseña?". Ingresá el email vinculado a tu cuenta y recibirás un enlace o código para restablecerla. Revisá también la carpeta de spam si no ves el email.',
    },
    {
        id: 'c-05', categoryId: 'cuenta',
        question: '¿Cómo modifico mi perfil?',
        answer: 'Podés editar tu perfil desde la sección "Perfil" o desde Configuración. Ahí podés actualizar tu foto, nombre de usuario, biografía, ubicación y otras preferencias.',
    },
    {
        id: 'c-06', categoryId: 'cuenta',
        question: '¿Cómo elimino mi cuenta?',
        answer: 'Para solicitar la eliminación de tu cuenta, escribinos a finiixarg@gmail.com indicando tu usuario y la solicitud. La eliminación puede tomar hasta 30 días hábiles. Algunos datos pueden conservarse por obligaciones legales o necesidades técnicas razonables.',
    },
    {
        id: 'c-07', categoryId: 'cuenta',
        question: '¿Cómo funcionan las verificaciones?',
        answer: 'Finix puede otorgar insignias de verificación a usuarios que cumplan con criterios específicos (por ejemplo, analistas con credenciales comprobables, creadores de contenido con trayectoria reconocida o cuentas institucionales). Para solicitar verificación, contactanos en finiixarg@gmail.com con la documentación de respaldo correspondiente.',
    },
    {
        id: 'c-08', categoryId: 'cuenta',
        question: '¿Cómo funcionan las notificaciones?',
        answer: 'Recibís notificaciones dentro de la plataforma sobre actividad relacionada con tus publicaciones, comunidades, mensajes y eventos importantes. Podés gestionar tus preferencias de notificación desde Configuración.',
    },
    {
        id: 'c-09', categoryId: 'cuenta',
        question: '¿Cómo puedo reportar un problema técnico?',
        answer: 'Si encontrás un error técnico o un comportamiento inesperado, podés escribirnos a finiixarg@gmail.com describiendo el problema, el dispositivo que usás y los pasos para reproducirlo. También podés usar el sistema de reporte disponible dentro de la plataforma.',
    },

    // ── COMUNIDAD ──────────────────────────────────────────────────────────
    {
        id: 'com-01', categoryId: 'comunidad',
        question: '¿Qué son las comunidades?',
        answer: 'Las comunidades son espacios dentro de Finix donde grupos de usuarios pueden compartir contenido, análisis, ideas y debates relacionados con finanzas e inversiones. Cada comunidad puede tener sus propias reglas y moderadores.',
    },
    {
        id: 'com-02', categoryId: 'comunidad',
        question: '¿Cómo puedo unirme a una comunidad?',
        answer: 'Desde la sección "Comunidades" podés explorar las comunidades disponibles y unirte libremente a las públicas. Las comunidades privadas o de pago pueden requerir aprobación del administrador o el pago de una suscripción.',
    },
    {
        id: 'com-03', categoryId: 'comunidad',
        question: '¿Cómo creo una comunidad?',
        answer: 'Podés crear una comunidad desde la sección correspondiente dentro de Finix. Al crearla, podés definir el nombre, descripción, reglas, imagen y si será pública o privada. El creador de la comunidad actúa como administrador.',
    },
    {
        id: 'com-04', categoryId: 'comunidad',
        question: '¿Cómo funcionan las comunidades de pago?',
        answer: 'Algunos creadores pueden configurar comunidades con suscripción de pago a través de MercadoPago o Stripe. Los miembros pagan para acceder al contenido exclusivo de esa comunidad. Finix proporciona la infraestructura tecnológica, pero el contenido es responsabilidad del creador. Unirse a una comunidad de pago no implica recibir asesoramiento financiero personalizado.',
    },
    {
        id: 'com-05', categoryId: 'comunidad',
        question: '¿Qué puedo publicar?',
        answer: 'Podés publicar análisis, ideas, noticias, gráficos, comentarios y cualquier contenido relacionado con finanzas, mercados e inversiones que cumpla con las Condiciones de Uso de Finix y las reglas de la comunidad correspondiente.',
    },
    {
        id: 'com-06', categoryId: 'comunidad',
        question: '¿Qué contenido está prohibido?',
        answer: (
            <ul className="list-disc pl-4 space-y-1">
                <li>Información falsa, engañosa o presentada como certeza cuando no lo es</li>
                <li>Promesas de rentabilidades garantizadas o recomendaciones de inversión presentadas como personalizadas</li>
                <li>Manipulación de mercado, pump &amp; dump o esquemas similares</li>
                <li>Spam, phishing, malware o contenido malicioso</li>
                <li>Suplantación de identidad o fraude</li>
                <li>Acoso, amenazas, discriminación o abuso hacia otros usuarios</li>
                <li>Contenido que infrinja derechos de terceros</li>
                <li>Promoción de actividades ilegales</li>
            </ul>
        ),
    },
    {
        id: 'com-07', categoryId: 'comunidad',
        question: '¿Cómo reporto una publicación?',
        answer: 'En cada publicación encontrarás un menú de opciones que incluye la opción "Reportar". Seleccionala, elegí el motivo y enviá el reporte. El equipo de moderación evaluará la situación.',
    },
    {
        id: 'com-08', categoryId: 'comunidad',
        question: '¿Cómo reporto a otro usuario?',
        answer: 'Podés reportar a un usuario desde su perfil o desde sus publicaciones. Seleccioná la opción "Reportar usuario" y completá el formulario indicando el motivo del reporte.',
    },
    {
        id: 'com-09', categoryId: 'comunidad',
        question: '¿Qué sucede después de realizar un reporte?',
        answer: 'El equipo de moderación revisa el reporte y toma las acciones que considere pertinentes. Finix no garantiza respuesta inmediata ni un resultado específico en cada caso, pero todos los reportes son evaluados.',
    },
    {
        id: 'com-10', categoryId: 'comunidad',
        question: '¿Cómo funcionan los moderadores?',
        answer: 'Los moderadores son usuarios designados por el administrador de una comunidad para ayudar a mantener el orden y hacer cumplir las reglas. Tienen capacidad para moderar contenido dentro de su comunidad.',
    },

    // ── FINIX PRO ──────────────────────────────────────────────────────────
    {
        id: 'pro-01', categoryId: 'pro',
        question: '¿Qué es Finix Pro?',
        answer: 'Finix Pro es el plan de suscripción premium de Finix. Desbloquea funcionalidades avanzadas de análisis, datos y herramientas dentro de la plataforma.',
    },
    {
        id: 'pro-02', categoryId: 'pro',
        question: '¿Qué funcionalidades incluye Finix Pro?',
        answer: (
            <ul className="list-disc pl-4 space-y-1">
                <li>Rankings ampliados de mejores y peores rendimientos (Top 10, Top 25, Top 50)</li>
                <li>Estimaciones de consenso y métricas de sorpresa en resultados trimestrales</li>
                <li>Acceso a análisis avanzados de empresas y activos</li>
                <li>Insignia PRO en el perfil</li>
                <li>Acceso prioritario a nuevas funcionalidades</li>
            </ul>
        ),
    },
    {
        id: 'pro-03', categoryId: 'pro',
        question: '¿Finix Pro constituye asesoramiento financiero?',
        answer: 'No. Finix Pro es un conjunto de herramientas y datos de carácter informativo y educativo. Las funcionalidades adicionales que ofrece —incluyendo análisis, valoraciones, estimaciones y métricas— no constituyen asesoramiento financiero, de inversión ni recomendación personalizada. Las decisiones de inversión son responsabilidad exclusiva del usuario.',
    },
    {
        id: 'pro-04', categoryId: 'pro',
        question: '¿Los análisis de Finix Pro garantizan resultados?',
        answer: 'No. Los análisis disponibles en Finix Pro son contenido informativo general. Las valoraciones, estimaciones, precios objetivo y proyecciones son modelos sujetos a cambios y no garantizan rendimientos futuros. El rendimiento pasado no predice resultados futuros. Siempre realizá tu propia investigación antes de tomar decisiones de inversión.',
    },
    {
        id: 'pro-05', categoryId: 'pro',
        question: '¿Cómo puedo suscribirme a Finix Pro?',
        answer: 'Podés suscribirte desde la sección "Pro" o "Planes" dentro de la plataforma. El proceso de pago se realiza a través de MercadoPago de forma segura.',
    },

    // ── SUSCRIPCIONES ──────────────────────────────────────────────────────
    {
        id: 's-01', categoryId: 'suscripciones',
        question: '¿Cuáles son los planes disponibles?',
        answer: 'Finix ofrece actualmente dos planes principales: el plan gratuito (FREE), que da acceso a las funcionalidades básicas de la plataforma; y Finix Pro, que desbloquea funcionalidades avanzadas de análisis y datos.',
    },
    {
        id: 's-02', categoryId: 'suscripciones',
        question: '¿Cómo funcionan los pagos?',
        answer: 'Los pagos de suscripción se procesan a través de MercadoPago. Finix no almacena los datos completos de tu tarjeta: esa información la gestiona directamente MercadoPago bajo sus propios estándares de seguridad.',
    },
    {
        id: 's-03', categoryId: 'suscripciones',
        question: '¿Cómo cancelo mi suscripción?',
        answer: 'Podés gestionar o cancelar tu suscripción desde Configuración > Plan. Si necesitás asistencia, también podés escribirnos a finiixarg@gmail.com.',
    },
    {
        id: 's-04', categoryId: 'suscripciones',
        question: '¿Qué ocurre al cancelar?',
        answer: 'Si cancelás tu suscripción, mantendrás el acceso a las funcionalidades Pro hasta que finalice el período abonado. Al vencimiento, tu cuenta volverá automáticamente al plan gratuito sin pérdida de tus datos o contenido.',
    },
    {
        id: 's-05', categoryId: 'suscripciones',
        question: '¿Qué ocurre ante un pago rechazado?',
        answer: 'Si un pago es rechazado, el procesador intentará cobrarlo nuevamente según sus políticas. Si el problema persiste, tu acceso a las funcionalidades Pro puede suspenderse hasta regularizar el pago. Te recomendamos verificar los datos de tu medio de pago.',
    },
    {
        id: 's-06', categoryId: 'suscripciones',
        question: '¿Puedo obtener un reembolso?',
        answer: 'Las políticas de reembolso dependen de las condiciones del plan contratado. Para solicitudes específicas de reembolso, escribinos a finiixarg@gmail.com con los detalles de tu caso.',
    },

    // ── DATOS Y PRIVACIDAD ─────────────────────────────────────────────────
    {
        id: 'p-01', categoryId: 'privacidad',
        question: '¿Qué datos recopila Finix?',
        answer: 'Finix recopila los datos que proporcionás al registrarte (email, nombre de usuario), información de tu perfil, tu actividad dentro de la plataforma (publicaciones, portafolio, comunidades), datos técnicos para seguridad (IP, navegador, sesión) y datos relacionados con suscripciones si las tenés.',
    },
    {
        id: 'p-02', categoryId: 'privacidad',
        question: '¿Para qué utiliza Finix mis datos?',
        answer: 'Para crear y administrar tu cuenta, permitirte usar las funcionalidades de la plataforma, garantizar la seguridad del servicio, gestionar suscripciones y pagos, enviarte comunicaciones operativas y mejorar la experiencia de Finix.',
    },
    {
        id: 'p-03', categoryId: 'privacidad',
        question: '¿Finix vende mis datos?',
        answer: 'No. Finix no vende información personal a terceros. Solo comparte datos con proveedores técnicos indispensables para operar el servicio (como la infraestructura de autenticación, el email transaccional y el procesador de pagos) o cuando la ley lo exige.',
    },
    {
        id: 'p-04', categoryId: 'privacidad',
        question: '¿Cómo puedo solicitar la eliminación de mis datos?',
        answer: 'Escribinos a finiixarg@gmail.com con la solicitud de eliminación de cuenta y datos. Procesamos las solicitudes en un plazo razonable. Algunos datos pueden conservarse por obligaciones legales o necesidades operativas legítimas.',
    },
    {
        id: 'p-05', categoryId: 'privacidad',
        question: '¿Cómo protege Finix mi información?',
        answer: 'Implementamos medidas técnicas y organizativas razonables para proteger los datos personales. La autenticación es gestionada por Supabase con cifrado estándar de la industria. Aun así, ningún sistema conectado a Internet puede garantizar seguridad absoluta.',
    },
    {
        id: 'p-06', categoryId: 'privacidad',
        question: '¿Qué son las cookies que usa Finix?',
        answer: 'Finix utiliza principalmente mecanismos de almacenamiento local (localStorage del navegador) para mantener tu sesión y preferencias. No utilizamos cookies de publicidad ni de rastreo de terceros. TradingView, utilizado para los widgets de gráficos, puede establecer sus propias cookies de terceros según sus propias políticas.',
    },

    // ── SEGURIDAD ──────────────────────────────────────────────────────────
    {
        id: 'seg-01', categoryId: 'seguridad',
        question: '¿Cómo puedo proteger mi cuenta?',
        answer: (
            <ul className="list-disc pl-4 space-y-1">
                <li>Usá una contraseña única y difícil de adivinar para Finix</li>
                <li>No compartas tus credenciales con nadie</li>
                <li>Cerrá sesión si usás dispositivos compartidos</li>
                <li>Si notás actividad sospechosa, cambiá tu contraseña de inmediato</li>
                <li>Verificá que el sitio que visitás sea el oficial de Finix</li>
            </ul>
        ),
    },
    {
        id: 'seg-02', categoryId: 'seguridad',
        question: '¿Qué hago si detecto actividad sospechosa en mi cuenta?',
        answer: 'Cambiá tu contraseña de inmediato desde Configuración. Si no podés acceder a tu cuenta, usá la opción de recuperación de contraseña. Luego escribinos a finiixarg@gmail.com para reportar el incidente.',
    },
    {
        id: 'seg-03', categoryId: 'seguridad',
        question: '¿Cómo reporto una vulnerabilidad de seguridad?',
        answer: 'Si descubrís una vulnerabilidad en Finix, te pedimos que la reportes de forma responsable escribiéndonos a finiixarg@gmail.com antes de hacerla pública. Esto nos permite investigar y corregir el problema sin poner en riesgo a otros usuarios.',
    },
    {
        id: 'seg-04', categoryId: 'seguridad',
        question: '¿Finix garantiza seguridad absoluta?',
        answer: 'Ningún sistema conectado a Internet puede garantizar seguridad absoluta. Finix implementa medidas razonables y estándares de la industria para proteger la plataforma y los datos de los usuarios, pero no podemos eliminar completamente todos los riesgos.',
    },
];

const CATEGORIES = [
    { id: 'all', label: 'Todas', icon: '🔍' },
    { id: 'finix', label: 'Finix', icon: '🏦' },
    { id: 'cuenta', label: 'Cuenta', icon: '👤' },
    { id: 'comunidad', label: 'Comunidad', icon: '👥' },
    { id: 'pro', label: 'Finix Pro', icon: '⭐' },
    { id: 'suscripciones', label: 'Suscripciones', icon: '💳' },
    { id: 'privacidad', label: 'Datos y Privacidad', icon: '🔒' },
    { id: 'seguridad', label: 'Seguridad', icon: '🛡️' },
];


// ─── Accordion Item ────────────────────────────────────────────────────────────
function FaqAccordion({ faq }: { faq: FaqItem }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:border-border/80">
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls={`${faq.id}-content`}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base cursor-pointer"
            >
                <span className="leading-snug text-foreground">{faq.question}</span>
                <ChevronRight
                    className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90 text-primary' : ''}`}
                />
            </button>
            {open && (
                <div
                    id={`${faq.id}-content`}
                    role="region"
                    className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30"
                >
                    {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
                </div>
            )}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Help() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [scrolled, setScrolled] = useState(false);
    const [showBackTop, setShowBackTop] = useState(false);

    useState(() => {
        const fn = () => {
            setScrolled(window.scrollY > 10);
            setShowBackTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', fn, { passive: true });
    });

    const filteredFaqs = useMemo(() => {
        return FAQS.filter(faq => {
            const matchCat = selectedCategory === 'all' || faq.categoryId === selectedCategory;
            const q = searchQuery.trim().toLowerCase();
            const matchSearch = !q ||
                faq.question.toLowerCase().includes(q) ||
                (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(q));
            return matchCat && matchSearch;
        });
    }, [searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            {/* ── Navbar ── */}
            <nav className={`fixed top-0 w-full z-50 border-b transition-all ${scrolled ? 'border-border/50 bg-background/80 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
                <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Volver</span>
                    </button>
                    <Link to="/dashboard" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-black/20 dark:border-white/30 bg-white dark:bg-zinc-900 shadow-2xs transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Finix" className="h-5 w-5 object-contain" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tight text-foreground">Finix</span>
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-4 md:px-8 pt-24 pb-20 max-w-4xl">
                {/* ── Legal nav tabs ── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide border-b border-border/40 text-sm font-semibold">
                    {LEGAL_NAV.map(nav => {
                        const isActive = nav.to === '/help';
                        return (
                            <Link
                                key={nav.to}
                                to={nav.to}
                                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                {nav.label}
                            </Link>
                        );
                    })}
                </div>

                {/* ── Header ── */}
                <header className="text-center max-w-2xl mx-auto mb-12 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight">
                        Centro de Ayuda
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Encontrá respuestas sobre Finix, sus funcionalidades, tu cuenta y el funcionamiento de la plataforma.
                    </p>

                    {/* ── Search ── */}
                    <div className="relative max-w-lg mx-auto pt-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar preguntas (ej: contraseña, portafolio, pro, comunidad...)"
                            aria-label="Buscar preguntas frecuentes"
                            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-card border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all shadow-sm outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </header>

                {/* ── Category filters ── */}
                <div
                    className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide"
                    role="tablist"
                    aria-label="Categorías de ayuda"
                >
                    {CATEGORIES.map(cat => {
                        const active = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                role="tab"
                                aria-selected={active}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                            >
                                <span role="img" aria-hidden="true">{cat.icon}</span>
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── FAQ results info ── */}
                {searchQuery && (
                    <p className="text-xs text-muted-foreground mb-4">
                        {filteredFaqs.length} resultado{filteredFaqs.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
                    </p>
                )}

                {/* ── FAQ list ── */}
                <div className="space-y-3 mb-16" role="list">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-16 rounded-3xl bg-card border border-border/60">
                            <p className="text-sm font-semibold text-muted-foreground mb-2">
                                No encontramos resultados para tu búsqueda.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Restablecer filtros
                            </button>
                        </div>
                    ) : (
                        filteredFaqs.map(faq => (
                            <div key={faq.id} role="listitem">
                                <FaqAccordion faq={faq} />
                            </div>
                        ))
                    )}
                </div>

                {/* ── Financial disclaimer ── */}
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 mb-10">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                        ⚠️ <strong>Aviso importante:</strong> Finix ofrece información general, herramientas y contenido educativo relacionados con finanzas y mercados. La información disponible no constituye asesoramiento financiero, recomendación de inversión, ni una invitación a comprar o vender activos. Las decisiones de inversión son responsabilidad exclusiva del usuario y pueden implicar pérdidas.
                    </p>
                </div>

                {/* ── Contact card ── */}
                <div
                    id="contacto"
                    className="rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg scroll-mt-24"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                            <Mail className="w-4 h-4" />
                            <span>¿No encontraste lo que buscabas?</span>
                        </div>
                        <h2 className="text-xl font-heading font-bold">Contactar a Finix</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Nuestro equipo responde generalmente en menos de 24 horas hábiles. Describí tu consulta con el mayor detalle posible.
                        </p>
                    </div>
                    <a
                        href={`mailto:${CONTACT_EMAIL}?subject=Consulta%20sobre%20Finix`}
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm whitespace-nowrap hover:opacity-90 transition-all flex items-center gap-2 shadow-sm shrink-0"
                        rel="noopener noreferrer"
                    >
                        <Mail className="w-4 h-4" />
                        {CONTACT_EMAIL}
                    </a>
                </div>

                {/* ── Footer ── */}
                <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Finix. Todos los derechos reservados.</p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
                    </div>
                </footer>
            </main>

            {/* ── Back to top ── */}
            {showBackTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Volver arriba"
                    className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
