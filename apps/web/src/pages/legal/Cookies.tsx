import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cookie, ArrowLeft, ArrowUp, ChevronDown } from 'lucide-react';
import { InformationPageTabs } from '@/components/legal/InformationPageTabs';

// ─── Constants ─────────────────────────────────────────────────────────────────
const LAST_UPDATED = '15 de septiembre de 2026';
const CONTACT_EMAIL = 'finiixarg@gmail.com';

// ─── Section index ─────────────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'que-son', title: '1. ¿Qué son las cookies?' },
    { id: 'que-usamos', title: '2. Qué usamos realmente' },
    { id: 'almacenamiento-local', title: '3. Almacenamiento local' },
    { id: 'cookies-sesion', title: '4. Autenticación y sesión' },
    { id: 'cookies-preferencias', title: '5. Preferencias de interfaz' },
    { id: 'cookies-seguridad', title: '6. Seguridad' },
    { id: 'cookies-terceros', title: '7. Cookies de terceros (TradingView)' },
    { id: 'lo-que-no-usamos', title: '8. Lo que NO usamos' },
    { id: 'tabla-cookies', title: '9. Tabla de almacenamiento' },
    { id: 'como-gestionar', title: '10. Cómo gestionar preferencias' },
    { id: 'deshabilitar-navegador', title: '11. Deshabilitar desde el navegador' },
    { id: 'consecuencias', title: '12. Consecuencias de deshabilitar' },
    { id: 'cambios', title: '13. Cambios en la política' },
    { id: 'contacto', title: '14. Contacto' },
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

