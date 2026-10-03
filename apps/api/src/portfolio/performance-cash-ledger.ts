/** Replay each currency separately. A purchase funded outside Finix is an
 * investor contribution, never a market gain. Explicit deposits and available
 * sale proceeds fund purchases first, so capital is never counted twice. */
export function buildPerformanceCashLedger(transactions: any[]) {
    const balances = new Map<string, number>();
    const events: Array<{ date: Date; currency: string; cashDelta: number; externalFlow: number }> = [];
    const ordered = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        || Number(b.type === 'DEPOSIT') - Number(a.type === 'DEPOSIT'));
    for (const tx of ordered) {
        const date = new Date(tx.date);
        const currency = String(tx.currency || 'USD').trim().toUpperCase();
        const total = Number(tx.total ?? 0);
        const fee = Number(tx.fee ?? 0);
        if (!Number.isFinite(date.getTime()) || !Number.isFinite(total) || !Number.isFinite(fee)) continue;
        let cashDelta = 0;
        let externalFlow = 0;
        if (tx.type === 'BUY') cashDelta = -(total + fee);
        else if (tx.type === 'SELL') cashDelta = total - fee;
        else if (tx.type === 'DIVIDEND') cashDelta = total;
        else if (tx.type === 'FEE') cashDelta = -total;
        else if (tx.type === 'DEPOSIT') cashDelta = externalFlow = total;
        else if (tx.type === 'WITHDRAW') cashDelta = externalFlow = -total;
        const balance = balances.get(currency) ?? 0;
        if (tx.type === 'BUY' && balance + cashDelta < 0) {
            const funding = -(balance + cashDelta);
            cashDelta += funding;
            externalFlow += funding;
        }
        balances.set(currency, balance + cashDelta);
        events.push({ date, currency, cashDelta, externalFlow });
    }
    return events;
}
