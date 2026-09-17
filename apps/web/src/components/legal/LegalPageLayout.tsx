import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Legal navigation items ────────────────────────────────────────────────────
export const LEGAL_NAV = [
    { to: '/about', label: 'Sobre Finix' },
    { to: '/help', label: 'Centro de Ayuda' },
    { to: '/terms', label: 'Términos' },
    { to: '/privacy', label: 'Privacidad' },
    { to: '/cookies', label: 'Cookies' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface LegalSection {
    id: string;
    title: string;
    shortTitle?: string;
}

interface LegalPageLayoutProps {
    currentPath: string;
    title: string;
    subtitle?: string;
    lastUpdated: string;
    icon: React.ReactNode;
    sections: LegalSection[];
    children: React.ReactNode;
    /** Color class for accent, e.g. "primary", "amber" */
    accent?: 'primary' | 'amber' | 'emerald';
    meta?: { title: string; description: string };
}

// ─── Scroll-spy hook ───────────────────────────────────────────────────────────
function useScrollSpy(ids: string[]) {
    const [activeId, setActiveId] = useState(ids[0] ?? '');

    useEffect(() => {
        const handleScroll = () => {
            let found = ids[0] ?? '';
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) continue;
                const top = el.getBoundingClientRect().top;
                if (top <= 120) found = id;
            }
            setActiveId(found);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [ids]);

    return activeId;
}

// ─── Back to top button ────────────────────────────────────────────────────────
function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Volver arriba"
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
        >
            <ArrowUp className="w-4 h-4" />
        </button>
    );
}

// ─── Mobile section selector ───────────────────────────────────────────────────
function MobileSectionSelect({ sections, activeId }: { sections: LegalSection[]; activeId: string }) {
    const [open, setOpen] = useState(false);
    const active = sections.find(s => s.id === activeId) ?? sections[0];

    return (
        <div className="relative lg:hidden mb-6">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/60 text-sm font-medium text-left"
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="truncate text-foreground">{active?.shortTitle ?? active?.title}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div
                    className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-card border border-border/60 shadow-xl overflow-hidden"
                    role="listbox"
                >
                    {sections.map(s => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            role="option"
                            aria-selected={s.id === activeId}
                            className={`block px-4 py-2.5 text-sm transition-colors ${s.id === activeId ? 'text-primary font-semibold bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                            onClick={() => setOpen(false)}
                        >
                            {s.shortTitle ?? s.title}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Desktop sidebar index ─────────────────────────────────────────────────────
function DesktopSidebar({ sections, activeId }: { sections: LegalSection[]; activeId: string }) {
    return (
        <nav aria-label="Índice de secciones" className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-1 scrollbar-hide">
            {sections.map(s => (
                <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`block px-3.5 py-2 rounded-lg text-sm transition-all leading-snug ${
                        s.id === activeId
                            ? 'text-primary font-bold bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                >
                    {s.shortTitle ?? s.title}
                </a>
            ))}
        </nav>
    );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────
export default function LegalPageLayout({
    currentPath,
    title,
    subtitle,
    lastUpdated,
    icon,
    sections,
    children,
}: LegalPageLayoutProps) {
    const sectionIds = sections.map(s => s.id);
    const activeId = useScrollSpy(sectionIds);
    const navigate = useNavigate();

    // Scroll anchor into view on hash change
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            setTimeout(() => {
                const el = document.getElementById(hash);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, []);

    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            {/* ── Top Nav ── */}
            <nav
                className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-colors"
                role="navigation"
                aria-label="Navegación principal"
            >
                <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Volver</span>
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
                {/* ── Legal nav tabs ── */}
                <div
                    className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide border-b border-border/40 text-sm font-semibold"
                    role="tablist"
                    aria-label="Secciones legales"
                >
                    {LEGAL_NAV.map(nav => {
                        const isActive = currentPath === nav.to;
                        return (
                            <Link
                                key={nav.to}
                                to={nav.to}
                                role="tab"
                                aria-selected={isActive}
                                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                {nav.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex gap-10">
                    {/* ── Sidebar (desktop) ── */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <DesktopSidebar sections={sections} activeId={activeId} />
                    </aside>

                    {/* ── Main content ── */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <header className="mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary">
                                {icon}
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight mb-3">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-muted-foreground text-base sm:text-lg mb-3">{subtitle}</p>
                            )}
                            <p className="text-sm text-muted-foreground/80 font-medium">
                                Última actualización: {lastUpdated}
                            </p>
                        </header>

                        {/* Mobile section selector */}
                        <MobileSectionSelect sections={sections} activeId={activeId} />

                        {/* Content */}
                        <div className="space-y-4">
                            {children}
                        </div>

                        {/* ── Footer ── */}
                        <footer
                            className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground"
                            role="contentinfo"
                        >
                            <p>
                                © {new Date().getFullYear()} Finix. Todos los derechos reservados.{' '}
                                <span className="opacity-60">[Razón social pendiente de configuración]</span>
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link to="/help" className="hover:text-foreground transition-colors">Ayuda</Link>
                                <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                                <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                                <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            <BackToTop />
        </div>
    );
}

// ─── LegalSection component ────────────────────────────────────────────────────
interface LegalSectionBlockProps {
    id: string;
    title: string;
    children: React.ReactNode;
    variant?: 'default' | 'warning' | 'info';
}

export function LegalSectionBlock({ id, title, children, variant = 'default' }: LegalSectionBlockProps) {
    const variantClass = {
        default: 'bg-card/60 border-border/40',
        warning: 'bg-amber-500/5 border-amber-500/25',
        info: 'bg-primary/5 border-primary/25',
    }[variant];

    return (
        <section
            id={id}
            className={`rounded-2xl border ${variantClass} p-6 sm:p-7 scroll-mt-24`}
            aria-labelledby={`${id}-heading`}
        >
            <h2
                id={`${id}-heading`}
                className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight"
            >
                {title}
            </h2>
            <div className="text-base sm:text-[17px] text-foreground/90 leading-relaxed space-y-4">
                {children}
            </div>
        </section>
    );
}

// ─── Callout component ─────────────────────────────────────────────────────────
interface CalloutProps {
    type: 'warning' | 'info' | 'important';
    title?: string;
    children: React.ReactNode;
}

export function Callout({ type, title, children }: CalloutProps) {
    const styles = {
        warning: 'border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400',
        info: 'border-blue-500/30 bg-blue-500/8 text-blue-600 dark:text-blue-400',
        important: 'border-primary/30 bg-primary/8 text-primary',
    };

    return (
        <div className={`rounded-xl border p-5 ${styles[type]}`} role="note">
            {title && <p className="font-bold text-base mb-1.5">{title}</p>}
            <div className="text-base leading-relaxed text-foreground/90">{children}</div>
        </div>
    );
}

// ─── Expandable FAQ accordion (shared) ────────────────────────────────────────
interface AccordionItemProps {
    id: string;
    question: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function AccordionItem({ id, question, children, defaultOpen = false }: AccordionItemProps) {
    const [open, setOpen] = useState(defaultOpen);
    const contentId = `${id}-content`;

    return (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-border/80">
            <button
                id={id}
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls={contentId}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base cursor-pointer"
            >
                <span className="leading-snug text-foreground">{question}</span>
                <ChevronRight
                    className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90 text-primary' : ''}`}
                />
            </button>
            {open && (
                <div
                    id={contentId}
                    role="region"
                    aria-labelledby={id}
                    className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30 space-y-2"
                >
                    {children}
                </div>
            )}
        </div>
    );
}
