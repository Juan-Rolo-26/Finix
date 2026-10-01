import type { ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

export const fieldClass = 'w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
export const money = (value: unknown, currency = 'ARS') => `${currency} ${Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const today = () => new Date().toISOString().slice(0, 10);
export const meta = (row: any) => typeof row.details === 'string' ? JSON.parse(row.details || '{}') : row.details || {};
export const kinds: Record<string, string> = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia propia', card_payment: 'Pago de tarjeta', refund: 'Devolución', investment: 'Aporte a inversión' };
export async function financeRequest(path: string, body?: unknown, method = 'POST') {
    const response = await apiFetch(`/personal-finance/${path}`, body === undefined && method === 'POST' ? undefined : { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) throw new Error(response.status >= 500 || !result ? 'No pudimos guardar o cargar los datos. Intentá nuevamente.' : Array.isArray(result?.message) ? result.message.join('. ') : result?.message || 'No se pudo completar la operación');
    return result;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-muted-foreground">{label}{children}</label>;
}
export function Surface({ title, children }: { title?: string; children: ReactNode }) {
    return <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">{title && <h2 className="mb-4 font-semibold">{title}</h2>}{children}</section>;
}
export function Empty({ children }: { children: ReactNode }) {
    return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
export function financeAccess(user: any) {
    return !!user && (user.role === 'ADMIN' || user.proAccessOverride === true || (user.proAccessOverride !== false && ['PRO', 'CREATOR', 'PRO_CREATOR'].includes(user.plan) && user.subscriptionStatus === 'ACTIVE'));
}
