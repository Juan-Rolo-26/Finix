// Pure accounting functions. Monetary calculations use integer minor units.
export const cents = (value: unknown) => Math.round(Number(value || 0) * 100);
export const amount = (value: number) => value / 100;
export const iso = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
export const details = (row: any) => typeof row.details === 'string' ? JSON.parse(row.details || '{}') : row.details || {};
export function addMonths(date: string, offset: number) {
    const d = new Date(date + 'T12:00:00Z');
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + offset);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
    return iso(d);
}
export function monthDay(month: string, day: number) {
    const last = new Date(Date.UTC(Number(month.slice(0,4)), Number(month.slice(5,7)), 0)).getUTCDate();
    return month.slice(0,7) + '-' + String(Math.min(day, last)).padStart(2,'0');
}
export function cycleDue(date: string, card: any) {
    if (!card?.closingDay || !card?.dueDay) return null;
    const base = date.slice(0, 7) + '-01';
    const closing = addMonths(base, Number(date.slice(8)) > card.closingDay ? 1 : 0);
    const month = addMonths(closing, card.dueDay <= card.closingDay ? 1 : 0);
    return monthDay(month, card.dueDay);
}
export function expenseCents(row: any) {
    if (row.status !== 'confirmed') return 0;
    return row.type === 'expense' ? Math.abs(cents(row.amount)) : row.type === 'refund' ? -Math.abs(cents(row.amount)) : 0;
}
export function splitExpenses(row: any, transactions: any[]) {
    const value = expenseCents(row);
    const original = row.type === 'refund' ? transactions.find(t => t.id === details(row).refundOf) : row;
    const splits = details(original || row).splits || [];
    const total = Math.abs(cents(original?.amount || row.amount));
    if (!splits.length || !total) return [{ category: row.category, value }];
    let remaining = value;
    return splits.map((s: any, i: number) => {
        const part = i === splits.length - 1 ? remaining : Math.round(value * cents(s.amount) / total);
        remaining -= part;
        return { category: s.category, value: part };
    });
}
export function commitments(transactions: any[], cards: any[], recurring: any[], start: string, end: string, asOf = end) {
    const events: any[] = [];
    const confirmed = transactions.filter(t => t.status === 'confirmed' && iso(t.date) <= asOf);
    for (const row of confirmed.filter(t => t.cardId && t.type === 'expense')) {
        const meta = details(row);
        const card = cards.find(c => c.id === row.cardId);
        const first = meta.firstInstallment || cycleDue(iso(row.date), card);
        if (!first || meta.incomplete) continue;
        const count = meta.installments || 1;
        const total = Math.abs(cents(row.amount));
        const base = Math.floor(total / count);
        for (let i = 0; i < count; i++) {
            events.push({ id: row.id + ':' + i, transactionId: row.id, cardId: row.cardId,
                title: row.description, date: addMonths(first, i), currency: row.currency,
                cents: base + (i < total % count ? 1 : 0), installment: i + 1, count, kind: 'card' });
        }
    }
    events.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    // Refunds cancel the linked purchase's latest obligations first.
    for (const refund of confirmed.filter(t => t.type === 'refund' && t.cardId)) {
        let credit = Math.abs(cents(refund.amount));
        for (const e of [...events].reverse().filter(e => e.transactionId === details(refund).refundOf)) {
            const used = Math.min(e.cents, credit); e.cents -= used; credit -= used;
        }
    }
    // Payments settle oldest obligations, without creating another expense.
    for (const card of cards) for (const currency of ['ARS', 'USD', 'EUR']) {
        let paid = confirmed.filter(t => t.cardId === card.id && t.currency === currency && t.type === 'card_payment' && iso(t.date) <= end)
            .reduce((sum, t) => sum + Math.abs(cents(t.amount)), 0);
        // Opening debt takes priority over new purchases.
        paid = Math.max(0, paid - (card.currency === currency ? cents(card.currentBalance) : 0));
        for (const e of events.filter(e => e.cardId === card.id && e.currency === currency)) {
            const used = Math.min(e.cents, paid); e.cents -= used; paid -= used;
        }
        const opening = card.currency === currency ? cents(card.currentBalance) : 0;
        const allPayments = confirmed.filter(t => t.cardId === card.id && t.currency === currency && t.type === 'card_payment' && iso(t.date) <= end).reduce((s,t) => s + Math.abs(cents(t.amount)),0);
        if (opening > allPayments && card.dueDay) {
            const date = cycleDue(addMonths(start.slice(0,7) + '-01', -1), card);
            if (date) events.push({ id: 'opening-' + card.id, cardId: card.id, title: 'Deuda inicial · ' + card.name, date, currency, cents: opening - allPayments, kind: 'card' });
        }
    }
    for (const r of recurring.filter(r => r.active)) {
        let date = iso(r.nextDate);
        for (let i = 0; i < 1200 && date <= end; i++) {
            const paid = confirmed.some(t => details(t).recurringId === r.id && details(t).occurrence === date);
            if (!paid) events.push({ id: r.id + ':' + date, recurringId: r.id, title: r.name, date, currency: r.currency, cents: cents(r.amount), kind: 'recurring', estimated: true });
            if (r.frequency === 'once') break;
            date = r.frequency === 'weekly' ? iso(new Date(new Date(date).getTime() + 7 * 86400000)) : addMonths(iso(r.nextDate), (i + 1) * (r.frequency === 'yearly' ? 12 : 1));
        }
    }
    return events.filter(e => e.cents > 0 && e.date <= end).map(e => ({ ...e, amount: amount(e.cents), overdue: e.date < start })).sort((a,b) => a.date.localeCompare(b.date));
}
export function report(data: any, month: string, currency: string, prefs: any) {
    const { transactions, accounts, cards, budgets, recurring } = data;
    const start = month + '-01', end = addMonths(start, 1);
    const rows = transactions.filter((t: any) => t.currency === currency && iso(t.date) >= start && iso(t.date) < end);
    const confirmed = rows.filter((t: any) => t.status === 'confirmed');
    const income = confirmed.filter((t: any) => t.type === 'income').reduce((s: number,t: any) => s + Math.abs(cents(t.amount)), 0);
    const expenses = confirmed.reduce((s: number,t: any) => s + expenseCents(t), 0);
    const categories: Record<string, number> = {};
    for (const t of confirmed) for (const s of splitExpenses(t, transactions)) categories[s.category] = (categories[s.category] || 0) + s.value;
    const planned = budgets.filter((b: any) => b.currency === currency && b.month === Number(month.slice(5)) && b.year === Number(month.slice(0,4))).map((b: any) => ({
        ...b, limit: Number(b.limit), spent: amount(categories[b.category] || 0),
        remaining: amount(Math.max(0,cents(b.limit) - (categories[b.category] || 0))),
        alert: cents(b.limit) > 0 && (categories[b.category] || 0) / cents(b.limit) * 100 >= b.alertAt,
    }));
    const asOf = iso(new Date(new Date(end).getTime() - 86400000));
    const upcoming = commitments(transactions, cards, recurring, start, addMonths(start,12), asOf).filter(e => e.currency === currency);
    const due = upcoming.filter(e => e.date < end).reduce((s,e) => s + e.cents, 0);
    // Cash basis for this estimate: card purchases are commitments, not cash out twice.
    const paidCash = confirmed.filter((t: any) => ['card_payment', 'investment'].includes(t.type) || ((t.type === 'expense' || t.type === 'refund') && !t.cardId))
        .reduce((s: number,t: any) => s + (['card_payment', 'investment'].includes(t.type) ? Math.abs(cents(t.amount)) : expenseCents(t)), 0);
    const reserved = cents(prefs.reserves?.[currency] || 0);
    // Only subtract the overlapping commitment, not an entire mixed category.
    const variable = planned.reduce((sum: number, b: any) => {
        const overlap = upcoming.filter(e => e.kind === 'recurring' && e.date < end && recurring.find((r: any) => r.id === e.recurringId)?.category === b.category).reduce((n,e) => n + e.cents, 0);
        return sum + Math.max(0, cents(b.remaining) - overlap);
    }, 0);
    const fixed = confirmed.filter((t: any) => Boolean(details(t).recurringId)).reduce((s: number,t: any) => s + expenseCents(t), 0);
    const balances = accounts.map((a: any) => {
        let balance = cents(a.balance);
        for (const t of transactions.filter((t: any) => t.status === 'confirmed' && t.currency === a.currency)) {
            const n = Math.abs(cents(t.amount)), meta = details(t);
            if (t.accountId === a.id && (!t.cardId || t.type === 'card_payment')) balance += ['income','refund'].includes(t.type) ? n : -n;
            if (t.type === 'transfer' && meta.destinationAccountId === a.id) balance += n;
        }
        return { ...a, openingBalance: Number(a.balance), calculatedBalance: amount(balance) };
    });
    return { month, currency, income: amount(income), expenses: amount(expenses), difference: amount(income-expenses),
        pendingCount: rows.length - confirmed.length, categories: Object.entries(categories).map(([category,value]) => ({ category, amount: amount(value) })),
        fixed: amount(fixed), variable: amount(expenses-fixed), budgets: planned, upcoming, accounts: balances,
        estimate: { hidden: prefs.hideEstimate === true, income: amount(income), paid: amount(paidCash), commitments: amount(due), variableBudget: amount(variable), reserve: amount(reserved),
            value: amount(income-paidCash-due-variable-reserved), incomplete: !income || transactions.some((t: any) => t.currency === currency && iso(t.date) < end && (t.status !== 'confirmed' || details(t).incomplete || (t.cardId && t.type === 'expense' && !details(t).firstInstallment && !cycleDue(iso(t.date), cards.find((c: any) => c.id === t.cardId))))) || !prefs.dataComplete,
            formula: 'Ingresos confirmados − salidas pagadas − compromisos pendientes del mes (incluye atrasados) − presupuesto variable restante − reserva. Compras con tarjeta se descuentan al pagarse o como compromiso, una sola vez.' } };
}
