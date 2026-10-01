import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { addMonths, commitments, cycleDue, report } from './ledger';
import { csvAmount, csvDate, parseCsv, toCsv } from './csv';

const row = (overrides: any = {}) => ({ id: 'purchase', date: '2026-10-05', amount: -120, currency: 'ARS', status: 'confirmed', type: 'expense', category: 'Hogar', details: {}, ...overrides });
const card = { id: 'card', name: 'Visa', currency: 'ARS', closingDay: 25, dueDay: 5, currentBalance: 0 };
const data = (transactions: any[], extra = {}) => ({ transactions, cards: [card], accounts: [{ id: 'a', currency: 'ARS', balance: 0 }], recurring: [], budgets: [], ...extra });

test('cuotas: gasto único, redondeo exacto, pago parcial sin nuevo gasto', () => {
    const purchase = row({ cardId: 'card', amount: -100, details: { installments: 3, firstInstallment: '2026-10-10' } });
    const income = row({ id: 'income', type: 'income', amount: 200, accountId: 'a' });
    const payment = row({ id: 'payment', type: 'card_payment', amount: -20, cardId: 'card', accountId: 'a' });
    const r = report(data([purchase, income, payment]), '2026-10', 'ARS', { dataComplete: true });
    assert.equal(r.expenses, 100); assert.equal(r.income, 200); assert.equal(r.upcoming[0].amount, 13.34);
    assert.equal(r.upcoming.reduce((n, e) => n + e.cents, 0), 8000);
    assert.equal(r.accounts[0].calculatedBalance, 180);
    assert.equal(r.estimate.value, 166.66);
    assert.equal(report(data([purchase, income, payment]), '2026-11', 'ARS', {}).expenses, 0);
});
test('transferencia propia y aporte a inversión no son gasto ni ingreso', () => {
    const r = report(data([row({ type: 'transfer', accountId: 'a', details: { destinationAccountId: 'b' } }), row({ type: 'investment', amount: -10, accountId: 'b' })], { accounts: [{ id: 'a', currency: 'ARS', balance: 200 }, { id: 'b', currency: 'ARS', balance: 0 }] }), '2026-10', 'ARS', {});
    assert.equal(r.expenses, 0); assert.equal(r.income, 0); assert.equal(r.accounts[0].calculatedBalance, 80); assert.equal(r.accounts[1].calculatedBalance, 110); assert.equal(r.estimate.paid, 10);
});
test('devolución distribuye categorías y corrige deuda sin duplicar', () => {
    const purchase = row({ cardId: 'card', details: { splits: [{ category: 'Alimentos', amount: 90 }, { category: 'Hogar', amount: 30 }] } });
    const refund = row({ id: 'refund', type: 'refund', amount: 40, cardId: 'card', details: { refundOf: 'purchase' } });
    const r = report(data([purchase, refund]), '2026-10', 'ARS', {});
    assert.equal(r.expenses, 80); assert.deepEqual(r.categories, [{ category: 'Alimentos', amount: 60 }, { category: 'Hogar', amount: 20 }]); assert.equal(r.upcoming[0].amount, 80);
});
test('ARS y USD separados; cuotas no se saldan con pagos de otra moneda', () => {
    const rows = [row({ cardId: 'card' }), row({ id: 'usd', cardId: 'card', currency: 'USD', amount: -10 }), row({ id: 'payusd', cardId: 'card', currency: 'USD', type: 'card_payment', amount: -5 })];
    const ars = report(data(rows), '2026-10', 'ARS', {}), usd = report(data(rows), '2026-10', 'USD', {});
    assert.equal(ars.expenses, 120); assert.equal(usd.expenses, 10); assert.equal(ars.upcoming[0].amount, 120); assert.equal(usd.upcoming[0].amount, 5);
});
test('pagos y devoluciones futuros no reescriben compromisos históricos', () => {
    const purchase = row({ cardId: 'card' });
    const future = [row({ id: 'f1', type: 'card_payment', cardId: 'card', date: '2026-12-05', amount: -60 }), row({ id: 'f2', type: 'refund', cardId: 'card', date: '2026-12-05', amount: 60, details: { refundOf: 'purchase' } })];
    assert.equal(report(data([purchase, ...future]), '2026-10', 'ARS', {}).upcoming[0].amount, 120);
});
test('presupuesto mixto descuenta sólo el recurrente solapado; datos faltantes visibles', () => {
    const r = report(data([row({ type: 'income', amount: 1000 })], { recurring: [{ id: 'r', name: 'Servicio', amount: 100, currency: 'ARS', category: 'Hogar', nextDate: '2026-10-10', active: true, frequency: 'monthly' }], budgets: [{ category: 'Hogar', month: 10, year: 2026, currency: 'ARS', limit: 300, alertAt: 80 }] }), '2026-10', 'ARS', { dataComplete: true, reserves: { ARS: 50 } });
    assert.equal(r.estimate.commitments, 100); assert.equal(r.estimate.variableBudget, 200); assert.equal(r.estimate.value, 650); assert.equal(r.estimate.incomplete, false);
    assert.equal(report(data([]), '2026-10', 'ARS', {}).estimate.incomplete, true); assert.ok(r.estimate.formula.includes('Ingresos confirmados'));
    assert.equal(report(data([row({ cardId: 'card', date: '2026-09-01', details: { incomplete: true } })]), '2026-10', 'ARS', { dataComplete: true }).estimate.incomplete, true);
});
test('fin de mes, cierre y primer vencimiento', () => {
    assert.equal(addMonths('2026-01-31', 1), '2026-02-28'); assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
    assert.equal(cycleDue('2026-10-25', card), '2026-11-05'); assert.equal(cycleDue('2026-10-26', card), '2026-12-05');
    assert.equal(commitments([row({ cardId: 'card', details: { incomplete: true } })], [card], [], '2026-10-01', '2027-10-01').length, 0);
});
test('CSV argentino y anglosajón: BOM, comillas, multilinea, negativos y monedas', () => {
    assert.deepEqual(parseCsv('\uFEFFFecha;Descripción;Importe\r\n01/10/2026;"Café; centro";"-1.234,56"\r\n'), [['Fecha', 'Descripción', 'Importe'], ['01/10/2026', 'Café; centro', '-1.234,56']]);
    assert.deepEqual(parseCsv('date,description,amount\n2026-10-01,"linea\ncon ""comillas""","1,234.56"', ','), [['date', 'description', 'amount'], ['2026-10-01', 'linea\ncon "comillas"', '1,234.56']]);
    assert.deepEqual(parseCsv('fecha\timporte\n01/10/2026\t123,45', '\t'), [['fecha', 'importe'], ['01/10/2026', '123,45']]);
    assert.equal(csvAmount('ARS -1.234,56'), -1234.56); assert.equal(csvAmount('USD (1,234.56)', '.'), -1234.56); assert.equal(csvAmount('US$ +20,50'), 20.5);
    assert.equal(csvDate('1/10/2026'), '2026-10-01'); assert.equal(csvDate('10/1/2026', 'MDY'), '2026-10-01'); assert.equal(csvDate('2026-10-01'), '2026-10-01');
    assert.throws(() => csvDate('31/02/2026')); assert.throws(() => csvAmount('1,234.56', ',')); assert.throws(() => parseCsv('a;"sin cerrar'));
    assert.ok(toCsv([['=HYPERLINK("bad")', -123.45]]).includes("'="));
});
