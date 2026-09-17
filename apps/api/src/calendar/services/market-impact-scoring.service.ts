import { Injectable } from '@nestjs/common';
import { CalendarImpact, CalendarImportance, MarketCalendarCategory } from '../interfaces/calendar.interface';

interface IndicatorRule {
    pattern: RegExp;
    score: number;
    impact: CalendarImpact;
    category: MarketCalendarCategory;
    canonicalKey: string;
    affectedAssets: string[];
    expectedEffectHigher?: string;
    expectedEffectLower?: string;
}

@Injectable()
export class MarketImpactScoringService {
    // Reglas de Estados Unidos y Global
    private readonly usRules: IndicatorRule[] = [
        // 1. Federal Reserve & Monetary Policy (95 - 100 -> CRITICAL)
        {
            pattern: /(fomc.*rate|fed.*interest rate|federal funds rate|interest rate decision|decisión de tasas)/i,
            score: 100,
            impact: 'CRITICAL',
            category: 'MONETARY_POLICY',
            canonicalKey: 'fomc_rate_decision',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Una tasa mayor fortalece al dólar y presiona las valoraciones bursátiles.',
            expectedEffectLower: 'Una tasa menor suele impulsar a las acciones y reducir el costo de endeudamiento.',
        },
        {
            pattern: /(fomc statement|fomc minutes|powell speech|powell testimony|discurso de powell|minutas fed)/i,
            score: 95,
            impact: 'CRITICAL',
            category: 'CENTRAL_BANK',
            canonicalKey: 'fomc_statement',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Un tono hawkish (restrictivo) eleva rendimientos de bonos y presiona activos de riesgo.',
            expectedEffectLower: 'Un tono dovish (acomodaticio) favorece a la renta variable y metales.',
        },
        // 2. Inflation Metrics (80 - 95)
        {
            pattern: /(core cpi|consumer price index.*core|cpi m\/m|cpi y\/y|\bcpi\b|índice de precios al consumidor)/i,
            score: 95,
            impact: 'CRITICAL',
            category: 'INFLATION',
            canonicalKey: 'us_cpi',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Mayor inflación de lo esperado incrementa las expectativas de tasas restrictivas.',
            expectedEffectLower: 'Menor inflación refuerza expectativas de flexibilización monetaria.',
        },
        {
            pattern: /(core pce|pce price index|personal consumption expenditure|gasto en consumo personal)/i,
            score: 95,
            impact: 'CRITICAL',
            category: 'INFLATION',
            canonicalKey: 'us_pce',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'El indicador predilecto de la Fed: cifras altas sostienen tasas restrictivas.',
            expectedEffectLower: 'Moderación en el PCE acerca posibles recortes de tasa.',
        },
        {
            pattern: /(producer price index|\bppi\b|precios de producción|ipp)/i,
            score: 80,
            impact: 'HIGH',
            category: 'INFLATION',
            canonicalKey: 'us_ppi',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
            expectedEffectHigher: 'Presión en costos mayoristas suele trasladarse a la inflación al consumidor.',
        },
        // 3. Employment (70 - 95)
        {
            pattern: /(nonfarm payrolls|non-farm employment|\bnfp\b|nóminas no agrícolas)/i,
            score: 95,
            impact: 'CRITICAL',
            category: 'EMPLOYMENT',
            canonicalKey: 'us_nfp',
            affectedAssets: ['SPY', 'QQQ', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Fuerte creación de empleo refleja solidez pero aleja bajas de tasas agresivas.',
            expectedEffectLower: 'Menor creación de empleo puede despertar alertas de enfriamiento económico.',
        },
        {
            pattern: /(unemployment rate|tasa de desempleo)/i,
            score: 88,
            impact: 'HIGH',
            category: 'EMPLOYMENT',
            canonicalKey: 'us_unemployment_rate',
            affectedAssets: ['SPY', 'QQQ', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Un desempleo al alza señala enfriamiento en el mercado laboral.',
            expectedEffectLower: 'Un desempleo contenido confirma resistencia económica.',
        },
        {
            pattern: /(initial jobless claims|continuing claims|solicitudes de desempleo)/i,
            score: 70,
            impact: 'HIGH',
            category: 'EMPLOYMENT',
            canonicalKey: 'us_jobless_claims',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
            expectedEffectHigher: 'Aumento en solicitudes semanales sugiere menor tensión en contrataciones.',
        },
        {
            pattern: /(jolts job openings|job openings|ofertas de empleo)/i,
            score: 75,
            impact: 'HIGH',
            category: 'EMPLOYMENT',
            canonicalKey: 'us_jolts',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
        },
        // 4. Growth & GDP (90 -> CRITICAL)
        {
            pattern: /(gdp|gross domestic product|pib)/i,
            score: 90,
            impact: 'CRITICAL',
            category: 'GDP',
            canonicalKey: 'us_gdp',
            affectedAssets: ['SPY', 'QQQ', 'DIA', 'US10Y'],
            expectedEffectHigher: 'Crecimiento del PIB superior al consenso disipa temores de recesión.',
            expectedEffectLower: 'PIB débil refleja desaceleración en la actividad económica.',
        },
        // 5. Consumer & Retail (65 - 80)
        {
            pattern: /(retail sales|ventas minoristas)/i,
            score: 80,
            impact: 'HIGH',
            category: 'CONSUMER',
            canonicalKey: 'us_retail_sales',
            affectedAssets: ['SPY', 'XLY', 'DIA'],
            expectedEffectHigher: 'Consumo sólido impulsa balances corporativos pero mantiene presión de demanda.',
        },
        {
            pattern: /(consumer confidence|consumer sentiment|michigan consumer|confianza del consumidor)/i,
            score: 65,
            impact: 'MEDIUM',
            category: 'CONSUMER',
            canonicalKey: 'us_consumer_sentiment',
            affectedAssets: ['SPY', 'QQQ'],
        },
        // 6. Manufacturing & Housing (55 - 70)
        {
            pattern: /(ism manufacturing|ism services|ism pmi|pmi manufacturero|pmi servicios)/i,
            score: 70,
            impact: 'HIGH',
            category: 'MANUFACTURING',
            canonicalKey: 'us_ism_pmi',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
        },
        {
            pattern: /(housing starts|building permits|existing home sales|inicios de viviendas)/i,
            score: 60,
            impact: 'MEDIUM',
            category: 'HOUSING',
            canonicalKey: 'us_housing',
            affectedAssets: ['ITB', 'VNQ'],
        },
        // 7. Trade & Treasury / Bond Auction (60 - 75)
        {
            pattern: /(trade balance|balanza comercial)/i,
            score: 65,
            impact: 'MEDIUM',
            category: 'TRADE',
            canonicalKey: 'us_trade_balance',
            affectedAssets: ['DXY'],
        },
        {
            pattern: /(10-year note auction|30-year bond auction|treasury auction|subasta del tesoro)/i,
            score: 70,
            impact: 'HIGH',
            category: 'BOND_AUCTION',
            canonicalKey: 'us_bond_auction',
            affectedAssets: ['US10Y', 'TLT'],
        },
    ];

    // Reglas de Argentina (INDEC y BCRA)
    private readonly arRules: IndicatorRule[] = [
        // 1. Inflación IPC INDEC (95 - 98 -> CRITICAL)
        {
            pattern: /(ipc|inflaci[oó]n|precios al consumidor|indec.*ipc)/i,
            score: 95,
            impact: 'CRITICAL',
            category: 'INFLATION',
            canonicalKey: 'ar_ipc',
            affectedAssets: ['AL30', 'GD30', 'MERVAL', 'USDARS', 'LECAPS'],
            expectedEffectHigher: 'Mayor inflación presiona la brecha cambiaria y las tasas reales.',
            expectedEffectLower: 'La desaceleración de precios consolida la estabilidad cambiaria y favorece bonos.',
        },
        // 2. Política Monetaria & Tasas BCRA (95 -> CRITICAL)
        {
            pattern: /(bcra.*tasa|tasa.*bcra|tasa de inter[eé]s|pol[íi]tica monetaria|decisi[oó]n.*bcra)/i,
            score: 95,
            impact: 'CRITICAL',
            category: 'MONETARY_POLICY',
            canonicalKey: 'ar_bcra_rate',
            affectedAssets: ['AL30', 'GD30', 'MERVAL', 'LECAPS', 'USDARS'],
            expectedEffectHigher: 'Tasas reales positivas atraen colocaciones en pesos y contienen el dólar.',
            expectedEffectLower: 'Bajas de tasa estimulan el crédito pero pueden impulsar dolarización.',
        },
        // 3. Actividad Económica EMAE / PIB (85 -> HIGH)
        {
            pattern: /(emae|estimador mensual de actividad|pib argentina|actividad econ[oó]mica)/i,
            score: 85,
            impact: 'HIGH',
            category: 'GDP',
            canonicalKey: 'ar_emae_gdp',
            affectedAssets: ['MERVAL', 'GGAL', 'YPF'],
            expectedEffectHigher: 'Recuperación de actividad tracciona ingresos bancarios y corporativos.',
        },
        // 4. Reservas Internacionales BCRA (88 -> HIGH)
        {
            pattern: /(reservas.*bcra|reservas internacionales|compras netas bcra)/i,
            score: 88,
            impact: 'HIGH',
            category: 'CENTRAL_BANK',
            canonicalKey: 'ar_bcra_reserves',
            affectedAssets: ['AL30', 'GD30', 'USDARS'],
            expectedEffectHigher: 'Acumulación de reservas fortalece la capacidad de pago soberana.',
        },
        // 5. Resultado Fiscal (85 -> HIGH)
        {
            pattern: /(resultado fiscal|super[aá]vit fiscal|super[aá]vit primario|d[eé]ficit fiscal)/i,
            score: 85,
            impact: 'HIGH',
            category: 'FISCAL',
            canonicalKey: 'ar_fiscal_balance',
            affectedAssets: ['AL30', 'GD30', 'MERVAL'],
            expectedEffectHigher: 'Consolidación del superávit financiero refuerza la confianza en la economía.',
        },
        // 6. Balanza Comercial ICA (75 -> HIGH)
        {
            pattern: /(balanza comercial|super[aá]vit comercial|ica indec)/i,
            score: 75,
            impact: 'HIGH',
            category: 'TRADE',
            canonicalKey: 'ar_trade_balance',
            affectedAssets: ['AL30', 'USDARS'],
        },
        // 7. Desempleo y Salarios (70 -> HIGH)
        {
            pattern: /(desempleo|tasa de desocupaci[oó]n|ripte|salarios)/i,
            score: 70,
            impact: 'HIGH',
            category: 'EMPLOYMENT',
            canonicalKey: 'ar_employment',
            affectedAssets: ['MERVAL'],
        },
    ];

    // Reglas de Eventos Corporativos y Keynotes (Apple, Nvidia, Tesla, Microsoft, etc.)
    private readonly corporateRules: IndicatorRule[] = [
        {
            pattern: /(apple.*event|apple.*keynote|iphone.*launch|wwdc|presentaci[oó]n.*apple)/i,
            score: 88,
            impact: 'HIGH',
            category: 'CORPORATE_EVENT',
            canonicalKey: 'corp_apple_keynote',
            affectedAssets: ['AAPL', 'QQQ'],
        },
        {
            pattern: /(nvidia.*gtc|nvidia.*keynote|computex.*nvidia|presentaci[oó]n.*nvidia)/i,
            score: 88,
            impact: 'HIGH',
            category: 'CORPORATE_EVENT',
            canonicalKey: 'corp_nvda_keynote',
            affectedAssets: ['NVDA', 'SMH', 'QQQ'],
        },
        {
            pattern: /(tesla.*investor day|tesla.*robotaxi|we robot|tesla.*ai day)/i,
            score: 85,
            impact: 'HIGH',
            category: 'CORPORATE_EVENT',
            canonicalKey: 'corp_tsla_event',
            affectedAssets: ['TSLA', 'QQQ'],
        },
        {
            pattern: /(shareholder meeting|asamblea de accionistas)/i,
            score: 70,
            impact: 'HIGH',
            category: 'SHAREHOLDER_MEETING',
            canonicalKey: 'corp_shareholder_meeting',
            affectedAssets: ['SPY'],
        },
        {
            pattern: /(dividend|dividendo|ex-dividend)/i,
            score: 60,
            impact: 'MEDIUM',
            category: 'DIVIDEND',
            canonicalKey: 'corp_dividend',
            affectedAssets: ['SPY'],
        },
        {
            pattern: /(ipo|salida a bolsa)/i,
            score: 75,
            impact: 'HIGH',
            category: 'IPO',
            canonicalKey: 'corp_ipo',
            affectedAssets: ['SPY'],
        },
    ];

    /**
     * Evalúa el impacto, categoría y activos afectados de un evento según título, país y ticker.
     */
    evaluateEvent(title: string, country: string, ticker?: string): {
        score: number;
        impact: CalendarImpact;
        importance: CalendarImportance;
        category: MarketCalendarCategory;
        canonicalKey: string;
        affectedAssets: string[];
        expectedEffect?: string;
    } {
        const cleanCountry = (country || 'US').toUpperCase();

        // 1. Revisar reglas corporativas si tiene ticker o palabras clave corporativas
        for (const rule of this.corporateRules) {
            if (rule.pattern.test(title)) {
                return {
                    score: rule.score,
                    impact: rule.impact,
                    importance: rule.impact,
                    category: rule.category,
                    canonicalKey: rule.canonicalKey,
                    affectedAssets: ticker ? [ticker, ...rule.affectedAssets] : rule.affectedAssets,
                    expectedEffect: rule.expectedEffectHigher,
                };
            }
        }

        // 2. Si es una empresa prioritaria presentando resultados o evento
        const megaCaps = new Set(['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'BRK.B', 'JPM']);
        if (ticker && megaCaps.has(ticker.toUpperCase())) {
            return {
                score: 90,
                impact: 'CRITICAL',
                importance: 'CRITICAL',
                category: 'EARNINGS',
                canonicalKey: `corp_earnings_${ticker.toLowerCase()}`,
                affectedAssets: [ticker.toUpperCase(), 'SPY', 'QQQ'],
                expectedEffect: `Resultados trimestrales de ${ticker.toUpperCase()} con alto impacto en el índice S&P 500 y Nasdaq.`,
            };
        }

        // 3. Evaluar reglas macro según país
        const rules = cleanCountry === 'AR' ? this.arRules : this.usRules;
        for (const rule of rules) {
            if (rule.pattern.test(title)) {
                return {
                    score: rule.score,
                    impact: rule.impact,
                    importance: rule.impact,
                    category: rule.category,
                    canonicalKey: rule.canonicalKey,
                    affectedAssets: rule.affectedAssets,
                    expectedEffect: rule.expectedEffectHigher,
                };
            }
        }

        // 4. Fallback si no encaja con ninguna regla
        return {
            score: 40,
            impact: 'MEDIUM',
            importance: 'MEDIUM',
            category: 'MACROECONOMIC',
            canonicalKey: this.normalizeTitle(title).substring(0, 32),
            affectedAssets: cleanCountry === 'AR' ? ['MERVAL'] : ['SPY'],
        };
    }

    /**
     * Convierte un puntaje 0-100 en un nivel de impacto formal.
     */
    scoreToImpact(score: number): CalendarImpact {
        if (score >= 90) return 'CRITICAL';
        if (score >= 70) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Normaliza un título para comparaciones y deduplicación.
     */
    normalizeTitle(rawTitle: string): string {
        return (rawTitle || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Genera un fingerprint canónico único para evitar duplicados entre múltiples fuentes.
     * country + date + canonical_key + ticker
     */
    generateFingerprint(country: string, date: string, title: string, ticker?: string): string {
        const cleanCountry = (country || 'US').toUpperCase().trim();
        const cleanDate = (date || '').substring(0, 10).trim();
        const evalRes = this.evaluateEvent(title, cleanCountry, ticker);
        const slug = evalRes.canonicalKey || this.normalizeTitle(title).replace(/\s+/g, '_').substring(0, 32);
        const comp = ticker ? `_${ticker.toUpperCase().trim()}` : '';
        return `${cleanCountry}_${cleanDate}_${slug}${comp}`;
    }

    /**
     * Jerarquía de prioridad de fuentes:
     * 1: Fuente oficial (BLS, FED, FOMC, INDEC, BCRA, BEA, Census, Treasury, SEC)
     * 2: API Financiera confiable (FMP, Finnhub, Alpha Vantage, FRED, Trading Economics)
     * 3: TradingView
     * 4: Investing.com
     * 5: Otras fuentes / Manual
     */
    getSourcePriority(sourceName?: string): number {
        if (!sourceName) return 5;
        const norm = sourceName.toUpperCase();
        if (/(BLS|FED|FOMC|FEDERAL RESERVE|INDEC|BCRA|BEA|CENSUS|TREASURY|SEC|OFICIAL)/.test(norm)) {
            return 1;
        }
        if (/(FINANCIAL MODELING PREP|FMP|FINNHUB|ALPHA VANTAGE|FRED|TRADING ECONOMICS)/.test(norm)) {
            return 2;
        }
        if (/(TRADINGVIEW|TV)/.test(norm)) {
            return 3;
        }
        if (/(INVESTING)/.test(norm)) {
            return 4;
        }
        return 5;
    }

    /**
     * Deduplicación retrocompatible para comparar dos eventos.
     */
    isDuplicateEvent(
        eventA: { country: string; date: string; title: string; ticker?: string },
        eventB: { country: string; date: string; title: string; ticker?: string }
    ): boolean {
        const fpA = this.generateFingerprint(eventA.country, eventA.date, eventA.title, eventA.ticker);
        const fpB = this.generateFingerprint(eventB.country, eventB.date, eventB.title, eventB.ticker);
        return fpA === fpB;
    }
}

