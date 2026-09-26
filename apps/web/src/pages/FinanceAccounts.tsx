import { ArrowUpRight, Landmark, MoreHorizontal, RefreshCw, Wallet, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createFinanceRecord, useFinanceSnapshot } from '@/features/finance/financeApi';
import { useFinancePreferences } from '@/features/finance/financePreferences';
import type { FinanceAccount } from '@/features/finance/types';
import { FinanceAmount, FinanceDelta, FinancePageFrame, FinanceSectionHeading, FinanceSurface, SyncButton, ViewAllLink } from '@/features/finance/FinanceComponents';
import { cn } from '@/lib/utils';

function accountIcon(account: FinanceAccount) {
    if (account.kind === 'bank') return <Landmark className="h-5 w-5" />;
    if (account.kind === 'broker') return <ArrowUpRight className="h-5 w-5" />;
    if (account.kind === 'wallet') return <Wallet className="h-5 w-5" />;
    return <Wifi className="h-5 w-5" />;
}

function accountTone(kind: FinanceAccount['kind']) {
    if (kind === 'bank') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    if (kind === 'broker') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (kind === 'wallet') return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
    return 'bg-secondary text-muted-foreground';
}

export default function FinanceAccounts() {
    const { snapshot, reload, request, loading } = useFinanceSnapshot();
    const accounts = snapshot.accounts;
    const currency = useFinancePreferences((state) => state.currency);
    const total = accounts.reduce((sum, account) => sum + (account.balanceReference ?? account.balanceArs), 0);

    const addAccount = async () => {
        const name = window.prompt('Nombre de la cuenta (por ejemplo, Caja de ahorro)');
        if (!name?.trim()) return;
        const balance = Number(window.prompt('Saldo inicial', '0') || 0);
        await createFinanceRecord('accounts', { name: name.trim(), institution: name.trim(), kind: 'bank', currency: 'ARS', balance: Number.isFinite(balance) ? balance : 0 });
        await reload();
    };

    const syncAccounts = async () => {
        await Promise.all(accounts.map((account) => request(`/personal-finance/accounts/${account.id}/sync`, { method: 'POST' })));
        await reload();
    };

    return (
        <FinancePageFrame title="Cuentas" description="Consolidá bancos, billeteras, brokers y efectivo en una sola vista." actionLabel="Agregar cuenta" onAction={() => void addAccount()}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Saldo consolidado</p><FinanceAmount value={total} currency={currency} className="mt-1 block text-3xl font-semibold tracking-tight" /></div><Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void syncAccounts()}>Sincronizar todo</Button></div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accounts.map((account) => <FinanceSurface key={account.id} className="rounded-2xl p-5 transition-colors hover:border-primary/40"><div className="flex items-start justify-between gap-3"><div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', accountTone(account.kind))}>{accountIcon(account)}</div><button type="button" aria-label={`Opciones de ${account.institution}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{account.institution}</p><h2 className="mt-1 text-lg font-semibold">{account.name}</h2><FinanceAmount value={account.balanceReference ?? account.balanceArs} currency={currency} className="mt-5 block text-2xl font-semibold" /><div className="mt-2 flex items-center justify-between"><FinanceDelta value={account.change} /><span className="text-[11px] text-muted-foreground">{account.lastSync === 'Manual' ? 'Manual' : new Date(account.lastSync).toLocaleString('es-AR')}</span></div><div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3"><span className="text-xs text-muted-foreground">{account.currency} · {account.kind === 'broker' ? 'Inversiones' : account.kind === 'wallet' ? 'Billetera virtual' : account.kind === 'cash' ? 'Manual' : 'Cuenta bancaria'}</span><ViewAllLink to={`/finanzas/cuentas/${account.id}`}>Detalle</ViewAllLink></div></FinanceSurface>)}
                <button type="button" onClick={() => void addAccount()} className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-transparent px-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary">+</span><span className="mt-4 text-sm font-semibold">Agregar otra cuenta</span><span className="mt-1 max-w-[210px] text-xs leading-5 text-muted-foreground">Banco, billetera, broker o efectivo manual</span></button>
            </div>

            <FinanceSurface className="mt-8 overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-border/70 px-5 py-5"><FinanceSectionHeading title="Todas tus cuentas" /><SyncButton onClick={() => void syncAccounts()} /></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-secondary/35 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Cuenta</th><th className="px-5 py-3 font-semibold">Tipo</th><th className="px-5 py-3 text-right font-semibold">Saldo</th><th className="px-5 py-3 text-right font-semibold">Variación</th><th className="px-5 py-3 text-right font-semibold">Sincronización</th></tr></thead><tbody className="divide-y divide-border/60">{accounts.map((account) => <tr key={account.id} className="transition-colors hover:bg-secondary/25"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accountTone(account.kind))}>{accountIcon(account)}</span><div><p className="font-semibold">{account.institution}</p><p className="text-xs text-muted-foreground">{account.name}</p></div></div></td><td className="px-5 py-4 text-muted-foreground">{account.currency} · {account.kind}</td><td className="px-5 py-4 text-right font-semibold"><FinanceAmount value={account.balanceReference ?? account.balanceArs} currency={currency} /></td><td className="px-5 py-4 text-right"><FinanceDelta value={account.change} /></td><td className="px-5 py-4 text-right text-xs text-muted-foreground">{account.lastSync === 'Manual' ? 'Manual' : new Date(account.lastSync).toLocaleString('es-AR')}</td></tr>)}</tbody></table></div><div className="flex items-center gap-2 border-t border-border/70 px-5 py-4 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {loading ? 'Sincronizando…' : 'Registros privados de tu cuenta · No almacenamos credenciales bancarias'}</div></FinanceSurface>
        </FinancePageFrame>
    );
}
