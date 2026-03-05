import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    TrendingUp,
    Users,
    BarChart3,
    Sparkles,
    ArrowRight,
    Wallet,
    LineChart,
    User,
    MessageSquare,
    Heart,
    Share2,
    Shield,
    Zap,
    ArrowUpRight,
    GraduationCap,
    UserPlus,
    Settings,
    CheckCircle2,
    TrendingDown,
    Activity,
    Eye,
    MessageCircle,
    Share,
    Star,
    Verified,
    Check,
    NotebookPen,
    Loader2
} from 'lucide-react';
import { useTranslation } from '@/i18n';

// --- Helper Components ---

const Badge = ({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "secondary" }) => {
    return (
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'} ${className}`}>
            {children}
        </div>
    );
};

// --- Sections ---

const Hero = () => {
    const t = useTranslation();
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    const stats = [
        { icon: TrendingUp, value: t.landing.hero.progress, label: t.landing.hero.progressDesc, delay: 0.6 },
        { icon: Users, value: t.landing.hero.community, label: 'Usuarios activos', delay: 0.7 },
        { icon: BarChart3, value: t.landing.hero.criteria, label: t.landing.hero.criteriaDesc, delay: 0.8 },
    ];

    return (
        <section id="inicio" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-hero" />

                {/* Animated Orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
                    }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* Content */}
            <motion.div
                className="container max-w-[1400px] relative z-10 px-4 md:px-6 pt-44 pb-20"
                style={{ y, opacity }}
            >
                <div className="flex flex-col items-center text-center space-y-6 max-w-5xl mx-auto">

                    {/* Main Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight leading-[0.9]">
                            <span className="block text-foreground">{t.landing.hero.welcome}</span>
                            <span className="relative inline-block mt-2">
                                <motion.span
                                    className="text-transparent bg-clip-text bg-gradient-accent"
                                    style={{
                                        textShadow: "0 0 80px hsl(var(--primary) / 0.5)",
                                    }}
                                >
                                    FINIX
                                </motion.span>
                                <motion.div
                                    className="absolute -inset-4 bg-gradient-primary-glow blur-3xl -z-10"
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                            </span>
                        </h1>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl leading-relaxed"
                    >
                        {t.landing.hero.subtitle}{" "}
                        <span className="text-primary font-semibold">{t.landing.hero.social}</span>,{" "}
                        <span className="text-primary font-semibold">{t.landing.hero.simple}</span> {t.lang.startsWith('en') ? 'and' : (t.lang.startsWith('pt') ? 'e' : 'y')}{" "}
                        <span className="text-primary font-semibold">{t.landing.hero.powerful}</span>.
                        <br className="hidden md:block" />
                        {t.landing.hero.desc}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4"
                    >
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                            <Button
                                size="lg"
                                asChild
                                className="relative text-lg md:text-xl px-10 md:px-12 py-7 md:py-8 font-bold rounded-xl shadow-intense hover:shadow-[0_0_110px_rgba(0,255,170,0.5)] transition-all bg-primary text-primary-foreground border-none"
                            >
                                <Link to="/" className="flex items-center">
                                    <span>{t.landing.hero.startFree}</span>
                                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-3xl pt-10 pb-4"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="flex flex-col items-center gap-3 group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: stat.delay }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="relative">
                                    <motion.div
                                        className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                    />
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-primary/30 flex items-center justify-center relative group-hover:border-primary/60 transition-all shadow-glow">
                                        <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-primary group-hover:scale-110 transition-transform" />
                                    </div>
                                </div>
                                <p className="text-xl md:text-2xl lg:text-3xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-accent">
                                    {stat.value}
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground font-medium text-center max-w-[150px]">
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
            >
                <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-2"
                >
                    <span className="text-xs text-muted-foreground font-medium">{t.landing.hero.discoverMore}</span>
                    <div className="w-6 h-10 rounded-full border-2 border-primary/40 flex items-start justify-center p-2">
                        <motion.div
                            className="w-1.5 h-3 bg-primary rounded-full"
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
};

const MVPExplanation = () => {
    const t = useTranslation();
    return (
        <section id="mvp" className="py-20 px-4 md:px-6 relative overflow-hidden bg-secondary/5 border-y border-primary/5">
            <div className="container max-w-[1200px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                        <NotebookPen className="w-3 h-3 mr-2" />
                        {t.landing.mvp.transparency}
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                        {t.landing.mvp.whatIs} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">MVP</span>?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        {t.landing.mvp.desc}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Loader2,
                            title: t.landing.mvp.cards.construction.title,
                            desc: t.landing.mvp.cards.construction.desc,
                            color: "text-blue-400",
                            bg: "bg-blue-500/10"
                        },
                        {
                            icon: Users,
                            title: t.landing.mvp.cards.voice.title,
                            desc: t.landing.mvp.cards.voice.desc,
                            color: "text-emerald-400",
                            bg: "bg-emerald-500/10"
                        },
                        {
                            icon: Zap,
                            title: t.landing.mvp.cards.iteration.title,
                            desc: t.landing.mvp.cards.iteration.desc,
                            color: "text-orange-400",
                            bg: "bg-orange-500/10"
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            whileHover={{ y: -5 }}
                            className="bg-background/40 backdrop-blur-sm border border-border p-8 rounded-2xl hover:border-primary/20 transition-all group"
                        >
                            <div className={`w-14 h-14 rounded-xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <item.icon className={`w-7 h-7 ${item.color} ${i === 0 ? 'animate-spin-slow' : ''}`} />
                            </div>
                            <h3 className="text-xl font-heading font-bold mb-3">{item.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-background to-primary/5 border border-primary/10 text-center relative overflow-hidden"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <MessageSquare className="w-10 h-10 text-primary mb-4" />
                        <h4 className="text-2xl font-bold mb-2">{t.landing.mvp.feedback.title}</h4>
                        <p className="text-muted-foreground mb-6 max-w-xl">
                            {t.landing.mvp.feedback.desc}
                        </p>
                        <Button
                            variant="outline"
                            className="border-primary/30 text-primary bg-transparent hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium px-8"
                            onClick={() => {
                                window.location.href = "mailto:finixarg@gmail.com?subject=Feedback%20Finix%20MVP&body=Hola%20equipo%20de%20Finix,%20tengo%20el%20siguiente%20feedback:";
                            }}
                        >
                            {t.landing.mvp.feedback.btn}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const Features = () => {
    const t = useTranslation();
    const features = [
        {
            icon: TrendingUp,
            title: t.landing.features.cards.socialFeed.title,
            description: t.landing.features.cards.socialFeed.desc,
            gradient: "from-primary/20 to-primary/5",
            iconBg: "bg-primary/20",
        },
        {
            icon: Wallet,
            title: t.landing.features.cards.smartPortfolios.title,
            description: t.landing.features.cards.smartPortfolios.desc,
            gradient: "from-emerald-500/20 to-emerald-500/5",
            iconBg: "bg-emerald-500/20",
        },
        {
            icon: BarChart3,
            title: 'Exploración de mercado',
            description: 'Seguimiento en tiempo real de activos con métricas claras para tomar decisiones.',
            gradient: "from-blue-500/20 to-blue-500/5",
            iconBg: "bg-blue-500/20",
        },
        {
            icon: LineChart,
            title: 'Herramientas de decisión',
            description: 'Visualizá el comportamiento de activos y compará escenarios desde una sola pantalla.',
            gradient: "from-orange-500/20 to-orange-500/5",
            iconBg: "bg-orange-500/20",
        },
        {
            icon: User,
            title: t.landing.features.cards.proProfiles.title,
            description: t.landing.features.cards.proProfiles.desc,
            gradient: "from-purple-500/20 to-purple-500/5",
            iconBg: "bg-purple-500/20",
        },
        {
            icon: GraduationCap,
            title: t.landing.features.cards.academy.title,
            description: t.landing.features.cards.academy.desc,
            gradient: "from-pink-500/20 to-pink-500/5",
            iconBg: "bg-pink-500/20",
        }
    ];

    const socialFeatures = [
        { icon: MessageSquare, label: t.landing.features.social.comments, color: "text-blue-400" },
        { icon: Heart, label: t.landing.features.social.likes, color: "text-red-400" },
        { icon: Share2, label: t.landing.features.social.share, color: "text-primary" },
        { icon: Shield, label: t.landing.features.social.security, color: "text-emerald-400" },
        { icon: Zap, label: t.landing.features.social.realtime, color: "text-yellow-400" }
    ];

    return (
        <section id="features" className="py-24 md:py-32 px-4 md:px-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <motion.div
                    className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
                    animate={{ x: [-100, 0, -100], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 15, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl"
                    animate={{ x: [100, 0, 100], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 12, repeat: Infinity }}
                />
            </div>

            <div className="container max-w-[1400px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 md:mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                    >
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{t.landing.features.pill}</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
                        {t.landing.features.title}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-accent">
                            FINIX
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t.landing.features.subtitle}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={index === 4 ? "md:col-span-2 lg:col-span-1" : ""}
                            >
                                <Card className={`relative p-6 md:p-8 h-full bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border-border/50 hover:border-primary/40 transition-all duration-500 group overflow-hidden`}>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    />
                                    <div className="relative flex flex-col gap-5">
                                        <div className="flex items-start justify-between">
                                            <div
                                                className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                                            >
                                                <Icon className="w-7 h-7 text-primary" />
                                            </div>
                                            <motion.div
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                <ArrowUpRight className="w-5 h-5 text-primary" />
                                            </motion.div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-primary transition-colors">
                                                {feature.title}
                                            </h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-2xl" />
                    <div className="relative flex flex-wrap justify-center gap-4 md:gap-8 p-6 md:p-8 rounded-2xl border border-primary/10 bg-secondary/30 backdrop-blur-sm">
                        {socialFeatures.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={index}
                                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-background/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-4 h-4 ${item.color}`} />
                                    </div>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const Steps = () => {
    const t = useTranslation();
    const steps = [
        {
            number: "01",
            icon: UserPlus,
            title: t.landing.steps.cards.step1.title,
            description: t.landing.steps.cards.step1.desc,
            color: "from-primary to-emerald-400",
        },
        {
            number: "02",
            icon: Settings,
            title: t.landing.steps.cards.step2.title,
            description: t.landing.steps.cards.step2.desc,
            color: "from-blue-500 to-cyan-400",
        },
        {
            number: "03",
            icon: TrendingUp,
            title: t.landing.steps.cards.step3.title,
            description: t.landing.steps.cards.step3.desc,
            color: "from-orange-500 to-yellow-400",
        },
        {
            number: "04",
            icon: Users,
            title: t.landing.steps.cards.step4.title,
            description: t.landing.steps.cards.step4.desc,
            color: "from-purple-500 to-pink-400",
        },
    ];

    return (
        <section id="steps" className="py-24 md:py-32 px-4 md:px-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                    style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 60%)" }}
                />
            </div>

            <div className="container max-w-[1400px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 md:mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                    >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{t.landing.steps.pill}</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
                        {t.landing.steps.title}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-accent">{t.landing.steps.titleSuffix}</span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t.landing.steps.subtitle}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className="relative group"
                        >
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-16 left-[calc(100%+0.5rem)] w-[calc(100%-2rem)] h-px">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary/50 to-primary/20"
                                        initial={{ scaleX: 0 }}
                                        whileInView={{ scaleX: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                                        style={{ originX: 0 }}
                                    />
                                    <motion.div
                                        className="absolute right-0 top-1/2 -translate-y-1/2"
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.2 + 0.6 }}
                                    >
                                        <ArrowRight className="w-4 h-4 text-primary/50" />
                                    </motion.div>
                                </div>
                            )}

                            <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 hover:border-primary/40 transition-all duration-500 h-full group-hover:shadow-glow">
                                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                                    <span className={`text-lg font-heading font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                                        {step.number}
                                    </span>
                                </div>
                                <motion.div
                                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <step.icon className="w-8 h-8 text-white" />
                                </motion.div>
                                <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-primary transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-6">
                        {t.landing.steps.ready}{" "}
                        <span className="text-primary font-semibold">{t.landing.steps.time}</span>
                    </p>
                    <motion.a
                        href="#register"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold shadow-glow hover:shadow-intense transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>{t.landing.steps.cta}</span>
                        <ArrowRight className="w-5 h-5" />
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
};

const Showcase = () => {
    const t = useTranslation();
    const mockPosts = [
        {
            user: "María López",
            username: "@marialopez",
            avatar: "M",
            verified: true,
            action: t.landing.showcase.sharedAnalysis,
            asset: "AAPL",
            trend: "up",
            change: "+3.2%",
            likes: 234,
            comments: 45,
            time: "2 min"
        },
        {
            user: "Carlos Ruiz",
            username: "@carlosruiz",
            avatar: "C",
            verified: false,
            action: t.landing.showcase.postedIdea,
            asset: "TSLA",
            trend: "down",
            change: "-1.8%",
            likes: 156,
            comments: 28,
            time: "5 min"
        },
        {
            user: "Ana García",
            username: "@anagarcia",
            avatar: "A",
            verified: true,
            action: t.landing.showcase.updatedPortfolio,
            asset: "BTC",
            trend: "up",
            change: "+5.7%",
            likes: 892,
            comments: 134,
            time: "12 min"
        }
    ];

    const holdings = [
        { symbol: "AAPL", name: "Apple Inc.", value: "$45,200", percent: 36, change: "+2.1%", color: "from-primary to-emerald-400" },
        { symbol: "MSFT", name: "Microsoft", value: "$38,100", percent: 31, change: "+1.8%", color: "from-blue-500 to-blue-400" },
        { symbol: "GOOGL", name: "Alphabet", value: "$28,900", percent: 23, change: "+3.4%", color: "from-red-500 to-orange-400" },
        { symbol: "BTC", name: "Bitcoin", value: "$12,380", percent: 10, change: "+8.2%", color: "from-yellow-500 to-amber-400" }
    ];

    return (
        <section id="showcase" className="py-24 md:py-32 px-4 md:px-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-secondary/30 to-background" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="container max-w-[1400px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 md:mb-20"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                    >
                        <Eye className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{t.landing.showcase.pill}</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
                        {t.landing.showcase.title}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-accent">
                            {t.landing.showcase.titleSuffix}
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t.landing.showcase.subtitle}
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Card className="p-6 md:p-8 bg-gradient-to-br from-secondary/80 to-secondary/40 backdrop-blur-xl border-border/50 h-full">
                            <div className="space-y-5">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                            <Activity className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-lg">{t.landing.showcase.feedTitle}</h3>
                                            <p className="text-sm text-muted-foreground">{t.landing.showcase.feedSubtitle}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                                        Live
                                    </Badge>
                                </div>

                                {mockPosts.map((post, i) => (
                                    <motion.div
                                        key={i}
                                        className="p-4 rounded-xl bg-background/60 border border-border/30 space-y-4 hover:border-primary/30 transition-all cursor-pointer group"
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">
                                                    {post.avatar}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-semibold text-sm">{post.user}</p>
                                                        {post.verified && <Verified className="w-4 h-4 text-primary" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{post.action} • {post.time}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="gap-1.5 bg-secondary/80">
                                                {post.trend === "up" ? (
                                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                                ) : (
                                                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                                )}
                                                <span className={post.trend === "up" ? "text-emerald-400" : "text-red-400"}>
                                                    {post.change}
                                                </span>
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                                                ${post.asset}
                                            </Badge>
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                <button className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors">
                                                    <Heart className="w-4 h-4" />
                                                    {post.likes}
                                                </button>
                                                <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                                                    <MessageCircle className="w-4 h-4" />
                                                    {post.comments}
                                                </button>
                                                <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                                                    <Share className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Card className="p-6 md:p-8 bg-gradient-to-br from-secondary/80 to-secondary/40 backdrop-blur-xl border-border/50 h-full">
                            <div className="space-y-5">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-lg">{t.landing.showcase.myPortfolio}</h3>
                                            <p className="text-sm text-muted-foreground">{t.landing.showcase.realtimePerformance}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-sm font-medium">Top 5%</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        className="p-5 rounded-xl bg-background/60 border border-border/30"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <p className="text-xs text-muted-foreground mb-1.5">{t.landing.showcase.totalValue}</p>
                                        <p className="text-3xl font-heading font-bold">$124,580</p>
                                        <p className="text-xs text-muted-foreground mt-1">USD</p>
                                    </motion.div>
                                    <motion.div
                                        className="p-5 rounded-xl bg-background/60 border border-emerald-500/20"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <p className="text-xs text-muted-foreground mb-1.5">{t.landing.showcase.totalGain}</p>
                                        <p className="text-3xl font-heading font-bold text-emerald-400">+$8,420</p>
                                        <p className="text-xs text-emerald-400 mt-1">+7.25% YTD</p>
                                    </motion.div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-muted-foreground">{t.landing.showcase.positions}</p>
                                    {holdings.map((holding, i) => (
                                        <motion.div
                                            key={i}
                                            className="p-4 rounded-xl bg-background/60 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
                                            initial={{ opacity: 0, x: 10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.01 }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${holding.color} flex items-center justify-center`}>
                                                        <span className="text-xs font-bold text-white">{holding.symbol[0]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{holding.symbol}</p>
                                                        <p className="text-xs text-muted-foreground">{holding.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-sm">{holding.value}</p>
                                                    <p className="text-xs text-emerald-400">{holding.change}</p>
                                                </div>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full bg-gradient-to-r ${holding.color}`}
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${holding.percent}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};



const CTA = () => {
    const t = useTranslation();
    const features = t.landing.cta.features;

    return (
        <section id="cta" className="py-24 md:py-32 px-4 md:px-6 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
                    style={{
                        background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
                        backgroundSize: '80px 80px',
                    }}
                />
            </div>

            <div className="container max-w-[1200px] mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur-sm border border-primary/30"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-4 h-4 text-primary" />
                        </motion.div>
                        <span className="text-sm font-semibold text-primary">{t.landing.cta.pill}</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-[1.1]">
                        {t.landing.cta.title}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-accent">
                            {t.landing.cta.titleSuffix}
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t.landing.cta.desc}
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary/60 backdrop-blur-sm border border-border/50"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Check className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{feature}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                            <Button
                                asChild
                                size="lg"
                                className="relative text-lg md:text-xl px-10 md:px-12 py-7 md:py-8 font-bold rounded-xl shadow-intense group bg-primary text-primary-foreground"
                            >
                                <Link to="/" className="flex items-center">
                                    <span>{t.landing.cta.btn}</span>
                                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// --- Footer saved from current version ---
const Footer = () => {
    const t = useTranslation();
    return (
        <footer className="border-t border-white/5 bg-black py-16">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/logo.png" alt="Finix" className="h-8 w-8" />
                            <span className="font-heading font-bold text-xl text-white">Finix</span>
                        </div>
                        <p className="text-muted-foreground max-w-sm leading-relaxed">
                            {t.landing.footer.desc}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">{t.landing.footer.platform}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">{t.landing.footer.about}</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Mercados</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">{t.landing.footer.rules}</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">{t.landing.footer.contact}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">{t.landing.footer.legal}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link to="/legal/privacy" className="hover:text-primary transition-colors">{t.legal.privacy}</Link></li>
                            <li><Link to="/legal/terms" className="hover:text-primary transition-colors">{t.legal.terms}</Link></li>
                            <li><Link to="/legal/responsible" className="hover:text-primary transition-colors">{t.landing.footer.responsible}</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">{t.landing.footer.copyright}</p>
                    <div className="flex gap-6">
                        <a href="https://instagram.com/fiinixarg" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors">Instagram</a>
                        <a href="https://tiktok.com/@finixarg" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors">TikTok</a>
                        <a href="mailto:finiixarg@gmail.com" className="text-muted-foreground hover:text-white transition-colors">Email</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// --- Main Page (used by InfoPage) ---

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground font-sans">
            <Hero />
            <MVPExplanation />
            <Features />
            <Steps />
            <Showcase />
            <CTA />
            <Footer />
        </div>
    );
};

export default Landing;
