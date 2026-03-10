import { AlertTriangle, Scale } from 'lucide-react';
import BackButton from '@/components/BackButton';

const prohibitedConduct = [
    'Publicar información falsa, engañosa o presentada como certeza cuando no lo es.',
    'Promover maniobras de manipulación de mercado, pump and dump, front running o esquemas similares.',
    'Presentarte como asesor financiero, bróker, agente o profesional autorizado si no contás con las licencias exigidas por la ley aplicable.',
    'Prometer rendimientos garantizados o inducir decisiones de inversión como si fueran recomendaciones personalizadas.',
    'Subir contenido que infrinja derechos de autor, marcas, secretos comerciales o datos personales de terceros sin autorización.',
    'Acosar, discriminar, amenazar, suplantar identidad, vulnerar cuentas o intentar eludir medidas de seguridad.',
    'Usar bots, scraping no autorizado o cualquier mecanismo que afecte la estabilidad, disponibilidad o integridad de Finix.',
];

const termsSections = [
    {
        title: '1. Aceptación y alcance',
        paragraphs: [
            'Al acceder, registrarte o utilizar Finix aceptás estos Términos y Condiciones. Si no estás de acuerdo con ellos, no debés usar la plataforma.',
            'Estos términos regulan el uso de Finix como red social financiera, herramienta de aprendizaje, análisis de mercado y gestión de portafolio. Algunas funcionalidades pueden tener reglas adicionales que complementen este documento.',
        ],
    },
    {
        title: '2. Naturaleza del servicio',
        paragraphs: [
            'Finix es una plataforma tecnológica orientada a fines educativos, informativos y comunitarios. Su objetivo es ayudar a los usuarios a descubrir ideas, analizar activos, registrar inversiones y aprender de otros participantes de la comunidad.',
            'Finix no es un bróker, no ejecuta órdenes, no custodia activos, no administra fondos, no garantiza resultados y no reemplaza asesoramiento financiero, legal, contable ni impositivo profesional.',
        ],
    },
    {
        title: '3. No es asesoría financiera',
        paragraphs: [
            'Ningún post, comentario, gráfico, ranking, portafolio, watchlist, señal, score, mensaje o contenido disponible en Finix debe interpretarse como recomendación de inversión personalizada, oferta pública, invitación a comprar o vender activos, ni análisis de idoneidad para tu perfil.',
            'Toda decisión de inversión es exclusivamente tuya. Antes de operar, debés realizar tu propio análisis y, si corresponde, consultar con un profesional habilitado por la normativa aplicable.',
        ],
    },
    {
        title: '4. Cuenta, acceso y seguridad',
        paragraphs: [
            'Para usar ciertas funciones tenés que crear una cuenta y brindar datos veraces, completos y actualizados. Sos responsable de mantener la confidencialidad de tus credenciales y del uso de tu cuenta.',
            'Debés notificarnos de inmediato si detectás acceso no autorizado, uso indebido o cualquier incidente de seguridad relacionado con tu cuenta.',
        ],
    },
    {
        title: '5. Contenido de la comunidad',
        paragraphs: [
            'Cada usuario conserva la titularidad sobre el contenido que publica. Sin embargo, al subir contenido a Finix otorgás una licencia no exclusiva, mundial, revocable en la medida permitida por la ley y necesaria para alojarlo, reproducirlo, mostrarlo, moderarlo, adaptarlo técnicamente y distribuirlo dentro de la plataforma.',
            'Sos el único responsable por tus publicaciones, comentarios, mensajes, análisis, imágenes y cualquier otro material que compartas. Debés contar con los derechos y permisos necesarios para publicarlo.',
        ],
    },
    {
        title: '6. Conducta prohibida',
        paragraphs: [
            'Para proteger a la comunidad y al producto, no está permitido:',
        ],
        bullets: prohibitedConduct,
    },
    {
        title: '7. Datos de mercado y servicios de terceros',
        paragraphs: [
            'Finix puede mostrar precios, gráficos, noticias, métricas o contenido originado en proveedores externos. Esa información puede tener demoras, errores, omisiones, interrupciones o diferencias respecto de otras fuentes.',
            'No garantizamos exactitud, integridad, disponibilidad permanente ni actualización en tiempo real de datos de mercado o servicios de terceros. Si una decisión financiera depende de un dato concreto, debés verificarlo por canales adicionales.',
        ],
    },
    {
        title: '8. Riesgo y responsabilidad del usuario',
        paragraphs: [
            'Invertir en mercados financieros implica riesgos, incluida la posible pérdida total o parcial del capital. El rendimiento pasado no garantiza resultados futuros.',
            'Usás Finix bajo tu propia responsabilidad. En la máxima medida permitida por la ley, Finix no será responsable por pérdidas económicas, decisiones de inversión, lucro cesante, daño reputacional o perjuicios indirectos derivados del uso de la plataforma o de la confianza depositada en contenido publicado por terceros.',
        ],
    },
    {
        title: '9. Moderación, suspensión y baja',
        paragraphs: [
            'Podemos moderar contenido, limitar funcionalidades, suspender o dar de baja cuentas que incumplan estos términos, afecten a la comunidad, generen riesgos legales o comprometan la seguridad del servicio.',
            'La remoción de contenido o la suspensión de una cuenta puede realizarse con o sin aviso previo cuando resulte razonable para proteger a Finix, a sus usuarios o al cumplimiento normativo.',
        ],
    },
    {
        title: '10. Propiedad intelectual',
        paragraphs: [
            'El software, diseño, marca, nombre comercial, logo, interfaz y materiales propios de Finix están protegidos por derechos de propiedad intelectual. No podés copiarlos, reutilizarlos, revenderlos, explotarlos comercialmente ni crear obras derivadas sin autorización previa por escrito.',
        ],
    },
    {
        title: '11. Planes pagos y pagos de terceros',
        paragraphs: [
            'Si Finix ofrece funciones pagas, suscripciones o membresías, las condiciones comerciales aplicables se informarán antes del cobro. Los pagos pueden ser procesados por proveedores externos especializados, y Finix no almacena de forma directa el número completo de tu tarjeta.',
            'Los cargos, renovaciones, cancelaciones, impuestos y reembolsos podrán estar sujetos a reglas específicas del producto contratado y del proveedor de pagos correspondiente.',
        ],
    },
    {
        title: '12. Disponibilidad y cambios',
        paragraphs: [
            'Finix se ofrece “tal como está” y “según disponibilidad”. Podemos actualizar, modificar, suspender o discontinuar funciones, integraciones o partes del servicio en cualquier momento.',
            'También podemos actualizar estos Términos y Condiciones. Si los cambios son relevantes, procuraremos comunicarlo por medios razonables dentro de la plataforma o por email.',
        ],
    },
    {
        title: '13. Contacto',
        paragraphs: [
            'Si tenés consultas legales, reportes de abuso o dudas sobre estos Términos y Condiciones, podés escribirnos a finixarg@gmail.com.',
        ],
    },
];

const Terms = () => {
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
                        <Scale className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4">Términos y Condiciones</h1>
                    <p className="text-muted-foreground">Última actualización: 7 de marzo de 2026</p>
                </div>

                <div className="space-y-12 text-muted-foreground leading-8">
                    <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Importante: Finix no brinda asesoría financiera personalizada
                        </h2>
                        <p className="text-foreground/90 mb-4">
                            Finix es una herramienta para aprender, analizar y compartir información financiera dentro de una comunidad. No operamos como asesor financiero, bróker, agente ni administrador de inversiones.
                        </p>
                        <p>
                            El contenido de la plataforma tiene fines educativos e informativos. Nunca debe tomarse como instrucción directa para invertir ni como sustituto del análisis propio o del asesoramiento profesional habilitado.
                        </p>
                    </section>

                    {termsSections.map(({ title, paragraphs, bullets }) => (
                        <section key={title}>
                            <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
                            {paragraphs.map((paragraph) => (
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

export default Terms;
