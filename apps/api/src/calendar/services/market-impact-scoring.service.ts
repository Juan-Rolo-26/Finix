import { Injectable } from '@nestjs/common';
import { CalendarImportance } from '../interfaces/calendar.interface';

interface IndicatorRule {
    pattern: RegExp;
    score: number;
    importance: CalendarImportance;
    category: string;
    affectedAssets: string[];
    expectedEffectHigher?: string;
    expectedEffectLower?: string;
}

@Injectable()
export class MarketImpactScoringService {
    // US Priority Rules
    private readonly usRules: IndicatorRule[] = [
        // Federal Reserve
        {
            pattern: /(fomc.*rate|fed.*interest rate|federal funds rate|interest rate decision)/i,
            score: 100,
            importance: 'HIGH',
            category: 'CENTRAL_BANK',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Una tasa mayor de lo esperado fortalece al dólar y presiona las valoraciones bursátiles.',
            expectedEffectLower: 'Una tasa menor de lo esperado suele impulsar a las acciones y reducir el costo de endeudamiento.',
        },
        {
            pattern: /(fomc statement|fomc minutes|powell speech|powell testimony)/i,
            score: 95,
            importance: 'HIGH',
            category: 'CENTRAL_BANK',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Un tono hawkish (restrictivo) eleva rendimientos de bonos y presiona activos de riesgo.',
            expectedEffectLower: 'Un tono dovish (acomodaticio) favorece a la renta variable y metales preciosos.',
        },
        // Inflation
        {
            pattern: /(core cpi|consumer price index.*core|cpi m\/m|cpi y\/y|cpi)/i,
            score: 95,
            importance: 'HIGH',
            category: 'INFLATION',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Mayor inflación de lo esperado puede aumentar las expectativas de tasas elevadas.',
            expectedEffectLower: 'Menor inflación refuerza expectativas de flexibilización monetaria por parte de la Reserva Federal.',
        },
        {
            pattern: /(core pce|pce price index|personal consumption expenditure)/i,
            score: 92,
            importance: 'HIGH',
            category: 'INFLATION',
            affectedAssets: ['SPY', 'QQQ', 'BTC', 'GOLD', 'US10Y', 'DXY'],
            expectedEffectHigher: 'El indicador predilecto de la Fed: cifras altas sostienen tasas restrictivas.',
            expectedEffectLower: 'Moderación en el PCE acerca posibles recortes de tasa de interés.',
        },
        // Employment
        {
            pattern: /(nonfarm payrolls|non-farm employment|nfp)/i,
            score: 95,
            importance: 'HIGH',
            category: 'EMPLOYMENT',
            affectedAssets: ['SPY', 'QQQ', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Fuerte creación de empleo refleja solidez económica pero retrasa bajas de tasas.',
            expectedEffectLower: 'Menor creación de empleo puede despertar alertas de desaceleración económica.',
        },
        {
            pattern: /(unemployment rate)/i,
            score: 88,
            importance: 'HIGH',
            category: 'EMPLOYMENT',
            affectedAssets: ['SPY', 'QQQ', 'US10Y', 'DXY'],
            expectedEffectHigher: 'Un desempleo al alza señala enfriamiento en el mercado laboral.',
            expectedEffectLower: 'Un desempleo contenido confirma resistencia económica.',
        },
        {
            pattern: /(initial jobless claims|continuing claims)/i,
            score: 75,
            importance: 'MEDIUM',
            category: 'EMPLOYMENT',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
            expectedEffectHigher: 'Aumento en solicitudes semanales sugiere menor tensión en contrataciones.',
        },
        {
            pattern: /(jolts job openings|job openings)/i,
            score: 75,
            importance: 'MEDIUM',
            category: 'EMPLOYMENT',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
        },
        // Economic Activity & Growth
        {
            pattern: /(gdp|gross domestic product|pib)/i,
            score: 90,
            importance: 'HIGH',
            category: 'ACTIVITY',
            affectedAssets: ['SPY', 'QQQ', 'DIA', 'US10Y'],
            expectedEffectHigher: 'Crecimiento del PIB superior al consenso disipa temores de recesión.',
            expectedEffectLower: 'PIB débil refleja desaceleración en la actividad económica general.',
        },
        {
            pattern: /(retail sales|ventas minoristas)/i,
            score: 75,
            importance: 'MEDIUM',
            category: 'ACTIVITY',
            affectedAssets: ['SPY', 'XLY', 'DIA'],
            expectedEffectHigher: 'Consumo sólido impulsa resultados corporativos pero mantiene presión de demanda.',
        },
        {
            pattern: /(ism manufacturing|ism services|ism pmi|pmi manufacturero)/i,
            score: 70,
            importance: 'MEDIUM',
            category: 'ACTIVITY',
            affectedAssets: ['SPY', 'QQQ', 'US10Y'],
        },
        {
            pattern: /(consumer confidence|consumer sentiment|michigan consumer)/i,
            score: 65,
            importance: 'MEDIUM',
            category: 'ACTIVITY',
            affectedAssets: ['SPY', 'QQQ'],
        },
        {
            pattern: /(housing starts|building permits|existing home sales)/i,
            score: 55,
            importance: 'LOW',
            category: 'ACTIVITY',
            affectedAssets: ['ITB', 'VNQ'],
        },
    ];

    // Argentina Priority Rules
    private readonly arRules: IndicatorRule[] = [
        // Inflation (IPC)
        {
            pattern: /(ipc|inflaci[oó]n|precios al consumidor|indec.*ipc)/i,
            score: 98,
            importance: 'HIGH',
            category: 'INFLATION',
            affectedAssets: ['AL30', 'GD30', 'MERVAL', 'USDARS', 'LECAPS'],
            expectedEffectHigher: 'Una inflación mayor a la estimada presiona la brecha cambiaria y las tasas reales.',
            expectedEffectLower: 'La desaceleración de precios consolida la estabilidad cambiaria y favorece bonos soberanos.',
        },
        // BCRA Decisions & Interest Rate
        {
            pattern: /(bcra.*tasa|tasa.*bcra|tasa de inter[eé]s|pol[íi]tica monetaria|decisi[oó]n.*bcra)/i,
            score: 95,
            importance: 'HIGH',
            category: 'CENTRAL_BANK',
            affectedAssets: ['AL30', 'GD30', 'MERVAL', 'LECAPS', 'USDARS'],
            expectedEffectHigher: 'Tasas reales positivas atraen colocaciones en pesos y contienen el tipo de cambio financiero.',
            expectedEffectLower: 'Bajas de tasa estimulan el crédito pero pueden impulsar dolarización de carteras.',
        },
        // Reservas Internacionales
        {
            pattern: /(reservas.*bcra|reservas internacionales|compras netas bcra)/i,
            score: 88,
            importance: 'HIGH',
            category: 'CENTRAL_BANK',
            affectedAssets: ['AL30', 'GD30', 'USDARS'],
            expectedEffectHigher: 'Acumulación de reservas fortalece la capacidad de pago de deuda soberana.',
        },
        // Actividad económica (EMAE / PIB)
        {
            pattern: /(emae|estimador mensual de actividad|pib argentina|actividad econ[oó]mica)/i,
            score: 85,
            importance: 'HIGH',
            category: 'ACTIVITY',
            affectedAssets: ['MERVAL', 'GGAL', 'YPF'],
            expectedEffectHigher: 'Recuperación de la actividad tracciona ingresos del sector bancario y corporativo.',
        },
        // Balanza comercial / Fiscal
        {
            pattern: /(balanza comercial|super[aá]vit comercial|ica indec)/i,
            score: 75,
            importance: 'MEDIUM',
            category: 'TRADE',
            affectedAssets: ['AL30', 'USDARS'],
        },
        {
            pattern: /(resultado fiscal|super[aá]vit fiscal|super[aá]vit primario|d[eé]ficit fiscal)/i,
            score: 85,
            importance: 'HIGH',
            category: 'FISCAL',
            affectedAssets: ['AL30', 'GD30', 'MERVAL'],
            expectedEffectHigher: 'Consolidación del superávit financiero refuerza la confianza en el programa económico.',
        },
        // Desempleo y Salarios
        {
            pattern: /(desempleo|tasa de desocupaci[oó]n|ripte|salarios)/i,
            score: 75,
            importance: 'MEDIUM',
            category: 'EMPLOYMENT',
            affectedAssets: ['MERVAL'],
        },
        {
            pattern: /(producci[oó]n industrial|ipi manufacturero)/i,
            score: 65,
            importance: 'MEDIUM',
            category: 'ACTIVITY',
            affectedAssets: ['TXAR', 'ALUA', 'MERVAL'],
        },
    ];

    /**
     * Calcula el score de impacto y metadatos de un evento económico según país y título.
     */
    evaluateEvent(title: string, country: string): {
        score: number;
        importance: CalendarImportance;
        category: string;
        affectedAssets: string[];
        expectedEffect?: string;
    } {
        const cleanCountry = country.toUpperCase();
        const rules = cleanCountry === 'AR' ? this.arRules : this.usRules;

        for (const rule of rules) {
            if (rule.pattern.test(title)) {
                return {
                    score: rule.score,
                    importance: rule.importance,
                    category: rule.category,
                    affectedAssets: rule.affectedAssets,
                    expectedEffect: rule.expectedEffectHigher,
                };
            }
        }

        // Default fallback if no specific rule matched
        return {
            score: 40,
            importance: 'LOW',
            category: 'OTHER',
            affectedAssets: cleanCountry === 'AR' ? ['MERVAL'] : ['SPY'],
        };
    }

    /**
     * Normaliza un título para comparaciones y deduplicación.
     */
    normalizeTitle(rawTitle: string): string {
        return rawTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Determina si dos eventos económicos representan el mismo suceso (deduplicación).
     */
    isDuplicateEvent(
        eventA: { country: string; date: string; title: string },
        eventB: { country: string; date: string; title: string }
    ): boolean {
        if (eventA.country !== eventB.country) return false;
        if (eventA.date !== eventB.date) return false;

        const normA = this.normalizeTitle(eventA.title);
        const normB = this.normalizeTitle(eventB.title);

        if (normA === normB) return true;

        // Common synonyms checks
        const isCpiA = /(cpi|ipc|consumer price|precios al consumidor)/.test(normA);
        const isCpiB = /(cpi|ipc|consumer price|precios al consumidor)/.test(normB);
        if (isCpiA && isCpiB) return true;

        const isFomcA = /(fomc|interest rate|federal funds)/.test(normA);
        const isFomcB = /(fomc|interest rate|federal funds)/.test(normB);
        if (isFomcA && isFomcB) return true;

        const isNfpA = /(nonfarm|payrolls|nfp)/.test(normA);
        const isNfpB = /(nonfarm|payrolls|nfp)/.test(normB);
        if (isNfpA && isNfpB) return true;

        return false;
    }
}
