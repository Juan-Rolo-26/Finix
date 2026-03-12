export const es = {
    common: {
        loading: 'Cargando...',
        error: 'Algo salió mal',
        tryAgain: 'Intenta nuevamente',
        refresh: 'Refrescar',
        search: 'Buscar',
        viewAll: 'Ver todo',
        analyzing: 'Analizando...'
    },
    nav: {
        dashboard: 'Inicio',
        portfolio: 'Portafolio',
        market: 'Mercado',
        analysis: 'Análisis',
        news: 'Noticias',
        profile: 'Perfil',
        settings: 'Configuración',
        logout: 'Cerrar Sesión'
    },
    analysis: {
        title: 'Análisis Fundamental Pro',
        subtitle: 'Obtén una radiografía financiera completa de cualquier activo. Scoring propietario, ratios clave y análisis impulsado por IA.',
        searchPlaceholder: 'Buscar ticker (ej: AAPL, TSLA, BTC)...',
        analyzeBtn: 'Analizar',
        analyzeNow: 'Analizar ahora',
        lastUpdated: 'Última actualización',
        refreshResults: 'Actualizar Análisis',
        finixScore: 'Puntaje Finix',
        quantAlgorithm: 'Algoritmo Quant basado en 5 pilares clave',
        aiInterpretation: 'Interpretación IA',
        fullReport: 'Reporte Completo',
        overview: 'Resumen',
        valuation: 'Valuación',
        profitability: 'Rentabilidad',
        growth: 'Crecimiento',
        solidity: 'Solidez',
        risk: 'Riesgo',
        keyStrengths: 'Fortalezas Clave',
        keyRisks: 'Riesgos Clave',
        competitiveAdvantages: 'Ventajas Competitivas',
        mainRisks: 'Principales Riesgos',
        sectorContext: 'Contexto Sectorial',
        finalVerdict: 'Veredicto Final',
        metrics: {
            pe: 'PER (P/E)',
            peDesc: 'Precio sobre Ganancias',
            eps: 'BPA (EPS)',
            epsDesc: 'Beneficio por Acción',
            roe: 'ROE',
            roeDesc: 'Retorno sobre Patrimonio',
            netMargin: 'Margen Neto',
            opMargin: 'Margen Op.',
            debtEquity: 'Deuda/Capital',
            currentRatio: 'Ratio Corriente',
            quickRatio: 'Ratio Rápido',
            freeCashFlow: 'Flujo Caja Libre',

            // Add new keys here
            forwardPe: 'PER Futuro',
            ps: 'P/Ventas (P/S)',
            pb: 'P/Libro (P/B)',
            evEbitda: 'EV/EBITDA',
            roa: 'ROA',
            grossMargin: 'Margen Bruto',
            revGrowth3Y: 'Crec. Ventas 3A',
            revGrowth5Y: 'Crec. Ventas 5A',
            epsGrowth: 'Crec. BPA',
            beta: 'Beta',

            descriptions: {
                vsSector: 'vs Promedio Sector',
                annualized: 'Anualizado',
                volatility: 'Volatilidad',
                leverage: 'Ratio de Apalancamiento',
                liquidity: 'Liquidez',
                acidTest: 'Prueba Ácida',
                cashGen: 'Generación de Caja',
                target: 'Objetivo',
                priceToEarnings: 'Precio sobre Ganancias',
                estFuturePe: 'PER Futuro Est.',
                priceToSales: 'Precio sobre Ventas',
                priceToBook: 'Precio sobre Libros',
                enterpriseValue: 'Valor de Empresa',
                returnOnEquity: 'Retorno sobre Patrimonio',
                returnOnAssets: 'Retorno sobre Activos',
                netProfitMargin: 'Margen de Beneficio Neto',
                operatingMargin: 'Margen Operativo',
                grossProfitMargin: 'Margen Bruto',
                cagr3y: 'CAGR 3 Años',
                cagr5y: 'CAGR 5 Años',
                earningsGrowth: 'Crecimiento de Ganancias'
            }
        },
        chartPlaceholder: 'Gráfico de Crecimiento Histórico',
        noSectorData: 'Datos de comparación sectorial no disponibles.',
        scores: {
            verySolid: 'MUY SÓLIDO',
            solid: 'SÓLIDO',
            neutral: 'NEUTRAL',
            weak: 'DÉBIL'
        },
        errors: {
            unavailable: 'Análisis no disponible',
            fetchError: 'No se pudo cargar la información. Intenta nuevamente.'
        },
        viewOnInvesting: 'Ver en Investing.com'
    },
    settings: {
        title: 'Configuración',
        subtitle: 'Gestioná tu cuenta, privacidad, preferencias de la app y seguridad.',
        tabs: {
            account: 'Cuenta',
            privacy: 'Privacidad',
            preferences: 'Preferencias',
            security: 'Seguridad'
        },
        account: {
            subtitle: 'Información principal de tu cuenta y perfil público.',
            username: 'Usuario',
            usernamePlaceholder: 'Tu nombre de usuario',
            email: 'Correo electronico',
            titleProf: 'Título profesional',
            titlePlaceholder: 'Ej: Analista de mercados',
            company: 'Compañía',
            location: 'Ubicación',
            yearsExp: 'Años de experiencia',
            website: 'Sitio web',
            bioShort: 'Bio corta',
            bioLong: 'Bio extendida',
            avatarUrl: 'URL de avatar',
            bannerUrl: 'URL de banner',
            saveBtn: 'Guardar Cuenta'
        },
        privacy: {
            subtitle: 'Definí qué información pública puede ver el resto de usuarios.',
            publicProfile: 'Perfil público',
            publicProfileDesc: 'Permite que otros usuarios encuentren y vean tu perfil.',
            showPortfolio: 'Mostrar portafolio',
            showPortfolioDesc: 'Expone tu composición de cartera en el perfil público.',
            showStats: 'Mostrar estadísticas',
            showStatsDesc: 'Publica métricas agregadas como rendimiento y riesgo.',
            acceptFollowers: 'Aceptar seguidores',
            acceptFollowersDesc: 'Permite que otros usuarios te sigan para recibir tus publicaciones.',
            saveBtn: 'Guardar Privacidad'
        },
        preferences: {
            subtitle: 'Estas preferencias se guardan automáticamente.',
            autoRefresh: 'Auto refresco de mercado',
            autoRefreshDesc: 'Mantener los widgets de mercado actualizados automáticamente.',
            compactTables: 'Tablas compactas',
            compactTablesDesc: 'Reduce espaciado en tablas para ver más información en pantalla.',
            advancedMetrics: 'Métricas avanzadas visibles',
            advancedMetricsDesc: 'Muestra indicadores técnicos y métricas extendidas cuando estén disponibles.'
        },
        security: {
            subtitle: 'Actualizá tu contraseña para proteger tu cuenta.',
            currentPwd: 'Contraseña actual',
            newPwd: 'Nueva contraseña',
            confirmPwd: 'Confirmar nueva contraseña',
            minChars: 'Requisito mínimo: 8 caracteres.',
            updateBtn: 'Actualizar Contraseña'
        },
        language: 'Idioma',
        currency: 'Moneda',
        theme: 'Tema',
        notifications: 'Notificaciones',
        save: 'Guardar cambios',
        cancel: 'Cancelar'
    },
    auth: {
        welcomeTitle: 'Bienvenido al Futuro',
        welcomeSubtitle: 'Financiero Social',
        welcomeBack: 'Únete a la comunidad de inversores más inteligente. Comparte ideas, analiza mercados y haz crecer tu portafolio con herramientas profesionales.',
        transparency: 'Transparencia',
        marketAccess: 'Acceso al Mercado',
        backHome: 'Volver al Inicio',
        loginTitle: 'Iniciar Sesión',
        registerTitle: 'Crear Cuenta',
        forgotTitle: 'Recuperar Contraseña',
        loginDesc: 'Ingresa tus credenciales para continuar',
        registerDesc: 'Regístrate gratis en menos de 1 minuto',
        forgotDesc: 'Te enviaremos un código a tu correo',
        emailSentTitle: '¡Correo Enviado!',
        emailSentDesc: 'Hemos enviado un código de recuperación a',
        checkInbox: 'Por favor revisa tu bandeja de entrada.',
        backLogin: 'Volver al inicio de sesion',
        username: 'Nombre de usuario',
        email: 'Correo electrónico',
        password: 'Contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?',
        loginBtn: 'Ingresar',
        createAccountBtn: 'Crear Cuenta',
        sendLinkBtn: 'Enviar Código',
        orContinue: 'O continúa con',
        noAccount: '¿No tienes una cuenta?',
        register: 'Regístrate',
        hasAccount: '¿Ya tienes cuenta?',
        login: 'Inicia Sesión',
        backToLogin: 'Volver al Inicio de Sesión',
        errors: {
            googleNotConfigured: 'El acceso con Google no esta configurado todavia. Usa correo y contrasena.',
            invalidCredentials: 'El correo o la contrasena no son correctos.',
            connectionError: 'No se pudo conectar con el servidor. Verifica que la API esté levantada.'
        }
    },
    landing: {
        hero: {
            welcome: 'Bienvenido a',
            subtitle: 'La plataforma donde invertir se vuelve',
            social: 'social',
            simple: 'simple',
            powerful: 'poderosa',
            desc: 'Analiza mercados, comparte ideas y conecta con inversores.',
            startFree: 'Comenzar Gratis',
            progress: 'Progreso',
            progressDesc: 'Potencia tu capital a largo plazo',
            community: 'Comunidad',
            communityDesc: 'Aprende de inversores reales',
            criteria: 'Criterio',
            criteriaDesc: 'Toma decisiones fundamentadas',
            discoverMore: 'Descubre más'
        },
        mvp: {
            transparency: 'Transparencia Total',
            whatIs: '¿Qué es un',
            desc: 'Estás viendo nuestra versión "Minimum Viable Product". No es el final, es solo el comienzo explosivo.',
            cards: {
                construction: {
                    title: 'En Construcción Activa',
                    desc: 'Lanzamos las funciones nucleares para que operes YA. Mientras usas Finix, estamos programando las funciones de mañana.'
                },
                voice: {
                    title: 'Tu Voz Manda',
                    desc: 'No adivinamos qué quieres. Lo construimos basado en lo que TÚ nos pides. Eres co-creador de esta revolución.'
                },
                iteration: {
                    title: 'Iteración Rápida',
                    desc: 'Olvídate de actualizaciones anuales. Aquí verás mejoras, parches y nuevas herramientas cada semana.'
                }
            },
            feedback: {
                title: '¿Encontraste un bug o tienes una idea?',
                desc: 'Tu feedback vale oro. Reporta errores o sugiere features y recibe insignias exclusivas de "Early Adopter" en tu perfil.',
                btn: 'Enviar Feedback'
            }
        },
        features: {
            pill: 'Todo lo que necesitas',
            title: '5 Pilares de',
            subtitle: 'Una plataforma completa que combina lo mejor de las redes sociales con herramientas financieras profesionales',
            cards: {
                socialFeed: {
                    title: 'Comunidad financiera',
                    desc: 'Como Instagram, pero con contenido financiero. Ideas de trading, análisis técnico, gráficos incrustados y opiniones de la comunidad.'
                },
                smartPortfolios: {
                    title: 'Portafolios Inteligentes',
                    desc: 'Gestiona tus inversiones, compara rendimientos, simula operaciones y comparte tu estrategia con otros inversores.'
                },
                smartNews: {
                    title: 'Noticias Inteligentes',
                    desc: 'Noticias curadas por IA que resume eventos clave, explica impactos al mercado y genera alertas personalizadas.'
                },
                techAnalysis: {
                    title: 'Análisis Técnico Avanzado',
                    desc: 'TradingView integrado con herramientas profesionales: Fibonacci, RSI, MACD, y análisis automático generado por IA.'
                },
                proProfiles: {
                    title: 'Perfiles Profesionales',
                    desc: 'Muestra tu estrategia, portafolio, rendimiento histórico y conecta con inversores de ideas similares.'
                },
                academy: {
                    title: 'Academia y Webinars',
                    desc: 'Sesiones en vivo, rutas de aprendizaje y workshops con expertos para mejorar tus habilidades.'
                }
            },
            social: {
                comments: 'Comentarios',
                likes: 'Likes',
                share: 'Compartir',
                security: 'Seguridad',
                realtime: 'Tiempo Real'
            }
        },
        steps: {
            pill: 'Simple y Rápido',
            title: 'Comienza en',
            titleSuffix: '4 Pasos',
            subtitle: 'Únete a la comunidad financiera más activa en minutos',
            cards: {
                step1: {
                    title: 'Crea tu Cuenta',
                    desc: 'Registrate gratis en segundos con tu correo o redes sociales. Sin tarjeta de credito requerida.'
                },
                step2: {
                    title: 'Configura tu Perfil',
                    desc: 'Define tu estrategia de inversion, intereses y nivel de experiencia para personalizar tu inicio.'
                },
                step3: {
                    title: 'Carga tu Portafolio',
                    desc: 'Importa tus posiciones manualmente o conecta tu broker para sincronizar automáticamente.'
                },
                step4: {
                    title: 'Conecta y Aprende',
                    desc: 'Sigue a inversores exitosos, comparte tus ideas y aprende de la comunidad en tiempo real.'
                }
            },
            ready: '¿Listo para empezar? El proceso completo toma menos de',
            time: '2 minutos',
            cta: 'Crear Mi Cuenta Gratis'
        },
        showcase: {
            pill: 'Vista previa',
            title: 'Experiencia de',
            titleSuffix: 'Usuario',
            subtitle: 'Diseñada para que cualquier inversor pueda navegar con facilidad',
            feedTitle: 'Actividad en tiempo real',
            feedSubtitle: 'Ideas de la comunidad',
            sharedAnalysis: 'compartió análisis',
            postedIdea: 'publicó idea',
            updatedPortfolio: 'actualizó portafolio',
            myPortfolio: 'Mi portafolio',
            realtimePerformance: 'Rendimiento en tiempo real',
            totalValue: 'Valor Total',
            totalGain: 'Ganancia Total',
            positions: 'Posiciones'
        },
        authSection: {
            pill: 'Únete a la Revolución',
            title: 'Comienza tu viaje',
            titleSuffix: 'financiero',
            desc: 'Regístrate o inicia sesión en segundos. Todo listo para que inviertas y compartas sin fricción.',
            benefits: {
                analysis: {
                    title: 'Análisis en Tiempo Real',
                    desc: 'Accede a gráficos profesionales y análisis técnico avanzado'
                },
                portfolio: {
                    title: 'Portafolio Seguro',
                    desc: 'Gestiona tus inversiones con encriptación de nivel bancario'
                },
                community: {
                    title: 'Comunidad Activa',
                    desc: 'Conecta con inversores y comparte estrategias ganadoras'
                }
            },
            cardTitle: 'Bienvenido a Finix',
            cardDesc: 'Únete a la comunidad líder en trading social.',
            register: 'Registrarse',
            login: 'Iniciar Sesión'
        },
        cta: {
            pill: 'Únete a la Revolución Financiera',
            title: '¿Listo para invertir',
            titleSuffix: 'de forma inteligente?',
            desc: 'Únete a miles de inversores que ya están tomando decisiones más informadas con FINIX',
            features: [
                'Gratis para siempre',
                'Sin tarjeta de crédito',
                'Configuración en 2 minutos',
                'Comunidad activa'
            ],
            btn: 'Crear Cuenta Gratis'
        },
        nav: {
            home: 'Inicio',
            mvp: 'Sobre MVP',
            pillars: 'Pilares',
            experience: 'Experiencia',
            register: 'Registro',
            login: 'Ingresar',
            signup: 'Registrarse',
            investmentSocial: 'Inversión social'
        },
        footer: {
            desc: 'Plataforma social dedicada al análisis y debate financiero profesional. Conectamos inversores con criterio.',
            platform: 'Plataforma',
            about: 'Sobre Finix',
            proCommunity: 'Comunidad PRO',
            rules: 'Normas de la comunidad',
            contact: 'Contacto',
            legal: 'Legal',
            privacy: 'Política de Privacidad',
            terms: 'Términos y Condiciones',
            responsible: 'Uso Responsable',
            copyright: '© 2025 Finix. Todos los derechos reservados.'
        }
    },
    time: {
        justNow: 'hace un momento',
        minutesAgo: 'hace {{count}} min',
        hoursAgo: 'hace {{count}} h',
        daysAgo: 'hace {{count}} d'
    },
    legal: {
        privacy: 'Política de Privacidad',
        terms: 'Términos y Condiciones',
        help: 'Ayuda',
        title: 'Legal'
    },
    markets: {
        title: 'Mercados',
        subtitle: 'Análisis en tiempo real con gráficos de TradingView',
        searchPlaceholder: 'Buscar activos (ej: AAPL, BTC, EUR/USD)...',
        quickAccess: 'Acceso Rápido',
        noQuote: 'Sin cotización en vivo',
        tabs: {
            chart: 'Gráfico',
            analysis: 'Análisis Técnico',
            overview: 'Resumen',
            news: 'Noticias'
        }
    },
    portfolio: {
        title: 'Portafolios',
        subtitle: 'Gestiona tus inversiones de forma profesional',
        deletePortfolio: 'Eliminar Portafolio',
        createPortfolio: 'Crear Portafolio',
        createTitle: 'Crear Nuevo Portafolio',
        createDesc: 'Define los parámetros de tu nuevo portafolio de inversión',
        form: {
            name: 'Nombre',
            namePlaceholder: 'Mi Portafolio de Largo Plazo',
            desc: 'Descripción',
            descPlaceholder: 'Describe el propósito de este portafolio...',
            objective: 'Objetivo',
            baseCurrency: 'Moneda Base',
            riskLevel: 'Nivel de Riesgo',
            socialMode: 'Modo Social',
            socialModeDesc: 'Permite que otros usuarios vean este portafolio',
            realEstate: 'Bienes Raíces',
            realEstateDesc: 'Permite agregar activos inmobiliarios en este portafolio',
            mainPortfolio: 'Portafolio Principal',
            mainPortfolioDesc: 'Se mostrará por defecto al abrir la sección',
            cancel: 'Cancelar',
            create: 'Crear Portafolio',
            creating: 'Creando...'
        },
        metrics: {
            totalCapital: 'Capital Total',
            investedAmount: 'Monto invertido',
            currentValue: 'Valor Actual',
            marketValue: 'Valor de mercado',
            gainLoss: 'Ganancia/Pérdida',
            assets: 'Activos',
            inPortfolio: 'En portafolio'
        },
        tabs: {
            assets: 'Activos',
            movements: 'Movimientos',
            diversification: 'Diversificación',
            advanced: 'Avanzado'
        },
        assets: {
            title: 'Activos del Portafolio',
            add: 'Agregar Activo',
            table: {
                ticker: 'Ticker',
                type: 'Tipo',
                quantity: 'Cantidad',
                invested: 'Monto Invertido',
                avgPrice: 'PPC',
                currentPrice: 'Precio Actual',
                variation: 'Variación',
                gain: 'Ganancia',
                actions: 'Acciones'
            },
            empty: 'No hay activos en este portafolio',
            addFirst: 'Agregar Primer Activo',
            deleteConfirm: '¿Estás seguro de eliminar este activo?'
        },
        movements: {
            title: 'Historial de Movimientos',
            filters: 'Filtros',
            export: 'Exportar',
            table: {
                date: 'Fecha',
                type: 'Tipo',
                asset: 'Activo',
                class: 'Clase',
                quantity: 'Cantidad',
                price: 'Precio',
                total: 'Total'
            },
            empty: 'No hay movimientos registrados'
        },
        deleteConfirm: '¿Eliminar este portafolio? Esta acción no se puede deshacer.'
    },
    news: {
        title: 'Noticias Financieras',
        subtitle: 'Últimas noticias de mercados globales con análisis de sentimiento y traducción automática',
        sentiment: {
            label: 'Sentimiento:',
            all: 'Todos',
            positive: 'Positivo',
            neutral: 'Neutral',
            negative: 'Negativo'
        },
        showingResults: 'Mostrando noticias',
        withSentiment: ' con sentimiento ',
        updated: 'Actualizado',
        noNews: 'No hay noticias disponibles en esta categoría',
        featured: 'Destacadas',
        moreNews: 'Más Noticias',
        readFull: 'Leer artículo completo',
        readMore: 'Leer más',
        translated: 'Traducido',
        impact: {
            high: 'Alto Impacto',
            medium: 'Impacto Medio',
            low: 'Bajo Impacto'
        }
    },
    profile: {
        notFound: 'Perfil no encontrado',
        backDashboard: 'Volver al inicio',
        edit: 'Editar Perfil',
        cancel: 'Cancelar',
        save: 'Guardar',
        follow: 'Seguir',
        following: 'Siguiendo',
        changeBanner: 'Cambiar Banner',
        experience: 'años de experiencia',
        followers: 'seguidores',
        stats: {
            totalReturn: 'Retorno Total',
            winRate: 'Tasa de acierto',
            risk: 'Riesgo'
        },
        tabs: {
            overview: 'Resumen',
            posts: 'Publicaciones',
            portfolio: 'Portafolio',
            about: 'Sobre Mí'
        },
        about: {
            specializations: 'Especializaciones',
            certifications: 'Certificaciones',
            aboutUser: 'Sobre',
            editInfo: 'Editar Información Profesional',
            title: 'Título/Rol',
            company: 'Empresa',
            location: 'Ubicación',
            yearsExperience: 'Años de Experiencia',
            bioLong: 'Bio Extendida',
            website: 'Sitio Web',
            accountDetails: 'Detalles de la Cuenta',
            memberSince: 'Miembro desde',
            privatePortfolio: 'Este portafolio es privado',
            privatePortfolioOwn: 'Tu portafolio esta privado. Activalo en configuracion para compartirlo.'
        }
    },
    dashboard: {
        welcome: 'Hola,',
        subtitle: 'Aquí está tu resumen del mercado hoy.',
        newTrade: '+ Nueva operacion',
        trends: 'Tendencias',
        noTrends: 'Sin tendencias aún.',
        mentions: 'menciones',
        premium: {
            title: 'Acceso Premium',
            desc: 'Señales de trading en tiempo real, análisis on-chain y acceso al grupo privado de Discord.',
            btn: 'Mejorar Plan'
        }
    }
}
