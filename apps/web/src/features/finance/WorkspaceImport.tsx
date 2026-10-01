import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Empty, Field, fieldClass, financeRequest, money, Surface } from './workspaceShared';

export function WorkspaceImport({ snapshot, saved, edit }: any) {
    const [config, setConfig] = useState<any>({ text: '', mapping: { date: '0', description: '1', amount: '2', currency: '' }, currency: 'ARS', decimal: ',', dateOrder: 'DMY', positiveType: 'income', delimiter: ';', accountId: '', cardId: '' });
    const [preview, setPreview] = useState<any>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const change = (key: string, value: any) => { setConfig((c: any) => ({ ...c, [key]: value })); setPreview(null); setMessage(''); };
    async function check() {
        setBusy(true); setMessage('');
        try { const result = await financeRequest('import/preview', config); setHeaders(result.headers); setPreview(result); setSelected(result.rows.filter((r: any) => !r.error && !r.duplicate && !r.ambiguous).map((r: any) => r.line)); }
        catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
    }
    async function confirm() {
        setBusy(true); setMessage('');
        try { const result = await financeRequest('import/confirm', { ...config, selectedLines: selected, confirm: true }); setMessage(`${result.imported} importados, pendientes de revisión. ${result.omitted} omitidos. Revisá y confirmá cada movimiento desde Movimientos.`); setPreview(null); await saved(); }
        catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
    }
    return <Surface title="Importar movimientos CSV"><div className="space-y-5">
        <p className="text-sm text-muted-foreground">El archivo se procesa sin almacenarlo. Primero elegí la fuente y las columnas; después revisá la vista previa. No se importan PDFs ni credenciales bancarias. Máximo 2000 filas y 1 MB en esta pantalla.</p>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="1. Archivo CSV (UTF-8)"><input type="file" accept=".csv,text/csv" className={fieldClass} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_000_000) { setMessage('El archivo supera 1 MB. Dividilo antes de importar.'); return; } const text = await file.text(); change('text', text); setHeaders([]); }} /></Field>
            <Field label="2. Cuenta o tarjeta"><select className={fieldClass} value={config.cardId ? `card:${config.cardId}` : config.accountId ? `account:${config.accountId}` : ''} onChange={e => { const [kind, id] = e.target.value.split(':'); setConfig((c: any) => ({ ...c, accountId: kind === 'account' ? id : '', cardId: kind === 'card' ? id : '' })); setPreview(null); }}><option value="">Elegí la fuente</option>{snapshot.accounts.map((a: any) => <option key={a.id} value={`account:${a.id}`}>{a.name} · {a.currency}</option>)}{snapshot.cards.map((a: any) => <option key={a.id} value={`card:${a.id}`}>{a.name} · tarjeta</option>)}</select></Field>
            <Field label="Separador"><select className={fieldClass} value={config.delimiter} onChange={e => change('delimiter', e.target.value)}><option value=";">Punto y coma (;)</option><option value=",">Coma (,)</option><option value={'\t'}>Tabulación</option></select></Field>
            <Field label="Decimales"><select className={fieldClass} value={config.decimal} onChange={e => change('decimal', e.target.value)}><option value=",">Coma: 1.234,56</option><option value=".">Punto: 1,234.56</option></select></Field>
            <Field label="Fechas (ISO también aceptado)"><select className={fieldClass} value={config.dateOrder} onChange={e => change('dateOrder', e.target.value)}><option value="DMY">Día / mes / año</option><option value="MDY">Mes / día / año</option></select></Field>
            <Field label="Un importe positivo significa"><select className={fieldClass} value={config.positiveType} onChange={e => change('positiveType', e.target.value)}><option value="income">Ingreso (negativo = gasto)</option><option value="expense">Gasto (negativo = ingreso a revisar)</option></select></Field>
            <Field label="Moneda cuando no hay columna"><select className={fieldClass} value={config.currency} onChange={e => change('currency', e.target.value)}>{['ARS', 'USD', 'EUR'].map(c => <option key={c}>{c}</option>)}</select></Field>
            {Object.entries({ date: 'Fecha', description: 'Descripción', amount: 'Importe', currency: 'Moneda (opcional)' }).map(([key, label]) => <Field key={key} label={`Columna: ${label}`}><select className={fieldClass} value={config.mapping[key]} onChange={e => change('mapping', { ...config.mapping, [key]: e.target.value })}>{key === 'currency' && <option value="">Usar moneda elegida</option>}{(headers.length ? headers : ['Columna 1', 'Columna 2', 'Columna 3', 'Columna 4']).map((h, i) => <option key={i} value={i}>{i + 1}. {h || '(sin título)'}</option>)}</select></Field>)}
        </fieldset>
        <Button disabled={busy || !config.text} variant="outline" onClick={check}>{busy ? 'Procesando…' : headers.length ? 'Actualizar vista previa' : '3. Leer columnas y previsualizar'}</Button>
        {message && <p role="status" className="rounded-xl bg-secondary p-3 text-sm">{message}</p>}
        {preview && <><p className="text-sm text-muted-foreground">4. Confirmá las filas seleccionadas. Los posibles duplicados y datos ambiguos se omiten; podés abrirlos para completar manualmente. Nada se incluye en informes hasta confirmarlo.</p>
            <div className="max-h-96 space-y-2 overflow-y-auto">{preview.rows.map((r: any) => <div key={r.line} className="flex items-start gap-3 rounded-xl border border-border p-3"><input aria-label={`Importar fila ${r.line}`} type="checkbox" disabled={busy || !!(r.error || r.duplicate || r.ambiguous)} checked={selected.includes(r.line)} onChange={e => setSelected(s => e.target.checked ? [...s, r.line] : s.filter(v => v !== r.line))} /><div className="min-w-0 flex-1 text-sm"><p className="break-words">Fila {r.line}: {r.row?.description || r.error}</p>{r.row && <p className="text-xs text-muted-foreground">{r.row.date} · {money(r.row.amount, r.row.currency)} · {r.row.type === 'expense' ? 'Gasto' : 'Ingreso'}</p>}<p className="text-xs text-muted-foreground">{r.error ? 'Corregí formato o columnas' : r.duplicate ? 'Ya importado: se omite' : r.ambiguous ? 'Posible duplicado o dato ambiguo: requiere revisión manual' : 'Listo para importar pendiente de revisión'}</p></div>{r.ambiguous && !r.duplicate && <Button size="sm" variant="outline" disabled={busy} onClick={() => edit('transactions', r.row)}>Revisar</Button>}</div>)}</div>
            {!preview.rows.length && <Empty>No hay filas de movimientos en el archivo.</Empty>}
            <Button disabled={busy || !selected.length} onClick={confirm}>5. Confirmar importación de {selected.length} filas</Button>
        </>}
    </div></Surface>;
}
