import { Shield } from 'lucide-react';
import BackButton from '@/components/BackButton';

const privacySections = [
    {
        title: '1. Alcance de esta política',
        paragraphs: [
            'Esta Política de Privacidad explica qué datos personales puede tratar Finix, para qué los usa, con quién puede compartirlos y qué opciones tenés como usuario.',
            'Aplica al uso del sitio, la app, la comunidad, las funciones de análisis, la gestión de portafolio, el soporte y cualquier interacción relacionada con la plataforma.',
        ],
    },
    {
        title: '2. Qué información recopilamos',
        paragraphs: [
            'La información que tratamos depende de cómo usás Finix, pero puede incluir las siguientes categorías:',
        ],
        bullets: [
            'Datos de cuenta y acceso: email, username, contraseña cuando usás acceso por email y datos básicos asociados a proveedores de autenticación.',
            'Datos de perfil: avatar, biografía, ubicación, preferencias, configuración de privacidad y otra información que decidas agregar.',
            'Actividad dentro de la comunidad: posts, comentarios, mensajes, reacciones, análisis, imágenes, gráficos, comunidades seguidas y contenido guardado.',
            'Datos de portafolio y seguimiento: activos cargados, movimientos, watchlists, notas y configuraciones relacionadas con tu experiencia de inversión.',
            'Datos técnicos y de seguridad: dirección IP, navegador, dispositivo, identificadores de sesión, registros de acceso, errores y eventos necesarios para proteger la cuenta y operar el servicio.',
            'Datos de pagos y suscripciones: estado de suscripción, comprobantes, montos e identificadores transaccionales. Los datos completos de la tarjeta son procesados por el proveedor de pagos y no por Finix.',
            'Comunicaciones: emails que nos enviás, respuestas de soporte y mensajes operativos como verificación, acceso o recuperación de contraseña.',
        ],
    },
    {
        title: '3. Para qué usamos tus datos',
        bullets: [
            'Crear y administrar tu cuenta, autenticar el acceso y proteger la seguridad del servicio.',
            'Mostrarte la plataforma, permitir publicaciones, comentarios, mensajes, análisis y herramientas de portafolio.',
            'Aplicar tus preferencias y controles de privacidad dentro de la comunidad.',
            'Prevenir fraude, abuso, spam, suplantación, manipulación y otras conductas prohibidas.',
            'Gestionar suscripciones, cobros, facturación y funcionalidades pagas, cuando existan.',
            'Enviar comunicaciones operativas, de seguridad, soporte o cambios relevantes del servicio.',
            'Mejorar la estabilidad, rendimiento y experiencia general de Finix.',
            'Cumplir obligaciones legales, regulatorias o responder requerimientos válidos de autoridad competente.',
        ],
    },
    {
        title: '4. Qué información puede ver la comunidad',
        paragraphs: [
            'Parte de la información que cargás puede ser visible para otros usuarios según la configuración de privacidad que elijas. Por ejemplo, tu username, avatar, biografía, publicaciones, comentarios y, si así lo activás, ciertos datos de portafolio o estadísticas.',
            'Tu email, tus credenciales, los códigos de verificación, los registros internos de seguridad y otra información sensible no se muestran públicamente.',
        ],
    },
    {
        title: '5. Con quién compartimos información',
        paragraphs: [
            'No vendemos tu información personal a terceros. Solo compartimos datos cuando es necesario para operar Finix o cuando la ley lo exige.',
        ],
        bullets: [
            'Proveedores de autenticación, infraestructura y base de datos para iniciar sesión y mantener la cuenta.',
            'Proveedores de email transaccional para enviar códigos, avisos de seguridad y comunicaciones operativas.',
            'Procesadores de pago para gestionar suscripciones, cobros y comprobantes.',
            'Prestadores técnicos que ayuden con hosting, seguridad, almacenamiento o soporte del producto.',
            'Autoridades, reguladores o terceros cuando exista obligación legal, prevención de fraude, defensa de derechos o protección de usuarios.',
        ],
    },
    {
        title: '6. Conservación y seguridad',
        paragraphs: [
            'Conservamos la información mientras tu cuenta esté activa y durante el tiempo razonablemente necesario para prestar el servicio, resolver disputas, prevenir fraude, cumplir obligaciones legales o hacer valer nuestros derechos.',
            'Aplicamos medidas técnicas y organizativas razonables para proteger los datos personales. Aun así, ningún sistema es completamente invulnerable y no podemos garantizar seguridad absoluta.',
        ],
    },
    {
        title: '7. Transferencias internacionales',
        paragraphs: [
            'Algunos proveedores e infraestructuras usados por Finix pueden procesar información fuera de tu país de residencia. Cuando eso ocurra, procuraremos que exista una base legal o contractual razonable para proteger tus datos conforme a la normativa aplicable.',
        ],
    },
    {
        title: '8. Tus derechos y controles',
        paragraphs: [
            'Según la legislación que resulte aplicable, podés solicitar acceso, rectificación, actualización, supresión y, cuando corresponda, oposición, limitación o portabilidad de tus datos.',
            'Además, dentro de Finix podés administrar parte de tu visibilidad mediante la configuración de privacidad. Si querés pedir la eliminación de tu cuenta o ejercer derechos sobre tus datos, escribinos a finiixarg@gmail.com.',
            'Si te encontrás en Argentina y la normativa aplicable lo permite, la Agencia de Acceso a la Información Pública actúa como autoridad de control en materia de protección de datos personales.',
        ],
    },
    {
        title: '9. Menores de edad',
        paragraphs: [
            'Finix no está diseñado para recopilar deliberadamente datos de menores en infracción a la ley aplicable. Si sos menor de edad, usá la plataforma solo con la autorización requerida por tu jurisdicción.',
        ],
    },
    {
        title: '10. Cambios a esta política',
        paragraphs: [
            'Podemos actualizar esta Política de Privacidad para reflejar cambios del producto, del marco legal o de nuestros proveedores. Cuando el cambio sea relevante, procuraremos informarlo por medios razonables dentro de la plataforma o por email.',
        ],
    },
    {
        title: '11. Contacto',
        paragraphs: [
            'Si tenés preguntas sobre privacidad, tratamiento de datos o querés ejercer tus derechos, podés escribirnos a finiixarg@gmail.com.',
        ],
    },
];

import { Link } from 'react-router-dom';

const Privacy = () => {
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
                    <Link to="/privacy" className="px-3.5 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 whitespace-nowrap shadow-sm">
                        Política de Privacidad
                    </Link>
                    <Link to="/cookies" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Cookies
                    </Link>
                </div>

                <div className="mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight mb-3">Política de Privacidad</h1>
                    <p className="text-muted-foreground text-sm">Última actualización: 7 de marzo de 2026</p>
                </div>

                <div className="space-y-8 text-muted-foreground leading-relaxed">
                    <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">Resumen de Privacidad</h2>
                        <p className="text-foreground/90 text-sm mb-3">
                            Finix recopila y trata datos personales exclusivamente para poder crear tu cuenta, mantener la seguridad del acceso, mostrar contenido de la comunidad, permitir herramientas de análisis y operar funciones como portafolio, mensajería, soporte y suscripciones.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            No vendemos tu información personal a terceros. Compartimos datos únicamente con proveedores indispensables para la prestación técnica del servicio y conforme a tus preferencias de visibilidad.
                        </p>
                    </section>

                    {privacySections.map(({ title, paragraphs, bullets }) => (
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
                        <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Privacy;
