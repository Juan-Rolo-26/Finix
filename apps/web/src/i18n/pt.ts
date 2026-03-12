export const pt = {
    common: {
        loading: 'Carregando...',
        error: 'Algo deu errado',
        tryAgain: 'Tentar novamente',
        refresh: 'Atualizar',
        search: 'Buscar',
        viewAll: 'Ver tudo',
        analyzing: 'Analisando...'
    },
    nav: {
        dashboard: 'Dashboard',
        portfolio: 'Portfólio',
        market: 'Mercado',
        analysis: 'Análise',
        news: 'Notícias',
        profile: 'Perfil',
        settings: 'Configurações',
        logout: 'Sair'
    },
    analysis: {
        title: 'Análise Fundamental Pro',
        subtitle: 'Obtenha um raio-X financeiro completo de qualquer ativo. Pontuação proprietária, índices chave e análise com IA.',
        searchPlaceholder: 'Buscar ticker (ex: AAPL, TSLA, BTC)...',
        analyzeBtn: 'Analisar',
        analyzeNow: 'Analisar Agora',
        lastUpdated: 'Última atualização',
        refreshResults: 'Atualizar Análise',
        finixScore: 'Pontuação Finix',
        quantAlgorithm: 'Algoritmo Quant baseado em 5 pilares chave',
        aiInterpretation: 'Interpretação IA',
        fullReport: 'Relatório Completo',
        overview: 'Visão Geral',
        valuation: 'Valuation',
        profitability: 'Rentabilidade',
        growth: 'Crescimento',
        solidity: 'Solidez',
        risk: 'Risco',
        keyStrengths: 'Fortalezas Chave',
        keyRisks: 'Principais Riscos',
        competitiveAdvantages: 'Vantagens Competitivas',
        mainRisks: 'Principais Riscos',
        sectorContext: 'Contexto do Setor',
        finalVerdict: 'Veredito Final',
        metrics: {
            pe: 'Ratio P/L',
            peDesc: 'Preço sobre Lucro',
            eps: 'LPA',
            epsDesc: 'Lucro por Ação',
            forwardPe: 'P/L Futuro',
            ps: 'Ratio P/S',
            pb: 'Ratio P/VPA',
            evEbitda: 'EV/EBITDA',
            roe: 'ROE',
            roeDesc: 'Retorno sobre Patrimônio',
            roa: 'ROA',
            netMargin: 'Margem Líquida',
            opMargin: 'Margem Operacional',
            grossMargin: 'Margem Bruta',
            revGrowth3Y: 'Cresc. Receita (3A)',
            revGrowth5Y: 'Cresc. Receita (5A)',
            epsGrowth: 'Cresc. LPA',
            debtEquity: 'Dívida/Capital',
            currentRatio: 'Liquidez Corrente',
            quickRatio: 'Liquidez Seca',
            freeCashFlow: 'Fluxo Caixa Livre',
            beta: 'Beta',

            descriptions: {
                vsSector: 'vs Média do Setor',
                annualized: 'Anualizado',
                volatility: 'Volatilidade',
                leverage: 'Ratio de Alavancagem',
                liquidity: 'Liquidez',
                acidTest: 'Teste Ácido',
                cashGen: 'Geração de Caixa',
                target: 'Alvo',
                priceToEarnings: 'Preço sobre Lucro',
                estFuturePe: 'P/L Futuro Est.',
                priceToSales: 'Preço sobre Vendas',
                priceToBook: 'Preço sobre Valor Patrimonial',
                enterpriseValue: 'Valor da Empresa',
                returnOnEquity: 'Retorno sobre Patrimônio',
                returnOnAssets: 'Retorno sobre Ativos',
                netProfitMargin: 'Margem de Lucro Líquido',
                operatingMargin: 'Margem Operacional',
                grossProfitMargin: 'Margem Bruta',
                cagr3y: 'CAGR 3 Anos',
                cagr5y: 'CAGR 5 Anos',
                earningsGrowth: 'Crescimento de Lucros'
            }
        },
        chartPlaceholder: 'Gráfico de Crescimento Histórico',
        noSectorData: 'Dados de comparação do setor não disponíveis.',
        scores: {
            verySolid: 'MUITO SÓLIDO',
            solid: 'SÓLIDO',
            neutral: 'NEUTRO',
            weak: 'FRACO'
        },
        errors: {
            unavailable: 'Análise Indisponível',
            fetchError: 'Não foi possível carregar as informações. Tente novamente.'
        },
        viewOnInvesting: 'Ver no Investing.com'
    },
    settings: {
        title: 'Configurações',
        subtitle: 'Gerencie sua conta, privacidade, preferências do app e segurança.',
        tabs: {
            account: 'Conta',
            privacy: 'Privacidade',
            preferences: 'Preferências',
            security: 'Segurança'
        },
        account: {
            subtitle: 'Informações da conta e perfil público.',
            username: 'Nome de usuário',
            usernamePlaceholder: 'Seu nome de usuário',
            email: 'Email',
            titleProf: 'Título profissional',
            titlePlaceholder: 'Ex: Analista de Investimentos',
            company: 'Empresa',
            location: 'Localização',
            yearsExp: 'Anos de experiência',
            website: 'Site',
            bioShort: 'Biografia curta',
            bioLong: 'Biografia completa',
            avatarUrl: 'URL do avatar',
            bannerUrl: 'URL do banner',
            saveBtn: 'Salvar Conta'
        },
        privacy: {
            subtitle: 'Defina quais informações públicas os outros podem ver.',
            publicProfile: 'Perfil público',
            publicProfileDesc: 'Permite que outros usuários encontrem e vejam seu perfil.',
            showPortfolio: 'Mostrar portfólio',
            showPortfolioDesc: 'Exibe a composição da sua carteira no perfil público.',
            showStats: 'Mostrar estatísticas',
            showStatsDesc: 'Publica métricas agregadas como rentabilidade e risco.',
            acceptFollowers: 'Aceitar seguidores',
            acceptFollowersDesc: 'Permite que outros usuários te sigam para ver suas publicações.',
            saveBtn: 'Salvar Privacidade'
        },
        preferences: {
            subtitle: 'Essas preferências são salvas automaticamente.',
            autoRefresh: 'Atualização automática de mercado',
            autoRefreshDesc: 'Mantém os widgets de mercado atualizados automaticamente.',
            compactTables: 'Tabelas compactas',
            compactTablesDesc: 'Reduz o espaçamento nas tabelas para ver mais informações.',
            advancedMetrics: 'Métricas avançadas',
            advancedMetricsDesc: 'Mostra indicadores técnicos e métricas estendidas quando disponível.'
        },
        security: {
            subtitle: 'Atualize sua senha para proteger sua conta.',
            currentPwd: 'Senha atual',
            newPwd: 'Nova senha',
            confirmPwd: 'Confirmar nova senha',
            minChars: 'Requisito mínimo: 8 caracteres.',
            updateBtn: 'Atualizar Senha'
        },
        language: 'Idioma da Interface',
        currency: 'Moeda Padrão',
        theme: 'Tema',
        notifications: 'Notificações',
        save: 'Salvar Alterações',
        cancel: 'Cancelar'
    },
    auth: {
        welcomeTitle: 'Bem-vindo ao Futuro',
        welcomeSubtitle: 'Financeiro Social',
        welcomeBack: 'Junte-se à comunidade de investidores mais inteligente. Compartilhe ideias, analise mercados e aumente seu portfólio com ferramentas profissionais.',
        transparency: 'Transparência',
        marketAccess: 'Acesso ao Mercado',
        backHome: 'Voltar ao Início',
        loginTitle: 'Iniciar Sessão',
        registerTitle: 'Criar Conta',
        forgotTitle: 'Recuperar Senha',
        loginDesc: 'Insira suas credenciais para continuar',
        registerDesc: 'Registre-se gratuitamente em menos de 1 minuto',
        forgotDesc: 'Enviaremos um código para o seu e-mail',
        emailSentTitle: 'E-mail Enviado!',
        emailSentDesc: 'Enviamos um código de recuperação para',
        checkInbox: 'Por favor, verifique sua caixa de entrada.',
        backLogin: 'Voltar ao Login',
        username: 'Nome de usuário',
        email: 'E-mail',
        password: 'Senha',
        forgotPassword: 'Esqueceu sua senha?',
        loginBtn: 'Entrar',
        createAccountBtn: 'Criar Conta',
        sendLinkBtn: 'Enviar Código',
        orContinue: 'Ou continue com',
        noAccount: 'Não tem uma conta?',
        register: 'Registre-se',
        hasAccount: 'Já tem uma conta?',
        login: 'Inicie Sessão',
        backToLogin: 'Voltar ao Login',
        errors: {
            googleNotConfigured: 'Login com Google ainda não configurado. Use e-mail e senha.',
            invalidCredentials: 'O e-mail ou a senha estão incorretos.',
            connectionError: 'Não foi possível conectar ao servidor. Verifique se a API está ativa.'
        }
    },
    landing: {
        hero: {
            welcome: 'Bem-vindo ao',
            subtitle: 'A plataforma onde investir se torna',
            social: 'social',
            simple: 'simples',
            powerful: 'poderosa',
            desc: 'Analise mercados, compartilhe ideias e conecte-se com investidores.',
            startFree: 'Começar Grátis',
            progress: 'Progresso',
            progressDesc: 'Potencialize seu capital a longo prazo',
            community: 'Comunidade',
            communityDesc: 'Aprenda com investidores reais',
            criteria: 'Critério',
            criteriaDesc: 'Tome decisões fundamentadas',
            discoverMore: 'Descubra mais'
        },
        mvp: {
            transparency: 'Transparência Total',
            whatIs: 'O que é um',
            desc: 'Você está vendo nossa versão "Minimum Viable Product". Não é o fim, é apenas o começo explosivo.',
            cards: {
                construction: {
                    title: 'Em Construção Ativa',
                    desc: 'Lançamos as funções nucleares para você operar JÁ. Enquanto usa o Finix, estamos programando as funções de amanhã.'
                },
                voice: {
                    title: 'Sua Voz Manda',
                    desc: 'Não adivinhamos o que você quer. Construímos com base no que VOCÊ pede. Você é co-criador desta revolução.'
                },
                iteration: {
                    title: 'Iteração Rápida',
                    desc: 'Esqueça atualizações anuais. Aqui você verá melhorias, correções e novas ferramentas toda semana.'
                }
            },
            feedback: {
                title: 'Encontrou um bug ou tem uma ideia?',
                desc: 'Seu feedback vale ouro. Reporte erros ou sugira recursos e receba insígnias exclusivas de "Early Adopter" no seu perfil.',
                btn: 'Enviar Feedback'
            }
        },
        features: {
            pill: 'Tudo o que você precisa',
            title: '5 Pilares do',
            subtitle: 'Uma plataforma completa que combina o melhor das redes sociais com ferramentas financeiras profissionais',
            cards: {
                socialFeed: {
                    title: 'Feed Social Financeiro',
                    desc: 'Como Instagram, mas com conteúdo financeiro. Ideias de trading, análise técnica, gráficos incorporados e opiniões da comunidade.'
                },
                smartPortfolios: {
                    title: 'Portfólios Inteligentes',
                    desc: 'Gerencie seus investimentos, compare rendimentos, simule operações e compartilhe sua estratégia com outros investidores.'
                },
                smartNews: {
                    title: 'Notícias Inteligentes',
                    desc: 'Notícias curadas por IA que resumem eventos-chave, explicam impactos no mercado e geram alertas personalizados.'
                },
                techAnalysis: {
                    title: 'Análise Técnica Avançada',
                    desc: 'TradingView integrado com ferramentas profissionais: Fibonacci, RSI, MACD e análise automática gerada por IA.'
                },
                proProfiles: {
                    title: 'Perfis Profissionais',
                    desc: 'Mostre sua estratégia, portfólio, desempenho histórico e conecte-se com investidores com ideias semelhantes.'
                },
                academy: {
                    title: 'Academia e Webinars',
                    desc: 'Sessões ao vivo, trilhas de aprendizado e workshops com especialistas para melhorar suas habilidades.'
                }
            },
            social: {
                comments: 'Comentários',
                likes: 'Likes',
                share: 'Compartilhar',
                security: 'Segurança',
                realtime: 'Tempo Real'
            }
        },
        steps: {
            pill: 'Simples e Rápido',
            title: 'Comece em',
            titleSuffix: '4 Passos',
            subtitle: 'Junte-se à comunidade financeira mais ativa em minutos',
            cards: {
                step1: {
                    title: 'Crie sua Conta',
                    desc: 'Registre-se gratuitamente em segundos com seu e-mail ou redes sociais. Sem cartão de crédito.'
                },
                step2: {
                    title: 'Configure seu Perfil',
                    desc: 'Defina sua estratégia de investimento, interesses e nível de experiência para personalizar seu feed.'
                },
                step3: {
                    title: 'Carregue seu Portfólio',
                    desc: 'Importe suas posições manualmente ou conecte sua corretora para sincronizar automaticamente.'
                },
                step4: {
                    title: 'Conecte e Aprenda',
                    desc: 'Siga investidores de sucesso, compartilhe suas ideias e aprenda com a comunidade em tempo real.'
                }
            },
            ready: 'Pronto para começar? O processo completo leva menos de',
            time: '2 minutos',
            cta: 'Criar Minha Conta Grátis'
        },
        showcase: {
            pill: 'Pré-visualização',
            title: 'Experiência do',
            titleSuffix: 'Usuário',
            subtitle: 'Projetada para que qualquer investidor possa navegar com facilidade',
            feedTitle: 'Feed em Tempo Real',
            feedSubtitle: 'Ideias da comunidade',
            sharedAnalysis: 'compartilhou análise',
            postedIdea: 'publicou ideia',
            updatedPortfolio: 'atualizou portfólio',
            myPortfolio: 'Meu Portfólio',
            realtimePerformance: 'Desempenho em tempo real',
            totalValue: 'Valor Total',
            totalGain: 'Ganho Total',
            positions: 'Posições'
        },
        authSection: {
            pill: 'Junte-se à Revolução',
            title: 'Comece sua jornada',
            titleSuffix: 'financeira',
            desc: 'Registre-se ou faça login em segundos. Tudo pronto para você investir e compartilhar sem atrito.',
            benefits: {
                analysis: {
                    title: 'Análise em Tempo Real',
                    desc: 'Acesse gráficos profissionais e análise técnica avançada'
                },
                portfolio: {
                    title: 'Portfólio Seguro',
                    desc: 'Gerencie seus investimentos com criptografia de nível bancário'
                },
                community: {
                    title: 'Comunidade Ativa',
                    desc: 'Conecte-se com investidores e compartilhe estratégias vencedoras'
                }
            },
            cardTitle: 'Bem-vindo ao Finix',
            cardDesc: 'Junte-se à comunidade líder em trading social.',
            register: 'Registrar-se',
            login: 'Iniciar Sessão'
        },
        cta: {
            pill: 'Junte-se à Revolução Financeira',
            title: 'Pronto para investir',
            titleSuffix: 'de forma inteligente?',
            desc: 'Junte-se a milhares de investidores que já estão tomando decisões mais informadas com FINIX',
            features: [
                'Grátis para sempre',
                'Sem cartão de crédito',
                'Configuração em 2 minutos',
                'Comunidade ativa'
            ],
            btn: 'Criar Conta Grátis'
        },
        nav: {
            home: 'Início',
            mvp: 'Sobre MVP',
            pillars: 'Pilares',
            experience: 'Experiência',
            register: 'Registro',
            login: 'Entrar',
            signup: 'Registrar-se',
            investmentSocial: 'Investimento Social'
        },
        footer: {
            desc: 'Plataforma social dedicada à análise e debate financeiro profissional. Conectamos investidores com critério.',
            platform: 'Plataforma',
            about: 'Sobre Finix',
            proCommunity: 'Comunidade PRO',
            rules: 'Regras da Comunidade',
            contact: 'Contato',
            legal: 'Legal',
            privacy: 'Política de Privacidade',
            terms: 'Termos e Condições',
            responsible: 'Uso Responsável',
            copyright: '© 2025 Finix. Todos os direitos reservados.'
        }
    },
    time: {
        justNow: 'agora mesmo',
        minutesAgo: 'há {{count}} min',
        hoursAgo: 'há {{count}} h',
        daysAgo: 'há {{count}} d'
    },
    legal: {
        privacy: 'Política de Privacidade',
        terms: 'Termos e Condições',
        help: 'Ajuda',
        title: 'Legal'
    },
    markets: {
        title: 'Mercados',
        subtitle: 'Análise em tempo real com gráficos do TradingView',
        searchPlaceholder: 'Buscar ativos (ex: AAPL, BTC, EUR/USD)...',
        quickAccess: 'Acesso Rápido',
        noQuote: 'Sem cotação ao vivo',
        tabs: {
            chart: 'Gráfico',
            analysis: 'Análise Técnica',
            overview: 'Visão Geral',
            news: 'Notícias'
        }
    },
    portfolio: {
        title: 'Portfólios',
        subtitle: 'Gerencie seus investimentos profissionalmente',
        deletePortfolio: 'Excluir Portfólio',
        createPortfolio: 'Criar Portfólio',
        createTitle: 'Criar Novo Portfólio',
        createDesc: 'Defina os parâmetros do seu novo portfólio de investimentos',
        form: {
            name: 'Nome',
            namePlaceholder: 'Meu Portfólio de Longo Prazo',
            desc: 'Descrição',
            descPlaceholder: 'Descreva o objetivo deste portfólio...',
            objective: 'Objetivo',
            baseCurrency: 'Moeda Base',
            riskLevel: 'Nível de Risco',
            socialMode: 'Modo Social',
            socialModeDesc: 'Permitir que outros usuários vejam este portfólio',
            realEstate: 'Imóveis',
            realEstateDesc: 'Permitir adicionar ativos imobiliários a este portfólio',
            mainPortfolio: 'Portfólio Principal',
            mainPortfolioDesc: 'Será mostrado por padrão ao abrir a seção',
            cancel: 'Cancelar',
            create: 'Criar Portfólio',
            creating: 'Criando...'
        },
        metrics: {
            totalCapital: 'Capital Total',
            investedAmount: 'Valor Investido',
            currentValue: 'Valor Atual',
            marketValue: 'Valor de Mercado',
            gainLoss: 'Ganho/Perda',
            assets: 'Ativos',
            inPortfolio: 'Em portfólio'
        },
        tabs: {
            assets: 'Ativos',
            movements: 'Movimentos',
            diversification: 'Diversificação',
            advanced: 'Avanzado'
        },
        assets: {
            title: 'Ativos do Portfólio',
            add: 'Adicionar Ativo',
            table: {
                ticker: 'Ticker',
                type: 'Tipo',
                quantity: 'Quantidade',
                invested: 'Investido',
                avgPrice: 'Preço Médio',
                currentPrice: 'Preço Atual',
                variation: 'Variação',
                gain: 'Ganho',
                actions: 'Ações'
            },
            empty: 'Nenhum ativo neste portfólio',
            addFirst: 'Adicionar Primeiro Ativo',
            deleteConfirm: 'Tem certeza de que deseja excluir este ativo?'
        },
        movements: {
            title: 'Histórico de Transações',
            filters: 'Filtros',
            export: 'Exportar',
            table: {
                date: 'Data',
                type: 'Tipo',
                asset: 'Ativo',
                class: 'Classe',
                quantity: 'Quantidade',
                price: 'Preço',
                total: 'Total'
            },
            empty: 'Nenhuma transação registrada'
        },
        deleteConfirm: 'Excluir este portfólio? Esta ação não pode ser desfeita.'
    },
    news: {
        title: 'Notícias Financeiras',
        subtitle: 'Últimas notícias do mercado global com análise de sentimento e tradução automática',
        sentiment: {
            label: 'Sentimento:',
            all: 'Todos',
            positive: 'Positivo',
            neutral: 'Neutro',
            negative: 'Negativo'
        },
        showingResults: 'Mostrando notícias',
        withSentiment: ' com sentimento ',
        updated: 'Atualizado',
        noNews: 'Nenhuma notícia disponível nesta categoria',
        featured: 'Destaques',
        moreNews: 'Mais Notícias',
        readFull: 'Ler artigo completo',
        readMore: 'Ler mais',
        translated: 'Traduzido',
        impact: {
            high: 'Alto Impacto',
            medium: 'Impacto Médio',
            low: 'Baixo Impacto'
        }
    },
    profile: {
        notFound: 'Perfil não encontrado',
        backDashboard: 'Voltar ao Dashboard',
        edit: 'Editar Perfil',
        cancel: 'Cancelar',
        save: 'Salvar',
        follow: 'Seguir',
        following: 'Seguindo',
        changeBanner: 'Alterar Banner',
        experience: 'anos de experiência',
        followers: 'seguidores',
        stats: {
            totalReturn: 'Retorno Total',
            winRate: 'Win Rate',
            risk: 'Risco'
        },
        tabs: {
            overview: 'Visão Geral',
            posts: 'Postagens',
            portfolio: 'Portfólio',
            about: 'Sobre Mim'
        },
        about: {
            specializations: 'Especializações',
            certifications: 'Certificações',
            aboutUser: 'Sobre',
            editInfo: 'Editar Informações Profissionais',
            title: 'Título/Função',
            company: 'Empresa',
            location: 'Localização',
            yearsExperience: 'Anos de Experiência',
            bioLong: 'Bio Estendida',
            website: 'Site',
            accountDetails: 'Detalhes da Conta',
            memberSince: 'Membro desde',
            privatePortfolio: 'Este portfólio é privado',
            privatePortfolioOwn: 'Seu portfólio é privado. Ative-o nas configurações para compartilhá-lo.'
        }
    },
    dashboard: {
        welcome: 'Olá,',
        subtitle: 'Aqui está o resumo do mercado de hoje.',
        newTrade: '+ Novo Trade',
        trends: 'Tendências',
        noTrends: 'Sem tendências ainda.',
        mentions: 'menções',
        premium: {
            title: 'Acesso Premium',
            desc: 'Sinais de trading em tempo real, análise on-chain e acesso ao grupo privado do Discord.',
            btn: 'Melhorar Plano'
        }
    }
}