// ─── Section ───────────────────────────────────────────────────────────────────
function Section({ id, title, children, variant = 'default' }: {
    id: string; title: string; children: React.ReactNode; variant?: 'default' | 'info' | 'warning';
}) {
    const cls = { default: 'bg-card/60 border-border/40', info: 'bg-primary/5 border-primary/25', warning: 'bg-amber-500/5 border-amber-500/25' }[variant];
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
export default function Cookies() {
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
                        <Cookie className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight mb-3">{""}<FinixUiText text={"Política de Cookies"} />{""}</h1>
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
                            <h2 className="text-xl font-bold text-foreground mb-3">{""}<FinixUiText text={"Resumen"} />{""}</h2>
                            <p className="text-base sm:text-[17px] text-foreground/90 leading-relaxed">
                                {" "}<FinixUiText text={"En Finix usamos almacenamiento local del navegador para mantener tu sesión activa y guardar tus preferencias de interfaz."} />{" "}<strong>{""}<FinixUiText text={"La analítica propia es opcional y solo se activa si la aceptás. Si iniciás sesión, vincula tu cuenta con las visitas y permite al administrador ver tu correo en sus estadísticas privadas; las visitas sin sesión no muestran correo. No guardamos IP ni contenido privado y no usamos publicidad ni rastreo entre sitios."} />{""}</strong> {" "}<FinixUiText text={"La excepción son los widgets de gráficos de TradingView, que pueden establecer sus propias cookies según sus propias políticas."} />{" "}</p>
                        </div>

                        <MobileToc activeId={activeId} />

                        <div className="space-y-4">

                            <Section id="que-son" title="1. ¿Qué son las cookies y el almacenamiento local?">
                                <p>
                                    {" "}<FinixUiText text={"Las"} />{" "}<strong>{""}<FinixUiText text={"cookies"} />{""}</strong> {" "}<FinixUiText text={"son pequeños archivos de texto que los sitios web almacenan en tu navegador. Permiten que una plataforma recuerde información entre visitas o durante una sesión."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"El"} />{" "}<strong>{""}<FinixUiText text={"almacenamiento local (localStorage)"} />{""}</strong> {" "}<FinixUiText text={"es una tecnología similar integrada en los navegadores modernos que permite guardar datos de forma persistente en el dispositivo, sin fecha de expiración automática y sin ser enviados automáticamente al servidor en cada petición HTTP (a diferencia de las cookies tradicionales)."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Finix utiliza principalmente"} />{" "}<strong>{""}<FinixUiText text={"localStorage"} />{""}</strong> {" "}<FinixUiText text={"para sus funciones de sesión y preferencias, no cookies HTTP tradicionales."} />{" "}</p>
                            </Section>

                            <Section id="que-usamos" title="2. Qué utilizamos realmente en Finix" variant="info">
                                <p>
                                    {" "}<FinixUiText text={"Finix utiliza exclusivamente mecanismos de almacenamiento"} />{" "}<strong>{""}<FinixUiText text={"estrictamente necesarios"} />{""}</strong> {" "}<FinixUiText text={"para que la Plataforma funcione correctamente:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Almacenamiento de sesión de autenticación (token de acceso)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Cache de datos del usuario logueado"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Preferencias de interfaz (tema oscuro/claro, configuración del sidebar)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Estado temporal durante el proceso de registro (onboarding)"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Toda esta información"} />{" "}<strong>{""}<FinixUiText text={"permanece en tu dispositivo"} />{""}</strong> {" "}<FinixUiText text={"y es accedida solo cuando usás la Plataforma."} />{" "}</p>
                            </Section>

                            <Section id="almacenamiento-local" title="3. Almacenamiento local — Datos de sesión">
                                <p>
                                    {" "}<FinixUiText text={"Al iniciar sesión en Finix, tu token de autenticación y los datos básicos de tu perfil se almacenan en el"} />{" "}<strong>{""}<FinixUiText text={"localStorage"} />{""}</strong> {" "}<FinixUiText text={"de tu navegador. Esto permite que la sesión persista entre visitas sin que tengas que iniciar sesión cada vez."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Esta información"} />{" "}<strong>{""}<FinixUiText text={"solo es accesible por Finix"} />{""}</strong> {" "}<FinixUiText text={"y no puede ser leída por otros sitios web. Se elimina automáticamente cuando cerrás sesión."} />{" "}</p>
                            </Section>

                            <Section id="cookies-sesion" title="4. Autenticación y sesión">
                                <p>
                                    {" "}<FinixUiText text={"La autenticación es gestionada por"} />{" "}<strong>{""}<FinixUiText text={"Finix"} />{""}</strong>{""}<FinixUiText text={". Durante el inicio de sesión, Finix establece cookies y datos de sesión necesarios para verificar tu identidad y mantener el acceso seguro."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Estas cookies/tokens son"} />{" "}<strong>{""}<FinixUiText text={"estrictamente necesarias"} />{""}</strong> {" "}<FinixUiText text={"para que puedas acceder a tu cuenta. Sin ellas, no es posible iniciar sesión ni utilizar las funcionalidades que requieren autenticación."} />{" "}</p>
                            </Section>

                            <Section id="cookies-preferencias" title="5. Preferencias de interfaz">
                                <p>
                                    {" "}<FinixUiText text={"Finix guarda tus preferencias de interfaz en el almacenamiento local del navegador:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>{""}<FinixUiText text={"Tema"} />{""}</strong>{""}<FinixUiText text={": si preferís el modo oscuro o claro (o modo sistema)"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Sidebar"} />{""}</strong>{""}<FinixUiText text={": si lo tenés expandido o colapsado"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Otras configuraciones de UI"} />{""}</strong>{""}<FinixUiText text={": preferencias de visualización dentro de la Plataforma"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Estas preferencias se guardan para que no tengas que configurarlas cada vez que accedés a Finix."} />{" "}</p>
                            </Section>

                            <Section id="cookies-seguridad" title="6. Seguridad">
                                <p>
                                    {" "}<FinixUiText text={"Finix puede almacenar información temporal relacionada con la seguridad de tu sesión, como marcadores de tiempo de última actividad, para detectar actividad sospechosa o sesiones expiradas."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Esta información se usa exclusivamente para proteger tu cuenta y el servicio."} />{" "}</p>
                            </Section>

                            <Section id="cookies-terceros" title="7. Cookies de terceros — TradingView" variant="warning">
                                <p>
                                    {" "}<FinixUiText text={"Finix integra"} />{" "}<strong>{""}<FinixUiText text={"widgets de gráficos de TradingView"} />{""}</strong> {" "}<FinixUiText text={"en algunas secciones de la Plataforma. Estos widgets se cargan desde los servidores de TradingView y pueden establecer sus"} />{" "}<strong>{""}<FinixUiText text={"propias cookies"} />{""}</strong> {" "}<FinixUiText text={"en tu navegador."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Finix"} />{" "}<strong>{""}<FinixUiText text={"no controla"} />{""}</strong> {" "}<FinixUiText text={"las cookies establecidas por TradingView. Para conocer qué cookies utiliza TradingView y cómo las gestiona, consultá la"} />{""}{' '}
                                    <a href="https://www.tradingview.com/policies/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{""}<FinixUiText text={"Política de Privacidad de TradingView"} />{""}</a>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Si no deseás que TradingView establezca cookies, podés bloquearlas desde la configuración de tu navegador (ver sección 11)."} />{" "}</p>
                            </Section>

                            <Section id="lo-que-no-usamos" title="8. Lo que NO utilizamos en Finix">
                                <p>
                                    {" "}<FinixUiText text={"Para ser completamente transparentes, Finix"} />{" "}<strong>{""}<FinixUiText text={"no utiliza"} />{""}</strong>:
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"❌ Google Analytics ni analítica de terceros (la opción propia de Finix es anónima y requiere aceptación)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"❌ Cookies de publicidad o retargeting"} />{""}</li>
                                    <li>{""}<FinixUiText text={"❌ Cookies de rastreo entre sitios (cross-site tracking)"} />{""}</li>
                                    <li>{""}<FinixUiText text={"❌ Píxeles de seguimiento de redes sociales"} />{""}</li>
                                    <li>{""}<FinixUiText text={"❌ Herramientas de mapas de calor de terceros"} />{""}</li>
                                    <li>{""}<FinixUiText text={"❌ Cookies de marketing o personalización de anuncios"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Finix no comercializa tus hábitos de navegación ni comparte tu actividad con plataformas de publicidad."} />{" "}</p>
                            </Section>

                            <Section id="tabla-cookies" title="9. Tabla de almacenamiento utilizado">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm sm:text-[15px] border-collapse" role="table">
                                        <thead>
                                            <tr className="border-b border-border/60">
                                                <th className="text-left py-3 pr-4 font-bold text-foreground">{""}<FinixUiText text={"Clave"} />{""}</th>
                                                <th className="text-left py-3 pr-4 font-bold text-foreground">{""}<FinixUiText text={"Tipo"} />{""}</th>
                                                <th className="text-left py-3 pr-4 font-bold text-foreground">{""}<FinixUiText text={"Finalidad"} />{""}</th>
                                                <th className="text-left py-3 font-bold text-foreground">{""}<FinixUiText text={"Expiración"} />{""}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"token"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Autenticación — mantiene tu sesión iniciada"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Al cerrar sesión"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"user"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Cache del perfil de usuario para carga rápida"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Al cerrar sesión"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"pendingUsername"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Estado temporal durante el registro inicial"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Al completar el registro"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"finix-preferences"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Preferencias de tema, sidebar y UI"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Persistente (hasta borrar)"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"finix_analytics_visitor / finix_analytics_session"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Identificadores aleatorios; medición anónima solo con consentimiento (los datos de visitas se conservan hasta 13 meses)"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Hasta borrar el almacenamiento del navegador"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"finix_cookie_consent"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Registro de preferencias de cookies del usuario"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Hasta cambiar tus preferencias o borrar el almacenamiento del navegador"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"finix_token / finix_refresh_token"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"localStorage / Cookie"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Sesión de autenticación de Finix"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Según configuración de sesión"} />{""}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 pr-4 font-mono text-foreground font-medium">{""}<FinixUiText text={"TV* (TradingView)"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Cookie de tercero"} />{""}</td>
                                                <td className="py-3 pr-4">{""}<FinixUiText text={"Funcionalidad de widgets de gráficos de TradingView"} />{""}</td>
                                                <td className="py-3">{""}<FinixUiText text={"Según política de TradingView"} />{""}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>

                            <Section id="como-gestionar" title="10. Cómo gestionar tus preferencias">
                                <button type="button" onClick={() => window.dispatchEvent(new Event('finix-open-cookie-preferences'))} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                                    <FinixUiText text="Abrir preferencias de cookies" />
                                </button>
                                <p>
                                    {" "}<FinixUiText text={"Podés gestionar las preferencias de almacenamiento directamente desde la Plataforma. Si aparece el banner de cookies cuando ingresás por primera vez, podés:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>{""}<FinixUiText text={"Aceptar todas"} />{""}</strong>{""}<FinixUiText text={": aceptás el uso del almacenamiento necesario y de preferencias"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Solo necesarias"} />{""}</strong>{""}<FinixUiText text={": aceptás únicamente el almacenamiento estrictamente necesario para el funcionamiento"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Configurar"} />{""}</strong>{""}<FinixUiText text={": personalizar qué categorías aceptás"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"Podés cambiar tus preferencias en cualquier momento desde Configuración o contactando a"} />{" "}<a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
                                </p>
                                <p>
                                    {" "}<FinixUiText text={"Ten en cuenta que rechazar el almacenamiento"} />{" "}<strong>{""}<FinixUiText text={"necesario"} />{""}</strong> {" "}<FinixUiText text={"impedirá que Finix funcione correctamente (no podrás iniciar sesión ni mantener tus preferencias)."} />{" "}</p>
                            </Section>

                            <Section id="deshabilitar-navegador" title="11. Cómo deshabilitar cookies desde el navegador">
                                <p>
                                    {" "}<FinixUiText text={"Podés gestionar las cookies y el almacenamiento local directamente desde la configuración de tu navegador:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li><strong>{""}<FinixUiText text={"Google Chrome"} />{""}</strong>{""}<FinixUiText text={": Configuración → Privacidad y seguridad → Cookies y otros datos de sitios"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Mozilla Firefox"} />{""}</strong>{""}<FinixUiText text={": Configuración → Privacidad &amp; Seguridad → Cookies y datos del sitio"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Safari"} />{""}</strong>{""}<FinixUiText text={": Preferencias → Privacidad → Gestionar datos del sitio"} />{""}</li>
                                    <li><strong>{""}<FinixUiText text={"Microsoft Edge"} />{""}</strong>{""}<FinixUiText text={": Configuración → Privacidad, búsqueda y servicios → Cookies y permisos del sitio"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"También podés borrar el almacenamiento local de Finix desde las herramientas de desarrollo de tu navegador (DevTools → Application → Local Storage)."} />{" "}</p>
                            </Section>

                            <Section id="consecuencias" title="12. Consecuencias de deshabilitar el almacenamiento">
                                <p>
                                    {" "}<FinixUiText text={"Si deshabilitás o eliminás el almacenamiento local asociado a Finix:"} />{" "}</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>{""}<FinixUiText text={"Tu sesión se cerrará automáticamente y tendrás que iniciar sesión nuevamente en cada visita"} />{""}</li>
                                    <li>{""}<FinixUiText text={"Tus preferencias de tema e interfaz no se recordarán"} />{""}</li>
                                    <li>{""}<FinixUiText text={"El funcionamiento general de la Plataforma puede verse afectado"} />{""}</li>
                                </ul>
                                <p>
                                    {" "}<FinixUiText text={"No podemos garantizar el correcto funcionamiento de todas las funcionalidades si el almacenamiento local está deshabilitado."} />{" "}</p>
                            </Section>

                            <Section id="cambios" title="13. Cambios en la política de cookies">
                                <p>
                                    {" "}<FinixUiText text={"Podemos actualizar esta Política de Cookies para reflejar cambios en nuestras prácticas, en el producto o en la normativa aplicable. Cuando los cambios sean relevantes, procuraremos notificarlo dentro de la Plataforma."} />{" "}</p>
                                <p>
                                    {" "}<FinixUiText text={"Te recomendamos revisar esta página periódicamente para mantenerte informado."} />{" "}</p>
                            </Section>

                            <Section id="contacto" title="14. Contacto">
                                <p>
                                    {" "}<FinixUiText text={"Si tenés consultas sobre el uso de cookies o almacenamiento en Finix, podés contactarnos en:"} />{" "}</p>
                                <p>
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline font-semibold">{CONTACT_EMAIL}</a>
                                </p>
                                <p className="mt-4">
                                    {" "}<FinixUiText text={"Para conocer más sobre la privacidad en Finix, consultá nuestra"} />{""}{' '}
                                    <Link to="/privacy" className="text-primary hover:underline">{""}<FinixUiText text={"Política de Privacidad"} />{""}</Link>{' '}{""}<FinixUiText text={"completa."} />{" "}</p>
                            </Section>

                        </div>

                        {/* Footer */}
                        <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                            <p>© {new Date().getFullYear()} {" "}<FinixUiText text={"Finix. Todos los derechos reservados."} />{""}</p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link to="/help" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Ayuda"} />{""}</Link>
                                <Link to="/terms" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Términos"} />{""}</Link>
                                <Link to="/privacy" className="hover:text-foreground transition-colors">{""}<FinixUiText text={"Privacidad"} />{""}</Link>
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
