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

const Cookies = () => {
    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans">
            <nav className="fixed top-0 w-full z-50 border-b border-primary/10 bg-background/60 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <BackButton to="/" label="Volver al inicio" />
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xl">Finix</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-32 pb-20 max-w-4xl">
                <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        <Cookie className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Política de Cookies</h1>
                    <p className="text-muted-foreground">Última actualización: Agosto de 2026</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-8">
                    <section className="rounded-3xl border border-primary/15 bg-primary/5 p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Resumen</h2>
                        <p className="mb-4">
                            En Finix usamos cookies de distintos tipos para garantizar que puedas iniciar sesión, para prevenir fraudes, y para recordar tus preferencias (como el tema oscuro/claro). El uso responsable de estas tecnologías es fundamental para tu experiencia en nuestra red social financiera.
                        </p>
                    </section>

                    {cookiesSections.map(({ title, paragraphs, bullets }) => (
                        <section key={title}>
                            <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
                            {paragraphs?.map((paragraph) => (
                                <p key={paragraph} className="mb-4 last:mb-0">
                                    {paragraph}
                                </p>
                            ))}
                            {bullets ? (
                                <ul className="list-disc pl-6 space-y-2 mt-4">
                                    {bullets.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Cookies;
