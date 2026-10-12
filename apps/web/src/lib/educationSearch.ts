export interface SearchableArticle {
  slug: string;
  title: string;
  summary?: string;
  formula?: string | null;
  category?: { name?: string; slug?: string };
  subcategory?: { name?: string; slug?: string };
  categorySlug?: string;
  subcategorySlug?: string;
}

export const normalizeEducationText = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const aliases: Record<string, string[]> = {
  'que-es-el-per': ['pe', 'p e', 'p/e', 'p-e', 'per', 'price to earnings', 'precio beneficio', 'forward pe', 'trailing pe'],
  'que-es-el-rsi': ['rsi', 'rsi14', 'rsi14d', 'indice de fuerza relativa', 'relative strength index'],
  'que-es-el-macd': ['macd', 'convergencia divergencia de medias moviles'],
  'medias-moviles-sma-ema': ['media movil', 'medias moviles', 'media 20', 'media 50', 'media 100', 'media 200', 'media movil 20', 'media movil 200', 'media movil 20 200', 'sma', 'ema', 'sma20', 'sma50', 'sma100', 'sma200', 'ema20', 'ema200', 'media movil 20 periodos', 'media movil 200 periodos', 'cruce dorado', 'cruce de la muerte'],
  'que-es-el-roic': ['roic', 'retorno sobre capital invertido'],
  'wacc-y-spread-creacion-valor': ['wacc', 'roic wacc', 'spread roic wacc', 'costo de capital'],
  'que-es-el-roe-retorno-patrimonio': ['roe', 'return on equity', 'roa', 'roce'],
  'que-es-el-ev-ebitda': ['ev ebitda', 'ev/ebitda', 'ebitda'],
  'que-es-el-peg-ratio': ['peg', 'peg ratio'],
  'deuda-solvencia-cobertura': ['deuda', 'solvencia', 'liquidez', 'ratio corriente', 'current ratio', 'prueba acida', 'quick ratio', 'cobertura intereses', 'activos totales', 'pasivos totales', 'patrimonio neto'],
  'margenes-bruto-operativo-neto': ['margen bruto', 'margen operativo', 'margen neto', 'margen ebitda', 'ebit'],
  'eps-beneficio-por-accion': ['eps', 'bpa', 'beneficio por accion'],
  'pb-precio-valor-libros': ['pb', 'p b', 'p/b', 'price to book', 'valor en libros', 'bvps'],
  'ps-precio-ventas': ['ps', 'p s', 'p/s', 'price to sales', 'ev ingresos', 'ev/ingresos'],
  'que-es-el-flujo-de-caja-libre': ['conversion a caja', 'margen fcf', 'fcf por accion', 'flujo de caja operativo', 'fcf', 'free cash flow', 'flujo de caja libre', 'cfo', 'capex', 'p/fcf', 'fcf yield'],
  'modelos-de-valuacion-dcf': ['dcf', 'fair value', 'valor intrinseco', 'descuento de flujos'],
  'negocio-directivos-y-estructura-accionaria': ['ceo', 'liderazgo', 'fundacion', 'empleados', 'cuota de mercado', 'market share', 'arr', 'mrr', 'insiders', 'tenencia institucional', 'tenencia directivos', 'flotante', 'acciones en circulacion'],
  'capitalizacion-y-enterprise-value': ['capitalizacion', 'market cap', 'enterprise value', 'ev', 'arr'],
  'bandas-de-bollinger': ['bollinger', 'bandas de bollinger'],
  'atr-average-true-range': ['atr', 'average true range'],
  'adx-fuerza-de-tendencia': ['adx', 'average directional index'],
  'oscilador-estocastico': ['estocastico', 'stochastic'],
  'vwap-precio-ponderado-por-volumen': ['vwap', 'precio ponderado por volumen'],
  'que-son-los-cedears': ['cedear', 'cedears', 'ratio cedear', 'ratio de conversion'],
  'que-son-los-etfs': ['etf', 'etfs'],
  'bonos-tir-duration': ['bonos', 'tir', 'duration', 'ytm', 'duracion modificada', 'paridad'],
  'dolar-mep-y-ccl': ['mep', 'ccl', 'dolar mep', 'dolar ccl', 'dolar bolsa', 'contado con liquidacion'],
  'riesgo-pais-embi': ['riesgo pais', 'embi'],
  'calendario-economico-y-eventos': ['calendario', 'consenso', 'dato previo', 'sorpresa economica'],
  'dividendos-yield-payout': ['dividendos', 'dividend yield', 'payout'],
  'beta-volatilidad-mercado': ['beta', 'volatilidad', 'short interest', 'flotante en corto', 'dilucion'],
  'diversificacion-y-drawdown': ['drawdown', 'max drawdown', 'diversificacion'],
  'cotizaciones-ohlc-volumen-variacion': ['cotizaciones', 'precio', 'variacion', 'ohlc', 'volumen', 'cotizacion'],
  'crecimiento-cagr-comparaciones': ['cagr', 'tasa de crecimiento anual compuesta', 'crecimiento compuesto'],
  'portafolio-pnl-costo-aportes': ['portafolio', 'pnl', 'costo promedio', 'aportes', 'ganancia realizada', 'ganancia no realizada', 'cartera'],
};

const ignored = new Set(['que','es','el','la','los','las','de','del','un','una','en','y','para','como','sobre']);
const words = (value: string) => normalizeEducationText(value).split(' ').filter(Boolean);
const matchWord = (haystack: string[], needle: string) => haystack.some(word =>
  word === needle || (needle.length >= 4 && !/^\d+$/.test(needle) && word.startsWith(needle)));

/** Exact concept aliases rank first; multi-word searches require all significant words. */
export function searchEducationArticles<T extends SearchableArticle>(articles: T[], query: string): T[] {
  const normalized = normalizeEducationText(query);
  if (!normalized) return articles;
  const tokens = words(query).filter(word => !ignored.has(word));
  if (!tokens.length) return articles;
  const targetSlugs = Object.entries(aliases).filter(([,values]) =>
    values.some(alias => normalizeEducationText(alias) === normalized)).map(([slug])=>slug);
  return articles.map((article,index)=>{
    const titleWords = words(article.title);
    const aliasWords = (aliases[article.slug] || []).flatMap(words);
    const catWords = [
      ...words(article.category?.name || ''),
      ...words(article.category?.slug || ''),
      ...words(article.categorySlug || ''),
      ...words(article.subcategory?.name || ''),
      ...words(article.subcategory?.slug || ''),
      ...words(article.subcategorySlug || ''),
    ];
    const allWords = [
      ...titleWords,
      ...words(article.summary || ''),
      ...words(article.slug),
      ...words(article.formula || ''),
      ...catWords,
      ...aliasWords
    ];
    // Every query token MUST be matched in the article's text, category, or aliases
    if (!tokens.every(token => matchWord(allWords, token))) return null;
    const concept = targetSlugs.includes(article.slug);
    const score = (concept ? 1000 : 0) + (tokens.every(token=>matchWord(titleWords,token)) ? 100 : 0)
      + tokens.filter(token=>titleWords.includes(token)).length * 10;
    return {article,index,score};
  }).filter((entry): entry is {article:T;index:number;score:number} => entry!==null)
    .sort((a,b)=>b.score-a.score || a.index-b.index).map(entry=>entry.article);
}
