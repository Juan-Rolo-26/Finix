import { fundamentalOnly } from '../analysis/fundamental-visibility';
import { AssetAnalysis, Prisma } from '@prisma/client';

export const escapeEmail = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function emailUrl(value?: string | null) {
    if (!value) return '';
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) throw new Error('URL no permitida');
    return escapeEmail(url.href);
}
export function renderAnalysis(analysis: AssetAnalysis) {
    const publicAnalysis = fundamentalOnly(analysis);
    analysis = { ...publicAnalysis, executiveSummary: JSON.stringify(publicAnalysis.executiveSummary) } as AssetAnalysis;
    const labels: Record<string, string> = { executiveSummary: 'Resumen ejecutivo', businessDescription: 'Empresa', businessModel: 'Modelo de negocio', revenue: 'Ingresos', revenueGrowthYoY: 'Crecimiento interanual', eps: 'EPS', grossMargin: 'Margen bruto', operatingMargin: 'Margen operativo', netMargin: 'Margen neto', roe: 'ROE', roic: 'ROIC', freeCashFlow: 'Flujo de caja libre', peRatio: 'P/E', forwardPe: 'P/E futuro', evToEbitda: 'EV/EBITDA', estimatedFairValue: 'Valor razonable', cash: 'Efectivo', totalDebt: 'Deuda total', netDebt: 'Deuda neta', currentPrice: 'Precio', sma50: 'SMA 50', sma200: 'SMA 200', rsi: 'RSI', supports: 'Soportes', resistances: 'Resistencias', trend: 'Tendencia', competitorsData: 'Competidores', risksData: 'Riesgos', catalystsData: 'Catalizadores', scenariosData: 'Escenarios', valuationMethodology: 'Metodologia de valuacion', swotData: 'FODA', sources: 'Fuentes', legalDisclaimer: 'Aviso legal' };
    const renderValue = (value: unknown, depth = 0): string => {
        if (depth > 5 || value == null) return '';
        if (typeof value === 'string') { try { return renderValue(JSON.parse(value), depth + 1); } catch { return escapeEmail(value).replace(/\n/g, '<br>'); } }
        if (Array.isArray(value)) return '<ul>' + value.slice(0, 100).map(v => `<li>${renderValue(v, depth + 1)}</li>`).join('') + '</ul>';
        if (typeof value === 'object') return Object.entries(value).map(([k,v]) => `<p><strong>${escapeEmail(k)}:</strong> ${renderValue(v, depth + 1)}</p>`).join('');
        return escapeEmail(value);
    };
    const sections = [
        ['Resumen ejecutivo', 'showSummary', 'executiveSummary'],
        ['Empresa', 'showCompany', 'companyName ticker sector industry country foundedYear ceo employeesCount marketCap businessDescription productsServices revenueGeneration mainRevenueSources geographicRevenue businessSegments mainCompetitors competitiveAdvantage customerDependency productDependency marketShare'],
        ['Modelo de negocio', 'showBusinessModel', 'businessModel'],
        ['Ingresos y crecimiento', 'showGrowth', 'revenue revenueGrowthYoY revenueCagr3y revenueCagr5y growthBySegment growthByRegion recurringRevenue arr mrr revenueGuidance estimatedRevenue realVsEstimatedRevenue segmentGrowth'],
        ['Rentabilidad', 'showProfitability', 'eps epsGrowth epsEstimatedVsReal grossMargin operatingMargin netMargin ebit ebitda ebitdaMargin roe roa roic roce'],
        ['Valuacion', 'showValuation', 'peRatio forwardPe pegRatio priceToSales priceToBook evToEbitda evToRevenue priceToFcf dividendYield marketCapToFcf historicalValuation historicalAvgPe sectorPe competitorsPe valuationPremiumDiscount valuationMethodology'],
        ['Valor razonable', 'showFairValue', 'estimatedFairValue'],
        ['Balance', 'showBalance', 'cash totalDebt netDebt netDebtToEbitda currentRatio quickRatio totalAssets totalLiabilities equity equityGrowth longTermDebt shortTermDebt interestPaid interestCoverageRatio'],
        ['Flujo de caja', 'showCashFlow', 'freeCashFlow fcfMargin fcfGrowth operatingCashFlow capEx fcfPerShare fcfYield earningsToCashConversion historicalCashFlow'],
        ['Accionistas', 'showOwnership', 'sharesOutstanding shareDilution insiderOwnership institutionalOwnership insiderBuys insiderSells buybacks sharesGrowthReduction shortInterest shortFloat beta'],
        ['Competidores', 'showCompetitors', 'competitorsData'],
        ['Analisis tecnico', 'showTechnical', 'currentPrice dailyChange weeklyChange monthlyChange yearlyChange high52w low52w distanceToHigh distanceToLow volume avgVolume relativeVolume sma20 sma50 sma100 sma200 rsi macd bollingerBands atr supports resistances trend momentum historicalVolatility technicalData'],
        ['Riesgos y catalizadores', 'showRisks', 'risksData catalystsData swotData'],
        ['Escenarios', 'showScenarios', 'scenariosData'],
        ['Series historicas', 'showGrowth', 'historicalSeries'],
        ['Fuentes y metodologia', '', 'sources analysisDate legalDisclaimer'],
    ];
    let visibility: Record<string, boolean> = {};
    try { visibility = JSON.parse(analysis.sectionVisibility || '{}'); } catch { /* Legacy records have no visibility settings. */ }
    return `<h2>${escapeEmail(analysis.companyName || analysis.symbol)}</h2>` + sections.filter(([, flag]) => flag !== 'showTechnical' && visibility[flag] !== false).map(([title,, fields]) => {
        const values = fields.split(' ').filter(key => analysis[key] != null && analysis[key] !== '');
        if (!values.length) return '';
        return `<h2 style="border-bottom:1px solid #d8e1dc;padding-bottom:8px">${title}</h2>` + values.map(key => `<h3>${labels[key] || escapeEmail(key.replace(/([A-Z])/g, ' $1'))}</h3><div>${renderValue(analysis[key])}</div>`).join('');
    }).join('');
}
export function renderCampaign(input: { title: string; message: string; imageUrl?: string | null; chartUrl?: string; ctaUrl?: string | null; ctaLabel?: string | null; audience?: string }, analysis?: AssetAnalysis | null) {
    const img = (url?: string | null, alt = '') => url ? `<img src="${emailUrl(url)}" alt="${escapeEmail(alt)}" width="640" style="display:block;width:100%;height:auto;margin:20px 0;border-radius:8px">` : '';
    const badgeText = input.audience === 'PRO' ? 'FINIX PRO' : 'FINIX';
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"></head><body style="margin:0;background:#f3f5f4;font-family:Arial,sans-serif;color:#18241f"><table role="presentation" width="100%"><tr><td align="center" style="padding:20px 10px"><table role="presentation" width="640" style="max-width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06)"><tr><td style="background:#073c2b;color:#fff;padding:24px;font-size:24px;font-weight:bold;letter-spacing:1px">${badgeText}</td></tr><tr><td style="padding:28px 24px;line-height:1.6"><h1 style="margin-top:0;font-size:22px;color:#0b1913">${escapeEmail(input.title)}</h1>${img(input.imageUrl)}<div style="font-size:15px;color:#2d3748">${escapeEmail(input.message).replace(/\n/g, '<br>')}</div>${img(input.chartUrl, 'Grafico de mercado')}${analysis ? renderAnalysis(analysis) : ''}${input.ctaUrl ? `<p style="margin:28px 0 16px"><a style="display:inline-block;background:#087f5b;color:#ffffff;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none" href="${emailUrl(input.ctaUrl)}">${escapeEmail(input.ctaLabel || 'Ver en Finix')}</a></p>` : ''}<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px"><p style="font-size:12px;color:#718096;line-height:1.5">La información publicada por Finix tiene fines exclusivamente informativos y educativos y no constituye asesoramiento financiero, recomendación de inversión ni oferta de compra o venta de activos financieros.</p><p style="font-size:12px;color:#718096"><a style="color:#087f5b" href="${emailUrl((process.env.FRONTEND_URL || 'https://finixarg.com') + '/settings')}">Preferencias de email</a> · <a style="color:#718096" href="{{unsubscribe_url}}">Cancelar suscripción</a></p></td></tr></table></td></tr></table></body></html>`;
}

// Publication and outbox are committed together. Re-edits never announce twice.
export async function queuePublishedAnalysis(tx: Prisma.TransactionClient, analysis: AssetAnalysis, adminId?: string) {
    if (analysis.status !== 'PUBLISHED' || !analysis.isActive || analysis.emailAnnounced || !adminId) return;
    const claimed = await tx.assetAnalysis.updateMany({ where: { id: analysis.id, emailAnnounced: false }, data: { emailAnnounced: true } });
    if (!claimed.count) return;
    const title = `Analisis PRO: ${analysis.companyName || analysis.symbol}`;
    const message = `Ya esta disponible el nuevo analisis de ${analysis.ticker || analysis.symbol}.`;
    const ctaUrl = `${process.env.FRONTEND_URL || 'https://finixarg.com'}/analysis/${encodeURIComponent(analysis.slug || analysis.id)}`;
    await tx.proEmailCampaign.create({ data: { sourceKey: `analysis:${analysis.id}`, subject: title, title, message, ctaUrl, ctaLabel: 'Ver analisis completo', contentHtml: renderCampaign({ title, message, ctaUrl }, analysis), createdById: adminId, status: 'SENDING', audience: 'PRO' } });
}
