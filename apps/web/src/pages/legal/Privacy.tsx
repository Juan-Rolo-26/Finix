import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, ArrowUp, ChevronDown } from 'lucide-react';
import { LEGAL_NAV } from '@/components/legal/LegalPageLayout';

// ─── Constants ─────────────────────────────────────────────────────────────────
const LAST_UPDATED = '15 de septiembre de 2026';
const LEGAL_COMPANY_NAME = '[Razón social pendiente de configuración]';
const CONTACT_EMAIL = 'finiixarg@gmail.com';

// ─── Section index ─────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'introduccion', title: '1. Introducción' },
    { id: 'responsable', title: '2. Responsable del tratamiento' },
    { id: 'datos-recopilados', title: '3. Información que recopilamos' },
    { id: 'datos-directos', title: '4. Datos proporcionados por el usuario' },
    { id: 'datos-actividad', title: '5. Datos de uso de la plataforma' },
    { id: 'datos-tecnicos', title: '6. Información técnica y de seguridad' },
    { id: 'cookies-tecnologias', title: '7. Almacenamiento local y cookies' },
    { id: 'datos-suscripciones', title: '8. Datos de suscripciones' },
    { id: 'datos-comunidades', title: '9. Datos de comunidades' },
    { id: 'finalidades', title: '10. Finalidades del tratamiento' },
    { id: 'base-legal', title: '11. Base legal' },
    { id: 'proveedores', title: '12. Proveedores de servicios' },
    { id: 'transferencias', title: '13. Transferencias internacionales' },
    { id: 'conservacion', title: '14. Conservación de datos' },
    { id: 'seguridad', title: '15. Seguridad' },
    { id: 'derechos', title: '16. Derechos de los usuarios' },
    { id: 'eliminacion', title: '17. Eliminación de cuenta y datos' },
    { id: 'menores', title: '18. Menores de edad' },
    { id: 'cambios', title: '19. Cambios en la política' },
    { id: 'contacto', title: '20. Contacto' },
];

// ─── Scroll spy ────────────────────────────────────────────────────────────────
function useScrollSpy(ids: string[]) {
    const [activeId, setActiveId] = useState(ids[0] ?? '');
    useState(() => {
        const fn = () => {
            let found = ids[0] ?? '';
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) continue;
                if (el.getBoundingClientRect().top <= 120) found = id;
            }
            setActiveId(found);
        };
        window.addEventListener('scroll', fn, { passive: true });
        fn();
    });
    return activeId;
}

// ─── Section block ─────────────────────────────────────────────────────────────
function Section({
    id, title, children, variant = 'default',
}: {
    id: string; title: string; children: React.ReactNode; variant?: 'default' | 'info';
}) {
    const cls = {
        default: 'bg-card/60 border-border/40',
        info: 'bg-primary/5 border-primary/25',
    }[variant];
    return (
        <section id={id} className={`rounded-2xl border ${cls} p-6 sm:p-7 scroll-mt-24`} aria-labelledby={`${id}-h`}>
            <h2 id={`${id}-h`} className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight">{title}</h2>
            <div className="text-base sm:text-[17px] text-foreground/90 leading-relaxed space-y-4">{children}</div>
        </section>
    );
}

