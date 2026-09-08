import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';

const cols = [
    {
        title: 'Producto',
        links: [
            { label: 'Finix', href: '/' },
            { label: 'Finix Pro', href: '#precios' },
            { label: 'Finix Creator', href: '#creadores' },
            { label: 'Finix AI', href: '#finix-ai' },
        ],
    },
    {
        title: 'Comunidad',
        links: [
            { label: 'Comunidades', href: '#comunidades' },
            { label: 'Creadores', href: '#creadores' },
            { label: 'Explorar', href: '/' },
        ],
    },
    {
        title: 'Empresa',
        links: [
            { label: 'Sobre Finix', href: '/about' },
            { label: 'Contacto', href: '/help' },
            { label: 'Ayuda', href: '/help' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Términos', href: '/legal/terms' },
            { label: 'Privacidad', href: '/legal/privacy' },
            { label: 'Cookies', href: '/legal/cookies' },
            { label: 'Riesgos', href: '/legal/responsible' },
        ],
    },
];

const socials = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
];

export default function LandingFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border/20 bg-secondary/20 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16 py-16 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <motion.div
                            className="flex items-center gap-2 mb-4 cursor-pointer group"
                            whileHover={{ scale: 1.03 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-glow">
                                <span className="text-black font-extrabold text-sm select-none">F</span>
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-foreground">FINIX</span>
                        </motion.div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-[200px]">
                            La plataforma social y financiera para inversores modernos.
                        </p>

                        {/* Social links */}
                        <div className="flex items-center gap-3">
                            {socials.map(s => {
                                const Icon = s.icon;
                                return (
                                    <motion.a
                                        key={s.label}
                                        href={s.href}
                                        aria-label={s.label}
                                        className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                    </motion.a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Columns */}
                    {cols.map(col => (
                        <div key={col.title}>
                            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">{col.title}</p>
                            <ul className="space-y-2.5">
                                {col.links.map(link => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/20">
                    <p className="text-xs text-muted-foreground">
                        © {year} Finix. Todos los derechos reservados.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        La información en Finix no constituye asesoramiento financiero personalizado.
                    </p>
                </div>
            </div>
        </footer>
    );
}
