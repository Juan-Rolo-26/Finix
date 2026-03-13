import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  Globe2,
  Heart,
  Rocket,
  Shield,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import ContactFormSection from '@/components/ContactFormSection';

type SectionKey = 'features' | 'how' | 'about';

type SectionMeta = {
  title: string;
  eyebrow: string;
  subtitle: string;
  summary: string;
  icon: LucideIcon;
  stats: Array<{ id: string; label: string; value: string }>;
};

const SECTION_META: Record<SectionKey, SectionMeta> = {
  features: {
    title: 'Características',
    eyebrow: 'Plataforma',
    subtitle:
      'Finix es una red social financiera para analizar el mercado, compartir ideas y aprender con otros inversores.',
    summary:
      'La plataforma reúne comunidad, herramientas de análisis y gestión de portafolio en una sola experiencia para que descubrir oportunidades, seguir activos y publicar análisis tenga contexto.',
    icon: Zap,
    stats: [
      { id: 'experience', label: 'Experiencia', value: 'Red social + análisis financiero' },
      { id: 'markets', label: 'Mercados', value: 'Acciones, CEDEARs, ETFs, Crypto' },
      { id: 'community', label: 'Comunidad', value: 'Inversores de Latinoamérica' },
    ],
  },
  how: {
    title: 'Cómo funciona',
    eyebrow: 'Proceso',
    subtitle: 'Empezar en Finix es rápido, claro y pensado para que el usuario entre en acción sin fricción.',
    summary:
      'Finix permite crear un perfil, explorar el mercado y participar en la comunidad desde un flujo simple, sin pasos innecesarios ni pantallas desconectadas.',
    icon: Rocket,
    stats: [
      { id: 'time', label: 'Tiempo de inicio', value: 'Menos de 2 minutos' },
      { id: 'access', label: 'Acceso', value: 'Registro gratuito' },
      { id: 'goal', label: 'Objetivo', value: 'Explorar y analizar el mercado' },
    ],
  },
  about: {
    title: 'Sobre Finix',
    eyebrow: 'Identidad',
    subtitle: 'Construyendo una red social financiera para Latinoamérica.',
    summary:
      'Finix busca democratizar el acceso a información financiera y construir una comunidad donde los inversores de la región puedan analizar, aprender y compartir ideas con más claridad.',
    icon: Heart,
    stats: [
      { id: 'region', label: 'Región', value: 'Latinoamérica' },
      { id: 'mission', label: 'Misión', value: 'Democratizar la información financiera' },
      { id: 'status', label: 'Estado', value: 'Producto en desarrollo' },
    ],
  },
};

const FEATURE_PILLARS = [
  {
    id: 'social',
    icon: TrendingUp,
    title: 'Red social financiera',
    desc:
      'Los usuarios pueden publicar análisis, opiniones de mercado y compartir ideas de inversión dentro de una comunidad enfocada en finanzas.',
  },
  {
    id: 'portfolio',
    icon: Wallet,
    title: 'Gestión de portafolio',
    desc:
      'Cada usuario puede registrar sus inversiones, seguir movimientos y entender mejor el rendimiento de su portafolio.',
  },
  {
    id: 'market',
    icon: BarChart3,
    title: 'Datos de mercado',
    desc:
      'Gráficos y herramientas de análisis para mirar activos, validar ideas y tomar decisiones con más contexto.',
  },
];

const FEATURE_DETAILS = [
  {
    id: 'privacy',
    icon: Shield,
    tag: 'Control',
    title: 'Privacidad configurable',
    desc:
      'El usuario decide qué información compartir, qué mantener privada y cómo mostrar su actividad dentro de Finix.',
  },
  {
    id: 'coverage',
    icon: Globe2,
    tag: 'Cobertura',
    title: 'Mercado global',
    desc:
      'La plataforma contempla acciones, CEDEARs, ETFs y crypto para seguir oportunidades locales e internacionales.',
  },
  {
    id: 'learning',
    icon: BookOpen,
    tag: 'Aprendizaje',
    title: 'Aprendizaje social',
    desc:
      'Aprender de otros inversores forma parte de la experiencia: ideas, análisis y conversaciones con contexto real de mercado.',
  },
  {
    id: 'identity',
    icon: BadgeCheck,
    tag: 'Perfil',
    title: 'Seguimiento de inversores',
    desc:
      'Finix permite descubrir perfiles, seguir inversores y mantener una lectura más ordenada de lo que comparte la comunidad.',
  },
];

const HOW_STEPS = [
  {
    id: 'register',
    number: '01',
    title: 'Crear cuenta',
    desc:
      'El usuario se registra con email para acceder a la plataforma y comenzar a explorar la experiencia de Finix.',
  },
  {
    id: 'profile',
    number: '02',
    title: 'Configurar perfil inversor',
    desc:
      'El usuario personaliza su perfil, define su privacidad y deja lista su cuenta según su forma de invertir.',
  },
  {
    id: 'use',
    number: '03',
    title: 'Explorar el mercado y la comunidad',
    desc:
      'Desde el mismo entorno puede analizar activos, compartir ideas y aprender de otros inversores de la comunidad.',
  },
];

