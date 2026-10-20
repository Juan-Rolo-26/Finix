import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';

export default function AnalysisRequestsPanel({ onCreate }:{onCreate:(query:string)=>void}) {
    const [data,setData] = useState<{items:any[];pending:number}>({items:[],pending:0});
    const [error,setError] = useState(''), [busy,setBusy] = useState<string|null>(null);
    const load = useCallback(async()=>{
        try { const response=await adminFetch('/admin/analysis-requests'); if(!response.ok)throw Error();setData(await response.json());setError(''); }
        catch {setError('No se pudieron actualizar las solicitudes.');}
    },[]);
    useEffect(()=>{void load();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);const refresh=()=>{void load();};window.addEventListener('focus',refresh);return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
    async function change(id:string,status:string) {
        setBusy(id);setError('');
        try {const response=await adminFetch('/admin/analysis-requests/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});if(!response.ok)throw Error();await load();}
        catch{setError('No se pudo guardar el estado de la solicitud.');}
        finally{setBusy(null);}
    }
    return <section className="rounded-2xl border border-border bg-card p-5" aria-label="Solicitudes y búsquedas de empresas">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Solicitudes y búsquedas sin resultados <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-1 text-sm text-emerald-600">{data.pending} pendientes</span></h2><p className="mt-1 text-sm text-muted-foreground">Qué empresa buscaron, quién la solicitó y cuántas veces quedó sin cobertura.</p></div><button type="button" onClick={()=>void load()} className="rounded-lg border border-border px-3 py-2 text-sm">Actualizar</button></div>
        {error&&<p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}
        {!data.items.length?<p className="mt-4 text-sm text-muted-foreground">Todavía no hay solicitudes ni búsquedas registradas.</p>:<div className="mt-4 max-h-[420px] overflow-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-border text-muted-foreground"><th className="p-3">Empresa buscada</th><th className="p-3">Usuario</th><th className="p-3">Búsquedas</th><th className="p-3">Solicitudes</th><th className="p-3">Estado</th><th className="p-3">Acción</th></tr></thead><tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border/50"><td className="p-3 font-semibold">{item.query}<span className="mt-1 block text-xs font-normal text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString('es-AR')}</span></td><td className="p-3">{item.user?.username||'Usuario'}</td><td className="p-3 tabular-nums">{item.searchCount}</td><td className="p-3 tabular-nums">{item.requestCount}</td><td className="p-3"><select aria-label={'Estado de '+item.query} disabled={busy===item.id} value={item.status} onChange={event=>void change(item.id,event.target.value)} className="rounded-lg border border-border bg-background p-2"><option value="PENDING">Pendiente</option><option value="IN_REVIEW">En revisión</option><option value="PUBLISHED">Publicado</option><option value="DISMISSED">Descartado</option></select></td><td className="p-3"><button type="button" onClick={()=>onCreate(item.query)} className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white">Crear análisis</button></td></tr>)}</tbody></table></div>}
    </section>;
}
