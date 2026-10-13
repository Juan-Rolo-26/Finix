import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, AlertTriangle, ArrowLeft, ArrowUp, ChevronDown } from 'lucide-react';
import { InformationPageTabs } from '@/components/legal/InformationPageTabs';

// ─── Constants ─────────────────────────────────────────────────────────────────
const LAST_UPDATED = '15 de septiembre de 2026';
const LEGAL_COMPANY_NAME = 'Finix';
const CONTACT_EMAIL = 'finiixarg@gmail.com';

// ─── Section index ─────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'informacion-general', title: '1. Información general' },
    { id: 'aceptacion', title: '2. Aceptación de los términos' },
    { id: 'descripcion', title: '3. Descripción de Finix' },
    { id: 'no-asesoramiento', title: '4. No asesoramiento financiero' },
    { id: 'no-ejecucion', title: '5. No ejecución de operaciones' },
    { id: 'datos-mercado', title: '6. Datos de mercado y terceros' },
    { id: 'exactitud', title: '7. Exactitud y disponibilidad' },
    { id: 'registro', title: '8. Registro y cuentas' },
    { id: 'responsabilidades-usuario', title: '9. Responsabilidades del usuario' },
    { id: 'contenido-usuarios', title: '10. Contenido generado por usuarios' },
    { id: 'publicaciones-comunidades', title: '11. Publicaciones y comunidades' },
    { id: 'comunidades-monetizadas', title: '12. Comunidades monetizadas' },
    { id: 'creators', title: '13. Creadores (Creators)' },
    { id: 'conducta-prohibida', title: '14. Conducta prohibida' },
    { id: 'propiedad-intelectual', title: '15. Propiedad intelectual' },
    { id: 'licencias-contenido', title: '16. Licencias de contenido' },
    { id: 'moderacion', title: '17. Reportes y moderación' },
    { id: 'suspension', title: '18. Suspensión y cancelación' },
    { id: 'suscripciones', title: '19. Suscripciones y pagos' },
    { id: 'facturacion', title: '20. Facturación y cancelaciones' },
    { id: 'finix-pro', title: '21. Finix Pro' },
    { id: 'contenido-financiero', title: '22. Contenido financiero' },
    { id: 'riesgos-inversion', title: '23. Riesgos de inversión' },
    { id: 'enlaces-terceros', title: '24. Servicios de terceros' },
    { id: 'disponibilidad', title: '25. Disponibilidad del servicio' },
    { id: 'limitacion-responsabilidad', title: '26. Limitación de responsabilidad' },
    { id: 'indemnidad', title: '27. Indemnidad' },
    { id: 'modificaciones', title: '28. Modificaciones' },
    { id: 'legislacion', title: '29. Legislación aplicable' },
    { id: 'contacto', title: '30. Contacto' },
];

const SECTION_IDS = SECTIONS.map(section => section.id);

// ─── Scroll spy hook ───────────────────────────────────────────────────────────
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
    id: string; title: string; children: React.ReactNode; variant?: 'default' | 'warning' | 'info';
}) {
    const cls = {
        default: 'bg-card/60 border-border/40',
        warning: 'bg-amber-500/5 border-amber-500/25',
        info: 'bg-primary/5 border-primary/25',
    }[variant];
    return (
        <section
            id={id}
            className={`rounded-2xl border ${cls} p-6 sm:p-7 scroll-mt-24`}
            aria-labelledby={`${id}-h`}
        >
            <h2 id={`${id}-h`} className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight">{<FinixUiText text={title} />}</h2>
            <div className="text-base sm:text-[17px] text-foreground/90 leading-relaxed space-y-4">{children}</div>
        </section>
    );
}

