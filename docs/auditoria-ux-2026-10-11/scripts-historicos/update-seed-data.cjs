const fs = require('fs');
const path = require('path');
const { Client } = require('/home/juampi26/Finix/node_modules/pg');
const dotenv = require('/home/juampi26/Finix/node_modules/dotenv').parse(fs.readFileSync('/home/juampi26/Finix/apps/api/.env'));

// 1. Define Categories
const SEED_CATEGORIES = [
    {
        name: 'Fundamentos de Inversión',
        slug: 'fundamentos',
        description: 'Conceptos básicos, instrumentos financieros y los pilares para comenzar a invertir con criterio.',
        icon: 'BookOpen',
        order: 1,
        subcategories: [
            { name: 'Primeros Pasos', slug: 'primeros-pasos', description: 'Conceptos iniciales y mentalidad de inversor', order: 1 },
            { name: 'Instrumentos Financieros', slug: 'instrumentos', description: 'Acciones, bonos, CEDEARs, ETFs y fondos', order: 2 },
            { name: 'Principios Financieros', slug: 'principios', description: 'Interés compuesto, inflación y riesgo', order: 3 },
        ],
    },
    {
        name: 'Análisis Fundamental',
        slug: 'analisis-fundamental',
        description: 'Evaluación de modelos de negocio, balances, ratios financieros y valoración intrínseca de empresas.',
        icon: 'BarChart3',
        order: 2,
        subcategories: [
            { name: 'Estados Financieros', slug: 'estados-financieros', description: 'Balance general, estado de resultados y flujos de caja', order: 1 },
            { name: 'Ratios y Múltiplos', slug: 'ratios', description: 'PER, EV/EBITDA, ROIC, ROE y solvencia', order: 2 },
            { name: 'Modelos de Valoración', slug: 'valoracion', description: 'DCF, múltiplos comparables y valor intrínseco', order: 3 },
            { name: 'Calidad del Negocio', slug: 'calidad', description: 'Foso defensivo (Moat), management y asignación de capital', order: 4 },
        ],
    },
    {
        name: 'Análisis Técnico',
        slug: 'analisis-tecnico',
        description: 'Lectura de gráficos de precios, acción del precio, indicadores cuantitativos y psicología de mercado.',
        icon: 'TrendingUp',
        order: 3,
        subcategories: [
            { name: 'Estructura y Tendencias', slug: 'tendencias', description: 'Estructura de mercado, máximos, mínimos y rupturas', order: 1 },
            { name: 'Soportes y Resistencias', slug: 'soportes-resistencias', description: 'Zonas de oferta y demanda, polaridad y niveles clave', order: 2 },
            { name: 'Velas y Patrones', slug: 'velas-patrones', description: 'Lectura de velas japonesas y formaciones chartistas', order: 3 },
            { name: 'Indicadores Técnicos', slug: 'indicadores', description: 'RSI, MACD, Medias Móviles, Bandas de Bollinger, ATR, ADX, VWAP', order: 4 },
        ],
    },
    {
        name: 'Macroeconomía y Mercados',
        slug: 'macroeconomia',
        description: 'Cómo influyen las tasas de interés, la inflación, los bancos centrales y los ciclos globales.',
        icon: 'Landmark',
        order: 4,
        subcategories: [
            { name: 'Variables Macroeconómicas', slug: 'variables-macro', description: 'PIB, inflación, empleo y política monetaria', order: 1 },
            { name: 'Bancos Centrales y Tasas', slug: 'bancos-centrales', description: 'Reserva Federal, BCRA, curva de rendimientos y liquidez', order: 2 },
            { name: 'Mercado Argentino y Global', slug: 'mercados', description: 'Dólar MEP/CCL, riesgo país y activos internacionales', order: 3 },
        ],
    },
    {
        name: 'Estrategias y Gestión del Riesgo',
        slug: 'estrategias',
        description: 'Construcción de carteras, psicología del inversor, Dollar Cost Averaging y preservación de capital.',
        icon: 'ShieldCheck',
        order: 5,
        subcategories: [
            { name: 'Filosofías de Inversión', slug: 'filosofias', description: 'Value investing, growth investing, dividendos y DCA', order: 1 },
            { name: 'Gestión del Riesgo', slug: 'gestion-riesgo', description: 'Diversificación, dimensionamiento de posición, stop loss y drawdown', order: 2 },
            { name: 'Psicología y Sesgos', slug: 'psicologia', description: 'Control de emociones y toma racional de decisiones', order: 3 },
        ],
    },
];

console.log("Categories defined:", SEED_CATEGORIES.length);
