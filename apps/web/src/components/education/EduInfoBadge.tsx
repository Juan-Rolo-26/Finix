import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

const GLOSSARY_LINKS: Record<string, string> = {
    roic: '/educativa/analisis-fundamental/que-es-el-roic',
    roic_wacc: '/educativa/analisis-fundamental/que-es-el-roic',
    wacc: '/educativa/analisis-fundamental/que-es-el-roic',
    per: '/educativa/analisis-fundamental/que-es-el-per',
    pe: '/educativa/analisis-fundamental/que-es-el-per',
    peratio: '/educativa/analisis-fundamental/que-es-el-per',
    forward_pe: '/educativa/analisis-fundamental/que-es-el-per',
    trailing_pe: '/educativa/analisis-fundamental/que-es-el-per',
    fcf: '/educativa/analisis-fundamental/que-es-el-flujo-de-caja-libre',
    freecashflow: '/educativa/analisis-fundamental/que-es-el-flujo-de-caja-libre',
    flujo_de_caja: '/educativa/analisis-fundamental/que-es-el-flujo-de-caja-libre',
    dcf: '/educativa/analisis-fundamental/modelos-de-valuacion-dcf',
    fair_value: '/educativa/analisis-fundamental/modelos-de-valuacion-dcf',
    rsi: '/educativa/analisis-tecnico/que-es-el-rsi',
    rsi14d: '/educativa/analisis-tecnico/que-es-el-rsi',
    macd: '/educativa/analisis-tecnico/que-es-el-macd',
    tendencia: '/educativa/analisis-tecnico/tendencias-alcista-bajista-lateral',
    tendencia_alcista: '/educativa/analisis-tecnico/tendencias-alcista-bajista-lateral',
    soporte: '/educativa/analisis-tecnico/soportes-resistencias-polaridad',
    resistencia: '/educativa/analisis-tecnico/soportes-resistencias-polaridad',
    velas: '/educativa/analisis-tecnico/lectura-de-velas-japonesas',
    martillo: '/educativa/analisis-tecnico/lectura-de-velas-japonesas',
    inflacion: '/educativa/fundamentos/que-es-invertir-vs-ahorrar',
    stop_loss: '/educativa/estrategias/gestion-del-riesgo-stop-loss-posicion',
    take_profit: '/educativa/estrategias/gestion-del-riesgo-stop-loss-posicion',
    gestion_riesgo: '/educativa/estrategias/gestion-del-riesgo-stop-loss-posicion',
    ev_ebitda: '/educativa/analisis-fundamental/que-es-el-ev-ebitda',
    evebitda: '/educativa/analisis-fundamental/que-es-el-ev-ebitda',
    evtoebitda: '/educativa/analisis-fundamental/que-es-el-ev-ebitda',
    peg: '/educativa/analisis-fundamental/que-es-el-peg-ratio',
    pegratio: '/educativa/analisis-fundamental/que-es-el-peg-ratio',
    peg_ratio: '/educativa/analisis-fundamental/que-es-el-peg-ratio',
    roe: '/educativa/analisis-fundamental/que-es-el-roe-retorno-patrimonio',
    return_on_equity: '/educativa/analisis-fundamental/que-es-el-roe-retorno-patrimonio',
    retorno_patrimonio: '/educativa/analisis-fundamental/que-es-el-roe-retorno-patrimonio',
    sma: '/educativa/analisis-tecnico/medias-moviles-sma-ema',
    ema: '/educativa/analisis-tecnico/medias-moviles-sma-ema',
    medias_moviles: '/educativa/analisis-tecnico/medias-moviles-sma-ema',
    sma50: '/educativa/analisis-tecnico/medias-moviles-sma-ema',
    sma200: '/educativa/analisis-tecnico/medias-moviles-sma-ema',
    bollinger: '/educativa/analisis-tecnico/bandas-de-bollinger',
    bandas_bollinger: '/educativa/analisis-tecnico/bandas-de-bollinger',
    cedear: '/educativa/fundamentos/que-son-los-cedears',
    cedears: '/educativa/fundamentos/que-son-los-cedears',
    etf: '/educativa/fundamentos/que-son-los-etfs',
    etfs: '/educativa/fundamentos/que-son-los-etfs',
    spy: '/educativa/fundamentos/que-son-los-etfs',
    qqq: '/educativa/fundamentos/que-son-los-etfs',
    tasas: '/educativa/macroeconomia/inflacion-y-tasas-de-interes',
    tasas_interes: '/educativa/macroeconomia/inflacion-y-tasas-de-interes',
    fed: '/educativa/macroeconomia/inflacion-y-tasas-de-interes',
    dca: '/educativa/estrategias/dollar-cost-averaging-dca',
    dollar_cost_averaging: '/educativa/estrategias/dollar-cost-averaging-dca',
    drawdown: '/educativa/estrategias/diversificacion-y-drawdown',
    max_drawdown: '/educativa/estrategias/diversificacion-y-drawdown',
    diversificacion: '/educativa/estrategias/diversificacion-y-drawdown',
    pnl: '/educativa/estrategias/diversificacion-y-drawdown',
    rendimiento: '/educativa/estrategias/diversificacion-y-drawdown',
};

export function EduInfoBadge({
    term,
    title,
    className = '',
}: {
    term: string;
    title?: string;
    className?: string;
}) {
    const key = term.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const targetUrl = GLOSSARY_LINKS[key] || `/educativa?search=${encodeURIComponent(term)}`;

    return (
        <Link
            to={targetUrl}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center justify-center p-0.5 rounded-full text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors ml-1 align-middle shrink-0 ${className}`}
            title={title || `Aprender más sobre ${term} en Educativa`}
            aria-label={`Aprender más sobre ${term}`}
        >
            <Info className="w-3.5 h-3.5" />
        </Link>
    );
}
