import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
    { label: 'Producto', href: '#producto' },
    { label: 'Comunidades', href: '#comunidades' },
    { label: 'Mercados', href: '#mercados' },
    { label: 'Creadores', href: '#creadores' },
    { label: 'Precios', href: '#precios' },
];

export default function LandingNav() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleScroll = (href: string) => {
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            <motion.header
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={{
                    background: scrolled
                        ? 'hsl(222 28% 7% / 0.88)'
                        : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px)' : 'none',
                    borderBottom: scrolled ? '1px solid hsl(215 90% 65% / 0.08)' : '1px solid transparent',
                    boxShadow: scrolled ? '0 8px 32px hsl(222 42% 3% / 0.3)' : 'none',
                }}
            >
                <div className="w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-16">
                    <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
                        {/* Logo */}
                        <motion.a
                            href="#inicio"
                            onClick={e => { e.preventDefault(); handleScroll('#inicio'); }}
                            className="flex items-center gap-2 group cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src="/finix-logo.png" alt="Finix" className="h-10 w-auto object-contain" />
                            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                FINIX
                            </span>
                        </motion.a>

                        {/* Desktop nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map(link => (
                                <motion.a
                                    key={link.label}
                                    href={link.href}
                                    onClick={e => { e.preventDefault(); handleScroll(link.href); }}
                                    className="px-5 py-2.5 text-base font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
                                    whileHover={{ y: -2 }}
                                >
                                    {link.label}
                                </motion.a>
                            ))}
                        </nav>

                        {/* Desktop CTAs */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                to="/auth"
                                className="px-5 py-2.5 text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                <Link
                                    to="/auth"
                                    className="px-6 py-3 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-glow hover:shadow-intense"
                                >
                                    Crear cuenta
                                </Link>
                            </motion.div>
                        </div>

                        {/* Mobile menu button */}
                        <motion.button
                            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Menú"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-x-0 top-[60px] z-40 p-4 md:hidden"
                    >
                        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden">
                            <nav className="flex flex-col p-2 gap-1">
                                {navLinks.map(link => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        onClick={e => { e.preventDefault(); handleScroll(link.href); }}
                                        className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
                                    >
                                        {link.label}
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </a>
                                ))}
                            </nav>
                            <div className="flex flex-col gap-2 p-4 pt-0">
                                <Link
                                    to="/auth"
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full py-4 text-center text-base font-medium rounded-xl border border-border hover:bg-white/5 transition-colors"
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/auth"
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full py-4 text-center text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                                >
                                    Crear cuenta gratis
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
