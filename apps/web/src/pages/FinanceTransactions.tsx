import { useMemo, useState } from 'react';
import { ArrowDownLeft, Download, Filter, MoreHorizontal, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createFinanceRecord, useFinanceSnapshot } from '@/features/finance/financeApi';
import { useFinancePreferences } from '@/features/finance/financePreferences';
import { FinanceAmount, FinancePageFrame, FinanceSectionHeading, FinanceSurface, SearchField, formatShortDate } from '@/features/finance/FinanceComponents';
import { cn } from '@/lib/utils';

export default function FinanceTransactions() {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('all');
    const [category, setCategory] = useState('all');
    const currency = useFinancePreferences((state) => state.currency);
    const { snapshot, reload } = useFinanceSnapshot();
    const transactions = snapshot.transactions;

    const filtered = useMemo(() => transactions.filter((transaction) => {
        const matchesQuery = `${transaction.description} ${transaction.merchant} ${transaction.account}`.toLowerCase().includes(query.toLowerCase());
        const matchesType = type === 'all' || transaction.type === type;
        const matchesCategory = category === 'all' || transaction.categoryKey === category;
        return matchesQuery && matchesType && matchesCategory;
    }), [category, query, type]);

    const income = filtered.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = filtered.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    const addTransaction = async () => {
        const description = window.prompt('Descripción del movimiento');
        if (!description?.trim()) return;
        const rawAmount = Number(window.prompt('Importe positivo', '0') || 0);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) return;
        const isIncome = window.confirm('¿Es un ingreso? Aceptar = ingreso, cancelar = gasto');
        await createFinanceRecord('transactions', { description: description.trim(), merchant: description.trim(), category: isIncome ? 'Ingresos' : 'Otros', categoryKey: isIncome ? 'income' : 'other', type: isIncome ? 'income' : 'expense', amount: rawAmount, currency: snapshot.currency });
        await reload();
    };

    const exportCsv = () => {
        const header = ['Fecha', 'Descripción', 'Comercio', 'Categoría', 'Cuenta', 'Tipo', 'Importe', 'Moneda', 'Estado'];
        const rows = filtered.map((item) => [item.date, item.description, item.merchant, item.category, item.account, item.type, String(item.amount), item.currency, item.status]);
        const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'finix-movimientos.csv'; anchor.click(); URL.revokeObjectURL(url);
    };

    return (
        <FinancePageFrame title="Movimientos" description="Buscá, filtrá y entendé cada peso que entra o sale de tus cuentas." actionLabel="Agregar movimiento" onAction={() => void addTransaction()}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><FinanceSurface className="rounded-xl p-4"><p className="text-xs text-muted-foreground">Ingresos visibles</p><FinanceAmount value={income} currency={currency} className="mt-2 block text-xl font-semibold text-emerald-600 dark:text-emerald-400" /></FinanceSurface><FinanceSurface className="rounded-xl p-4"><p className="text-xs text-muted-foreground">Gastos visibles</p><FinanceAmount value={expenses} currency={currency} className="mt-2 block text-xl font-semibold" /></FinanceSurface><FinanceSurface className="rounded-xl p-4"><p className="text-xs text-muted-foreground">Resultado del filtro</p><FinanceAmount value={income - expenses} currency={currency} className={cn('mt-2 block text-xl font-semibold', income - expenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')} /></FinanceSurface></div>

            <FinanceSurface className="mt-6 rounded-2xl p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><SearchField value={query} onChange={setQuery} placeholder="Buscar comercio, descripción o cuenta" /><div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="transaction-type">Tipo</label><select id="transaction-type" value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="all">Todos los tipos</option><option value="income">Ingresos</option><option value="expense">Gastos</option><option value="investment">Inversiones</option><option value="transfer">Transferencias</option></select><label className="sr-only" htmlFor="transaction-category">Tipo de categoría</label><select id="transaction-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="all">Todas las categorías</option><option value="food">Supermercado</option><option value="restaurants">Restaurantes</option><option value="services">Servicios</option><option value="transport">Transporte</option><option value="shopping">Compras</option><option value="investments">Inversiones</option></select><Button variant="outline" size="icon" aria-label="Más filtros"><Filter className="h-4 w-4" /></Button><Button variant="outline" onClick={exportCsv} leftIcon={<Download className="h-4 w-4" />}>Exportar</Button></div></div></FinanceSurface>

            <FinanceSurface className="mt-6 overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-border/70 px-5 py-5"><FinanceSectionHeading title={`${filtered.length} movimientos`} /><span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span></div><div className="hidden overflow-x-auto md:block"><table className="min-w-full text-left text-sm"><thead className="bg-secondary/35 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Fecha</th><th className="px-5 py-3 font-semibold">Descripción</th><th className="px-5 py-3 font-semibold">Categoría</th><th className="px-5 py-3 font-semibold">Cuenta</th><th className="px-5 py-3 font-semibold">Estado</th><th className="px-5 py-3 text-right font-semibold">Importe</th><th className="w-10 px-3" /></tr></thead><tbody className="divide-y divide-border/60">{filtered.map((transaction) => { const positive = transaction.amount >= 0; return <tr key={transaction.id} className="transition-colors hover:bg-secondary/25"><td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{formatShortDate(transaction.date)}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">{positive ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Receipt className="h-4 w-4 text-muted-foreground" />}</span><div><p className="font-semibold">{transaction.description}</p><p className="text-xs text-muted-foreground">{transaction.merchant}</p></div></div></td><td className="px-5 py-4 text-xs text-muted-foreground">{transaction.category}</td><td className="px-5 py-4 text-xs text-muted-foreground">{transaction.account}</td><td className="px-5 py-4"><span className={cn('rounded-full px-2 py-1 text-[11px] font-semibold', transaction.status === 'pending' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-secondary text-muted-foreground')}>{transaction.status === 'pending' ? 'Pendiente' : 'Confirmado'}</span></td><td className={cn('whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>{positive ? '+' : ''}<FinanceAmount value={transaction.amount} currency={currency} /></td><td className="px-3 py-4"><button type="button" aria-label={`Opciones de ${transaction.description}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button></td></tr>; })}</tbody></table></div><div className="divide-y divide-border/60 md:hidden">{filtered.map((transaction) => { const positive = transaction.amount >= 0; return <div key={transaction.id} className="flex items-center gap-3 px-4 py-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">{positive ? <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Receipt className="h-4 w-4 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{transaction.description}</p><p className="truncate text-xs text-muted-foreground">{transaction.merchant} · {formatShortDate(transaction.date)}</p></div><div className="text-right"><p className={cn('text-sm font-semibold tabular-nums', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground')}>{positive ? '+' : ''}<FinanceAmount value={transaction.amount} currency={currency} /></p><p className="text-[11px] text-muted-foreground">{transaction.category}</p></div></div>; })}</div>{filtered.length === 0 ? <div className="px-6 py-14 text-center"><p className="text-sm font-semibold">No encontramos movimientos</p><p className="mt-1 text-xs text-muted-foreground">Probá con otra búsqueda o agregá tu primer movimiento.</p></div> : null}</FinanceSurface>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {transactions.filter((transaction) => transaction.status === 'pending').length} movimientos pendientes · Tus registros se guardan en la base de datos</div>
        </FinancePageFrame>
    );
}
