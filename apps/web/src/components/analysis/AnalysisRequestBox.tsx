import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function AnalysisRequestBox({ query = '' }: { query?: string }) {
    const user = useAuthStore(state => state.user);
    const [term,setTerm] = useState(query), [busy,setBusy] = useState(false);
    const [feedback,setFeedback] = useState<{text:string;slug?:string;error?:boolean}|null>(null);
    useEffect(() => { setTerm(query); setFeedback(null); },[query]);
    async function submit(event:FormEvent) {
        event.preventDefault();
        if (!user || busy || term.trim().length < 2) return;
        setBusy(true); setFeedback(null);
        try {
            const response = await apiFetch('/analysis/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:term.trim(),intent:'REQUEST'})});
            const data = await response.json();
            if (!response.ok) throw Error(typeof data.message==='string'?data.message:'No pudimos registrar la solicitud. Intentá de nuevo.');
            setFeedback({text:data.message,slug:data.available?data.slug:undefined});
        } catch(error:any) { setFeedback({text:error.message || 'No pudimos enviar la solicitud.',error:true}); }
        finally { setBusy(false); }
    }
    return <section className="rounded-2xl border border-primary/20 bg-card p-5 sm:p-6" aria-label="Solicitar una empresa">
        <div className="flex items-start gap-3"><Search className="mt-1 h-5 w-5 shrink-0 text-primary"/><div><h2 className="text-lg font-bold">¿No encontrás la empresa que buscás?</h2><p className="mt-1 text-sm text-muted-foreground">Pedí que la sumemos al análisis fundamental. El equipo de Finix recibe tu solicitud y las búsquedas sin resultados.</p></div></div>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">Empresa o ticker a solicitar</span><input value={term} onChange={event=>{setTerm(event.target.value);setFeedback(null);}} minLength={2} maxLength={80} required disabled={!user||busy} placeholder="Ej.: Palantir o PLTR" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"/></label><Button type="submit" disabled={!user||busy||term.trim().length<2} className="h-11 gap-2">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}Solicitar análisis</Button></form>
        {!user&&<p className="mt-3 text-sm text-muted-foreground">Iniciá sesión para enviar una solicitud. Está disponible con cualquier plan.</p>}
        {feedback&&<p role="status" className={`mt-3 text-sm ${feedback.error?'text-rose-600':'text-primary'}`}>{feedback.text}{feedback.slug&&<> <Link className="font-semibold underline" to={'/analysis/'+encodeURIComponent(feedback.slug)}>Ver empresa</Link></>}</p>}
    </section>;
}