// ─── Mobile TOC ────────────────────────────────────────────────────────────────
function MobileToc({ activeId }: { activeId: string }) {
    const [open, setOpen] = useState(false);
    const active = SECTIONS.find(s => s.id === activeId);
    return (
        <div className="relative lg:hidden mb-6">
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/60 text-base font-medium text-left cursor-pointer" aria-expanded={open}>
                <span className="truncate text-foreground">{active?.title ?? 'Índice'}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-card border border-border/60 shadow-xl overflow-y-auto max-h-72">
                    {SECTIONS.map(s => (
                        <a key={s.id} href={`#${s.id}`} className={`block px-4 py-2.5 text-sm transition-colors ${s.id === activeId ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`} onClick={() => setOpen(false)}>
                            {s.title}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Privacy() {
    const navigate = useNavigate();
    const activeId = useScrollSpy(SECTIONS.map(s => s.id));
    const [showBackTop, setShowBackTop] = useState(false);
    useState(() => {
        const fn = () => setShowBackTop(window.scrollY > 400);
        window.addEventListener('scroll', fn, { passive: true });
    });

    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            {/* ── Navbar ── */}
            <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer" aria-label="Volver">
                        <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Volver</span>
                    </button>
                    <Link to="/dashboard" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-black/20 dark:border-white/30 bg-white dark:bg-zinc-900 shadow-2xs transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Finix" className="h-5 w-5 object-contain" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tight text-foreground">Finix</span>
                    </Link>
                </div>
            </nav>

            <div className="container mx-auto px-4 md:px-8 pt-24 pb-20 max-w-6xl">
                {/* ── Tabs ── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide border-b border-border/40 text-sm font-semibold">
                    {LEGAL_NAV.map(nav => (
                        <Link key={nav.to} to={nav.to} className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${nav.to === '/privacy' ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                            {nav.label}
                        </Link>
                    ))}
                </div>

                <div className="flex gap-10">
                    {/* ── Sidebar ── */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <nav aria-label="Índice" className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-1 scrollbar-hide">
                            {SECTIONS.map(s => (
                                <a key={s.id} href={`#${s.id}`} className={`block px-3.5 py-2 rounded-lg text-sm leading-snug transition-all ${s.id === activeId ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                                    {s.title}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* ── Content ── */}
                    <div className="flex-1 min-w-0">
                        <header className="mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight mb-3">Política de Privacidad</h1>
                            <p className="text-sm text-muted-foreground/80 font-medium">Última actualización: {LAST_UPDATED}</p>
                            <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/40 text-sm text-muted-foreground">
                                Este documento ha sido preparado con fines informativos y deberá ser revisado por un profesional legal antes de su publicación definitiva.
                            </div>
                        </header>

                        {/* ── Summary callout ── */}
                        <div className="rounded-3xl border border-primary/25 bg-primary/5 p-6 sm:p-7 mb-8">
                            <h2 className="text-xl font-bold text-foreground mb-3">Resumen de privacidad</h2>
                            <p className="text-base sm:text-[17px] text-foreground/90 leading-relaxed mb-3">
                                Finix recopila y trata datos personales exclusivamente para crear tu cuenta, mantener la seguridad del acceso, mostrar contenido de la comunidad, permitir herramientas de análisis y operar funciones como portafolio, mensajería, soporte y suscripciones.
                            </p>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                No vendemos tu información personal a terceros. Compartimos datos únicamente con proveedores indispensables para la prestación técnica del servicio y conforme a tus preferencias de visibilidad.
                            </p>
                        </div>

                        <MobileToc activeId={activeId} />

                        <div className="space-y-4">

                            <Section id="introduccion" title="1. Introducción">
                                <p>
                                    Esta Política de Privacidad describe cómo Finix recopila, utiliza, almacena y protege la información personal de sus usuarios. Aplica a todas las funcionalidades de la Plataforma: sitio web, comunidades, portafolio, mensajería, suscripciones y cualquier otro servicio ofrecido por Finix.
                                </p>
                                <p>
                                    Al usar Finix, aceptás las prácticas descritas en esta Política.
                                </p>
                            </Section>

                            <Section id="responsable" title="2. Responsable del tratamiento">
                                <p>
                                    El responsable del tratamiento de los datos personales es <strong>{LEGAL_COMPANY_NAME}</strong>.
                                </p>
                                <p>
                                    Para consultas sobre privacidad, podés contactarnos en:{' '}
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                    [Completar con CUIT/CUIL, domicilio legal y datos de contacto del Delegado de Protección de Datos si corresponde, antes de publicar.]
                                </p>
                            </Section>

                            <Section id="datos-recopilados" title="3. Información que recopilamos">
                                <p>La información que tratamos depende de cómo usás Finix. Las categorías generales son:</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse mt-2" role="table">
                                        <thead>
                                            <tr className="border-b border-border/60">
                                                <th className="text-left py-2 pr-4 font-semibold text-foreground">Categoría</th>
                                                <th className="text-left py-2 font-semibold text-foreground">Ejemplos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Identidad y acceso</td><td className="py-2 align-top">Email, nombre de usuario, contraseña (hasheada), avatar, datos de Google si usás OAuth</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Perfil</td><td className="py-2 align-top">Foto de perfil, biografía, ubicación, preferencias de privacidad</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Actividad en la plataforma</td><td className="py-2 align-top">Publicaciones, comentarios, reacciones, mensajes, análisis compartidos, comunidades</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Portafolio e inversiones</td><td className="py-2 align-top">Activos cargados, movimientos, watchlists, notas</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Técnicos y de seguridad</td><td className="py-2 align-top">Dirección IP, navegador, dispositivo, ID de sesión, registros de acceso y errores</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Suscripciones y pagos</td><td className="py-2 align-top">Estado del plan, identificadores de transacción, montos (no número completo de tarjeta)</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">Comunicaciones</td><td className="py-2 align-top">Emails enviados a soporte, respuestas recibidas</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            <Section id="datos-directos" title="4. Información proporcionada directamente por el usuario">
                                <p>
                                    Incluye todos los datos que el usuario introduce activamente en la Plataforma: datos de registro, información del perfil, contenido publicado (posts, comentarios, análisis, imágenes), activos cargados en el portafolio y cualquier consulta enviada al soporte.
                                </p>
                                <p>
                                    También incluye los datos relacionados con la autenticación mediante Google OAuth, si el usuario elige esta opción. En ese caso, Finix recibe solo los datos que Google comparte según su propia política de privacidad.
                                </p>
                            </Section>

                            <Section id="datos-actividad" title="5. Información generada por el uso de la plataforma">
                                <p>
                                    Al usar Finix se genera información sobre tu actividad: las secciones que visitás, publicaciones con las que interactuás, comunidades a las que pertenecés, funcionalidades que usás y configuraciones que aplicás.
                                </p>
                                <p>
                                    Esta información se utiliza para mostrarte contenido relevante, aplicar tus preferencias y mejorar la Plataforma.
                                </p>
                            </Section>

                            <Section id="datos-tecnicos" title="6. Información técnica y de seguridad">
                                <p>
                                    Para garantizar la seguridad y el correcto funcionamiento de la Plataforma, Finix puede recopilar información técnica como:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Dirección IP</li>
                                    <li>Tipo de navegador y versión</li>
                                    <li>Sistema operativo y tipo de dispositivo</li>
                                    <li>Identificadores de sesión</li>
                                    <li>Registros de acceso y errores</li>
                                    <li>Eventos de autenticación y actividad sospechosa</li>
                                </ul>
                                <p>
                                    Esta información se usa exclusivamente para proteger la seguridad del servicio y prevenir fraudes y abusos.
                                </p>
                            </Section>

                            <Section id="cookies-tecnologias" title="7. Almacenamiento local, cookies y tecnologías similares">
                                <p>
                                    Finix utiliza principalmente el <strong>almacenamiento local del navegador (localStorage)</strong> para mantener tu sesión activa y guardar preferencias de interfaz (como el modo oscuro/claro o la configuración del sidebar).
                                </p>
                                <p>
                                    <strong>No utilizamos cookies de publicidad ni de rastreo de comportamiento entre sitios.</strong> Los widgets de gráficos provistos por <strong>TradingView</strong> pueden establecer sus propias cookies de terceros según sus propias políticas de privacidad.
                                </p>
                                <p>
                                    Podés gestionar las cookies y el almacenamiento local desde la configuración de tu navegador, aunque deshabilitar el almacenamiento local puede afectar el funcionamiento de la sesión.
                                </p>
                                <p>
                                    Para más información, consultá nuestra <Link to="/cookies" className="text-primary hover:underline">Política de Cookies</Link>.
                                </p>
                            </Section>

                            <Section id="datos-suscripciones" title="8. Datos relacionados con suscripciones y pagos">
                                <p>
                                    Si contratás un plan de pago (Finix Pro) o una suscripción a una comunidad monetizada, Finix almacena el estado de tu suscripción, el plan contratado e identificadores de transacción.
                                </p>
                                <p>
                                    Los datos de pago completos (número de tarjeta, CVV, etc.) son procesados directamente por <strong>MercadoPago</strong> o <strong>Stripe</strong> según corresponda. Finix <strong>no almacena estos datos</strong>.
                                </p>
                            </Section>

                            <Section id="datos-comunidades" title="9. Datos de comunidades y publicaciones">
                                <p>
                                    El contenido que publicás en Finix (publicaciones, comentarios, análisis, imágenes) puede ser visible para otros usuarios según la configuración de privacidad de tu cuenta y de la comunidad.
                                </p>
                                <p>
                                    Información pública: nombre de usuario, avatar, publicaciones en comunidades públicas, comentarios en contenido público.
                                </p>
                                <p>
                                    Información privada que <strong>no se muestra públicamente</strong>: email, contraseña, dirección IP, registros de seguridad, datos completos de suscripción.
                                </p>
                            </Section>

                            <Section id="finalidades" title="10. Finalidades del tratamiento">
                                <p>Utilizamos los datos personales para:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Crear y administrar tu cuenta, autenticar el acceso y gestionar la seguridad</li>
                                    <li>Proporcionar las funcionalidades de la Plataforma (portafolio, comunidad, mensajería, análisis)</li>
                                    <li>Aplicar tus preferencias y controles de privacidad</li>
                                    <li>Prevenir fraude, abuso, spam, suplantación y conductas prohibidas</li>
                                    <li>Gestionar suscripciones, cobros y facturación</li>
                                    <li>Enviar comunicaciones operativas (verificación, seguridad, soporte, cambios del servicio)</li>
                                    <li>Mejorar la estabilidad, rendimiento y experiencia de Finix</li>
                                    <li>Cumplir obligaciones legales y responder requerimientos de autoridades competentes</li>
                                </ul>
                                <p>
                                    Finix <strong>no utiliza tus datos para enviarte publicidad de terceros</strong> ni para comercializar tu información.
                                </p>
                            </Section>

                            <Section id="base-legal" title="11. Base legal del tratamiento">
                                <p>El tratamiento de datos personales en Finix se basa en:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>Ejecución del contrato</strong>: para prestarte los servicios de la Plataforma una vez que creás tu cuenta y aceptás estos Términos</li>
                                    <li><strong>Interés legítimo</strong>: para garantizar la seguridad del servicio y prevenir fraudes</li>
                                    <li><strong>Consentimiento</strong>: cuando lo recabemos específicamente para una finalidad determinada</li>
                                    <li><strong>Obligación legal</strong>: cuando la normativa aplicable exija el tratamiento o la conservación de determinados datos</li>
                                </ul>
                                <p className="text-xs text-muted-foreground/60">
                                    [Nota para revisión legal: Adaptar la base legal a la Ley 25.326 de Protección de Datos Personales de Argentina y a las normativas aplicables en otros países donde el servicio esté disponible.]
                                </p>
                            </Section>

                            <Section id="proveedores" title="12. Proveedores de servicios">
                                <p>
                                    Finix comparte datos con proveedores externos únicamente cuando es necesario para operar la Plataforma. Los proveedores actuales son:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>Supabase</strong> — Infraestructura de autenticación y base de datos. Gestiona el inicio de sesión, la seguridad de credenciales y el almacenamiento de datos de la Plataforma.
                                    </li>
                                    <li>
                                        <strong>Resend</strong> — Servicio de email transaccional. Utilizado para enviar correos de verificación de cuenta, recuperación de contraseña y comunicaciones operativas.
                                    </li>
                                    <li>
                                        <strong>MercadoPago</strong> — Procesador de pagos para suscripciones Finix Pro y comunidades monetizadas (principalmente para usuarios en Argentina y Latinoamérica).
                                    </li>
                                    <li>
                                        <strong>Stripe</strong> — Procesador de pagos para comunidades monetizadas.
                                    </li>
                                    <li>
                                        <strong>Financial Modeling Prep (FMP)</strong> — Proveedor de datos de mercado, datos fundamentales de empresas y métricas financieras.
                                    </li>
                                    <li>
                                        <strong>TradingView</strong> — Widgets embebidos de gráficos e información de mercado. Sus widgets se cargan desde servidores de TradingView y están sujetos a sus propias políticas.
                                    </li>
                                </ul>
                                <p>
                                    Todos los proveedores están sujetos a compromisos contractuales de confidencialidad y seguridad y solo pueden utilizar los datos para las finalidades específicas para las que fueron contratados.
                                </p>
                            </Section>

                            <Section id="transferencias" title="13. Transferencias internacionales de datos">
                                <p>
                                    Algunos de los proveedores utilizados por Finix pueden procesar datos en servidores ubicados fuera de Argentina u otros países de residencia del usuario. En esos casos, Finix procura que exista una base legal o contractual razonable para proteger los datos conforme a la normativa aplicable.
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                    [Nota para revisión legal: Identificar los países donde cada proveedor procesa datos y las salvaguardias contractuales aplicables.]
                                </p>
                            </Section>

                            <Section id="conservacion" title="14. Conservación de datos">
                                <p>
                                    Conservamos los datos personales mientras tu cuenta esté activa y durante el tiempo razonablemente necesario para:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Prestar el servicio y resolver consultas</li>
                                    <li>Prevenir fraude y garantizar la seguridad</li>
                                    <li>Cumplir obligaciones legales y contables</li>
                                    <li>Hacer valer o defender derechos ante reclamaciones</li>
                                </ul>
                                <p>
                                    Pasados estos plazos, los datos se eliminan o anonimizamos según corresponda.
                                </p>
                            </Section>

                            <Section id="seguridad" title="15. Seguridad">
                                <p>
                                    Finix implementa medidas técnicas y organizativas razonables para proteger los datos personales, incluyendo:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Autenticación gestionada por Supabase con estándares de seguridad de la industria</li>
                                    <li>Transmisión de datos mediante cifrado HTTPS</li>
                                    <li>Controles de acceso a datos internos</li>
                                    <li>Monitoreo de actividad sospechosa</li>
                                </ul>
                                <p>
                                    <strong>Ningún sistema conectado a Internet puede garantizar seguridad absoluta.</strong> Si detectás una vulnerabilidad o un incidente de seguridad, informanos inmediatamente en <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                            </Section>

                            <Section id="derechos" title="16. Derechos de los usuarios">
                                <p>Según la legislación aplicable, podés solicitar:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>Acceso</strong>: conocer qué datos tenemos sobre vos</li>
                                    <li><strong>Rectificación</strong>: corregir datos inexactos o desactualizados</li>
                                    <li><strong>Supresión</strong>: eliminar tus datos cuando ya no sean necesarios</li>
                                    <li><strong>Oposición</strong>: oponerte a determinados tratamientos cuando sea aplicable</li>
                                    <li><strong>Limitación</strong>: restringir el tratamiento en determinados supuestos</li>
                                    <li><strong>Portabilidad</strong>: recibir tus datos en formato estructurado cuando corresponda</li>
                                </ul>
                                <p>
                                    Para ejercer tus derechos, escribinos a <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    Si te encontrás en Argentina, la <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> actúa como autoridad de control en materia de protección de datos personales. Podés presentar una reclamación ante la AAIP si considerás que tus derechos no han sido atendidos.
                                </p>
                            </Section>

                            <Section id="eliminacion" title="17. Eliminación de tu cuenta y datos" variant="info">
                                <p>
                                    Podés solicitar la eliminación de tu cuenta en cualquier momento escribiendo a <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    Al eliminar tu cuenta:
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Tu perfil dejará de ser visible para otros usuarios</li>
                                    <li>Procesaremos la eliminación en un plazo razonable (hasta 30 días hábiles)</li>
                                    <li>Algunos datos pueden conservarse cuando exista obligación legal, necesidad legítima o disputas pendientes</li>
                                    <li>El contenido publicado en comunidades puede conservarse en forma anonimizada o ser eliminado según lo que resulte técnicamente posible</li>
                                    <li>Si eras administrador de una comunidad, la comunidad puede quedar afectada. Te recomendamos gestionar la transición antes de solicitar la eliminación</li>
                                    <li>Las suscripciones activas continúan hasta el fin del período abonado; los datos de pago son gestionados por el procesador correspondiente</li>
                                </ul>
                                <p>
                                    Finix no puede garantizar la eliminación inmediata de todos los datos en todos los sistemas, ya que algunos pueden estar en backups o sistemas de terceros.
                                </p>
                            </Section>

                            <Section id="menores" title="18. Menores de edad">
                                <p>
                                    Finix no está diseñado para recopilar deliberadamente datos de menores de edad en infracción a la ley aplicable. Si sos menor de edad, usá la Plataforma solo con la autorización requerida por la legislación de tu jurisdicción.
                                </p>
                                <p>
                                    Si creés que un menor ha proporcionado datos sin autorización apropiada, contactanos para gestionar la eliminación de esa información.
                                </p>
                            </Section>

                            <Section id="cambios" title="19. Cambios en la política de privacidad">
                                <p>
                                    Podemos actualizar esta Política de Privacidad para reflejar cambios del producto, del marco legal o de nuestros proveedores. Cuando el cambio sea relevante, procuraremos notificarlo con antelación razonable a través de la Plataforma o por email.
                                </p>
                                <p>
                                    El uso continuado de Finix después de la actualización implica la aceptación de los cambios.
                                </p>
                            </Section>

                            <Section id="contacto" title="20. Contacto">
                                <p>
                                    Para consultas sobre privacidad, ejercicio de derechos, reportes de incidentes de seguridad o cualquier duda sobre esta Política, contactanos en:
                                </p>
                                <p>
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-semibold">{CONTACT_EMAIL}</a>
                                </p>
                                <p className="text-xs text-muted-foreground/60">
                                    [Completar con domicilio legal y datos de contacto formales cuando estén disponibles.]
                                </p>
                            </Section>

                        </div>

                        {/* Footer */}
                        <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                            <p>© {new Date().getFullYear()} Finix. Todos los derechos reservados.</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link to="/help" className="hover:text-foreground transition-colors">Ayuda</Link>
                                <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                                <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            {showBackTop && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver arriba" className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all">
                    <ArrowUp className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