const HOW_OUTCOMES = [
  'Un perfil listo para participar con claridad dentro de la comunidad.',
  'Acceso directo a herramientas para analizar activos y seguir el mercado.',
  'Un espacio para registrar inversiones, compartir ideas y aprender de otros inversores.',
];

const ABOUT_PRINCIPLES = [
  {
    id: 'clarity',
    title: 'Información clara',
    desc:
      'Reducir ruido y mostrar información útil es parte central del producto para analizar el mercado con mejor criterio.',
  },
  {
    id: 'trust',
    title: 'Comunidad colaborativa',
    desc:
      'Los usuarios comparten ideas, análisis y perspectivas para aprender entre pares dentro de una comunidad enfocada en inversión.',
  },
  {
    id: 'region',
    title: 'Educación financiera',
    desc:
      'Cada interacción busca ayudar a entender mejor el mercado y fortalecer decisiones de inversión con una mirada práctica.',
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`finix-marketing-panel ${className}`}>{children}</div>;
}

function SectionHero({ section }: { section: SectionMeta }) {
  const Icon = section.icon;

  return (
    <section className="grid gap-6 xl:grid-cols-12 xl:items-start">
      <motion.div variants={sectionVariants} className="space-y-5 xl:col-span-7">
        <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          {section.eyebrow}
        </span>
        <div className="space-y-3">
          <h1 className="max-w-4xl text-4xl font-heading font-bold tracking-tight text-foreground md:text-5xl">
            {section.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-foreground/82">
            {section.subtitle}
          </p>
        </div>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground md:text-base">
          {section.summary}
        </p>
      </motion.div>

      <motion.aside variants={sectionVariants} className="xl:col-span-5">
        <Panel className="rounded-[30px] p-6 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-primary/20 bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Resumen ejecutivo
            </span>
          </div>

          <div className="space-y-3">
            {section.stats.map(({ id, label, value }) => (
              <div key={id} className="rounded-2xl border border-border/45 bg-background/30 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </motion.aside>
    </section>
  );
}

function FeatureSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <motion.article variants={sectionVariants} className="xl:col-span-7">
        <Panel className="h-full rounded-[32px] p-7 md:p-9">
          <div className="max-w-2xl space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Lo central
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Comunidad, análisis y portafolio dentro de una misma experiencia.
            </h2>
            <p className="text-sm leading-8 text-muted-foreground">
              Finix combina herramientas que suelen estar separadas para que seguir inversores, analizar activos y gestionar inversiones tenga una lógica más simple y conectada.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURE_PILLARS.map(({ id, icon: Icon, title, desc }) => (
              <div key={id} className="rounded-[26px] border border-border/45 bg-background/28 p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </Panel>
      </motion.article>

      <motion.aside variants={sectionVariants} className="xl:col-span-5">
        <Panel className="h-full rounded-[32px] p-7 md:p-8">
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Qué incluye
            </span>
            <h3 className="text-2xl font-semibold text-foreground">
              Funcionalidades alineadas con el flujo real del inversor.
            </h3>
          </div>

          <div className="mt-8 space-y-5">
            {[
              'Publicación de análisis y opiniones de mercado dentro de una comunidad especializada.',
              'Registro de inversiones y seguimiento de portafolio en el mismo entorno.',
              'Cobertura sobre acciones, CEDEARs, ETFs y crypto para analizar oportunidades.',
              'Privacidad configurable para decidir qué se comparte y qué se mantiene privado.',
            ].map((item, index) => (
              <div key={item} className="flex gap-4 border-t border-border/50 pt-5 first:border-t-0 first:pt-0">
                <span className="w-8 shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  0{index + 1}
                </span>
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </motion.aside>

      {FEATURE_DETAILS.map(({ id, icon: Icon, tag, title, desc }) => (
        <motion.article
          key={id}
          variants={sectionVariants}
          className="xl:col-span-3"
        >
          <Panel className="h-full rounded-[28px] p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {tag}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{desc}</p>
          </Panel>
        </motion.article>
      ))}
    </section>
  );
}

function HowSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <motion.aside variants={sectionVariants} className="xl:col-span-4">
        <Panel className="rounded-[32px] p-7 md:p-8">
          <div className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Qué pasa después
            </span>
            <h2 className="text-2xl font-semibold text-foreground">
              El proceso deja al usuario listo para empezar a usar Finix.
            </h2>
            <p className="text-sm leading-8 text-muted-foreground">
              El objetivo es que el registro sea rápido y que, desde el primer ingreso, la plataforma ya tenga valor práctico para explorar, analizar y participar.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {HOW_OUTCOMES.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/45 bg-background/28 px-4 py-3.5">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </motion.aside>

      <div className="xl:col-span-8">
        <div className="space-y-0">
          {HOW_STEPS.map(({ id, number, title, desc }, index) => (
            <motion.article
              key={id}
              variants={sectionVariants}
              className="relative pl-20 pb-8 last:pb-0"
            >
              {index < HOW_STEPS.length - 1 ? (
                <div className="absolute left-[27px] top-14 bottom-0 w-px bg-border/70" />
              ) : null}

              <div className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/12 text-sm font-semibold tracking-[0.14em] text-primary">
                {number}
              </div>

              <Panel className="rounded-[30px] p-6 md:p-7">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <p className="max-w-2xl text-sm leading-8 text-muted-foreground">{desc}</p>
                </div>
              </Panel>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <motion.article variants={sectionVariants} className="xl:col-span-7">
        <Panel className="h-full rounded-[32px] p-7 md:p-9">
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Por qué existe
            </span>
            <h2 className="max-w-2xl text-2xl font-semibold text-foreground md:text-3xl">
              Una red social financiera pensada para mejorar el acceso a información y comunidad en la región.
            </h2>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5 text-sm leading-8 text-muted-foreground">
              <p>
                <strong className="font-semibold text-foreground">Finix</strong> busca democratizar el acceso a información financiera útil y construir una comunidad donde los inversores de Latinoamérica puedan compartir análisis, aprender y descubrir nuevas ideas.
              </p>
              <p>
                La propuesta integra red social, herramientas de análisis y gestión de portafolio para reducir fricción entre descubrir una oportunidad, analizarla y seguirla dentro del mismo producto.
              </p>
              <p>
                El producto sigue en desarrollo y se construye con foco en transparencia, claridad y aprendizaje continuo a partir del uso real de la comunidad.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/45 bg-background/28 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Idea rectora
              </p>
              <p className="mt-3 text-base leading-8 text-foreground/86">
                Crear una plataforma donde comunidad e información financiera convivan con más orden, contexto y utilidad para el inversor latinoamericano.
              </p>
            </div>
          </div>
        </Panel>
      </motion.article>

      <div className="space-y-6 xl:col-span-5">
        <motion.article variants={sectionVariants}>
          <Panel className="rounded-[30px] p-6 md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Visión
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  Construir una red social financiera relevante para Latinoamérica.
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  La visión es integrar educación financiera, análisis de mercado y comunidad dentro de un producto claro, útil y confiable.
                </p>
              </div>
            </div>
          </Panel>
        </motion.article>

        <motion.article variants={sectionVariants}>
          <Panel className="rounded-[30px] p-6 md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Principios de producto
            </p>
            <div className="mt-5 space-y-4">
              {ABOUT_PRINCIPLES.map(({ id, title, desc }) => (
                <div key={id} className="border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
                  <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </Panel>
        </motion.article>
      </div>

      <motion.div variants={sectionVariants} className="xl:col-span-12">
        <ContactFormSection
          id="contacto"
          title="Contacto Finix"
          description="Mandanos tu mensaje y el equipo lo recibe directamente por correo en finiixarg@gmail.com."
        />
      </motion.div>
    </section>
  );
}

export default function InfoPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const activeSection = (section && section in SECTION_META ? section : 'features') as SectionKey;
  const content = SECTION_META[activeSection];

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = location.hash.slice(1);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, activeSection]);

  return (
    <div className="finix-marketing-shell min-h-screen">
      <header className="finix-marketing-header sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex justify-start">
              <BackButton to="/" label="Volver al inicio" />
            </div>

            <div className="flex justify-center">
              <div className="finix-marketing-panel inline-flex flex-wrap items-center justify-center gap-1.5 rounded-[28px] border border-border/50 p-2 shadow-sm">
                {(Object.entries(SECTION_META) as [SectionKey, SectionMeta][]).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => navigate(`/info/${key}`)}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      activeSection === key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/72 hover:bg-background/70 hover:text-foreground'
                    }`}
                  >
                    {value.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="finix-marketing-panel inline-flex items-center gap-3 rounded-[26px] border border-border/50 px-5 py-3 shadow-sm">
                <img src="/logo.png" alt="Finix" className="h-7 w-7 object-contain" />
                <div className="leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Finanzas sociales
                  </p>
                  <p className="font-heading text-base font-bold text-primary">Finix</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <motion.div
          key={activeSection}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, staggerChildren: 0.05 },
            },
          }}
          className="space-y-10 md:space-y-12"
        >
          <SectionHero section={content} />

          {activeSection === 'features' ? <FeatureSection /> : null}
          {activeSection === 'how' ? <HowSection /> : null}
          {activeSection === 'about' ? <AboutSection /> : null}
        </motion.div>
      </main>
    </div>
  );
}
