export type ToolId = 'compuesto' | 'objetivos' | 'inflacion' | 'comisiones' | 'escenarios' | 'tasas' | 'prestamos' | 'operacion';
export type Values = Record<string, number>;
export type Field = { key: string; label: string; unit?: string; min: number; max: number; step?: number; hint?: string };
export type Tool = { id: ToolId; title: string; description: string; category: string; fields: Field[]; defaults: Values; formula: string; explanation: string; limitations: string; education: string; source: { name: string; url: string } };

const investor = { name: 'Investor.gov · calculadoras', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' };
const rates = { name: 'BCRA · metodología de tasas', url: 'https://www.bcra.gob.ar/archivos/Pdfs/PublicacionesEstadisticas/tasmet.pdf' };
const fees = { name: 'SEC · impacto de los costos', url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated' };

const money = (key: string, label: string, hint?: string): Field => ({ key, label, min: 0, max: 1e12, step: 100, hint });
const pct = (key: string, label: string, min = -90, max = 500): Field => ({ key, label, unit: '%', min, max, step: 0.1 });
const years: Field = { key: 'years', label: 'Plazo en años', min: 1, max: 50, step: 1 };
const capital = money('capital', 'Capital inicial');
const contribution = money('contribution', 'Aporte mensual', 'Importe fijo en la moneda elegida.');
const annual = pct('annual', 'Rendimiento efectivo anual supuesto');
const inflation = pct('inflation', 'Inflación efectiva anual supuesta', -50, 500);
const edu = '/educativa/macroeconomia/inflacion-y-tasas-de-interes';
const timing: Field = { key: 'beginning', label: 'Momento del aporte', min: 0, max: 1, step: 1 };

export const TOOLS: Tool[] = [
 { id: 'compuesto', title: 'Interés compuesto', category: 'Ahorro e inversión', description: 'Explorá el crecimiento del capital con aportes y reinversión.', fields: [capital, contribution, years, annual, inflation, timing], defaults: { capital: 10000, contribution: 200, years: 10, annual: 7, inflation: 3, beginning: 0 }, formula: 'r mensual = (1 + TEA)^(1/12) − 1. Saldo al cierre = saldo anterior × (1 + r) + aporte al cierre.', explanation: 'La tasa ingresada es efectiva anual. Los rendimientos se reinvierten cada mes; los aportes pueden entrar al inicio o al cierre. El saldo real descuenta la inflación acumulada desde hoy.', limitations: 'Tasa e inflación constantes, aportes nominales fijos y sin retiros. No incorpora impuestos ni comisiones. Un rendimiento negativo también es posible.', education: edu, source: investor },
 { id: 'objetivos', title: 'Objetivos de ahorro', category: 'Ahorro e inversión', description: 'Calculá el aporte mensual necesario para alcanzar una meta.', fields: [capital, money('target', 'Meta en dinero de hoy'), years, annual, inflation, timing], defaults: { capital: 5000, target: 50000, years: 5, annual: 7, inflation: 3, beginning: 0 }, formula: 'Meta futura = meta de hoy × (1 + inflación)^años. Aporte = máximo(0, (meta futura − capital × (1 + r)^meses) / factor de aportes).', explanation: 'La meta se expresa en poder adquisitivo de hoy y se actualiza con la inflación supuesta. El aporte calculado es nominal y permanece fijo durante todo el plazo. Si el capital inicial ya alcanza, el aporte requerido es cero.', limitations: 'La tasa es constante y no existe garantía de alcanzar la meta. No incluye costos ni impuestos. Una inflación mayor exige una meta nominal mayor.', education: edu, source: { name: 'Investor.gov · objetivos de ahorro', url: 'https://www.investor.gov/financial-tools-calculators/calculators/savings-goal-calculator' } },
 { id: 'inflacion', title: 'Inflación y poder adquisitivo', category: 'Tasas y moneda', description: 'Compará el saldo nominal con su valor en dinero de hoy.', fields: [capital, years, annual, inflation], defaults: { capital: 100000, years: 5, annual: 30, inflation: 35 }, formula: 'Rendimiento real anual = (1 + rendimiento nominal) / (1 + inflación) − 1. Valor real = saldo nominal / (1 + inflación)^años.', explanation: 'La relación de Fisher permite comparar rendimientos e inflación compuestos. Restar directamente los porcentajes es una aproximación que puede fallar con tasas altas. La inflación debe corresponder a la moneda seleccionada.', limitations: 'Supone tasas anuales constantes y un único capital sin aportes. No toma el IPC actual ni cotizaciones en vivo.', education: edu, source: rates },
 { id: 'comisiones', title: 'Impacto de comisiones', category: 'Ahorro e inversión', description: 'Compará dos costos anuales y su efecto acumulado.', fields: [capital, contribution, years, annual, pct('feeA', 'Costo anual alternativa A', 0, 20), pct('feeB', 'Costo anual alternativa B', 0, 20), timing], defaults: { capital: 10000, contribution: 200, years: 20, annual: 7, feeA: 0.25, feeB: 1, beginning: 0 }, formula: 'Factor anual neto = (1 + rendimiento bruto) × (1 − costo anual). Factor mensual = factor anual neto^(1/12).', explanation: 'Modela el costo como una reducción proporcional del patrimonio, distribuida mensualmente. Ambas alternativas tienen el mismo rendimiento bruto y aportes. La diferencia final incluye cargos y el crecimiento que ese dinero dejó de generar.', limitations: 'Es un modelo simplificado de costos recurrentes sobre patrimonio. No agrega comisiones por operación, costos fijos ni impuestos. El costo de oportunidad no equivale a los cargos efectivamente cobrados.', education: '/educativa/fundamentos/que-son-los-etfs', source: fees },
 { id: 'escenarios', title: 'Comparador de escenarios', category: 'Ahorro e inversión', description: 'Contrastá tres rendimientos supuestos con el mismo plan.', fields: [capital, contribution, years, pct('low', 'Escenario adverso · TEA'), pct('base', 'Escenario base · TEA'), pct('high', 'Escenario favorable · TEA'), inflation, timing], defaults: { capital: 10000, contribution: 200, years: 10, low: -2, base: 7, high: 12, inflation: 3, beginning: 0 }, formula: 'Cada escenario aplica su TEA mensual equivalente al mismo capital y a los mismos aportes. Saldo real = saldo nominal / inflación acumulada.', explanation: 'Los tres escenarios son hipótesis editables, sin probabilidades asignadas. Podés comparar cuánto influye el rendimiento manteniendo el plazo, la inflación y el esfuerzo de ahorro.', limitations: 'No es una proyección de mercado, un intervalo de confianza ni una simulación Monte Carlo. No representa volatilidad, caídas intermedias, costos o impuestos.', education: '/educativa?search=riesgo', source: investor },
 { id: 'tasas', title: 'Conversor de tasas', category: 'Tasas y moneda', description: 'Convertí TNA, TEA y tasa mensual con la misma convención.', fields: [pct('rate', 'Tasa ingresada', 0, 500), { key: 'kind', label: 'Tipo de tasa', min: 0, max: 2, step: 1 }, { key: 'periods', label: 'Capitalizaciones por año', min: 1, max: 365, step: 1 }], defaults: { rate: 30, kind: 0, periods: 12 }, formula: 'TEA = (1 + TNA / m)^m − 1. TNA = m × ((1 + TEA)^(1/m) − 1). Tasa mensual = (1 + TEA)^(1/12) − 1.', explanation: 'La TNA depende de la frecuencia de capitalización elegida. Para la tasa efectiva mensual se usa un año de 12 meses iguales. Las tasas equivalentes se calculan sin comisiones.', limitations: 'No es CFT. La base diaria comercial, los días reales del período, impuestos y cargos de cada entidad pueden cambiar el resultado contractual.', education: edu, source: rates },
 { id: 'prestamos', title: 'Simulador de préstamos', category: 'Crédito y operaciones', description: 'Estimá una cuota fija y revisá la amortización mensual.', fields: [money('principal', 'Monto del préstamo'), pct('tna', 'TNA con capitalización mensual', 0, 500), { key: 'months', label: 'Cantidad de cuotas mensuales', min: 1, max: 600, step: 1 }, money('upfront', 'Costo inicial adicional')], defaults: { principal: 100000, tna: 40, months: 24, upfront: 0 }, formula: 'r = TNA / 12. Cuota = principal × r / (1 − (1 + r)^−n). Con tasa cero: cuota = principal / n.', explanation: 'Sistema francés con tasa fija: cada cuota incluye intereses sobre el saldo pendiente y amortización de capital. El costo inicial se paga por separado y se suma al desembolso total.', limitations: 'No calcula CFT ni IVA, seguros, mora, préstamos UVA, tasa variable o precancelaciones. La cuota final ajusta diferencias de precisión; las cuotas comerciales pueden redondearse de otra forma.', education: edu, source: { name: 'CFPB · amortización de préstamos', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-amortization-and-how-could-it-affect-my-auto-loan-en-771/' } },
 { id: 'operacion', title: 'Punto de equilibrio', category: 'Crédito y operaciones', description: 'Calculá el precio de venta necesario para cubrir los costos.', fields: [money('buy', 'Precio de compra por unidad'), money('sell', 'Precio de venta por unidad'), { key: 'quantity', label: 'Cantidad de unidades', min: 1, max: 1e9, step: 1 }, pct('buyFee', 'Comisión de compra', 0, 50), pct('sellFee', 'Comisión de venta', 0, 50), money('fixed', 'Otros costos totales')], defaults: { buy: 100, sell: 110, quantity: 100, buyFee: 0.5, sellFee: 0.5, fixed: 0 }, formula: 'Equilibrio = (compra × cantidad × (1 + comisión compra) + costos fijos) / (cantidad × (1 − comisión venta)).', explanation: 'Compara el desembolso de compra con el ingreso neto de venta. Los otros costos se cargan una sola vez sobre toda la operación. Todas las entradas deben estar en una única moneda.', limitations: 'Solo una compra y una venta. No incorpora dividendos, impuestos, financiamiento, cambio de moneda o ratios de CEDEAR. No es una orden ni se conecta a un broker.', education: '/educativa/fundamentos/que-son-los-cedears', source: fees },
];

export type Row = Record<string, number>;
export type Result = { metrics: { label: string; value: number; percent?: boolean; hint?: string }[]; rows: Row[]; columns: { key: string; label: string; percent?: boolean; plain?: boolean }[]; series: { key: string; label: string; color: string }[]; xLabel: string };

export function validate(tool: Tool, values: Values): Record<string, string> {
 const errors: Record<string, string> = {};
 for (const f of tool.fields) {
  const v = values[f.key];
  if (!Number.isFinite(v) || v < f.min || v > f.max) {
   errors[f.key] = `Ingresá un valor entre ${f.min.toLocaleString('es-AR')} y ${f.max.toLocaleString('es-AR')}.`;
  } else if (f.step === 1 && !Number.isInteger(v)) {
   errors[f.key] = 'Ingresá un número entero.';
  }
 }
 if (
  tool.id === 'escenarios' &&
  Number.isFinite(values.low) &&
  Number.isFinite(values.base) &&
  Number.isFinite(values.high) &&
  !(values.low <= values.base && values.base <= values.high)
 ) {
  errors.base = 'Ordená los rendimientos: adverso ≤ base ≤ favorable.';
 }
 if (tool.id === 'prestamos' && values.principal === 0) {
  errors.principal = 'El monto del préstamo debe ser mayor a cero.';
 }
 if (tool.id === 'operacion' && values.buy === 0) {
  errors.buy = 'El precio de compra debe ser mayor a cero.';
 }
 return errors;
}

export function monthly(annualPercent: number): number {
 if (!Number.isFinite(annualPercent)) return 0;
 if (annualPercent <= -100) return -1;
 if (annualPercent === 0) return 0;
 return Math.expm1(Math.log1p(annualPercent / 100) / 12);
}

export function future(capital: number, contribution: number, months: number, rate: number, beginning = 0): Row[] {
 let balance = capital;
 const rows: Row[] = [{ period: 0, balance, contributed: capital }];
 for (let n = 1; n <= months; n++) {
  balance = (balance + (beginning ? contribution : 0)) * (1 + rate) + (beginning ? 0 : contribution);
  rows.push({ period: n, balance, contributed: capital + contribution * n });
 }
 return rows;
}

const colors = ['#059669', '#0284c7', '#d97706', '#9333ea'];
const series = (key: string, label: string, index: number) => ({ key, label, color: colors[index] });
const column = (key: string, label: string, percent = false, plain = false) => ({ key, label, percent, plain });

export function calculate(tool: Tool, v: Values): Result {
 if (Object.keys(validate(tool, v)).length) throw new Error('Revisá los valores ingresados.');
 const metric = (label: string, value: number, percent = false, hint?: string) => ({ label, value, percent, hint });
 const months = v.years * 12;
 let result: Result;

 if (tool.id === 'tasas') {
  const tea = v.kind === 1
   ? v.rate / 100
   : v.kind === 0
   ? Math.expm1(v.periods * Math.log1p(v.rate / 100 / v.periods))
   : Math.expm1(12 * Math.log1p(v.rate / 100));

  const tna = v.kind === 0
   ? v.rate / 100
   : v.kind === 2 && v.periods === 12
   ? (12 * v.rate) / 100
   : v.periods * Math.expm1(Math.log1p(tea) / v.periods);

  const month = v.kind === 2
   ? v.rate / 100
   : v.kind === 0 && v.periods === 12
   ? v.rate / 1200
   : Math.expm1(Math.log1p(tea) / 12);

  result = {
   metrics: [
    metric('Tasa efectiva anual', tea * 100, true),
    metric('Tasa nominal anual', tna * 100, true),
    metric('Tasa efectiva mensual', month * 100, true)
   ],
   rows: Array.from({ length: 13 }, (_, n) => ({ period: n, growth: (Math.pow(1 + month, n) - 1) * 100 })),
   columns: [column('period', 'Mes', false, true), column('growth', 'Rendimiento acumulado', true)],
   series: [series('growth', 'Rendimiento acumulado (%)', 0)],
   xLabel: 'Mes'
  };
 } else if (tool.id === 'prestamos') {
  const r = v.tna / 1200;
  const payment = r === 0
   ? v.principal / v.months
   : v.principal * r / -Math.expm1(-v.months * Math.log1p(r));

  let balance = v.principal;
  let total = 0;
  const rows: Row[] = [];

  for (let n = 1; n <= v.months; n++) {
   const interest = balance * r;
   // Value the remaining payments directly: subtracting nearly equal interest
   // and payment amounts loses all principal precision for long, high-rate loans.
   const remaining = v.months - n;
   const nextBalance = remaining === 0 ? 0 : r === 0
    ? Math.max(0, v.principal - payment * n)
    : payment * -Math.expm1(-remaining * Math.log1p(r)) / r;
   const principal = Math.max(0, balance - nextBalance);
   const actual = principal + interest;
   balance = Math.max(0, nextBalance);
   total += actual;
   rows.push({ period: n, payment: actual, interest, principal, balance });
  }

  result = {
   metrics: [
    metric('Cuota mensual', payment),
    metric('Intereses totales', Math.max(0, total - v.principal)),
    metric('Total con costo inicial', total + v.upfront)
   ],
   rows,
   columns: [
    column('period', 'Cuota', false, true),
    column('payment', 'Pago'),
    column('interest', 'Interés'),
    column('principal', 'Capital'),
    column('balance', 'Saldo pendiente')
   ],
   series: [series('balance', 'Saldo pendiente', 0)],
   xLabel: 'Cuota'
  };
 } else if (tool.id === 'operacion') {
  const spent = v.buy * v.quantity * (1 + v.buyFee / 100) + v.fixed;
  const received = v.sell * v.quantity * (1 - v.sellFee / 100);
  const sellNetFactor = v.quantity * (1 - v.sellFee / 100);
  const equilibrium = sellNetFactor > 0 ? spent / sellNetFactor : 0;
  const rows = Array.from({ length: 21 }, (_, n) => {
   const price = equilibrium * (0.5 + n * 0.05);
   return { period: price, profit: price * v.quantity * (1 - v.sellFee / 100) - spent };
  });

  result = {
   metrics: [
    metric('Precio de equilibrio por unidad', equilibrium),
    metric('Resultado neto', received - spent),
    metric('Rendimiento neto sobre costo', spent > 0 ? (received / spent - 1) * 100 : 0, true)
   ],
   rows,
   columns: [column('period', 'Precio de venta'), column('profit', 'Resultado neto')],
   series: [series('profit', 'Resultado neto', 0)],
   xLabel: 'Precio de venta'
  };
 } else {
  const rate = monthly(tool.id === 'escenarios' ? v.base : v.annual);
  let contribution = v.contribution || 0;
  let target = 0;

  if (tool.id === 'objetivos') {
   target = v.target * Math.pow(1 + v.inflation / 100, v.years);
   const factor = future(0, 1, months, rate, v.beginning)[months].balance;
   const capitalFV = v.capital * Math.pow(1 + rate, months);
   contribution = factor > 0 ? Math.max(0, (target - capitalFV) / factor) : 0;
  }

  const rows = future(v.capital, contribution, months, rate, v.beginning);
  const infRate = (v.inflation || 0) / 100;
  for (const row of rows) {
   const infFactor = 1 + infRate;
   row.real = infFactor > 0 ? row.balance / Math.pow(infFactor, row.period / 12) : row.balance;
  }

  const last = rows[rows.length - 1];
  let metrics = [
   metric('Saldo final nominal', last.balance),
   metric('Capital aportado', last.contributed),
   metric('Saldo en dinero de hoy', last.real)
  ];
  let columns = [
   column('period', 'Mes', false, true),
   column('contributed', 'Aportado'),
   column('balance', 'Saldo nominal'),
   column('real', 'Saldo real')
  ];
  let chart = [
   series('balance', 'Saldo nominal', 0),
   series('contributed', 'Capital aportado', 1),
   series('real', 'Dinero de hoy', 2)
  ];

  if (tool.id === 'objetivos') {
   metrics = [
    metric('Aporte mensual necesario', contribution),
    metric('Meta nominal futura', target),
    metric('Saldo proyectado', last.balance)
   ];
  }

  if (tool.id === 'inflacion') {
   const realAnnualReturn = (1 + infRate) > 0
    ? ((1 + v.annual / 100) / (1 + infRate) - 1) * 100
    : v.annual;
   metrics = [
    metric('Rendimiento real anual', realAnnualReturn, true),
    metric('Valor final nominal', last.balance),
    metric('Poder adquisitivo final', last.real)
   ];
  }

  if (tool.id === 'comisiones') {
   for (const [key, fee] of [['a', v.feeA], ['b', v.feeB]] as const) {
    const net = monthly(((1 + v.annual / 100) * (1 - fee / 100) - 1) * 100);
    const scenario = future(v.capital, contribution, months, net, v.beginning);
    rows.forEach((row, n) => { row[key] = scenario[n].balance; });
   }
   metrics = [
    metric('Saldo alternativa A', last.a),
    metric('Saldo alternativa B', last.b),
    metric('Diferencia A menos B', last.a - last.b, false, 'Incluye el crecimiento dejado de ganar.')
   ];
   columns = [
    column('period', 'Mes', false, true),
    column('balance', 'Sin costos'),
    column('a', 'Alternativa A'),
    column('b', 'Alternativa B')
   ];
   chart = [
    series('balance', 'Sin costos', 1),
    series('a', 'Alternativa A', 0),
    series('b', 'Alternativa B', 2)
   ];
  }

  if (tool.id === 'escenarios') {
   for (const key of ['low', 'base', 'high']) {
    const scenario = future(v.capital, contribution, months, monthly(v[key]), v.beginning);
    rows.forEach((row, n) => {
     row[key] = scenario[n].balance;
     const infFactor = 1 + infRate;
     row[`${key}Real`] = infFactor > 0 ? row[key] / Math.pow(infFactor, row.period / 12) : row[key];
    });
   }
   metrics = [
    metric('Adverso · saldo nominal', last.low),
    metric('Base · saldo nominal', last.base),
    metric('Favorable · saldo nominal', last.high)
   ];
   columns = [
    column('period', 'Mes', false, true),
    column('low', 'Adverso'),
    column('base', 'Base'),
    column('high', 'Favorable'),
    column('lowReal', 'Adverso real'),
    column('baseReal', 'Base real'),
    column('highReal', 'Favorable real')
   ];
   chart = [
    series('low', 'Adverso', 2),
    series('base', 'Base', 0),
    series('high', 'Favorable', 1)
   ];
  }

  result = { metrics, rows, columns, series: chart, xLabel: 'Mes' };
 }

 if (
  result.metrics.some(m => !Number.isFinite(m.value)) ||
  result.rows.some(row => Object.values(row).some(n => !Number.isFinite(n)))
 ) {
  throw new Error('Estos valores producen un resultado demasiado grande. Reducí las tasas, los montos o el plazo.');
 }

 return result;
}
