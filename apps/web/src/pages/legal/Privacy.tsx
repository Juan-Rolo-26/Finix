import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, ArrowUp, ChevronDown } from 'lucide-react';
import { InformationPageTabs } from '@/components/legal/InformationPageTabs';

// ─── Constants ─────────────────────────────────────────────────────────────────
const LAST_UPDATED = '15 de septiembre de 2026';
const LEGAL_COMPANY_NAME = 'Finix';
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

const SECTION_IDS = SECTIONS.map(section => section.id);

// ─── Scroll spy ────────────────────────────────────────────────────────────────
function useScrollSpy(ids: string[]) {
    const [activeId, setActiveId] = useState(ids[0] ?? '');
    useEffect(() => {
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
        return () => window.removeEventListener('scroll', fn);
    }, [ids]);
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
            <h2 id={`${id}-h`} className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight">{<FinixUiText text={title} />}</h2>
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
                <span className="min-w-0 break-words text-foreground">{<FinixUiText text={active?.title ?? 'Índice'} />}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-card border border-border/60 shadow-xl overflow-y-auto max-h-72">
                    {SECTIONS.map(s => (
                        <a key={s.id} href={`#${s.id}`} className={`block min-h-11 px-4 py-2.5 text-sm transition-colors ${s.id === activeId ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`} onClick={() => setOpen(false)}>
                            {<FinixUiText text={s.title} />}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Privacy() {
    const { ui: finixUi } = useFinixUiTranslation();

    const navigate = useNavigate();
    const activeId = useScrollSpy(SECTION_IDS);
    const [showBackTop, setShowBackTop] = useState(false);
    useEffect(() => {
        const fn = () => setShowBackTop(window.scrollY > 400);
        window.addEventListener('scroll', fn, { passive: true });
        fn();
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div className="info-page min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            {/* ── Navbar ── */}
            <nav aria-label={finixUi("Volver a Finix")} className="info-page__mobile-nav fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer" aria-label={finixUi("Volver")}>
                        <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">{""}<FinixUiText text={"Volver"} />{""}</span>
                    </button>
                    <Link to="/dashboard" className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-black/20 dark:border-white/30 bg-white dark:bg-zinc-900 shadow-2xs transition-transform group-hover:scale-105">
                            <img src="/logo-small.webp" alt={finixUi("Finix")} className="h-5 w-5 object-contain" />
                        </div>
                        <span className="font-heading font-black text-xl tracking-tight text-foreground">{""}<FinixUiText text={"Finix"} />{""}</span>
                    </Link>
                </div>
            </nav>

            <div className="info-page__container container mx-auto px-4 md:px-8 pt-24 pb-20 max-w-6xl">
                {/* ── Tabs ── */}
                <InformationPageTabs />

                <header className="info-page__header mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary">
                        <Shield className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight mb-3">{""}<FinixUiText text={"Política de Privacidad"} />{""}</h1>
                    <p className="text-sm text-muted-foreground/80 font-medium">{""}<FinixUiText text={"Última actualización:"} />{" "}{<FinixUiText text={LAST_UPDATED} />}</p>
                </header>

                <div className="info-page__grid flex gap-10">
                    {/* ── Sidebar ── */}
                    <aside className="info-page__sidebar hidden lg:block w-64 shrink-0">
                        <nav aria-label="Índice" className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-1 scrollbar-hide">
                            {SECTIONS.map(s => (
                                <a key={s.id} href={`#${s.id}`} className={`block px-3.5 py-2 rounded-lg text-sm leading-snug transition-all ${s.id === activeId ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                                    {<FinixUiText text={s.title} />}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* ── Content ── */}
                    <div className="info-page__body flex-1 min-w-0">


                        {/* ── Summary callout ── */}
                        <div className="rounded-3xl border border-primary/25 bg-primary/5 p-6 sm:p-7 mb-8">
                            <h2 className="text-xl font-bold text-foreground mb-3">{""}<FinixUiText text={"Resumen de privacidad"} />{""}</h2>
                            <p className="text-base sm:text-[17px] text-foreground/90 leading-relaxed mb-3">
                                {" "}<FinixUiText text={"Finix recopila y trata datos personales exclusivamente para crear tu cuenta, mantener la seguridad del acceso, mostrar contenido de la comunidad, permitir herramientas de análisis y operar funciones como portafolio, mensajería, soporte y suscripciones."} />{" "}</p>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {" "}<FinixUiText text={"No vendemos tu información personal a terceros. Compartimos datos únicamente con proveedores indispensables para la prestación técnica del servicio y conforme a tus preferencias de visibilidad."} />{" "}</p>
                        </div>

                        <MobileToc activeId={activeId} />

                        <div className="space-y-4">

                            <Section id="introduccion" title="1. Introducción">
                                <p>
                                    {" "}<FinixUiText text={"Esta Política de Privacidad describe cómo Finix recopila, utiliza, almacena y protege la información personal de sus usuarios. Aplica a todas las funcionalidades de la Plataforma: sitio web, comunidades, portafolio, mensajería, suscripciones y cualquier otro servicio ofrecido por Finix."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Al usar Finix, aceptás las prácticas descritas en esta Política."} />{" "}</p>
                            </Section>

                            <Section id="responsable" title="2. Responsable del tratamiento">
                                <p>
                                    {" "}<FinixUiText text={"El responsable del tratamiento de los datos personales es"} />{" "}<strong>{LEGAL_COMPANY_NAME}</strong>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Para consultas sobre privacidad, podés contactarnos en:"} />{""}{' '}
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>
                                </p>
                            </Section>

                            <Section id="datos-recopilados" title="3. Información que recopilamos">
                                <p>{""}<FinixUiText text={"La información que tratamos depende de cómo usás Finix. Las categorías generales son:"} />{""}</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse mt-2" role="table">
                                        <thead>
                                            <tr className="border-b border-border/60">
                                                <th className="text-left py-2 pr-4 font-semibold text-foreground">{""}<FinixUiText text={"Categoría"} />{""}</th>
                                                <th className="text-left py-2 font-semibold text-foreground">{""}<FinixUiText text={"Ejemplos"} />{""}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Identidad y acceso"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Email, nombre de usuario, contraseña (hasheada), avatar, datos de Google si usás OAuth"} />{""}</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Perfil"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Foto de perfil, biografía, ubicación, preferencias de privacidad"} />{""}</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Actividad en la plataforma"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Publicaciones, comentarios, reacciones, mensajes, análisis compartidos, comunidades"} />{""}</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Portafolio e inversiones"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Activos cargados, movimientos, watchlists, notas"} />{""}</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Técnicos y de seguridad"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Dirección IP, navegador, dispositivo, ID de sesión, registros de acceso y errores"} />{""}</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Suscripciones y pagos"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Estado del plan, identificadores de transacción, montos (no número completo de tarjeta)"} />{""}</td></tr>
                                            <tr><td className="py-2 pr-4 font-medium text-foreground align-top">{""}<FinixUiText text={"Comunicaciones"} />{""}</td><td className="py-2 align-top">{""}<FinixUiText text={"Emails enviados a soporte, respuestas recibidas"} />{""}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            <Section id="datos-directos" title="4. Información proporcionada directamente por el usuario">
                                <p>
                                    {" "}<FinixUiText text={"Finanzas Personales guarda los movimientos, fuentes informativas, categorías, presupuestos, metas y preferencias que decidís cargar. Estos datos son privados y no se incorporan a perfiles públicos, publicaciones, comunidades ni segmentación publicitaria. El CSV original se procesa sin conservar el archivo; sólo se guardan los movimientos que confirmás importar, inicialmente pendientes de revisión. No ingreses números completos de tarjeta, CVV, PIN ni credenciales bancarias. No hay conexiones bancarias automáticas activas."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Desde Finanzas Personales podés exportar tus movimientos y categorías o eliminar los registros de esta sección, sin borrar tu Portafolio. La eliminación de la cuenta también elimina estos registros. Las copias de respaldo de la infraestructura siguen su política de retención; esta función no garantiza su purga inmediata. Los avisos financieros usan mensajes genéricos, sin importes ni comercios."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Incluye todos los datos que el usuario introduce activamente en la Plataforma: datos de registro, información del perfil, contenido publicado (posts, comentarios, análisis, imágenes), activos cargados en el portafolio y cualquier consulta enviada al soporte."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"También incluye los datos relacionados con la autenticación mediante Google OAuth, si el usuario elige esta opción. En ese caso, Finix recibe solo los datos que Google comparte según su propia política de privacidad."} />{" "}</p>
                            </Section>

                            <Section id="datos-actividad" title="5. Información generada por el uso de la plataforma">
                                <p>
                                    {" "}<FinixUiText text={"Al usar Finix se genera información sobre tu actividad: las secciones que visitás, publicaciones con las que interactuás, comunidades a las que pertenecés, funcionalidades que usás y configuraciones que aplicás."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Esta información se utiliza para mostrarte contenido relevante, aplicar tus preferencias y mejorar la Plataforma."} />{" "}</p>
                            </Section>

                            <Section id="datos-tecnicos" title="6. Información técnica y de seguridad">
                                <p>
                                    {" "}<FinixUiText text={"Para garantizar la seguridad y el correcto funcionamiento de la Plataforma, Finix puede recopilar información técnica como:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"Dirección IP"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Tipo de navegador y versión"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Sistema operativo y tipo de dispositivo"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Identificadores de sesión"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Registros de acceso y errores"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Eventos de autenticación y actividad sospechosa"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Esta información se usa exclusivamente para proteger la seguridad del servicio y prevenir fraudes y abusos."} />{" "}</p>
                            </Section>

                            <Section id="cookies-tecnologias" title="7. Almacenamiento local, cookies y tecnologías similares">
                                <p>
                                    {" "}<FinixUiText text={"Finix utiliza principalmente el"} />{" "}<strong>{""}<FinixUiText text={"almacenamiento local del navegador (localStorage)"} />{""}</strong> {" "}<FinixUiText text={"para mantener tu sesión activa y guardar preferencias de interfaz (como el modo oscuro/claro o la configuración del sidebar)."} />{" "}</p>
                                <p>
                                    <strong>{""}<FinixUiText text={"No utilizamos cookies de publicidad ni de rastreo de comportamiento entre sitios."} />{""}</strong> {" "}<FinixUiText text={"Los widgets de gráficos provistos por"} />{" "}<strong>{""}<FinixUiText text={"TradingView"} />{""}</strong> {" "}<FinixUiText text={"pueden establecer sus propias cookies de terceros según sus propias políticas de privacidad."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Podés gestionar las cookies y el almacenamiento local desde la configuración de tu navegador, aunque deshabilitar el almacenamiento local puede afectar el funcionamiento de la sesión."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Para más información, consultá nuestra"} />{" "}<Link to="/cookies" className="text-primary hover:underline">{""}<FinixUiText text={"Política de Cookies"} />{""}</Link>.
                                </p>
                            </Section>

                            <Section id="datos-suscripciones" title="8. Datos relacionados con suscripciones y pagos">
                                <p>
                                    {" "}<FinixUiText text={"Si contratás un plan de pago (Finix Pro) o una suscripción a una comunidad monetizada, Finix almacena el estado de tu suscripción, el plan contratado e identificadores de transacción."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Los datos de pago completos (número de tarjeta, CVV, etc.) son procesados directamente por"} />{" "}<strong>{""}<FinixUiText text={"MercadoPago"} />{""}</strong> {" "}<FinixUiText text={"o"} />{" "}<strong>{""}<FinixUiText text={"Stripe"} />{""}</strong> {" "}<FinixUiText text={"según corresponda. Finix"} />{" "}<strong>{""}<FinixUiText text={"no almacena estos datos"} />{""}</strong>.
                                </p>
                            </Section>

                            <Section id="datos-comunidades" title="9. Datos de comunidades y publicaciones">
                                <p>
                                    {" "}<FinixUiText text={"El contenido que publicás en Finix (publicaciones, comentarios, análisis, imágenes) puede ser visible para otros usuarios según la configuración de privacidad de tu cuenta y de la comunidad."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Información pública: nombre de usuario, avatar, publicaciones en comunidades públicas, comentarios en contenido público."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Información privada que"} />{" "}<strong>{""}<FinixUiText text={"no se muestra públicamente"} />{""}</strong>{""}<FinixUiText text={": email, contraseña, dirección IP, registros de seguridad, datos completos de suscripción."} />{" "}</p>
                            </Section>

                            <Section id="finalidades" title="10. Finalidades del tratamiento">
                                <p>{""}<FinixUiText text={"Utilizamos los datos personales para:"} />{""}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Crear y administrar tu cuenta, autenticar el acceso y gestionar la seguridad"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Proporcionar las funcionalidades de la Plataforma (portafolio, comunidad, mensajería, análisis)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Aplicar tus preferencias y controles de privacidad"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Prevenir fraude, abuso, spam, suplantación y conductas prohibidas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Gestionar suscripciones, cobros y facturación"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Enviar comunicaciones operativas (verificación, seguridad, soporte, cambios del servicio)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Mejorar la estabilidad, rendimiento y experiencia de Finix"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Cumplir obligaciones legales y responder requerimientos de autoridades competentes"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Finix"} />{" "}<strong>{""}<FinixUiText text={"no utiliza tus datos para enviarte publicidad de terceros"} />{""}</strong> {" "}<FinixUiText text={"ni para comercializar tu información."} />{" "}</p>
                            </Section>

                            <Section id="base-legal" title="11. Base legal del tratamiento">
                                <p>{""}<FinixUiText text={"El tratamiento de datos personales en Finix se basa en:"} />{""}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>{""}<FinixUiText text={"Ejecución del contrato"} />{""}</strong>{""}<FinixUiText text={": para prestarte los servicios de la Plataforma una vez que creás tu cuenta y aceptás estos Términos"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Interés legítimo"} />{""}</strong>{""}<FinixUiText text={": para garantizar la seguridad del servicio y prevenir fraudes"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Consentimiento"} />{""}</strong>{""}<FinixUiText text={": cuando lo recabemos específicamente para una finalidad determinada"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Obligación legal"} />{""}</strong>{""}<FinixUiText text={": cuando la normativa aplicable exija el tratamiento o la conservación de determinados datos"} />{""}</li>
                                </ul>
                            </Section>

                            <Section id="proveedores" title="12. Proveedores de servicios">
                                <p>
                                    {" "}<FinixUiText text={"Finix comparte datos con proveedores externos únicamente cuando es necesario para operar la Plataforma. Los proveedores actuales son:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>
                                        <strong>{""}<FinixUiText text={"Google"} />{""}</strong> {" "}<FinixUiText text={"— Verificación de identidad cuando elegís iniciar sesión con Google. Las cuentas, sesiones y datos de la Plataforma son gestionados por Finix."} />{" "}</li>
                                    <li>
                                        <strong>{""}<FinixUiText text={"Resend"} />{""}</strong> {" "}<FinixUiText text={"— Servicio de email transaccional. Utilizado para enviar correos de verificación de cuenta, recuperación de contraseña y comunicaciones operativas."} />{" "}</li>
                                    <li>
                                        <strong>{""}<FinixUiText text={"MercadoPago"} />{""}</strong> {" "}<FinixUiText text={"— Procesador de pagos para suscripciones Finix Pro y comunidades monetizadas (principalmente para usuarios en Argentina y Latinoamérica)."} />{" "}</li>
                                    <li>
                                        <strong>{""}<FinixUiText text={"Stripe"} />{""}</strong> {" "}<FinixUiText text={"— Procesador de pagos para comunidades monetizadas."} />{" "}</li>
                                    <li>
                                        <strong>{""}<FinixUiText text={"Financial Modeling Prep (FMP)"} />{""}</strong> {" "}<FinixUiText text={"— Proveedor de datos de mercado, datos fundamentales de empresas y métricas financieras."} />{" "}</li>
                                    <li>
                                        <strong>{""}<FinixUiText text={"TradingView"} />{""}</strong> {" "}<FinixUiText text={"— Widgets embebidos de gráficos e información de mercado. Sus widgets se cargan desde servidores de TradingView y están sujetos a sus propias políticas."} />{" "}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Todos los proveedores están sujetos a compromisos contractuales de confidencialidad y seguridad y solo pueden utilizar los datos para las finalidades específicas para las que fueron contratados."} />{" "}</p>
                            </Section>

                            <Section id="transferencias" title="13. Transferencias internacionales de datos">
                                <p>
                                    {" "}<FinixUiText text={"Algunos de los proveedores utilizados por Finix pueden procesar datos en servidores ubicados fuera de Argentina u otros países de residencia del usuario. En esos casos, Finix procura que exista una base legal o contractual razonable para proteger los datos conforme a la normativa aplicable."} />{" "}</p>
                            </Section>

                            <Section id="conservacion" title="14. Conservación de datos">
                                <p>
                                    {" "}<FinixUiText text={"Conservamos los datos personales mientras tu cuenta esté activa y durante el tiempo razonablemente necesario para:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"Prestar el servicio y resolver consultas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Prevenir fraude y garantizar la seguridad"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Cumplir obligaciones legales y contables"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Hacer valer o defender derechos ante reclamaciones"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Pasados estos plazos, los datos se eliminan o anonimizamos según corresponda."} />{" "}</p>
                            </Section>

                            <Section id="seguridad" title="15. Seguridad">
                                <p>
                                    {" "}<FinixUiText text={"Finix implementa medidas técnicas y organizativas razonables para proteger los datos personales, incluyendo:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"Autenticación gestionada por Finix con contraseñas protegidas mediante hashes y sesiones propias"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Transmisión de datos mediante cifrado HTTPS"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Controles de acceso a datos internos"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Monitoreo de actividad sospechosa"} />{""}</li>
                                </ul>
                                <p>
                                    <strong>{""}<FinixUiText text={"Ningún sistema conectado a Internet puede garantizar seguridad absoluta."} />{""}</strong> {" "}<FinixUiText text={"Si detectás una vulnerabilidad o un incidente de seguridad, informanos inmediatamente en"} />{" "}<a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                            </Section>

                            <Section id="derechos" title="16. Derechos de los usuarios">
                                <p>{""}<FinixUiText text={"Según la legislación aplicable, podés solicitar:"} />{""}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>{""}<FinixUiText text={"Acceso"} />{""}</strong>{""}<FinixUiText text={": conocer qué datos tenemos sobre vos"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Rectificación"} />{""}</strong>{""}<FinixUiText text={": corregir datos inexactos o desactualizados"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Supresión"} />{""}</strong>{""}<FinixUiText text={": eliminar tus datos cuando ya no sean necesarios"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Oposición"} />{""}</strong>{""}<FinixUiText text={": oponerte a determinados tratamientos cuando sea aplicable"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Limitación"} />{""}</strong>{""}<FinixUiText text={": restringir el tratamiento en determinados supuestos"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Portabilidad"} />{""}</strong>{""}<FinixUiText text={": recibir tus datos en formato estructurado cuando corresponda"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Para ejercer tus derechos, escribinos a"} />{" "}<a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Si te encontrás en Argentina, la"} />{" "}<strong>{""}<FinixUiText text={"Agencia de Acceso a la Información Pública (AAIP)"} />{""}</strong> {" "}<FinixUiText text={"actúa como autoridad de control en materia de protección de datos personales. Podés presentar una reclamación ante la AAIP si considerás que tus derechos no han sido atendidos."} />{" "}</p>
                            </Section>

                            <Section id="eliminacion" title="17. Eliminación de tu cuenta y datos" variant="info">
                                <p>
                                    {" "}<FinixUiText text={"Podés solicitar la eliminación de tu cuenta en cualquier momento escribiendo a"} />{" "}<a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Al eliminar tu cuenta:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Tu perfil dejará de ser visible para otros usuarios"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Procesaremos la eliminación en un plazo razonable (hasta 30 días hábiles)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Algunos datos pueden conservarse cuando exista obligación legal, necesidad legítima o disputas pendientes"} />{""}</li>
                                    <li>{""}<FinixUiText text={"El contenido publicado en comunidades puede conservarse en forma anonimizada o ser eliminado según lo que resulte técnicamente posible"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Si eras administrador de una comunidad, la comunidad puede quedar afectada. Te recomendamos gestionar la transición antes de solicitar la eliminación"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Las suscripciones activas continúan hasta el fin del período abonado; los datos de pago son gestionados por el procesador correspondiente"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Finix no puede garantizar la eliminación inmediata de todos los datos en todos los sistemas, ya que algunos pueden estar en backups o sistemas de terceros."} />{" "}</p>
                            </Section>

                            <Section id="menores" title="18. Menores de edad">
                                <p>
                                    {" "}<FinixUiText text={"Finix no está diseñado para recopilar deliberadamente datos de menores de edad en infracción a la ley aplicable. Si sos menor de edad, usá la Plataforma solo con la autorización requerida por la legislación de tu jurisdicción."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Si creés que un menor ha proporcionado datos sin autorización apropiada, contactanos para gestionar la eliminación de esa información."} />{" "}</p>
                            </Section>

                            <Section id="cambios" title="19. Cambios en la política de privacidad">
                                <p>
                                    {" "}<FinixUiText text={"Podemos actualizar esta Política de Privacidad para reflejar cambios del producto, del marco legal o de nuestros proveedores. Cuando el cambio sea relevante, procuraremos notificarlo con antelación razonable a través de la Plataforma o por email."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"El uso continuado de Finix después de la actualización implica la aceptación de los cambios."} />{" "}</p>
                            </Section>

                            <Section id="contacto" title="20. Contacto">
                                <p>
                                    {" "}<FinixUiText text={"Para consultas sobre privacidad, ejercicio de derechos, reportes de incidentes de seguridad o cualquier duda sobre esta Política, contactanos en:"} />{" "}</p>
                                <p>
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-semibold">{CONTACT_EMAIL}</a>
                                </p>
                            </Section>

                        </div>

                        {/* Footer */}
                        <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                            <p>© {new Date().getFullYear()} {" "}<FinixUiText text={"Finix. Todos los derechos reservados."} />{""}</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link to="/help" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Ayuda"} />{""}</Link>
                                <Link to="/terms" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Términos"} />{""}</Link>
                                <Link to="/cookies" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Cookies"} />{""}</Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            {showBackTop && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={finixUi("Volver arriba")} className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all">
                    <ArrowUp className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
