import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Field, fieldClass, kinds, meta, today, financeRequest } from './workspaceShared';

const definitions: Record<string, { key: string; label: string; type?: string; options?: Record<string, string>; required?: boolean }[]> = {
    accounts: [{ key: 'name', label: 'Nombre', required: true }, { key: 'institution', label: 'Institución (opcional)' }, { key: 'kind', label: 'Tipo', options: { bank: 'Cuenta bancaria', wallet: 'Billetera', cash: 'Efectivo', debit: 'Tarjeta de débito', broker: 'Cuenta de inversión' } }, { key: 'balance', label: 'Saldo inicial informativo', type: 'number' }],
    cards: [{ key: 'name', label: 'Nombre', required: true }, { key: 'brand', label: 'Marca' }, { key: 'last4', label: 'Últimos 4 dígitos (opcional)' }, { key: 'closingDay', label: 'Día de cierre (1–31)', type: 'number', required: true }, { key: 'dueDay', label: 'Día de vencimiento (1–31)', type: 'number', required: true }, { key: 'creditLimit', label: 'Límite informativo', type: 'number' }, { key: 'currentBalance', label: 'Deuda inicial, sin compras ya registradas', type: 'number' }],
    budgets: [{ key: 'category', label: 'Categoría', required: true }, { key: 'limit', label: 'Límite mensual', type: 'number', required: true }, { key: 'month', label: 'Mes (1–12)', type: 'number', required: true }, { key: 'year', label: 'Año', type: 'number', required: true }, { key: 'alertAt', label: 'Avisar al alcanzar (%)', type: 'number', required: true }],
    goals: [{ key: 'name', label: 'Meta', required: true }, { key: 'target', label: 'Objetivo', type: 'number', required: true }, { key: 'saved', label: 'Ahorro registrado', type: 'number' }, { key: 'deadline', label: 'Fecha objetivo (opcional)', type: 'date' }],
    recurring: [{ key: 'name', label: 'Servicio o compromiso', required: true }, { key: 'category', label: 'Categoría', required: true }, { key: 'amount', label: 'Importe previsto', type: 'number', required: true }, { key: 'nextDate', label: 'Primer vencimiento pendiente', type: 'date', required: true }, { key: 'frequency', label: 'Frecuencia', options: { monthly: 'Mensual', weekly: 'Semanal', yearly: 'Anual', once: 'Una vez' } }],
    transactions: [{ key: 'type', label: 'Tipo de movimiento', options: kinds }, { key: 'description', label: 'Descripción', required: true }, { key: 'amount', label: 'Importe total (positivo)', type: 'number', required: true }, { key: 'date', label: 'Fecha de compra / movimiento', type: 'date', required: true }, { key: 'category', label: 'Categoría', required: true }, { key: 'merchant', label: 'Comercio o contraparte (opcional)' }, { key: 'status', label: 'Revisión', options: { confirmed: 'Confirmado por mí', pending: 'Pendiente de revisión' } }, { key: 'notes', label: 'Notas (sin datos bancarios sensibles)' }],
};
const defaults: Record<string, any> = {
    accounts: { kind: 'bank', balance: 0 }, cards: { brand: 'Tarjeta', creditLimit: 0, currentBalance: 0 }, budgets: { alertAt: 80 }, goals: { saved: 0 },
    recurring: { category: 'Servicios', nextDate: today(), frequency: 'monthly', active: true },
    transactions: { type: 'expense', date: today(), category: 'Otros', status: 'confirmed' },
};
export function WorkspaceEditor({ resource, row, snapshot, month, currency, close, saved }: any) {
    const [form, setForm] = useState<any>(() => ({ currency, ...defaults[resource], month: Number(month.slice(5)), year: Number(month.slice(0, 4)), ...row, amount: row?.amount === undefined ? '' : Math.abs(Number(row.amount)), details: meta(row || {}) }));
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const update = (key: string, value: any) => setForm((old: any) => ({ ...old, [key]: value }));
    const detail = (key: string, value: any) => setForm((old: any) => ({ ...old, details: { ...old.details, [key]: value } }));
    const categories = [...new Set<string>([...snapshot.preferences.categories, ...snapshot.transactions.map((t: any) => t.category)])];
    async function submit(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setError('');
        try {
            const body: any = { currency: form.currency };
            for (const f of definitions[resource]) {
                const value = form[f.key];
                if (f.type === 'number') body[f.key] = Number(value || 0);
                else if (f.type === 'date') { if (value) body[f.key] = value.slice(0, 10); else if (f.key === 'deadline') body[f.key] = null; }
                else body[f.key] = value || (f.key === 'last4' ? null : '');
            }
            if (resource === 'transactions') {
                body.categoryKey = body.category;
                body.accountId = form.accountId || null;
                body.cardId = ['expense', 'refund', 'card_payment'].includes(form.type) ? form.cardId || null : null;
                body.details = { origin: form.details.origin || 'manual', incomplete: !!form.details.incomplete };
                if (form.details.postedDate) body.details.postedDate = form.details.postedDate;
                if (form.type === 'transfer') body.details.destinationAccountId = form.details.destinationAccountId || null;
                if (form.type === 'refund') body.details.refundOf = form.details.refundOf || null;
                if (form.type === 'expense') {
                    if (body.cardId && Number(form.details.installments) > 0) { body.details.installments = Number(form.details.installments); body.details.firstInstallment = form.details.firstInstallment; }
                    if (form.details.splits?.length) body.details.splits = form.details.splits.map((s: any) => ({ category: s.category, amount: Number(s.amount) }));
                    if (form.details.recurringId) { body.details.recurringId = form.details.recurringId; body.details.occurrence = form.details.occurrence; }
                }
            }
            if (resource === 'budgets') body.categoryKey = body.category;
            if (resource === 'recurring') { body.accountId = form.accountId || null; body.active = form.active !== false; }
            await financeRequest(`${resource}${row?.id ? '/' + row.id : ''}`, body, row?.id ? 'PATCH' : 'POST');
            await saved(); close();
        } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
    }
    const sources = (key: string, label: string, rows: any[], value = form[key], onChange = (v: string) => update(key, v)) => <Field label={label}><select className={fieldClass} value={value || ''} onChange={e => onChange(e.target.value)}><option value="">Sin seleccionar</option>{rows.map((r: any) => <option key={r.id} value={r.id}>{r.name || r.description} · {r.currency}</option>)}</select></Field>;
    return <Dialog open onOpenChange={v => !v && !busy && close()}><DialogContent className="max-w-2xl"><DialogTitle>{row?.id ? 'Editar registro' : 'Agregar registro'}</DialogTitle><DialogDescription>Datos privados e informativos. No se mueve dinero. No ingreses número completo de tarjeta, CVV, PIN ni contraseñas.</DialogDescription>
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">{definitions[resource].map(f => <Field key={f.key} label={f.label}>{f.options ? <select className={fieldClass} value={form[f.key] || Object.keys(f.options)[0]} onChange={e => update(f.key, e.target.value)}>{Object.entries(f.options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : <input className={fieldClass} type={f.type || 'text'} step={f.type === 'number' ? '0.01' : undefined} maxLength={f.key === 'last4' ? 4 : 1000} pattern={f.key === 'last4' ? '[0-9]{4}' : undefined} required={f.required} list={f.key === 'category' ? 'finance-categories' : undefined} value={f.type === 'date' ? (form[f.key] || '').slice(0, 10) : form[f.key] ?? ''} onChange={e => update(f.key, e.target.value)} onBlur={() => { if (f.key === 'description' && !row?.id && form.category === 'Otros') { const rule = snapshot.preferences.rules.find((r: any) => form.description?.toLowerCase().includes(r.contains.toLowerCase())); if (rule) update('category', rule.category); } }} />}</Field>)}
                <Field label="Moneda original"><select className={fieldClass} value={form.currency} onChange={e => update('currency', e.target.value)}>{['ARS', 'USD', 'EUR'].map(c => <option key={c}>{c}</option>)}</select></Field>
                {['transactions', 'recurring'].includes(resource) && sources('accountId', 'Cuenta / efectivo (origen)', snapshot.accounts.filter((a: any) => a.currency === form.currency))}
                {resource === 'transactions' && <>
                    {['expense', 'refund', 'card_payment'].includes(form.type) && sources('cardId', 'Tarjeta de crédito (opcional en gastos)', snapshot.cards)}
                    <Field label="Fecha de contabilización (opcional)"><input type="date" className={fieldClass} value={form.details.postedDate || ''} onChange={e => detail('postedDate', e.target.value)} /></Field>
                    {form.type === 'transfer' && sources('destinationAccountId', 'Cuenta de destino', snapshot.accounts.filter((a: any) => a.id !== form.accountId && a.currency === form.currency), form.details.destinationAccountId, v => detail('destinationAccountId', v))}
                    {form.type === 'refund' && sources('refundOf', 'Compra original', snapshot.transactions.filter((t: any) => t.type === 'expense' && t.currency === form.currency && t.status === 'confirmed'), form.details.refundOf, v => { const original = snapshot.transactions.find((t: any) => t.id === v); setForm((old: any) => ({ ...old, cardId: original?.cardId, accountId: original?.accountId, details: { ...old.details, refundOf: v } })); })}
                    {form.type === 'expense' && form.cardId && <><Field label="Cantidad de cuotas (vacío: un pago)"><input type="number" min="1" max="120" className={fieldClass} value={form.details.installments || ''} onChange={e => detail('installments', e.target.value)} /></Field><Field label="Primera cuota (si hay cuotas)"><input type="date" required={Number(form.details.installments) > 0} className={fieldClass} value={form.details.firstInstallment || ''} onChange={e => detail('firstInstallment', e.target.value)} /></Field></>}
                </>}
            </div>
            <datalist id="finance-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            {resource === 'transactions' && <>
                <p className="text-xs text-muted-foreground">Origen: {form.details.origin === 'csv' ? 'CSV importado' : 'Carga manual'}. Las cuotas distribuyen el importe total, no agregan nuevos gastos. Un aporte a inversión reduce la cuenta sin registrar una operación en Portafolio.</p>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.details.incomplete} onChange={e => detail('incomplete', e.target.checked)} />Faltan datos por completar (no proyectar cuotas)</label>
                {form.type === 'expense' && <div className="space-y-2"><Button type="button" variant="outline" size="sm" onClick={() => detail('splits', [...(form.details.splits || []), { category: '', amount: '' }])}>Dividir en categorías</Button>{(form.details.splits || []).map((s: any, i: number) => <div key={i} className="flex gap-2"><input aria-label={`Categoría ${i + 1}`} list="finance-categories" required className={fieldClass} value={s.category} onChange={e => detail('splits', form.details.splits.map((v: any, j: number) => i === j ? { ...v, category: e.target.value } : v))} /><input aria-label={`Importe ${i + 1}`} type="number" step="0.01" min="0" required className={fieldClass} value={s.amount} onChange={e => detail('splits', form.details.splits.map((v: any, j: number) => i === j ? { ...v, amount: e.target.value } : v))} /><Button type="button" variant="ghost" aria-label={`Quitar categoría ${i + 1}`} onClick={() => detail('splits', form.details.splits.filter((_: any, j: number) => i !== j))}>×</Button></div>)}{form.details.splits?.length > 0 && <p className="text-xs text-muted-foreground">La suma debe coincidir exactamente con el total.</p>}</div>}
            </>}
            {resource === 'recurring' && <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active !== false} onChange={e => update('active', e.target.checked)} />Proyectar próximos vencimientos</label>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button><Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button></div>
        </form>
    </DialogContent></Dialog>;
}
