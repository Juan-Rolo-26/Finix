import { parsePublicFundamentals, PublicPages, FieldEvidence } from './public-fundamentals';

type Sector = { pe:number; ps:number; pb:number; source:string; queriedAt:string };
const parsed = (value:any) => { try{return typeof value==='string'?JSON.parse(value):value||{};}catch{return{};} };
const finite = (value:any):value is number => typeof value==='number'&&Number.isFinite(value);
const pct = (n:number) => new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(n)+'%';
export function enrichResearch(existing:Record<string,any>, research:ReturnType<typeof parsePublicFundamentals>, sectors:Record<string,Sector>, texts:{description?:string;segments?:Record<string,string>}={}) {
    const data:Record<string,any>={},series=parsed(existing.historicalSeries),meta=series.meta||{};meta.fieldSources||={};meta.fieldAvailability||={};
    const get=(field:string)=>data[field]??existing[field];
    const assign=(field:string,value:any,source?:FieldEvidence)=>{if(value===null||value===undefined||value==='')return;data[field]=value;if(source)meta.fieldSources[field]=source;delete meta.unavailable?.[field];delete meta.retainedValues?.[field];meta.fieldAvailability[field]={status:source?.method?'calculated':'reported',display:'Disponible',reason:source?.method||'Valor observado en la fuente.',...source};};
    for(const[field,value]of Object.entries(research.values)){
        const evidence=research.evidence[field];
        if(['cash','totalDebt','totalAssets','totalLiabilities','equity','longTermDebt','operatingCashFlow','capEx','freeCashFlow','interestPaid','fcfPerShare'].includes(field))continue;
        if(evidence.currency&&meta.currency&&evidence.currency!==meta.currency)continue;
        if(get(field)==null||['eps','peRatio','forwardPe','pegRatio','priceToSales','priceToBook','priceToFcf','evToRevenue','evToEbitda','roe','roa','roic','roce','currentRatio','quickRatio','interestCoverageRatio','grossMargin','operatingMargin','netMargin','ebitdaMargin','fcfMargin','dividendYield','beta','netDebtToEbitda','foundedYear','ceo','employeesCount','sector','industry','historicalAvgPe','shareDilution','insiderOwnership','institutionalOwnership','shortInterest','shortFloat'].includes(field))assign(field,value,evidence);
    }
    // Refresh complete, internally consistent statement groups when their period is at least as recent.
    for(const[type,fields]of Object.entries({balance:['cash','totalDebt','totalAssets','totalLiabilities','equity','longTermDebt'],cashFlow:['operatingCashFlow','capEx','freeCashFlow','interestPaid','fcfPerShare']})){
        const period=research.periods[type as 'balance'|'cashFlow'];
        const required=type==='balance'?['totalAssets','equity']:['operatingCashFlow','capEx','freeCashFlow'];
        if(period&&(!meta[type]||period>=meta[type])&&required.every(key=>finite(research.values[key])&&research.evidence[key]?.currency===meta.currency)){
            for(const field of fields){
                if(finite(research.values[field]))assign(field,research.values[field],research.evidence[field]);
                else if(finite(get(field))){meta.retainedValues||={};meta.retainedValues[field]||={verifiedAt:meta.queriedAt,period:meta[type],reason:'La nueva tabla no desglosa este componente; se conserva su fecha anterior.'};}
            }
            meta[type]=period;if(type==='cashFlow')meta.cashFlowBasis='TTM';
        }
    }
    const calc=(field:string,value:number,method:string,period?:string)=>{if(finite(value))assign(field,value,{source:'Finix · cálculo reproducible sobre cifras publicadas',queriedAt:research.queriedAt,period,method});};
    if(finite(get('totalDebt'))&&finite(get('cash'))&&meta.fieldSources.totalDebt?.period===meta.fieldSources.cash?.period)calc('netDebt',get('totalDebt')-get('cash'),'Deuda total menos efectivo de la misma fecha.',meta.balance);
    if(meta.currency==='USD'){
        if(finite(get('freeCashFlow'))&&get('freeCashFlow')!==0&&get('marketCap')>0)calc('priceToFcf',get('marketCap')/get('freeCashFlow'),'Capitalización en USD / FCF reportado en USD. Un múltiplo negativo indica consumo de caja, no infravaloración.',meta.cashFlow);
        if(finite(get('equity'))&&get('equity')!==0&&get('marketCap')>0)calc('priceToBook',get('marketCap')/get('equity'),'Capitalización en USD / patrimonio reportado en USD; un patrimonio negativo limita su interpretación.',meta.balance);
        if(get('marketCap')>0&&finite(get('freeCashFlow')))calc('fcfYield',get('freeCashFlow')/get('marketCap')*100,'FCF publicado en USD / capitalización en USD.',meta.cashFlow);
    }
    if(get('ebitda')>0&&finite(get('netDebt'))&&get('netDebtToEbitda')==null)calc('netDebtToEbitda',get('netDebt')/get('ebitda'),'Deuda neta / EBITDA. Las fechas de ambos componentes se muestran en sus fuentes.');
    const sector=sectors[get('sector')];
    if(sector){assign('sectorPe',sector.pe,{source:sector.source,queriedAt:sector.queriedAt,method:'P/E agregado del sector publicado por Finviz; clasificación sectorial de la empresa en Stock Analysis.'});meta.sectorBenchmark=sector;}
    if(!finite(get('peRatio'))&&meta.currency==='USD'&&finite(get('eps'))&&get('eps')<0&&get('currentPrice')>0)calc('peRatio',get('currentPrice')/get('eps'),'Precio en USD / EPS TTM en USD. Un P/E negativo refleja pérdidas y no permite comparar una valoración positiva.');
    const historic = get('peRatio')>0&&get('historicalAvgPe')>0?{ratio:'PE',mean:get('historicalAvgPe'),sample:research.peHistory}:research.psHistory?.length>=2&&get('priceToSales')>0?{ratio:'PS',mean:research.psHistory.reduce((n,x)=>n+x.value!,0)/research.psHistory.length,sample:research.psHistory}:null;
    if(historic){
        meta.valuationReference=historic;
        const current=historic.ratio==='PE'?get('peRatio'):get('priceToSales');
        calc('valuationPremiumDiscount',(current/historic.mean-1)*100,'Diferencia porcentual del '+(historic.ratio==='PE'?'P/E':'P/S')+' actual frente a la media de cierres fiscales positivos; no es un descuento frente a un DCF.');
        meta.fieldSources.historicalComparison={source:research.sources.find(s=>s.endsWith('/ratios/')),queriedAt:research.queriedAt,method:'Media aritmética de '+historic.sample.length+' cierres fiscales positivos de '+historic.ratio+'.'};
        if(sector)meta.fieldSources.sectorComparison={source:sector.source,queriedAt:sector.queriedAt,method:'Referencia '+historic.ratio+' publicada por Finviz.'};
    }
    series.pe=research.peHistory.map(x=>({period:x.period,value:x.value}));
    if(get('historicalAvgPe')>0){data.historicalValuation='P/E al cierre de '+research.peHistory.length+' ejercicios: '+research.peHistory.map(x=>x.period+': '+x.value!.toFixed(2)+'x').join(' · ')+'. Media aritmética de observaciones positivas; excluye el múltiplo corriente.';}
    if(finite(get('shareDilution')))data.sharesGrowthReduction='Cambio interanual de acciones en circulación: '+pct(get('shareDilution'))+'. Un aumento refleja dilución neta; una caída, reducción neta.';
    if(research.segments.length&&research.segmentTotal&&research.segments.every(s=>s.value!>=0)&&Math.abs(research.segments.reduce((n,s)=>n+s.value!,0)-research.segmentTotal)/research.segmentTotal<.015){
        const items=research.segments.map(s=>({product:texts.segments?.[s.name]||s.name,description:'Línea reportada al '+research.periods.income+'.',revenuePct:s.value!/research.segmentTotal!*100}));
        data.businessModel=items;data.mainRevenueSources=items.map(x=>x.product+': '+pct(x.revenuePct)).join(' · ');data.businessSegments=items.map(x=>x.product).join(' · ');
        const largest=[...items].sort((a,b)=>b.revenuePct-a.revenuePct)[0];data.productDependency='Mayor línea de ingresos reportada: '+largest.product+', '+pct(largest.revenuePct)+' del total en el período '+research.periods.income+'.';
        meta.fieldSources.businessModel={source:research.sources.find(s=>s.endsWith('/financials/')),queriedAt:research.queriedAt,period:research.periods.income,method:'Porcentajes calculados solo cuando las líneas suman el total reportado sin solapamiento.'};
    }
    // Documented comparative valuation model. This is an estimate, never a reported number or analyst price target.
    if(sector&&get('currentPrice')>0){
        const method=get('peRatio')>0?'P/E':get('priceToSales')>0?'P/S':get('priceToBook')>0?'P/B':null;
        const observed=method==='P/E'?get('peRatio'):method==='P/S'?get('priceToSales'):get('priceToBook');const benchmark=method==='P/E'?sector.pe:method==='P/S'?sector.ps:sector.pb;
        if(method&&observed>0&&benchmark>0){
            const base=get('currentPrice')*benchmark/observed;
            calc('estimatedFairValue',base,'Modelo comparativo '+method+': precio actual × múltiplo sectorial / múltiplo actual. No es DCF ni consenso de analistas.');
            data.valuationMethodology={method:'Comparación por '+method+' sectorial',assumptions:'Precio y múltiplo actual observados; referencia sectorial Finviz. Se mantienen constantes los resultados por acción. La comparación no ajusta diferencias de crecimiento, riesgo o calidad.',result:base,date:research.queriedAt,notes:'Estimación de modelo de Finix. No representa un valor intrínseco publicado ni un objetivo de analistas. Escenarios de sensibilidad: referencia sectorial -20%, central y +20%.'};
            const scenario=(factor:number,title:string)=>({title,assumptions:'Sensibilidad del múltiplo sectorial por '+factor.toFixed(2)+'; se mantienen constantes los resultados y el precio de referencia.',targetPe:method==='P/E'?(benchmark*factor).toFixed(2):undefined,fairValue:'USD '+(base*factor).toFixed(2),upside:pct((base*factor/get('currentPrice')-1)*100)});
            data.scenariosData={bear:scenario(.8,'Sensibilidad inferior'),base:scenario(1,'Referencia sectorial'),bull:scenario(1.2,'Sensibilidad superior')};
            const visibility=parsed(existing.sectionVisibility);data.sectionVisibility={...visibility,showTechnical:false,showFairValue:true,showScenarios:true};
        }
    }
    if(texts.description){
        data.businessDescription=texts.description;
        const sentences=texts.description.split(/(?<=[.!?])\s+/);
        data.productsServices=sentences.slice(0,2).join(' ').split(/\s+/).slice(0,45).join(' ');
        data.revenueGeneration=finite(get('revenue'))?'Los ingresos reportados '+(meta.basis||'')+' al '+meta.revenue+' son '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(get('revenue')/1e6)+' millones '+meta.currency+'. Las líneas de actividad se describen en el perfil y en el desglose publicado.':sentences[0];
        if(!parsed(get('businessModel'))?.length)data.businessModel=[{product:'Actividad principal',description:data.productsServices}];
        for(const field of ['businessDescription','productsServices','revenueGeneration'])meta.fieldSources[field]={source:research.sources.find(s=>s.endsWith('/company/')),queriedAt:research.queriedAt,method:'Perfil público traducido al español; cifras contables separadas del texto descriptivo.'};
    }
    const positive:string[]=[],negative:string[]=[];
    if(finite(get('netMargin')))(get('netMargin')>=0?positive:negative).push('Margen neto observado: '+pct(get('netMargin'))+'.');
    if(finite(get('revenueGrowthYoY')))(get('revenueGrowthYoY')>=0?positive:negative).push('Variación interanual de ingresos: '+pct(get('revenueGrowthYoY'))+'.');
    if(finite(get('freeCashFlow')))(get('freeCashFlow')>=0?positive:negative).push('FCF reportado '+meta.cashFlowBasis+' al '+meta.cashFlow+': '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(get('freeCashFlow')/1e6)+' millones '+meta.currency+'.');
    data.swotData={strengths:positive,weaknesses:negative,opportunities:['Seguimiento: expansión de los negocios descriptos y mejora de su rentabilidad; no se da por hecho un resultado futuro.'],threats:['Monitorear variaciones de demanda, competencia, financiación y regulación que afecten las cifras reportadas.']};
    const statements = positive.concat(negative);
    data.executiveSummary={title:(existing.companyName||existing.ticker)+' · análisis fundamental',summary:(texts.description||existing.businessDescription||'')+' '+statements.join(' '),positivePoints:positive,negativePoints:negative,conclusion:'Distinguir los resultados reportados de la valoración comparativa y sus escenarios. Las fechas y los métodos se detallan junto a cada indicador.'};
    data.risksData=[{title:'Resultados y generación de caja',description:statements.join(' ')||'Evaluar las cifras publicadas y su evolución antes de comparar negocios.',severity:'MONITORING'},{title:'Financiación y sensibilidad del modelo',description:'La referencia por múltiplos depende de la rentabilidad observada y de las condiciones del sector. Los escenarios son sensibilidades, no previsiones de resultados.',severity:'MONITORING'}];
    data.catalystsData=[{title:'Próxima revisión de resultados',description:research.nextEarningsDate?'Fecha estimada por el proveedor: '+research.nextEarningsDate.split('-').reverse().join('/')+'. Contrastar los resultados que publique la empresa con el consenso y con su generación de caja.':'La próxima publicación de estados financieros permitirá revisar ingresos, márgenes y caja. La fecha no está confirmada en esta fuente.',horizon:research.nextEarningsDate||'Según calendario de la compañía',impact:'Por confirmar'}];
    const cashLabels:Record<string,string>={operatingCashFlow:'Caja operativa',capEx:'CapEx',freeCashFlow:'Flujo libre'};
    data.historicalCashFlow=Object.entries(cashLabels).map(([field,label])=>{
        if(finite(get(field)))return label+': '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(get(field)/1e6)+' millones '+meta.currency+' (al '+(meta.fieldSources[field]?.period||meta.cashFlow)+')';
        if(finite(research.values[field]))return label+': '+new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(research.values[field]/1e6)+' millones '+research.evidence[field].currency+' (al '+research.evidence[field].period+')';
        return label+': el estado de caja consultado no desglosa esta partida; no se presume que sea cero';
    }).join('. ')+'.';
    const unknown=Object.keys({...existing,...data}).filter(field=>get(field)===null);
    const financial=/finanz|financial|banc/i.test(get('sector')||'');
    const reasons:Record<string,{display:string;reason:string;status:string}>={};
    for(const field of unknown){
        let status='not_disclosed',display='Sin desglose público',reason='Las fuentes públicas consultadas no ofrecen un valor verificable para este campo. No se sustituye por cero.';
        if(['arr','mrr','recurringRevenue'].includes(field)){display=financial||!/software|internet|technology|tecnolog/i.test((get('sector')||'')+' '+(get('industry')||''))?'No aplica al modelo':'No desglosado';reason=display.startsWith('No aplica')?'ARR y MRR miden contratos recurrentes de suscripción; no equivalen a ingresos de cualquier empresa.':'La empresa no divulga ARR/MRR de forma separada en estas fuentes; no se infiere dividiendo ventas por doce.';status=display.startsWith('No aplica')?'not_applicable':'not_disclosed';}
        if(financial&&['grossMargin','roic','roce','evToEbitda','netDebtToEbitda','fcfMargin','fcfPerShare'].includes(field)){display='No comparable';status='not_applicable';reason='La estructura de una entidad financiera requiere ratios de capital, margen financiero y solvencia; este indicador operativo no es comparable con el de una empresa industrial.';}
        if(research.unavailable[field]){display=field==='historicalAvgPe'?'Histórico no comparable':'Base no comparable';reason=research.unavailable[field];status='not_applicable';}
        if(field==='marketShare'){display='Mercado no delimitado';status='not_applicable';reason='Una empresa diversificada participa en mercados distintos. No existe una cuota única sin definir producto, región y período; no se confunde con su peso bursátil.';}
        if(field==='peRatio'&&finite(get('eps'))&&get('eps')<=0){display='Beneficios no positivos';status='not_applicable';reason='El P/E positivo no es interpretable con beneficio por acción nulo o negativo.';}
        if(finite(research.values[field])&&research.evidence[field]?.currency&&research.evidence[field].currency!==meta.currency){
            display=new Intl.NumberFormat('es-AR',{maximumFractionDigits:2}).format(research.values[field]/1e6)+' M '+research.evidence[field].currency;
            reason='Importe publicado en la moneda de reporte al '+research.evidence[field].period+'. Se conserva esta unidad para evitar mezclarla con cifras en '+meta.currency+'.';status='reported';
            meta.fieldSources[field]=research.evidence[field];
        }
        reasons[field]={display,reason,status};meta.fieldAvailability[field]={...reasons[field],checkedAt:research.queriedAt,sources:research.sources};
    }
    meta.publicResearch={queriedAt:research.queriedAt,sources:research.sources,periods:research.periods};
    data.legalDisclaimer='Información educativa basada en resultados publicados, referencias de mercado y modelos identificados. Los indicadores no comparables se explican junto a su fuente; la ausencia de una cifra no equivale a cero. Las estimaciones no constituyen una recomendación de inversión.';
    data.historicalSeries={...series,meta};data.sources=(existing.sources||'').split('\nFuentes ampliadas:')[0]+'\nFuentes ampliadas: '+research.sources.join(' · ')+' · Consulta: '+research.queriedAt+'. Los datos de consenso y los modelos de Finix se identifican por separado.';
    return {data,description:research.description,remaining:reasons};
}
export function attachComparables(row:Record<string,any>,universe:Record<string,any>[]) {
    const eligible=universe.filter(other=>other.ticker!==row.ticker&&other.sector===row.sector&&other.marketCap>0&&other.revenue>0&&other.peRatio>0&&finite(other.netMargin)&&finite(other.roic));
    eligible.sort((a,b)=>Number(b.industry===row.industry)-Number(a.industry===row.industry)||Math.abs(Math.log(a.marketCap/row.marketCap))-Math.abs(Math.log(b.marketCap/row.marketCap)));
    const peers=eligible.slice(0,4);
    if(!peers.length)return{};
    return{mainCompetitors:'Comparables financieros del mismo sector: '+peers.map(p=>(p.companyName||p.ticker)+' ('+p.ticker+')').join(', ')+'. La selección por industria y escala no implica que todos compitan en el mismo producto.',competitorsData:peers.map(p=>({name:p.companyName,ticker:p.ticker,revenue:p.revenue,growth:p.revenueGrowthYoY,pe:p.peRatio,roic:p.roic,netMargin:p.netMargin,fcf:p.freeCashFlow,marketCap:p.marketCap,debt:p.totalDebt})),competitorsPe:'P/E de comparables: '+peers.map(p=>p.ticker+' '+p.peRatio.toFixed(2)+'x').join(' · ')+'. Referencia del sector: '+(finite(row.sectorPe)?row.sectorPe.toFixed(2)+'x':'consultar fuentes')+'.',competitiveAdvantage:'Comparación observable: margen neto '+(finite(row.netMargin)?pct(row.netMargin):'según fuente')+' frente a '+peers.map(p=>p.ticker+' '+pct(p.netMargin)).join(', ')+'. La rentabilidad observada ayuda a comparar calidad económica; no demuestra por sí sola una ventaja competitiva permanente.'};
}
