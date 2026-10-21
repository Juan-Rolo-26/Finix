type Region = 'AR' | 'US';
type Candidate = { title: string; originalTitle?: string; eventFingerprint?: string | null };
const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const companies: [string, RegExp][] = [
 ['musk-companies', /\b(tesla|spacex|elon musk)\b/], ['meta', /\b(facebook|instagram|meta platforms)\b|\bmeta\b(?!\s+(de|del|para|fiscal|inflacion)\b)/],
 ['nvidia', /\bnvidia\b/], ['apple', /\bapple\b/], ['microsoft', /\bmicrosoft\b/], ['amazon', /\bamazon\b/], ['alphabet', /\b(alphabet|google)\b/],
 ['netflix', /\bnetflix\b/], ['broadcom', /\bbroadcom\b/], ['amd', /\bamd\b|advanced micro devices/], ['intel', /\bintel\b/], ['qualcomm', /\bqualcomm\b/], ['micron', /\bmicron\b/],
 ['oracle', /\boracle\b/], ['adobe', /\badobe\b/], ['salesforce', /\bsalesforce\b/], ['palantir', /\bpalantir\b/], ['cisco', /\bcisco\b/], ['ibm', /\bibm\b/],
 ['jpmorgan', /\b(jpmorgan|jpm|jp morgan)\b/], ['goldman-sachs', /goldman sachs/], ['morgan-stanley', /morgan stanley/], ['bank-of-america', /bank of america|\bbofa\b/], ['wells-fargo', /wells fargo/], ['citigroup', /\b(citigroup|citi)\b/],
 ['berkshire', /\bberkshire\b/], ['walmart', /\bwalmart\b/], ['costco', /\bcostco\b/], ['home-depot', /home depot/], ['coca-cola', /coca cola/], ['pepsico', /\bpepsico\b/], ['mcdonalds', /\bmcdonald/], ['disney', /\bdisney\b/],
 ['exxon', /\bexxon/], ['chevron', /\bchevron\b/], ['boeing', /\bboeing\b/], ['caterpillar', /\bcaterpillar\b/], ['johnson-johnson', /johnson.*johnson/], ['eli-lilly', /eli lilly/], ['pfizer', /\bpfizer\b/], ['merck', /\bmerck\b/], ['unitedhealth', /\bunitedhealth\b/],
 ['gm', /general motors|\bgm\b/], ['ford', /\bford\b/], ['visa', /\bvisa\b/], ['mastercard', /\bmastercard\b/], ['american-express', /american express/], ['blackrock', /\bblackrock\b/],
 ['ypf', /\bypf\b/], ['galicia', /\bgalicia\b|\bggal\b/], ['pampa', /pampa energia|\bpam\b/], ['vista', /vista energy|vista energ/], ['mercadolibre', /mercadolibre|mercado libre|\bmeli\b/], ['macro', /banco macro|\bbma\b/], ['telecom', /telecom argentina/],
];
const themes: [string, RegExp][] = [
 ['exchange-rates', /\b(dolar|dollar|divisa|cepo|devaluacion)\b|cambiari|exchange rate|tipo de cambio/],
 ['inflation', /inflacion|\binflation\b|\b(ipc|cpi|ppi)\b|precios al (consumidor|productor)/],
 ['monetary-policy', /\bfed\b|federal reserve|reserva federal|\bbcra\b|banco central|monetari|interest rates|tasas? de interes|subidas? de tipos|bajadas? de tipos/],
 ['economic-activity', /\b(pbi|pib|gdp|recesion|recession)\b|crecimiento economico|actividad economica/],
 ['employment', /\b(empleo|desempleo|nominas|payrolls?|salarios|sueldos|wages|jobs|unemployment|hiring)\b|laboral/],
 ['tax-budget', /fiscal|impuestos|tributari|superavit|deficit|presupuesto|\b(budget|taxes)\b/],
 ['sovereign-debt', /riesgo pais|deuda (publica|soberana)|bonos soberanos|\btreasur|bonos del tesoro|sovereign debt/],
 ['government-reforms', /\b(milei|caputo|sturzenegger)\b|desregulacion|reformas economicas/],
 ['household-credit', /endeud|morosidad|finanzas personales|sin (plata|dinero)|credito al consumo|deuda familiar|consumer credit/],
 ['housing', /alquiler|hipotec|\b(housing|mortgage|rents)\b/],
 ['trade', /arancel|\btariffs?\b|comercio exterior|exportacion|importacion|trade (deal|war|deficit)/],
 ['crypto', /\b(bitcoin|ethereum|criptomonedas|crypto)\b/],
 ['oil-gas', /petroleo|crudo|gas natural|\b(oil|brent|wti)\b/], ['precious-metals', /\b(oro|plata|gold|silver)\b/],
 ['mergers', /fusion|merger|adquisicion|acquisition|takeover/],
 ['company-results', /\b(earnings|eps)\b|resultados (trimestrales|del trimestre|de [a-z])|ganancias|beneficio (neto|trimestral)|quarterly (results|profit)/],
 ['analyst-ratings', /precio objetivo|price target|calificacion|\b(reitera|rating|upgrade|downgrade|overweight)\b/],
];
const stopWords = new Set(('para como desde sobre ante tras entre hacia este esta estos estas tiene sus una uno unas unos del las los por con sin que mas muy hoy ayer nuevo nueva news after before from with amid over under about this that the and are new says stocks stock shares acciones mercados mercado economia empresas empresa company companies resultados results report informe argentina argentino argentinas argentinos united states estados unidos').split(' '));
type Signature = { region: Region; keys: string[]; tokens: Set<string>; fingerprint?: string | null };
export function newsletterTopicSignature(story: Candidate, region: Region): Signature {
 const headline=normalize(story.title+' '+(story.originalTitle||''));
 const keys=companies.filter(([,pattern])=>pattern.test(headline)).map(([name])=>'company:'+name);
 keys.push(...themes.filter(([,pattern])=>pattern.test(headline)).map(([name])=>region+':'+name));
 if(!keys.length&&/wall street|s p 500|nasdaq|dow jones|russell|merval|\bbolsa\b|stock market/.test(headline))keys.push(region+':market-overview');
 const tokens=new Set(headline.split(' ').filter(word=>word.length>3&&!stopWords.has(word)&&!/^\d+$/.test(word)));
 return {region,keys,tokens,fingerprint:story.eventFingerprint};
}
export class NewsletterTopicTracker {
 private readonly signatures: Signature[]=[];
 isDuplicate(candidate: Signature) {
  return this.signatures.some(previous=>{
   if(candidate.fingerprint&&candidate.fingerprint===previous.fingerprint)return true;
   if(candidate.keys.some(key=>previous.keys.includes(key)))return true;
   if(candidate.region!==previous.region)return false;
   const common=[...candidate.tokens].filter(token=>previous.tokens.has(token)).length;
   return common>=3&&(2*common/(candidate.tokens.size+previous.tokens.size)>=0.65||common/Math.min(candidate.tokens.size,previous.tokens.size)>=0.85);
  });
 }
 add(candidate: Signature) {this.signatures.push(candidate);}
}
