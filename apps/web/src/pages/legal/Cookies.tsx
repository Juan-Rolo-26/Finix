import { Cookie } from 'lucide-react';
import BackButton from '@/components/BackButton';

const cookiesSections = [
    {
        title: '1. ¿Qué son las cookies?',
        paragraphs: [
            'Las cookies son pequeños archivos de texto que los sitios web y aplicaciones que visitas almacenan en tu dispositivo (computadora, tablet, smartphone). Permiten que la plataforma recuerde tus acciones y preferencias durante un período de tiempo, para que no tengas que volver a introducirlas cada vez que regreses o navegues por distintas páginas.',
        ],
    },
    {
        title: '2. Tipos de cookies que usamos',
        bullets: [
            'Cookies estrictamente necesarias: Son fundamentales para que Finix funcione correctamente. Incluyen, por ejemplo, las que te permiten iniciar sesión de forma segura y acceder a tu portafolio.',
            'Cookies de rendimiento y análisis: Nos ayudan a comprender cómo interactúan los usuarios con la plataforma recopilando y reportando información de forma anónima (por ejemplo, velocidad de carga y páginas más visitadas).',
            'Cookies de funcionalidad: Permiten que el sitio recuerde elecciones que haces (como tu nombre de usuario, idioma o la región en la que te encuentras) para ofrecerte características mejoradas y más personalizadas.',
            'Cookies de personalización o publicidad: Se utilizan para rastrear a los visitantes en diferentes sitios web con la intención de mostrar anuncios relevantes, aunque en Finix procuramos mantener la publicidad al mínimo enfocado al usuario.',
        ],
    },
    {
        title: '3. Servicios de terceros',
        paragraphs: [
            'Finix puede utilizar tecnologías de seguimiento proporcionadas por servicios de análisis de terceros (como Google Analytics, Supabase y Vercel/Cloudflare Analytics) para ayudarnos a analizar cómo usas la red social financiera.',
            'Estas empresas tendrán acceso a tu información de uso bajo sus propias políticas de privacidad.',
        ],
    },
    {
        title: '4. ¿Cómo administrar tus cookies?',
        paragraphs: [
            'Tienes el derecho de decidir si aceptas o rechazas las cookies. Puedes configurar o ajustar los controles de tu navegador web para determinar qué cookies se instalan. Si eliges rechazar las cookies esenciales, es posible que algunas partes de Finix, como el inicio de sesión y la persistencia de la sesión, no funcionen de manera óptima.',
        ],
    },
    {
        title: '5. Cambios en esta política',
        paragraphs: [
            'Es posible que actualicemos esta Política de Cookies de manera ocasional para reflejar cambios en nuestras prácticas operativas, legales o reglamentarias. Por favor, visita esta página de forma regular para mantenerte informado.',
        ],
    },
];

import { Link } from 'react-router-dom';

const Cookies = () => {
    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-colors">
                <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <BackButton to="/dashboard" label="Volver a Finix" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                            <span className="text-primary font-bold text-base">F</span>
                        </div>
                        <span className="font-heading font-black text-lg tracking-tight">Finix</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 md:px-8 pt-28 pb-20 max-w-4xl">
                {/* ── Navigation Tabs between Legal & Info pages ── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide border-b border-border/40 text-xs font-semibold">
                    <Link to="/about" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Sobre Finix
                    </Link>
                    <Link to="/help" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Centro de Ayuda
                    </Link>
                    <Link to="/terms" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Términos de Servicio
                    </Link>
                    <Link to="/privacy" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Política de Privacidad
                    </Link>
                    <Link to="/cookies" className="px-3.5 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 whitespace-nowrap shadow-sm">
                        Cookies
                    </Link>
                </div>

                <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary">
                        <Cookie className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight mb-3">Política de Cookies</h1>
                    <p className="text-muted-foreground text-sm">Última actualización: Agosto de 2026</p>
                </div>

                <div className="space-y-8 text-muted-foreground leading-relaxed">
                    <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">Resumen de Uso</h2>
                        <p className="text-foreground/90 text-sm leading-relaxed">
                            En Finix usamos cookies esenciales para garantizar que puedas iniciar sesión de forma persistente y segura, prevenir fraudes y guardar tus preferencias de interfaz (como el modo oscuro/claro). Nunca utilizamos cookies para comercializar tus hábitos de navegación.
                        </p>
                    </section>

                    {cookiesSections.map(({ title, paragraphs, bullets }) => (
                        <section key={title} className="rounded-2xl border border-border/40 bg-card/60 p-6">
                            <h2 className="text-xl font-bold text-foreground mb-3">{title}</h2>
                            {paragraphs?.map((paragraph) => (
                                <p key={paragraph} className="text-sm mb-3 last:mb-0 leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                            {bullets ? (
                                <ul className="list-disc pl-5 space-y-1.5 mt-3 text-sm">
                                    {bullets.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </section>
                    ))}
                </div>

                {/* ── Footer ── */}
                <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>© 2026 Finix Network Inc. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-4">
                        <Link to="/about" className="hover:text-foreground transition-colors">Sobre Finix</Link>
                        <Link to="/help" className="hover:text-foreground transition-colors">Ayuda</Link>
                        <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Cookies;
