import { useState, useMemo } from 'react';
import { HelpCircle, Search, ChevronDown, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';

interface FaqItem {
    id: string;
    category: 'general' | 'market' | 'portfolio' | 'account' | 'pro';
    question: string;
    answer: string;
}

const FAQS: FaqItem[] = [
    {
        id: 'faq-1',
        category: 'general',
        question: '¿Qué es Finix y cómo funciona?',
        answer: 'Finix es la primera red social financiera diseñada para simplificar el análisis y la toma de decisiones de inversión. Combina un feed de debate constructivo, seguimiento de portafolios, rankings automatizados del S&P 500 y un calendario financiero curado sin ruido ni distracciones.'
    },
    {
        id: 'faq-2',
        category: 'market',
        question: '¿Cómo se calculan los Mejores y Peores rendimientos?',
        answer: 'Nuestro motor de backend procesa automáticamente los 503 activos que componen el índice S&P 500. Diariamente a las 16:50 ET (tras el cierre de Wall Street) calcula la variación porcentual real y genera los rankings oficiales del día. En la versión gratuita puedes consultar el Top 5, y con Finix PRO accedes a los listados ampliados de Top 10, Top 25 y Top 50.'
    },
    {
        id: 'faq-3',
        category: 'market',
        question: '¿Qué eventos se incluyen en el Calendario Financiero?',
        answer: 'Bajo la premisa "No mostrar todo. Mostrar lo que importa", el Calendario de Finix selecciona exclusivamente los eventos de alto y medio impacto de Estados Unidos (IPC, tasas de la Fed, nóminas no agrícolas), Argentina (inflación INDEC, decisiones del BCRA) y los reportes de resultados trimestrales de las compañías más representativas.'
    },
    {
        id: 'faq-4',
        category: 'portfolio',
        question: '¿Cómo agrego y gestiono activos en mi portafolio?',
        answer: 'Dirígete a la sección "Portafolio" en la barra de navegación lateral y haz clic en "Agregar activo". Busca el ticker correspondiente (acciones, CEDEARs, ETFs o cripto), ingresa la cantidad, precio de compra y fecha. El sistema calculará automáticamente tu valor de mercado y rendimiento neto.'
    },
    {
        id: 'faq-5',
        category: 'account',
        question: '¿Cómo recupero mi contraseña si no puedo ingresar?',
        answer: 'En la pantalla de inicio de sesión (/auth), presiona "¿Olvidaste tu contraseña?". Ingresa el correo electrónico vinculado a tu cuenta de Finix y recibirás un código seguro de verificación de 6 dígitos para restablecerla inmediatamente.'
    },
    {
        id: 'faq-6',
        category: 'account',
        question: '¿Cómo obtengo la tilde de verificación en mi perfil?',
        answer: 'La insignia de verificación de Finix se otorga a analistas financieros certificados, creadores de contenido financiero con historial comprobado o perfiles institucionales. Si cumples estos requisitos, contáctanos a finiixarg@gmail.com con la documentación de respaldo.'
    },
    {
        id: 'faq-7',
        category: 'pro',
        question: '¿Qué beneficios incluye la suscripción Finix PRO?',
        answer: 'Finix PRO desbloquea la profundidad analítica completa: acceso a los rankings Top 10, Top 25 y Top 50 de Mejores y Peores Rendimientos, estimaciones de consenso y métricas de sorpresa en el Calendario de Earnings, alertas prioritarias de mercado y una insignia PRO distintiva en tu perfil.'
    },
    {
        id: 'faq-8',
        category: 'general',
        question: '¿Finix brinda asesoramiento o recomendaciones de compra?',
        answer: 'No. Finix es una plataforma meramente educativa, tecnológica y comunitaria. Ninguna publicación, análisis, ranking o señal debe considerarse una recomendación de inversión personalizada. Cada usuario debe realizar su propio análisis responsable (DYOR).'
    }
];

const CATEGORIES = [
    { id: 'all', label: 'Todas las preguntas' },
    { id: 'general', label: 'General' },
    { id: 'market', label: 'Mercado & Calendario' },
    { id: 'portfolio', label: 'Portafolio' },
    { id: 'account', label: 'Cuenta & Seguridad' },
    { id: 'pro', label: 'Finix PRO' }
];

export default function Help() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-2': true });

    const toggleFaq = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredFaqs = useMemo(() => {
        return FAQS.filter(faq => {
            const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
            const matchesQuery = searchQuery.trim() === '' ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen finix-unified-bg text-foreground font-sans selection:bg-primary/30">
            {/* ── Top Bar ── */}
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
                    <Link to="/help" className="px-3.5 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 whitespace-nowrap shadow-sm">
                        Centro de Ayuda
                    </Link>
                    <Link to="/terms" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Términos de Servicio
                    </Link>
                    <Link to="/privacy" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Política de Privacidad
                    </Link>
                    <Link to="/cookies" className="px-3.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap">
                        Cookies
                    </Link>
                </div>

                {/* ── Header ── */}
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight">
                        Centro de Ayuda y Soporte
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Encontrá respuestas rápidas a tus dudas y aprendé a aprovechar al máximo todas las herramientas de Finix.
                    </p>

                    {/* ── Search Input ── */}
                    <div className="relative max-w-lg mx-auto pt-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar preguntas (ej. portafolio, s&p 500, pro, contraseña)..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* ── Category Filters ── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
                    {CATEGORIES.map(cat => {
                        const active = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                    active
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── FAQs Accordion List ── */}
                <div className="space-y-4 mb-16">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-12 rounded-3xl bg-card border border-border/60">
                            <p className="text-sm font-semibold text-muted-foreground mb-2">No encontramos resultados para tu búsqueda.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Restablecer filtros
                            </button>
                        </div>
                    ) : (
                        filteredFaqs.map(faq => {
                            const isExpanded = Boolean(expandedIds[faq.id]);
                            return (
                                <div
                                    key={faq.id}
                                    className="rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-200 hover:border-border"
                                >
                                    <button
                                        onClick={() => toggleFaq(faq.id)}
                                        className="w-full px-6 py-4.5 flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base cursor-pointer"
                                    >
                                        <span className="leading-snug">{faq.question}</span>
                                        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                                    </button>
                                    {isExpanded && (
                                        <div className="px-6 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Contact Card ── */}
                <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                            <Mail className="w-4 h-4" />
                            <span>Atención Directa</span>
                        </div>
                        <h3 className="text-xl font-heading font-bold">¿Tenés una consulta específica?</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Nuestro equipo de soporte técnico y comunidad responde generalmente en menos de 24 horas hábiles.
                        </p>
                    </div>
                    <a
                        href="mailto:finiixarg@gmail.com?subject=Consulta%20sobre%20Finix"
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm whitespace-nowrap hover:opacity-90 transition-all flex items-center gap-2 shadow-sm shrink-0"
                    >
                        <Mail className="w-4 h-4" />
                        finiixarg@gmail.com
                    </a>
                </div>

                {/* ── Footer ── */}
                <footer className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>© 2026 Finix Network Inc. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-4">
                        <Link to="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                        <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}
