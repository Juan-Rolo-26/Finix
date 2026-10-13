const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Transpile laboratory.ts on the fly using typescript from node_modules
const tsPath = path.resolve(__dirname, '../node_modules/typescript');
const ts = require(tsPath);

const labTsPath = path.resolve(__dirname, '../apps/web/src/lib/laboratory.ts');
const tsCode = fs.readFileSync(labTsPath, 'utf8');
const jsCode = ts.transpileModule(tsCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

const mod = { exports: {} };
new Function('module', 'exports', 'require', jsCode)(mod, mod.exports, require);
const { TOOLS, calculate, validate, monthly, future } = mod.exports;

function getTool(id) {
    const t = TOOLS.find(x => x.id === id);
    assert(t, `Herramienta ${id} no encontrada en TOOLS`);
    return t;
}

const suite = [];
function test(name, fn) {
    try {
        fn();
        suite.push({ name, passed: true });
        console.log(`  ✓ ${name}`);
    } catch (e) {
        suite.push({ name, passed: false, error: e });
        console.error(`  ✗ ${name}: ${e.message}`);
        throw e;
    }
}

console.log('=== PRUEBAS INDEPENDIENTES DEL LABORATORIO FINANCIERO FINIX ===\n');

// ─────────────────────────────────────────────────────────────
// 1. CALCULADORA: INTERÉS COMPUESTO (Investor.gov methodology)
// ─────────────────────────────────────────────────────────────
console.log('1. Interés Compuesto (compuesto):');

test('Crecimiento compuesto estándar (10.000 capital, 200/mes, 10a, 7% TEA, 3% infl)', () => {
    const tool = getTool('compuesto');
    const res = calculate(tool, { capital: 10000, contribution: 200, years: 10, annual: 7, inflation: 3, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert.strictEqual(last.contributed, 34000);
    // Capital $10.000 al 7% en 10 años: ~19.671. Aportes $200 al final: ~33.000. Total ~52.600-53.500
    assert(last.balance > 52000 && last.balance < 54000, `Saldo nominal inesperado: ${last.balance}`);
    // Saldo real debe descontar inflación del 3% en 10 años (factor ~1.3439)
    assert(last.real < last.balance, 'El saldo real debe ser menor al nominal con inflación');
    assert.strictEqual(res.rows.length, 121); // Mes 0 a 120
});

test('Caso tasa cero: 0% anual, 0% inflación', () => {
    const tool = getTool('compuesto');
    const res = calculate(tool, { capital: 10000, contribution: 200, years: 10, annual: 0, inflation: 0, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert.strictEqual(last.balance, 34000, 'Con 0% de interés, el saldo debe ser exactamente igual a los aportes');
    assert.strictEqual(last.real, 34000, 'Con 0% de inflación, el saldo real debe ser igual al nominal');
});

test('Caso tasa negativa (-5% TEA)', () => {
    const tool = getTool('compuesto');
    const res = calculate(tool, { capital: 10000, contribution: 200, years: 5, annual: -5, inflation: 0, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert(last.balance < last.contributed, 'Con rendimiento negativo, el saldo final debe ser menor al capital aportado');
    assert(last.balance > 0, 'El saldo no debe volverse negativo con -5%');
});

test('Aportes al inicio vs al cierre (Annuity Due vs Ordinary Annuity)', () => {
    const tool = getTool('compuesto');
    const resCierre = calculate(tool, { capital: 10000, contribution: 200, years: 10, annual: 7, inflation: 3, beginning: 0 });
    const resInicio = calculate(tool, { capital: 10000, contribution: 200, years: 10, annual: 7, inflation: 3, beginning: 1 });
    const lastCierre = resCierre.rows[resCierre.rows.length - 1];
    const lastInicio = resInicio.rows[resInicio.rows.length - 1];
    assert(lastInicio.balance > lastCierre.balance, 'Aportes al inicio deben generar mayor rendimiento por capitalizar un mes más cada aporte');
});

test('Deflación (-3% anual): aumento del poder adquisitivo', () => {
    const tool = getTool('compuesto');
    const res = calculate(tool, { capital: 10000, contribution: 0, years: 5, annual: 0, inflation: -3, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert.strictEqual(last.balance, 10000);
    assert(last.real > last.balance, 'Bajo deflación, el dinero de hoy tiene mayor poder adquisitivo que el saldo nominal');
});

// ─────────────────────────────────────────────────────────────
// 2. CALCULADORA: OBJETIVOS DE AHORRO (Savings Goals)
// ─────────────────────────────────────────────────────────────
console.log('\n2. Objetivos de ahorro (objetivos):');

test('Cálculo estándar de meta y aporte requerido', () => {
    const tool = getTool('objetivos');
    const res = calculate(tool, { capital: 5000, target: 50000, years: 5, annual: 7, inflation: 3, beginning: 0 });
    const aporte = res.metrics.find(m => m.label === 'Aporte mensual necesario').value;
    const metaNominal = res.metrics.find(m => m.label === 'Meta nominal futura').value;
    const last = res.rows[res.rows.length - 1];
    assert(Math.abs(last.balance - metaNominal) < 0.05, `El saldo final acumulado ${last.balance} debe coincidir con la meta nominal ${metaNominal}`);
    assert(Math.abs(last.real - 50000) < 0.05, `El saldo real en dinero de hoy debe coincidir con la meta deseada de 50.000`);
    assert(aporte > 600 && aporte < 800, `Aporte mensual fuera del rango razonable: ${aporte}`);
});

test('Caso tasa cero en objetivos (meta 60.000 en 5 años sin capital inicial)', () => {
    const tool = getTool('objetivos');
    const res = calculate(tool, { capital: 0, target: 60000, years: 5, annual: 0, inflation: 0, beginning: 0 });
    const aporte = res.metrics.find(m => m.label === 'Aporte mensual necesario').value;
    assert.strictEqual(Math.round(aporte), 1000, '60.000 en 60 meses sin interés requiere exactamente 1.000/mes');
});

test('Capital inicial ya supera la meta requerida', () => {
    const tool = getTool('objetivos');
    const res = calculate(tool, { capital: 100000, target: 50000, years: 5, annual: 7, inflation: 0, beginning: 0 });
    const aporte = res.metrics.find(m => m.label === 'Aporte mensual necesario').value;
    assert.strictEqual(aporte, 0, 'Si el capital inicial ya supera la meta futura, el aporte requerido debe ser 0');
});

test('Objetivos con aportes al inicio (beginning = 1)', () => {
    const tool = getTool('objetivos');
    const resCierre = calculate(tool, { capital: 5000, target: 50000, years: 5, annual: 7, inflation: 3, beginning: 0 });
    const resInicio = calculate(tool, { capital: 5000, target: 50000, years: 5, annual: 7, inflation: 3, beginning: 1 });
    const aporteCierre = resCierre.metrics.find(m => m.label === 'Aporte mensual necesario').value;
    const aporteInicio = resInicio.metrics.find(m => m.label === 'Aporte mensual necesario').value;
    assert(aporteInicio < aporteCierre, 'Aportar al inicio requiere menor cuota mensual al capitalizar cada mes completo');
    const lastInicio = resInicio.rows[resInicio.rows.length - 1];
    const metaNominal = resInicio.metrics.find(m => m.label === 'Meta nominal futura').value;
    assert(Math.abs(lastInicio.balance - metaNominal) < 0.05, 'Debe alcanzar la meta nominal exacta también con beginning=1');
});

// ─────────────────────────────────────────────────────────────
// 3. CALCULADORA: INFLACIÓN Y PODER ADQUISITIVO (Fisher Equation)
// ─────────────────────────────────────────────────────────────
console.log('\n3. Inflación y poder adquisitivo (inflacion):');

test('Ecuación de Fisher exacta (1 + r_real) = (1 + r_nom) / (1 + i)', () => {
    const tool = getTool('inflacion');
    const res = calculate(tool, { capital: 100000, years: 5, annual: 30, inflation: 35 });
    const rendimientoReal = res.metrics.find(m => m.label === 'Rendimiento real anual').value;
    const esperado = ((1.30 / 1.35) - 1) * 100; // -3.703703...%
    assert(Math.abs(rendimientoReal - esperado) < 0.0001, `Rendimiento real ${rendimientoReal} difiere del esperado ${esperado}`);
});

test('Inflación 0% preserva valor nominal y real idénticos', () => {
    const tool = getTool('inflacion');
    const res = calculate(tool, { capital: 100000, years: 3, annual: 10, inflation: 0 });
    const last = res.rows[res.rows.length - 1];
    assert.strictEqual(last.balance, last.real, 'Con 0% inflación, saldo nominal y saldo real deben ser exactamente iguales');
});

test('Rendimiento nominal negativo con inflación', () => {
    const tool = getTool('inflacion');
    const res = calculate(tool, { capital: 100000, years: 2, annual: -10, inflation: 20 });
    const rendimientoReal = res.metrics.find(m => m.label === 'Rendimiento real anual').value;
    const esperado = ((0.90 / 1.20) - 1) * 100; // -25.0%
    assert.strictEqual(Math.round(rendimientoReal), -25);
});

// ─────────────────────────────────────────────────────────────
// 4. CALCULADORA: IMPACTO DE COSTOS Y COMISIONES (SEC Methodology)
// ─────────────────────────────────────────────────────────────
console.log('\n4. Impacto de comisiones y costos (comisiones):');

test('Erosión por costos anuales (0.25% vs 1.00% en 20 años)', () => {
    const tool = getTool('comisiones');
    const res = calculate(tool, { capital: 10000, contribution: 200, years: 20, annual: 7, feeA: 0.25, feeB: 1.0, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert(last.a > last.b, 'Alternativa A (0.25%) debe acumular más patrimonio que B (1.00%)');
    const diff = res.metrics.find(m => m.label === 'Diferencia A menos B').value;
    assert.strictEqual(diff, last.a - last.b);
    assert(diff > 10000, `La diferencia acumulada debe ser sustancial en 20 años: ${diff}`);
});

test('Comisiones cero (feeA = 0%, feeB = 0%) igualan al saldo bruto', () => {
    const tool = getTool('comisiones');
    const res = calculate(tool, { capital: 10000, contribution: 200, years: 5, annual: 7, feeA: 0, feeB: 0, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert(Math.abs(last.a - last.balance) < 0.01, 'Con 0% costo, alternativa A debe igualar al saldo sin costos');
    assert(Math.abs(last.b - last.balance) < 0.01, 'Con 0% costo, alternativa B debe igualar al saldo sin costos');
    assert.strictEqual(res.metrics.find(m => m.label === 'Diferencia A menos B').value, 0);
});

// ─────────────────────────────────────────────────────────────
// 5. CALCULADORA: COMPARADOR DE ESCENARIOS
// ─────────────────────────────────────────────────────────────
console.log('\n5. Comparador de escenarios (escenarios):');

test('Tres escenarios: adverso (-2%), base (7%), favorable (12%)', () => {
    const tool = getTool('escenarios');
    const res = calculate(tool, { capital: 10000, contribution: 200, years: 10, low: -2, base: 7, high: 12, inflation: 3, beginning: 0 });
    const last = res.rows[res.rows.length - 1];
    assert(last.low < last.base && last.base < last.high, 'Los saldos deben cumplir estrictamente: adverso < base < favorable');
    assert(last.lowReal < last.baseReal && last.baseReal < last.highReal, 'Los saldos reales deben mantener el mismo orden');
});

test('Validación de orden incorrecto en escenarios', () => {
    const tool = getTool('escenarios');
    const errs = validate(tool, { capital: 10000, contribution: 200, years: 10, low: 8, base: 5, high: 12, inflation: 3, beginning: 0 });
    assert(errs.base, 'Debe marcar error si low > base');
});

// ─────────────────────────────────────────────────────────────
// 6. CALCULADORA: CONVERSOR DE TASAS (BCRA Metodología Oficial)
// ─────────────────────────────────────────────────────────────
console.log('\n6. Conversor de tasas (tasas - BCRA):');

test('BCRA TNA 30% a capitalización mensual (m=12) -> TEA y TEM', () => {
    const tool = getTool('tasas');
    const res = calculate(tool, { rate: 30, kind: 0, periods: 12 });
    const tna = res.metrics.find(m => m.label === 'Tasa nominal anual').value;
    const tea = res.metrics.find(m => m.label === 'Tasa efectiva anual').value;
    const tem = res.metrics.find(m => m.label === 'Tasa efectiva mensual').value;
    assert.strictEqual(tna, 30, 'TNA debe ser exactamente 30%');
    assert.strictEqual(tem, 2.5, 'TEM debe ser exactamente 30 / 12 = 2.5%');
    const expectedTea = (Math.pow(1 + 0.025, 12) - 1) * 100; // 34.4888824%
    assert(Math.abs(tea - expectedTea) < 0.0001, `TEA esperada ${expectedTea}, obtenida ${tea}`);
});

test('BCRA TEA 40% a TNA y TEM', () => {
    const tool = getTool('tasas');
    const res = calculate(tool, { rate: 40, kind: 1, periods: 12 });
    const tea = res.metrics.find(m => m.label === 'Tasa efectiva anual').value;
    const tna = res.metrics.find(m => m.label === 'Tasa nominal anual').value;
    const tem = res.metrics.find(m => m.label === 'Tasa efectiva mensual').value;
    assert.strictEqual(tea, 40, 'TEA debe ser exactamente 40%');
    const expectedTem = (Math.pow(1.40, 1/12) - 1) * 100;
    assert(Math.abs(tem - expectedTem) < 0.0001, `TEM esperada ${expectedTem}, obtenida ${tem}`);
    assert(Math.abs(tna - (expectedTem * 12)) < 0.0001, 'TNA debe ser 12 * TEM');
});

test('BCRA TEM 3% mensual a TEA y TNA', () => {
    const tool = getTool('tasas');
    const res = calculate(tool, { rate: 3, kind: 2, periods: 12 });
    const tem = res.metrics.find(m => m.label === 'Tasa efectiva mensual').value;
    const tna = res.metrics.find(m => m.label === 'Tasa nominal anual').value;
    const tea = res.metrics.find(m => m.label === 'Tasa efectiva anual').value;
    assert.strictEqual(tem, 3, 'TEM debe ser exactamente 3%');
    assert.strictEqual(tna, 36, 'TNA con m=12 debe ser 3 * 12 = 36%');
    const expectedTea = (Math.pow(1.03, 12) - 1) * 100;
    assert(Math.abs(tea - expectedTea) < 0.0001, `TEA esperada ${expectedTea}, obtenida ${tea}`);
});

test('Tasas con tasa 0%', () => {
    const tool = getTool('tasas');
    const res = calculate(tool, { rate: 0, kind: 0, periods: 12 });
    assert.strictEqual(res.metrics.find(m => m.label === 'Tasa efectiva anual').value, 0);
    assert.strictEqual(res.metrics.find(m => m.label === 'Tasa nominal anual').value, 0);
    assert.strictEqual(res.metrics.find(m => m.label === 'Tasa efectiva mensual').value, 0);
});

// ─────────────────────────────────────────────────────────────
// 7. CALCULADORA: SIMULADOR DE PRÉSTAMOS (CFPB Amortization)
// ─────────────────────────────────────────────────────────────
console.log('\n7. Simulador de préstamos (prestamos - CFPB):');

test('Amortización francesa estándar: saldo final exactamente 0', () => {
    const tool = getTool('prestamos');
    const res = calculate(tool, { principal: 100000, tna: 40, months: 24, upfront: 0 });
    const last = res.rows[res.rows.length - 1];
    assert.strictEqual(last.balance, 0, 'El saldo de la última cuota debe ser estrictamente 0');
    // Suma de amortizaciones de capital debe coincidir con el principal
    const sumaCapital = res.rows.reduce((sum, r) => sum + r.principal, 0);
    assert(Math.abs(sumaCapital - 100000) < 0.01, `Suma de amortización ${sumaCapital} debe igualar al principal 100.000`);
    // Intereses totales deben ser positivos
    const intereses = res.metrics.find(m => m.label === 'Intereses totales').value;
    assert(intereses > 40000 && intereses < 50000, `Intereses totales inesperados: ${intereses}`);
});

test('Préstamo tasa 0% (sin interés)', () => {
    const tool = getTool('prestamos');
    const res = calculate(tool, { principal: 120000, tna: 0, months: 12, upfront: 500 });
    const cuota = res.metrics.find(m => m.label === 'Cuota mensual').value;
    assert.strictEqual(cuota, 10000, 'Con 0% TNA, la cuota es exactamente principal / meses = 10.000');
    const intereses = res.metrics.find(m => m.label === 'Intereses totales').value;
    assert.strictEqual(intereses, 0, 'Con 0% TNA, el interés total debe ser 0');
    const totalConGasto = res.metrics.find(m => m.label === 'Total con costo inicial').value;
    assert.strictEqual(totalConGasto, 120500, 'Total con costo inicial debe incluir el upfront');
    assert.strictEqual(res.rows[res.rows.length - 1].balance, 0);
});

test('Préstamo a 1 solo mes', () => {
    const tool = getTool('prestamos');
    const res = calculate(tool, { principal: 10000, tna: 24, months: 1, upfront: 0 });
    assert.strictEqual(res.rows.length, 1);
    const row = res.rows[0];
    assert.strictEqual(row.principal, 10000);
    assert.strictEqual(row.interest, 200); // 10.000 * 0.24 / 12 = 200
    assert.strictEqual(row.payment, 10200);
    assert.strictEqual(row.balance, 0);
});

// ─────────────────────────────────────────────────────────────
// 8. CALCULADORA: PUNTO DE EQUILIBRIO / BREAK-EVEN
// ─────────────────────────────────────────────────────────────
console.log('\n8. Punto de equilibrio (operacion):');

test('Cálculo de precio de equilibrio con comisiones y costo fijo', () => {
    const tool = getTool('operacion');
    const res = calculate(tool, { buy: 100, sell: 110, quantity: 100, buyFee: 0.5, sellFee: 0.5, fixed: 50 });
    const eq = res.metrics.find(m => m.label === 'Precio de equilibrio por unidad').value;
    // Gasto total = 100 * 100 * 1.005 + 50 = 10050 + 50 = 10100.
    // eq * 100 * (1 - 0.005) = 10100 => eq = 10100 / 99.5 = 101.507537688...
    const esperado = 10100 / 99.5;
    assert(Math.abs(eq - esperado) < 0.0001, `Equilibrio ${eq} difiere del esperado ${esperado}`);
});

test('Operación vendiendo al precio de equilibrio da resultado 0', () => {
    const tool = getTool('operacion');
    // Ponemos sell = eq exacto
    const buy = 200;
    const qty = 50;
    const buyFee = 1.0;
    const sellFee = 1.0;
    const fixed = 20;
    const spent = buy * qty * (1 + buyFee / 100) + fixed; // 200 * 50 * 1.01 + 20 = 10120
    const eq = spent / (qty * (1 - sellFee / 100)); // 10120 / (50 * 0.99) = 10120 / 49.5 = 204.44444...

    const res = calculate(tool, { buy, sell: eq, quantity: qty, buyFee, sellFee, fixed });
    const neto = res.metrics.find(m => m.label === 'Resultado neto').value;
    assert(Math.abs(neto) < 0.0001, `Vendiendo al equilibrio, el resultado neto debe ser 0, se obtuvo ${neto}`);
});

// ─────────────────────────────────────────────────────────────
// 9. ROBUSTEZ: ENTRADAS INVÁLIDAS Y LÍMITES
// ─────────────────────────────────────────────────────────────
console.log('\n9. Validación de entradas inválidas y límites:');

test('Rechazo de valores no numéricos, NaN o infinitos', () => {
    const tool = getTool('compuesto');
    const errs = validate(tool, { capital: NaN, contribution: Infinity, years: -5, annual: 7, inflation: 3, beginning: 0 });
    assert(errs.capital, 'Debe rechazar capital NaN');
    assert(errs.contribution, 'Debe rechazar aporte Infinity');
    assert(errs.years, 'Debe rechazar años negativos');
});

test('Rechazo de valores decimales donde se requiere entero', () => {
    const tool = getTool('compuesto');
    const errs = validate(tool, { capital: 10000, contribution: 200, years: 5.5, annual: 7, inflation: 3, beginning: 0 });
    assert(errs.years, 'Debe exigir que los años sean enteros');
});

test('Rechazo de préstamos con capital cero o negativo', () => {
    const tool = getTool('prestamos');
    const errs1 = validate(tool, { principal: 0, tna: 40, months: 24, upfront: 0 });
    assert(errs1.principal, 'Debe rechazar préstamo con principal 0');
    const errs2 = validate(tool, { principal: -500, tna: 40, months: 24, upfront: 0 });
    assert(errs2.principal, 'Debe rechazar préstamo con principal negativo');
});

test('Calculate arroja error explicativo si se invoca con datos inválidos', () => {
    const tool = getTool('compuesto');
    assert.throws(() => {
        calculate(tool, { capital: -100, contribution: 200, years: 10, annual: 7, inflation: 3, beginning: 0 });
    }, /Revisá los valores ingresados/);
});

console.log(`\n======================================================`);
console.log(`RESULTADO: ${suite.filter(s => s.passed).length}/${suite.length} PRUEBAS EXITOSAS (100% PASS)`);
console.log(`======================================================\n`);
