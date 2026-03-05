import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  Wallet,
  Zap,
  Shield,
  Globe,
  Heart,
  Rocket,
  Target,
} from 'lucide-react';
import BackButton from '@/components/BackButton';

const INFO_CONTENT: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: any;
    content: React.ReactNode;
  }
> = {
  features: {
    title: 'Características',
    subtitle: 'Un ecosistema financiero social todo-en-uno',
    icon: Zap,
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            icon: TrendingUp,
            title: 'Red Social Financiera',
            desc: 'Publicá análisis, gráficos editados de TradingView, estrategias, reels educativos y opiniones de mercado. Seguí inversores y creadores.',
          },
          {
            icon: Wallet,
            title: 'Gestión Inteligente de Portafolio',
            desc: 'Trackeo manual o automático de activos. Métricas como rendimiento acumulado, drawdown, volatilidad y comparación contra benchmarks.',
          },
          {
            icon: BarChart3,
            title: 'Datos de Mercado en Tiempo Real',
            desc: 'Acciones, CEDEARs, ETFs, crypto, forex y commodities con gráficos interactivos y herramientas de análisis técnico.',
          },
          {
            icon: Shield,
            title: 'Privacidad Configurable',
            desc: 'Elegí qué mostrar: portafolio público, privado o parcial. Control total sobre tu información.',
          },
          {
            icon: Globe,
            title: 'Mercado Global',
            desc: 'Seguí activos de mercados globales con datos claros y contexto para tomar decisiones.',
          },
          {
            icon: Heart,
            title: 'Experiencia Personal',
            desc: 'Configurá la plataforma a tu estilo con privacidad y preferencias personalizadas.',
          },
        ].map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border/40 bg-card/50 p-6 flex gap-4 hover:border-primary/30 hover:bg-card/70 transition-all duration-200"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 text-foreground">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },

  how: {
    title: 'Cómo funciona',
    subtitle: 'Empezá en minutos',
    icon: Rocket,
    content: (
      <div className="space-y-5 max-w-xl mx-auto">
        {[
          {
            step: '01',
            title: 'Creá tu cuenta gratuita',
            desc: 'Registrate en segundos y accedé al ecosistema Finix. Sin tarjeta de crédito.',
          },
          {
            step: '02',
            title: 'Configurá tu perfil inversor',
            desc: 'Definí tu estilo de inversión, agregá activos y personalizá tu privacidad.',
          },
          {
            step: '03',
            title: 'Publicá, analizá y conectá',
            desc: 'Compartí estrategias, seguí inversores y empezá a construir tu reputación financiera.',
          },
        ].map(({ step, title, desc }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4 items-start rounded-2xl border border-border/40 bg-card/50 p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-black font-bold">
              {step}
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 text-foreground">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },

  about: {
    title: 'Sobre Finix',
    subtitle: 'Construyendo la red financiera de Latinoamérica',
    icon: Heart,
    content: (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-5"
      >
        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Finix</strong> nace para
            resolver un problema claro: no existe una plataforma que combine red
            social, análisis avanzado y gestión de portafolio pensada
            específicamente para inversores argentinos y latinoamericanos.
          </p>

          <p>
            Nuestro objetivo es democratizar el acceso a información financiera
            de calidad y crear una comunidad donde compartir estrategias sea
            transparente, educativo y profesional.
          </p>

          <p>
            Actualmente estamos en fase MVP validando el producto junto a
            nuestra comunidad. Evolucionamos constantemente a partir del
            feedback real de usuarios.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h4 className="font-semibold text-primary text-sm mb-2">
            Nuestra visión
          </h4>
          <p className="text-xs text-muted-foreground">
            Convertirnos en la principal red social financiera de Latinoamérica,
            integrando educación financiera, análisis profesional y comunidad en
            un solo lugar.
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          📩 finixarg@gmail.com
        </div>
      </motion.div>
    ),
  },

  roadmap: {
    title: 'Roadmap',
    subtitle: 'Evolución del producto',
    icon: Target,
    content: (
      <div className="space-y-4 max-w-xl mx-auto">
        {[
          {
            quarter: 'Q1',
            desc: 'Lanzamiento MVP + Feed social financiero.',
          },
          {
            quarter: 'Q2',
            desc: 'Integración con brokers y portafolio automático.',
          },
          {
            quarter: 'Q3',
            desc: 'Ranking de inversores y métricas avanzadas.',
          },
          {
            quarter: 'Q4',
            desc: 'Optimización de performance y mejoras de experiencia en toda la plataforma.',
          },
        ].map(({ quarter, desc }, i) => (
          <motion.div
            key={quarter}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border/40 bg-card/50 p-5"
          >
            <h4 className="font-semibold text-primary text-sm mb-1">
              {quarter}
            </h4>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    ),
  },
};

export default function InfoPage() {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();

  const content =
    section && INFO_CONTENT[section]
      ? INFO_CONTENT[section]
      : INFO_CONTENT.features;

  const Icon = content.icon;
  const activeSection = section || 'features';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/20 bg-background/75 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <BackButton to="/" label="Volver al inicio" />

          <div className="flex items-center gap-2 ml-1">
            <img
              src="/logo.png"
              alt="Finix"
              className="h-5 w-5 object-contain"
            />
            <span className="font-heading font-bold text-sm text-primary">
              Finix
            </span>
          </div>

          <div className="ml-auto flex gap-1 bg-secondary/30 rounded-xl p-1">
            {Object.entries(INFO_CONTENT).map(([key, val]) => (
              <button
                key={key}
                onClick={() => navigate(`/info/${key}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeSection === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {val.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-10"
        >
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">
              {content.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          {content.content}
        </motion.div>
      </div>
    </div>
  );
}
