import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, Search, Download, RotateCcw, Save, Trash2, BookOpen, ArrowRight, FlaskConical } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TOOLS, calculate, validate, convertCurrency, parseLaboratoryNumber, type Currency, type ToolId, type Values, type Result } from '@/lib/laboratory';
import { useTranslation } from '@/i18n';
import './FinancialLaboratory.css';

type Snapshot = { id: string; name: string; tool: ToolId; values: Values; currency: Currency; exchangeRate?: number; date: string };
const STORAGE = 'finix-laboratory-v1';
const formatNumber = (v: number, percent = false, locale = 'es-AR') => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2, notation: Math.abs(v) >= 1e15 ? 'scientific' : 'standard' }).format(v)}${percent ? ' %' : ''}`;
const compactNumber = (v: number, locale = 'es-AR') => new Intl.NumberFormat(locale, { notation: Math.abs(v) >= 1e15 ? 'scientific' : 'compact', maximumFractionDigits: 1 }).format(v);
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function readSaved(): Snapshot[] {
 try { const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE) || '[]'); if (!Array.isArray(parsed)) return []; return parsed.filter((s): s is Snapshot => Boolean(s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.date === 'string' && ['ARS', 'USD'].includes(s.currency) && TOOLS.some(t => t.id === s.tool && s.values && Object.keys(validate(t, s.values)).length === 0))).slice(0, 6); } catch { return []; }
}
function exportCSV(result: Result, title: string, currency: string, values: Values, labels: Record<string, string>, ui: (text: string) => string, exchangeRate: number) {
 const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;
 const lines = [[title, currency], [ui('Fecha de simulación'), new Date().toISOString()], ...(currency !== '%' && Number.isFinite(exchangeRate) && exchangeRate > 0 ? [[ui('Tipo de cambio (ARS por USD)'), String(exchangeRate)]] : []), [ui('Supuestos editados'), ui('Valor')], ...Object.entries(values).map(([k, v]) => [labels[k] || k, k === 'beginning' ? ui(v ? 'Inicio del mes' : 'Cierre del mes') : k === 'kind' ? ['TNA', 'TEA', 'TEM'][v] : String(v)]), [], result.columns.map(c => `${ui(c.label)}${c.plain ? '' : c.percent ? ' (%)' : ` (${currency})`}`), ...result.rows.map(row => result.columns.map(c => String(row[c.key])))];
 const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map(line => line.map(quote).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
 const a = document.createElement('a'); a.href = url; a.download = `finix-${title.toLowerCase().replace(/\s+/g, '-')}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function FinancialLaboratory() {
 const { ui, lang } = useTranslation();
 const [params, setParams] = useSearchParams();
 useEffect(() => { const previous = document.title; document.title = `${ui('Laboratorio Financiero')} | FINIX`; return () => { document.title = previous; }; }, [lang]);
 const current = TOOLS.find(t => t.id === params.get('herramienta')) || TOOLS[0];
 const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
 const format = (v: number, percent = false) => formatNumber(v, percent, lang);
 const compact = (v: number) => compactNumber(v, lang);
 const [currency, setCurrency] = useState<Currency>('ARS');
 const [exchange, setExchange] = useState('');
 const [quoteSource, setQuoteSource] = useState('');
 const [quoteLoading, setQuoteLoading] = useState(false);
 const exchangeRate = parseLaboratoryNumber(exchange);
 const hasMoney = current.fields.some(f => f.monetary);
 const [search, setSearch] = useState('');
 const [category, setCategory] = useState('Todas');
 const [saved, setSaved] = useState<Snapshot[]>(readSaved);
 const [name, setName] = useState('');
 const [status, setStatus] = useState('');
 const [page, setPage] = useState(0);
 const panel = useRef<HTMLElement>(null);
 useEffect(() => { setPage(0); }, [current.id]);
 const raw = inputs[current.id] || Object.fromEntries(Object.entries(current.defaults).map(([k, v]) => [k, String(v)]));
 const values = useMemo(() => Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, parseLaboratoryNumber(v)])), [raw]);
 const errors = validate(current, values, lang);
 const computed = useMemo(() => { try { return { result: calculate(current, values), error: '' }; } catch (e) { return { result: null, error: e instanceof Error ? e.message : 'Revisá los supuestos.' }; } }, [current, values]);
 const result = computed.result;
 const filtered = TOOLS.filter(t => (category === 'Todas' || t.category === category) && normalize(`${ui(t.title)} ${ui(t.description)} ${ui(t.category)} ${ui(t.formula)}`).includes(normalize(search)));
 const loadQuote = async () => {
  setQuoteLoading(true);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
   const response = await fetch('/api/market/dolar/ccl', { signal: controller.signal });
   if (!response.ok) throw new Error();
   const quote = await response.json();
   const rate = Number(quote.venta);
   const date = new Date(quote.fecha);
   if (!Number.isFinite(rate) || rate <= 0 || !quote.fuente || /Finix Cache/i.test(quote.fuente) || !Number.isFinite(date.getTime()) || date.getTime() > Date.now() + 60000 || Date.now() - date.getTime() > 7 * 86400000) throw new Error();
   setExchange(String(rate)); setQuoteSource(`${quote.fuente} · ${date.toLocaleString(lang)}`); setStatus('');
  } catch { setStatus(ui('No hay una cotización reciente verificable. Ingresá una tasa manual.')); }
  finally { window.clearTimeout(timeout); setQuoteLoading(false); }
 };
 const changeCurrency = (next: Currency) => {
  if (next === currency) return;
  try {
   const converted = Object.fromEntries(TOOLS.map(tool => {
    const draft = inputs[tool.id] || Object.fromEntries(Object.entries(tool.defaults).map(([key, value]) => [key, String(value)]));
    const parsed = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, parseLaboratoryNumber(value)]));
    const nextValues = convertCurrency(tool, parsed, currency, next, exchangeRate);
    return [tool.id, Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, tool.fields.find(f => f.key === key)?.monetary ? String(nextValues[key]) : value]))];
   }));
   setInputs(converted); setCurrency(next); setPage(0); setStatus(ui('Conversión realizada.'));
  } catch (error) { setStatus(ui(error instanceof Error ? error.message : 'Corregí los importes antes de cambiar la moneda.')); }
 };
 const resetExample = () => {
  try {
   const defaults = currency === 'USD' && hasMoney ? convertCurrency(current, current.defaults, 'ARS', 'USD', exchangeRate) : current.defaults;
   setInputs(prev => ({ ...prev, [current.id]: Object.fromEntries(Object.entries(defaults).map(([key,value]) => [key,String(value)])) }));
   setPage(0); setStatus(ui('Supuestos de ejemplo restablecidos.'));
  } catch (error) { setStatus(ui(error instanceof Error ? error.message : 'Revisá los supuestos.')); }
 };
 const select = (id: ToolId) => { setParams({ herramienta: id }); setPage(0); setStatus(ui('')); if (window.innerWidth < 900) requestAnimationFrame(() => panel.current?.scrollIntoView({ block: 'start' })); };
 const update = (key: string, value: string) => { setInputs(prev => ({ ...prev, [current.id]: { ...raw, [key]: value } })); setPage(0); setStatus(ui('')); };
 const persist = (next: Snapshot[]) => { try { localStorage.setItem(STORAGE, JSON.stringify(next)); setSaved(next); return true; } catch { setStatus(ui('No se pudo guardar en este navegador. Podés descargar el CSV.')); return false; } };
 const save = () => { if (!result) return; if (saved.length >= 6) { setStatus(ui('Podés guardar hasta 6 simulaciones. Eliminá una para agregar otra.')); return; } const snapshot: Snapshot = { id: crypto.randomUUID(), name: name.trim().slice(0, 80) || ui(current.title), tool: current.id, values, currency, exchangeRate: Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : undefined, date: new Date().toISOString() }; if (persist([...saved, snapshot])) { setName(''); setStatus(ui('Simulación guardada en este navegador.')); } };
 const load = (snapshot: Snapshot) => {
  // A saved simulation is a standalone plan. Rebuild other examples in its denomination,
  // instead of silently relabelling drafts that were entered in another currency.
  const rate = snapshot.exchangeRate && snapshot.exchangeRate > 0 ? snapshot.exchangeRate : exchangeRate;
  const examples = Object.fromEntries(TOOLS.map(tool => { let defaults = tool.defaults; try { if (snapshot.currency === 'USD' && Number.isFinite(rate) && rate > 0) defaults = convertCurrency(tool, defaults, 'ARS', 'USD', rate); } catch { /* Unrelated examples retain valid defaults when an extreme saved quote cannot represent them. */ } return [tool.id, Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, String(value)]))]; }));
  setInputs({ ...examples, [snapshot.tool]: Object.fromEntries(Object.entries(snapshot.values).map(([key, value]) => [key, String(value)])) });
  setCurrency(snapshot.currency); setExchange(Number.isFinite(rate) && rate > 0 ? String(rate) : ''); setQuoteSource(''); select(snapshot.tool); setStatus(`${ui('Cargaste')} «${snapshot.name}».`);
 };
 const visibleRows = result?.rows.slice(page * 12, (page + 1) * 12) || [];
 return <div className="financial-lab">
  <header className="lab-header"><div><div className="lab-heading"><FlaskConical aria-hidden="true" size={28} /><h1>{ui('Laboratorio Financiero')}</h1></div><p>{ui('Probá tus números. Entendé cómo influyen el tiempo, las tasas y los costos.')}</p></div><Link className="lab-link" to="/educativa"><BookOpen size={17} />{ui(' Biblioteca educativa ')}<ArrowRight size={16} /></Link></header>
  <div className="lab-discovery"><label className="lab-search"><Search size={18} aria-hidden="true" /><input aria-label={ui('Buscar herramientas')} placeholder={ui('Buscar: inflación, cuota, aportes…')} value={search} onChange={e => setSearch(e.target.value)} /><span>{filtered.length}/8</span></label><div className="lab-filters" aria-label={ui('Filtrar herramientas')}>{['Todas', ...new Set(TOOLS.map(t => t.category))].map(c => <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c}>{ui(c)}</button>)}</div></div>
  <div className="lab-workspace"><aside className="lab-tools" aria-label={ui('Herramientas financieras')}>{filtered.map(t => <button key={t.id} className={current.id === t.id ? 'selected' : ''} aria-pressed={current.id === t.id} onClick={() => select(t.id)}><span className="lab-tool-title"><Calculator size={17} />{ui(t.title)}</span><span>{ui(t.description)}</span></button>)}{filtered.length === 0 && <div className="lab-empty">{ui('No encontramos esa herramienta.')}<button onClick={() => { setSearch(''); setCategory('Todas'); }}>{ui('Restablecer búsqueda')}</button></div>}</aside>
   <section ref={panel} className="lab-panel" aria-label={ui(current.title)}><div className="lab-panel-heading"><div><h2>{ui(current.title)}</h2><p>{ui(current.description)}</p></div><label className="lab-currency" hidden={!hasMoney}>{ui('Moneda')}<select aria-label={ui('Moneda de la simulación')} value={currency} onChange={e => changeCurrency(e.target.value as Currency)}><option value="ARS">{ui('ARS · pesos')}</option><option value="USD">{ui('USD · dólares')}</option></select></label></div><p className="lab-assumption">{ui('Simulación con supuestos editables. Los valores de ejemplo no son tasas vigentes ni rendimientos garantizados. Los importes se convierten con esta cotización fija. Las tasas y la inflación permanecen iguales.')}</p>
    {hasMoney && <label className="lab-field lab-exchange" htmlFor="lab-exchange"><span>{ui('Tipo de cambio (ARS por USD)')}</span><input id="lab-exchange" type="text" inputMode="decimal" value={exchange} onChange={e => { setExchange(e.target.value); setQuoteSource(''); }} placeholder={ui('Tasa manual')} aria-invalid={exchange !== '' && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)} /><small>{ui('Ingresá una cotización positiva para convertir los importes.')}</small><button type="button" className="lab-link" disabled={quoteLoading} onClick={loadQuote}>{ui('Cotización CCL de referencia')}</button>{quoteSource && <small>{quoteSource}</small>}</label>}
    {status && <p className="lab-status">{status}</p>}
    <div className="lab-calculator"><section className="lab-inputs" aria-label={ui('Supuestos')}><h3>{ui('Tus supuestos')}</h3><p className="lab-number-hint">{ui('Escribí importes sin separadores de miles. Para decimales, usá punto o coma.')}</p>{current.fields.map(field => <label className={`lab-field ${['beginning', 'kind'].includes(field.key) ? 'lab-field-wide' : ''}`} key={field.key} htmlFor={`lab-${field.key}`}><span>{ui(field.label)}{field.unit ? ` (${field.unit})` : field.monetary ? ` (${currency})` : ''}</span>{field.key === 'beginning' ? <select id={`lab-${field.key}`} value={raw[field.key]} onChange={e => update(field.key, e.target.value)}><option value="0">{ui('Al cierre de cada mes')}</option><option value="1">{ui('Al inicio de cada mes')}</option></select> : field.key === 'kind' ? <select id={`lab-${field.key}`} value={raw[field.key]} onChange={e => update(field.key, e.target.value)}><option value="0">{ui('TNA · nominal anual')}</option><option value="1">{ui('TEA · efectiva anual')}</option><option value="2">{ui('TEM · efectiva mensual')}</option></select> : <input id={`lab-${field.key}`} type="text" inputMode={field.step === 1 ? 'numeric' : 'decimal'} value={raw[field.key]} onChange={e => update(field.key, e.target.value)} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} />}{field.hint && <small>{ui(field.hint)}</small>}{errors[field.key] && <small className="lab-error" id={`error-${field.key}`}>{ui(errors[field.key])}</small>}</label>)}<button className="lab-link" onClick={resetExample}><RotateCcw size={16} />{ui(' Restablecer ejemplo')}</button></section>
    <section className="lab-results" aria-label={ui('Resultados')}><h3>{ui('Resultado de tu simulación')}</h3>{result ? <><div className="lab-metrics">{result.metrics.map(m => <div key={ui(m.label)}><span>{ui(m.label)}</span><strong>{format(m.value, m.percent)}</strong>{!m.percent && <small>{currency}</small>}{m.hint && <small>{ui(m.hint)}</small>}</div>)}</div><div className="lab-chart" role="img" aria-label={`${ui('Gráfico de')} ${ui(current.title)}. ${ui('El detalle accesible está en la tabla de resultados.')}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={result.rows} margin={{ top: 12, right: 14, left: 0, bottom: 5 }}><CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 5" /><XAxis dataKey="period" minTickGap={35} tickFormatter={n => current.id === 'operacion' ? compact(n) : String(n)} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} /><YAxis width={62} tickFormatter={compact} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} /><Tooltip labelFormatter={n => `${ui(result.xLabel)} ${format(Number(n))}`} formatter={(v: number, label: string) => [`${format(v)} ${current.id === 'tasas' ? '%' : currency}`, ui(label)]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: 10, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />{result.series.map(s => <Line key={s.key} type="monotone" dataKey={s.key} name={ui(s.label)} stroke={s.color} strokeWidth={2.5} dot={false} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div><p className="lab-chart-caption">{current.id === 'operacion' ? `${ui('Precio de venta por unidad')} (${currency})` : current.id === 'tasas' ? ui('Meses · rendimiento acumulado en porcentaje') : `${ui('Evolución mensual · importes en')} ${currency}`}</p><button className="lab-button" onClick={() => exportCSV(result, ui(current.title), current.id === 'tasas' ? '%' : currency, values, Object.fromEntries(current.fields.map(f => [f.key, `${ui(f.label)}${f.monetary ? ` (${currency})` : f.unit ? ` (${f.unit})` : ''}`])), ui, exchangeRate)}><Download size={16} />{ui(' Descargar detalle CSV')}</button></> : <div className="lab-invalid" role="status"><Calculator size={28} /><p>{ui(computed.error)}</p><small>{ui('El resultado se actualizará cuando todos los valores sean válidos.')}</small></div>}</section></div>
    <section className="lab-method"><h3>{ui('Cómo se calcula')}</h3><p>{ui(current.explanation)}</p><code>{ui(current.formula)}</code><p><strong>{ui('Alcance del cálculo:')}</strong> {ui(current.limitations)}</p><div className="lab-method-links"><Link to={current.education}>{ui('Entender el concepto en Educación ')}<ArrowRight size={15} /></Link><a href={current.source.url} target="_blank" rel="noopener noreferrer">{ui('Referencia:')} {ui(current.source.name)}</a></div></section>
    {result && <details className="lab-detail" key={current.id}><summary>{ui('Ver tabla de resultados')} · {result.rows.length} {ui('períodos')}</summary><div className="lab-table-scroll" tabIndex={0} role="region" aria-label={ui('Tabla de la simulación')}><table><caption>{ui('Detalle de')} {ui(current.title)} · {current.id === 'tasas' ? '%' : currency}</caption><thead><tr>{result.columns.map(c => <th key={c.key} scope="col">{ui(c.label)}</th>)}</tr></thead><tbody>{visibleRows.map(row => <tr key={row.period}>{result.columns.map(c => <td key={c.key}>{format(row[c.key], c.percent)}</td>)}</tr>)}</tbody></table></div><div className="lab-pagination"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>{ui('Anterior')}</button><span>{ui('Página')} {page + 1} {ui('de')} {Math.ceil(result.rows.length / 12)}</span><button disabled={(page + 1) * 12 >= result.rows.length} onClick={() => setPage(p => p + 1)}>{ui('Siguiente')}</button></div></details>}
   </section></div>
  <section className="lab-saved"><div><h2>{ui('Tus simulaciones guardadas')}</h2><p>{ui('Se guardan solo en este navegador. Podés conservar hasta 6 y volver a editar sus supuestos.')}</p></div><form className="lab-save-form" onSubmit={e => { e.preventDefault(); save(); }}><label htmlFor="simulation-name" className="sr-only">{ui('Nombre de la simulación')}</label><input id="simulation-name" maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder={ui('Nombre opcional para guardar')} /><button className="lab-button" disabled={!result} type="submit"><Save size={16} />{ui(' Guardar simulación')}</button></form><p className="lab-status" role="status" aria-live="polite">{status}</p>{saved.length ? <ul>{saved.map(s => <li key={s.id}><div><strong>{s.name}</strong><small>{ui(TOOLS.find(t => t.id === s.tool)?.title || '')} · {s.currency} · {new Date(s.date).toLocaleDateString(lang)}</small></div><button onClick={() => load(s)}>{ui('Cargar')}</button><button aria-label={`${ui('Eliminar')} ${s.name}`} onClick={() => { if (persist(saved.filter(item => item.id !== s.id))) setStatus(ui('Simulación eliminada.')); }}><Trash2 size={17} /></button></li>)}</ul> : <p className="lab-empty">{ui('Todavía no guardaste simulaciones. Editá los supuestos de una herramienta y guardá el resultado.')}</p>}</section>
 </div>;
}