// ─── Mobile TOC select ─────────────────────────────────────────────────────────
function MobileToc({ activeId }: { activeId: string }) {
    const [open, setOpen] = useState(false);
    const active = SECTIONS.find(s => s.id === activeId);
    return (
        <div className="relative lg:hidden mb-6">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/60 text-base font-medium text-left cursor-pointer"
                aria-expanded={open}
            >
                <span className="min-w-0 break-words text-foreground">{<FinixUiText text={active?.title ?? 'Índice'} />}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-card border border-border/60 shadow-xl overflow-y-auto max-h-72">
                    {SECTIONS.map(s => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className={`block min-h-11 px-4 py-2.5 text-sm transition-colors ${s.id === activeId ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                            onClick={() => setOpen(false)}
                        >
                            {<FinixUiText text={s.title} />}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Terms() {
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
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">{""}<FinixUiText text={"Volver"} />{""}</span>
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
                {/* ── Legal tabs ── */}
                <InformationPageTabs />

                <header className="info-page__header mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary">
                        <Scale className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight mb-2">
                        {" "}<FinixUiText text={"Términos y Condiciones"} />{" "}</h1>
                    <p className="text-xs text-muted-foreground/70 font-medium">{""}<FinixUiText text={"Última actualización:"} />{" "}{<FinixUiText text={LAST_UPDATED} />}</p>
                </header>

                <div className="info-page__grid flex gap-10">
                    {/* ── Sidebar TOC ── */}
                    <aside className="info-page__sidebar hidden lg:block w-64 shrink-0">
                        <nav aria-label="Índice" className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-1 scrollbar-hide">
                            {SECTIONS.map(s => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className={`block px-3 py-1.5 rounded-lg text-[11px] leading-snug transition-all ${s.id === activeId ? 'text-primary font-semibold bg-primary/8' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                                >
                                    {<FinixUiText text={s.title} />}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* ── Content ── */}
                    <div className="info-page__body flex-1 min-w-0">
                        {/* Header */}


                        <MobileToc activeId={activeId} />

                        {/* ── Callout destacado ── */}
                        <section id="no-asesoramiento-callout" className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-6 mb-6 scroll-mt-24">
                            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                {" "}<FinixUiText text={"Aviso importante: Finix no es un asesor financiero"} />{" "}</h2>
                            <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                                {" "}<FinixUiText text={"Finix proporciona información general, herramientas tecnológicas, contenido educativo, datos de mercado y análisis de carácter informativo. La información disponible en la plataforma"} />{" "}<strong>{""}<FinixUiText text={"no constituye asesoramiento financiero, de inversión, legal, contable, fiscal ni de ninguna otra naturaleza profesional."} />{""}</strong>
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {" "}<FinixUiText text={"Finix no recomienda a ningún usuario comprar, vender o mantener un activo financiero determinado, ni determina qué inversión resulta adecuada para una persona concreta. Las decisiones de inversión son responsabilidad exclusiva del usuario."} />{" "}</p>
                        </section>

                        <div className="space-y-4">

                            <Section id="informacion-general" title="1. Información general">
                                <p>
                                    {" "}<FinixUiText text={"Los presentes Términos y Condiciones (&ldquo;Términos&rdquo;) rigen el acceso y uso de Finix, una plataforma digital orientada a información financiera, mercados, economía, inversiones y comunidad (&ldquo;la Plataforma&rdquo;)."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"La Plataforma es operada por"} />{" "}<strong>{LEGAL_COMPANY_NAME}</strong>{""}<FinixUiText text={". El contacto oficial es"} />{""}{' '}
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                            </Section>

                            <Section id="aceptacion" title="2. Aceptación de los términos">
                                <p>
                                    {" "}<FinixUiText text={"Al acceder, registrarte o utilizar Finix en cualquier forma, aceptás estos Términos en su totalidad. Si no estás de acuerdo con ellos, no debés utilizar la Plataforma."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Algunas funcionalidades específicas pueden estar sujetas a términos adicionales que complementen este documento. En caso de conflicto, los términos específicos de cada funcionalidad prevalecerán en lo que les resulte aplicable."} />{" "}</p>
                            </Section>

                            <Section id="descripcion" title="3. Descripción de Finix">
                                <p>
                                    {" "}<FinixUiText text={"Finix es una plataforma tecnológica que proporciona:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Datos e información de mercados financieros (acciones, ETFs, CEDEARs, criptomonedas, commodities, índices y otros activos)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Herramientas de seguimiento de portafolio de activos"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Noticias y contenido editorial financiero"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Análisis e información educativa de carácter general"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Calendario de eventos financieros relevantes"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Funcionalidades de comunidad para compartir contenido e ideas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Rankings automatizados de rendimiento de activos"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Funcionalidades premium bajo suscripción (Finix Pro)"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Finix"} />{" "}<strong>{""}<FinixUiText text={"no es"} />{""}</strong> {" "}<FinixUiText text={"un broker, ALYC, banco, fondo de inversión, asesor de inversiones ni entidad financiera regulada. No ejecuta operaciones financieras, no custodia activos y no administra fondos."} />{" "}</p>
                            </Section>

                            <Section id="no-asesoramiento" title="4. Naturaleza informativa y educativa — Ausencia de asesoramiento financiero" variant="warning">
                                <p>
                                    {" "}<FinixUiText text={"El servicio que presta Finix tiene carácter exclusivamente"} />{" "}<strong>{""}<FinixUiText text={"informativo, educativo y tecnológico"} />{""}</strong>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Ningún contenido, funcionalidad, publicación, análisis, gráfico, ranking, señal, valoración, estimación, dato, comentario o mensaje disponible en Finix debe interpretarse como:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Asesoramiento financiero o de inversión personalizado"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Recomendación para comprar, vender o mantener cualquier activo financiero"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Análisis de idoneidad basado en el perfil de riesgo del usuario"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Oferta pública de compra o venta de valores"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Asesoramiento legal, contable, fiscal o de cualquier otra naturaleza profesional"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Cada usuario es el único responsable de sus decisiones de inversión. Antes de tomar cualquier decisión financiera, el usuario debe realizar su propia investigación y, cuando corresponda, consultar con un profesional habilitado por la normativa aplicable."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Los resultados históricos mostrados en la Plataforma"} />{" "}<strong>{""}<FinixUiText text={"no garantizan resultados futuros"} />{""}</strong>{""}<FinixUiText text={". Los mercados financieros implican riesgos, incluyendo la posible pérdida total o parcial del capital invertido."} />{" "}</p>
                            </Section>

                            <Section id="no-ejecucion" title="5. No ejecución de operaciones financieras">
                                <p>
                                    {" "}<FinixUiText text={"Finix no ejecuta ni puede ejecutar órdenes de compra o venta de activos financieros. La Plataforma no actúa como intermediario financiero, no conecta órdenes con mercados y no transmite instrucciones de inversión a ninguna entidad."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Si un usuario desea realizar operaciones financieras, deberá hacerlo a través de entidades debidamente habilitadas conforme a la normativa aplicable en su jurisdicción."} />{" "}</p>
                            </Section>

                            <Section id="datos-mercado" title="6. Información de mercados y datos de terceros">
                                <p>
                                    {" "}<FinixUiText text={"Finix puede mostrar, entre otros:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"Precios y variaciones de activos financieros"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Índices bursátiles"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Datos de acciones, ETFs, CEDEARs, criptomonedas, commodities y divisas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Indicadores económicos y calendarios de eventos"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Resultados trimestrales y estimaciones de consenso"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Gráficos, análisis técnico e información fundamental de empresas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Noticias de fuentes externas"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"La disponibilidad y alcance exacto de estos datos depende de los proveedores externos integrados. Los proveedores actuales incluyen, sin limitarse a,"} />{" "}<strong>{""}<FinixUiText text={"Financial Modeling Prep (FMP)"} />{""}</strong> {" "}<FinixUiText text={"para datos fundamentales y de mercado, y"} />{" "}<strong>{""}<FinixUiText text={"TradingView"} />{""}</strong> {" "}<FinixUiText text={"para widgets de gráficos. Dichos proveedores tienen sus propios términos de uso y políticas de privacidad."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Finix puede agregar, modificar o discontinuar integraciones con proveedores externos en cualquier momento."} />{" "}</p>
                            </Section>

                            <Section id="exactitud" title="7. Exactitud y disponibilidad de la información">
                                <p>
                                    {" "}<FinixUiText text={"Finix hace su mejor esfuerzo para ofrecer información de calidad, pero"} />{" "}<strong>{""}<FinixUiText text={"no garantiza"} />{""}</strong>:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"La exactitud, integridad o actualización de los datos mostrados"} />{""}</li>
                                    <li>{""}<FinixUiText text={"La disponibilidad permanente e ininterrumpida del servicio"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Que los datos estén libres de errores u omisiones provenientes de fuentes externas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Que los datos estén disponibles en tiempo real (pueden existir demoras de 15 a 20 minutos o más)"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Si una decisión financiera importante depende de un dato concreto, el usuario debe verificarlo por canales adicionales y fuentes oficiales."} />{" "}</p>
                            </Section>

                            <Section id="registro" title="8. Registro y cuentas de usuario">
                                <p>
                                    {" "}<FinixUiText text={"Para acceder a ciertas funcionalidades es necesario crear una cuenta. Al registrarte, te comprometés a proporcionar información veraz, completa y actualizada."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Sos responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Debés notificarnos inmediatamente si detectás acceso no autorizado o cualquier incidente de seguridad a través de"} />{" "}<a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"La autenticación es gestionada por"} />{" "}<strong>{""}<FinixUiText text={"Finix"} />{""}</strong>{""}<FinixUiText text={", con contraseñas protegidas mediante hashes y sesiones propias. El acceso con Google verifica tu identidad a través de Google."} />{" "}</p>
                            </Section>

                            <Section id="responsabilidades-usuario" title="9. Responsabilidades del usuario">
                                <p>{""}<FinixUiText text={"Al usar Finix, el usuario se compromete a:"} />{""}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Utilizar la Plataforma de buena fe y conforme a estos Términos"} />{""}</li>
                                    <li>{""}<FinixUiText text={"No infringir derechos de terceros ni las leyes aplicables"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Ser el único responsable del contenido que publica"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Verificar por cuenta propia la información antes de tomar decisiones financieras"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Mantener actualizada la información de su cuenta"} />{""}</li>
                                    <li>{""}<FinixUiText text={"No intentar eludir medidas de seguridad de la Plataforma"} />{""}</li>
                                </ul>
                            </Section>

                            <Section id="contenido-usuarios" title="10. Contenido generado por usuarios">
                                <p>
                                    {" "}<FinixUiText text={"Cada usuario conserva la titularidad sobre el contenido que publica (publicaciones, análisis, comentarios, imágenes, gráficos). Sin embargo, al subir contenido a Finix, otorgás una"} />{" "}<strong>{""}<FinixUiText text={"licencia no exclusiva, mundial y necesaria"} />{""}</strong> {" "}<FinixUiText text={"para que Finix pueda almacenarlo, mostrarlo, reproducirlo, moderarlo y distribuirlo dentro de la Plataforma mientras tu cuenta esté activa y durante el tiempo razonablemente necesario para la prestación del servicio."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Esta licencia"} />{" "}<strong>{""}<FinixUiText text={"no transfiere la propiedad"} />{""}</strong> {" "}<FinixUiText text={"del contenido ni autoriza a Finix a utilizarlo con fines comerciales fuera de la Plataforma sin tu consentimiento."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"El usuario es el único responsable del contenido que publica y debe contar con todos los derechos y permisos necesarios para publicarlo. Finix no valida ni endosa el contenido publicado por usuarios."} />{" "}</p>
                            </Section>

                            <Section id="publicaciones-comunidades" title="11. Publicaciones y comunidades">
                                <p>
                                    {" "}<FinixUiText text={"Las publicaciones en Finix tienen carácter público o limitado según la configuración de privacidad del usuario y de la comunidad en cuestión. El contenido publicado puede ser visto por otros usuarios de la Plataforma."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Las comunidades son espacios gestionados por sus administradores y moderadores, quienes establecen sus propias reglas complementarias. Finix actúa como proveedor de la infraestructura tecnológica y puede intervenir cuando una comunidad viole estos Términos o las políticas de la Plataforma."} />{" "}</p>
                            </Section>

                            <Section id="comunidades-monetizadas" title="12. Comunidades monetizadas">
                                <p>
                                    {" "}<FinixUiText text={"Algunas comunidades pueden requerir el pago de una suscripción para acceder a su contenido. Estos pagos se procesan a través de"} />{" "}<strong>{""}<FinixUiText text={"MercadoPago"} />{""}</strong> {" "}<FinixUiText text={"o"} />{" "}<strong>{""}<FinixUiText text={"Stripe"} />{""}</strong>{""}<FinixUiText text={", según corresponda."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Finix proporciona la infraestructura tecnológica para estas comunidades, pero"} />{" "}<strong>{""}<FinixUiText text={"no garantiza la calidad, exactitud, utilidad ni rentabilidad del contenido ofrecido por el administrador de la comunidad"} />{""}</strong>{""}<FinixUiText text={". El pago de una suscripción a una comunidad privada no implica recibir asesoramiento financiero personalizado."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Los conflictos entre usuarios y administradores de comunidades respecto al contenido deben resolverse entre las partes. Finix puede intervenir cuando se violen estos Términos o las políticas de la Plataforma."} />{" "}</p>
                            </Section>

                            <Section id="creators" title="13. Creadores (Creators)">
                                <p>
                                    {" "}<FinixUiText text={"Los Creadores son usuarios con capacidades adicionales para generar y monetizar contenido dentro de Finix. El contenido publicado por un Creador:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Es responsabilidad exclusiva del Creador, no de Finix"} />{""}</li>
                                    <li>{""}<FinixUiText text={"No representa necesariamente la opinión de Finix"} />{""}</li>
                                    <li>{""}<FinixUiText text={"No constituye asesoramiento financiero personalizado salvo que el Creador esté debidamente habilitado por la normativa aplicable y así lo indique explícitamente"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Debe cumplir con estos Términos y las políticas de contenido de Finix"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Finix puede suspender el acceso a las funcionalidades de Creador ante incumplimientos de estos Términos."} />{" "}</p>
                            </Section>

                            <Section id="conducta-prohibida" title="14. Conducta prohibida">
                                <p>{""}<FinixUiText text={"Está estrictamente prohibido en Finix:"} />{""}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Publicar información falsa, engañosa o presentada deliberadamente como certeza cuando no lo es"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Prometer rendimientos garantizados o inducir a terceros a tomar decisiones de inversión mediante información falsa o manipulada"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Promover maniobras de manipulación de mercado, pump and dump, front running, esquemas Ponzi o similares"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Presentarse como asesor financiero, broker, ALYC u otro profesional regulado sin las habilitaciones legales correspondientes"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Realizar estafas, fraudes, phishing, suplantación de identidad o cualquier actividad ilegal"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Publicar malware, virus, código dañino o intentar vulnerar la seguridad de la Plataforma"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Realizar spam, scraping no autorizado o actividades que afecten la estabilidad del servicio"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Acosar, amenazar, discriminar o abusar de otros usuarios"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Publicar contenido que infrinja derechos de propiedad intelectual de terceros"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Publicar contenido ilegal, pornográfico, violento o que infrinja la normativa aplicable"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Usar la Plataforma para cualquier fin ilícito o contrario al orden público"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Finix puede moderar, ocultar, eliminar o restringir contenido que viole estas reglas, con o sin aviso previo, según lo que resulte razonable para proteger a la comunidad."} />{" "}</p>
                            </Section>

                            <Section id="propiedad-intelectual" title="15. Propiedad intelectual">
                                <p>
                                    {" "}<FinixUiText text={"El software, diseño, interfaz, marca &ldquo;Finix&rdquo;, nombre comercial, logos, tipografías propias, gráficos propios, textos editoriales, código fuente, bases de datos y materiales propios de la Plataforma son propiedad de"} />{""}{' '}
                                    <strong>{LEGAL_COMPANY_NAME}</strong> {" "}<FinixUiText text={"o de sus licenciantes, y están protegidos por las leyes de propiedad intelectual aplicables."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Queda prohibido copiar, reproducir, distribuir, modificar, hacer obras derivadas o explotar comercialmente cualquier elemento de la Plataforma sin autorización previa y por escrito."} />{" "}</p>
                            </Section>

                            <Section id="licencias-contenido" title="16. Licencias sobre contenido generado por usuarios">
                                <p>
                                    {" "}<FinixUiText text={"Al publicar contenido en Finix, otorgás una licencia"} />{" "}<strong>{""}<FinixUiText text={"no exclusiva, mundial, libre de regalías"} />{""}</strong> {" "}<FinixUiText text={"para que Finix almacene, reproduzca, muestre, adapte técnicamente, distribuya y modere dicho contenido dentro de la Plataforma. Esta licencia es necesaria para la prestación del servicio."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"La licencia se limita a lo estrictamente necesario para operar y mejorar la Plataforma. Finix"} />{" "}<strong>{""}<FinixUiText text={"no utilizará tu contenido con fines publicitarios ni comerciales externos"} />{""}</strong> {" "}<FinixUiText text={"sin tu consentimiento explícito."} />{" "}</p>
                            </Section>

                            <Section id="moderacion" title="17. Reportes y moderación">
                                <p>
                                    {" "}<FinixUiText text={"Finix dispone de mecanismos para reportar publicaciones, comentarios y usuarios que incumplan estos Términos o las reglas de la Plataforma. Los reportes son evaluados por el equipo de moderación o administradores de la comunidad correspondiente."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Finix puede tomar medidas ante incumplimientos, incluyendo la eliminación de contenido, advertencias, restricciones de funcionalidades y suspensión o cancelación de cuentas."} />{" "}<strong>{""}<FinixUiText text={"Finix no garantiza moderación perfecta ni respuesta inmediata"} />{""}</strong> {" "}<FinixUiText text={"ante todos los reportes."} />{" "}</p>
                            </Section>

                            <Section id="suspension" title="18. Suspensión y cancelación de cuentas">
                                <p>
                                    {" "}<FinixUiText text={"Finix puede suspender o cancelar una cuenta, con o sin aviso previo, cuando existan motivos razonables, incluyendo:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"Incumplimiento de estos Términos"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Conductas que afecten a otros usuarios o a la comunidad"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Actividades fraudulentas o ilegales"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Riesgos de seguridad"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Requerimientos legales o regulatorios"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"El usuario puede solicitar la eliminación de su cuenta en cualquier momento contactando a"} />{""}{' '}
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>{""}<FinixUiText text={". Algunos datos pueden conservarse después de la cancelación por obligaciones legales o necesidades técnicas razonables."} />{" "}</p>
                            </Section>

                            <Section id="suscripciones" title="19. Suscripciones y servicios pagos">
                                <p>
                                    {" "}<FinixUiText text={"Finix puede ofrecer funcionalidades bajo planes de suscripción de pago. Las condiciones comerciales (precio, duración, renovación y beneficios incluidos) se informarán de forma clara antes del momento del cobro."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Los pagos son procesados por"} />{" "}<strong>{""}<FinixUiText text={"MercadoPago"} />{""}</strong> {" "}<FinixUiText text={"y/o"} />{" "}<strong>{""}<FinixUiText text={"Stripe"} />{""}</strong>{""}<FinixUiText text={", según la funcionalidad contratada. Finix no almacena el número completo de tu tarjeta; esa información es gestionada directamente por el procesador de pagos bajo sus propios estándares de seguridad."} />{" "}</p>
                            </Section>

                            <Section id="facturacion" title="20. Pagos, facturación y cancelaciones">
                                <p>
                                    {" "}<FinixUiText text={"Las suscripciones se renuevan automáticamente salvo que el usuario las cancele antes del siguiente período de facturación. Podés cancelar tu suscripción desde Configuración o escribiendo a"} />{""}{' '}
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Al cancelar, mantendrás el acceso a las funcionalidades hasta el fin del período abonado. Pasado ese período, tu cuenta volverá al plan gratuito sin pérdida de los datos o contenido generado."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Ante pagos rechazados, el sistema puede reintentar el cobro según las políticas del procesador de pagos. Si el problema persiste, el acceso a funcionalidades premium puede suspenderse. Los impuestos aplicables a la suscripción dependen de la jurisdicción del usuario."} />{" "}</p>
                            </Section>

                            <Section id="finix-pro" title="21. Finix Pro">
                                <p>
                                    {" "}<FinixUiText text={"Finix Pro es el plan de suscripción premium de Finix. Incluye funcionalidades adicionales de análisis, datos y herramientas dentro de la Plataforma."} />{" "}</p>
                                <p>
                                    <strong>{""}<FinixUiText text={"Aclaración fundamental:"} />{""}</strong> {" "}<FinixUiText text={"Las funcionalidades de Finix Pro —incluyendo análisis de empresas, valoraciones, estimaciones, rankings y métricas avanzadas— son de carácter"} />{" "}<strong>{""}<FinixUiText text={"informativo y educativo general"} />{""}</strong>{""}<FinixUiText text={". No constituyen asesoramiento financiero personalizado. Las valoraciones, estimaciones y precios objetivo son modelos sujetos a cambios y no garantizan rendimientos futuros. El usuario debe realizar su propia investigación antes de tomar decisiones de inversión."} />{" "}</p>
                            </Section>

                            <Section id="contenido-financiero" title="22. Contenido financiero">
                                <p>
                                    {" "}<FinixUiText text={"Los análisis, noticias, métricas y datos financieros presentes en Finix son de carácter informativo y educativo general. Cuando se utilicen valoraciones, estimaciones, precios objetivo, crecimiento esperado, múltiplos, indicadores técnicos o escenarios, debe entenderse que:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Son estimaciones o modelos, no certezas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Pueden cambiar en función de nuevos datos disponibles"} />{""}</li>
                                    <li>{""}<FinixUiText text={"No constituyen garantías de resultados"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Las fuentes externas pueden contener errores"} />{""}</li>
                                    <li>{""}<FinixUiText text={"No representan recomendaciones personalizadas de inversión"} />{""}</li>
                                </ul>
                            </Section>

                            <Section id="riesgos-inversion" title="23. Riesgos de inversión">
                                <p>
                                    {" "}<FinixUiText text={"Invertir en mercados financieros implica riesgos significativos, incluyendo la posible pérdida total o parcial del capital invertido. Algunos riesgos relevantes incluyen:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{""}<FinixUiText text={"Volatilidad de precios"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Riesgo de mercado y liquidez"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Riesgo regulatorio y político"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Riesgo cambiario"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Eventos imprevisibles que afecten a los mercados"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"El rendimiento pasado de un activo"} />{" "}<strong>{""}<FinixUiText text={"no garantiza resultados futuros"} />{""}</strong>{""}<FinixUiText text={". Cada usuario debe evaluar su situación financiera particular y su tolerancia al riesgo antes de tomar decisiones de inversión."} />{" "}</p>
                            </Section>

                            <Section id="enlaces-terceros" title="24. Servicios y enlaces de terceros">
                                <p>
                                    {" "}<FinixUiText text={"Finix integra servicios de terceros para proveer sus funcionalidades. Los principales proveedores son:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>{""}<FinixUiText text={"Google"} />{""}</strong> {" "}<FinixUiText text={"— Verificación de identidad cuando elegís iniciar sesión con Google"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"MercadoPago"} />{""}</strong> {" "}<FinixUiText text={"— Procesamiento de pagos (plan Finix Pro y comunidades)"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Stripe"} />{""}</strong> {" "}<FinixUiText text={"— Procesamiento de pagos (comunidades)"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Resend"} />{""}</strong> {" "}<FinixUiText text={"— Envío de emails transaccionales"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Financial Modeling Prep (FMP)"} />{""}</strong> {" "}<FinixUiText text={"— Datos fundamentales y de mercado"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"TradingView"} />{""}</strong> {" "}<FinixUiText text={"— Widgets de gráficos e información de mercado"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Cada uno de estos proveedores tiene sus propios términos de uso y políticas de privacidad. Finix no es responsable por las prácticas de dichos terceros."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"La Plataforma puede incluir enlaces a sitios web de terceros. Finix no controla ni es responsable del contenido, políticas de privacidad ni prácticas de esos sitios externos."} />{" "}</p>
                            </Section>

                            <Section id="disponibilidad" title="25. Disponibilidad del servicio">
                                <p>
                                    {" "}<FinixUiText text={"Finix se ofrece &ldquo;tal como está&rdquo; y &ldquo;según disponibilidad&rdquo;. Podemos actualizar, modificar, suspender temporalmente o discontinuar funcionalidades, integraciones o partes del servicio en cualquier momento, con o sin previo aviso, cuando resulte razonablemente necesario."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"No garantizamos disponibilidad permanente ni ininterrumpida del servicio. Las interrupciones pueden deberse a mantenimiento, actualizaciones, fallas técnicas, problemas de terceros o causas fuera de nuestro control."} />{" "}</p>
                            </Section>

                            <Section id="limitacion-responsabilidad" title="26. Limitación de responsabilidad" variant="warning">
                                <p>
                                    {" "}<FinixUiText text={"En la máxima medida permitida por la legislación aplicable, Finix y sus responsables no serán responsables por:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Pérdidas de capital o perjuicios derivados de decisiones de inversión tomadas por los usuarios"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Decisiones basadas en contenido publicado en la Plataforma por usuarios o terceros"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Errores, omisiones o retrasos en datos provenientes de fuentes externas"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Interrupciones o indisponibilidad del servicio"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Daños indirectos, incidentales, especiales o consecuentes"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Contenido publicado por otros usuarios"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Fallas de servicios de terceros integrados"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Acceso no autorizado a la cuenta del usuario derivado de su propio descuido en la gestión de credenciales"} />{""}</li>
                                </ul>
                            </Section>

                            <Section id="indemnidad" title="27. Indemnidad">
                                <p>
                                    {" "}<FinixUiText text={"El usuario se compromete a mantener indemne a Finix y a sus responsables de cualquier reclamo, pérdida, daño, multa o gasto (incluyendo honorarios legales razonables) derivado de: (i) el uso indebido de la Plataforma; (ii) la violación de estos Términos; (iii) la infracción de derechos de terceros; o (iv) el contenido publicado por el usuario."} />{" "}</p>
                            </Section>

                            <Section id="modificaciones" title="28. Modificaciones de los términos">
                                <p>
                                    {" "}<FinixUiText text={"Finix puede actualizar estos Términos para reflejar cambios del producto, del marco legal o de las prácticas operativas. Cuando los cambios sean relevantes, procuraremos comunicarlos con antelación razonable a través de la Plataforma o por email."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"El uso continuado de la Plataforma después de la entrada en vigencia de los nuevos Términos implica la aceptación de los cambios."} />{" "}</p>
                            </Section>

                            <Section id="legislacion" title="29. Legislación aplicable y jurisdicción">
                                <p>
                                    {" "}<FinixUiText text={"Estos Términos se rigen por la legislación aplicable, sin perjuicio de las protecciones que la normativa aplicable en el país de residencia del usuario pueda otorgar, especialmente en materia de defensa del consumidor."} />{" "}</p>
                            </Section>

                            <Section id="contacto" title="30. Contacto">
                                <p>
                                    {" "}<FinixUiText text={"Para consultas legales, reportes de abuso, solicitudes de eliminación de datos o cualquier duda sobre estos Términos y Condiciones, podés escribirnos a:"} />{" "}</p>
                                <p>
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-semibold">{CONTACT_EMAIL}</a>
                                </p>
                            </Section>

                        </div>

                        {/* Footer */}
                        <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                            <p>© {new Date().getFullYear()} {" "}<FinixUiText text={"Finix. Todos los derechos reservados."} />{""}</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link to="/help" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Ayuda"} />{""}</Link>
                                <Link to="/privacy" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Privacidad"} />{""}</Link>
                                <Link to="/cookies" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Cookies"} />{""}</Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            {showBackTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label={finixUi("Volver arriba")}
                    className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
