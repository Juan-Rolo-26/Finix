import { UiText as FinixUiText } from '@/i18n/UiText';
import { useTranslation as useFinixUiTranslation } from '@/i18n';
export interface DataReference {
    queriedAt?: string;
    referenceSession?: string | null;
    source?: string;
    priceUnit?: string;
    volumeUnit?: string;
    delay?: string;
    note?: string;
}
export default function DataReferenceContext({ context }: { context?: DataReference }) {
    const { ui: finixUi } = useFinixUiTranslation();

    if (!context) return <p className="text-sm text-muted-foreground">{""}<FinixUiText text={"Fuente, sesión de referencia y demora no informadas."} />{""}</p>;
    const queried = context.queriedAt ? new Date(context.queriedAt) : null;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return <div className="space-y-1 text-sm text-muted-foreground break-words" aria-label={finixUi("Contexto de los datos de mercado")}>
        <p>{""}<FinixUiText text={"Sesión de referencia:"} />{" "}{context.referenceSession || 'sin datos'}{""}<FinixUiText text={". Consulta:"} />{" "}{queried && Number.isFinite(queried.getTime()) ? `${queried.toLocaleString('es-AR')} (${timeZone})` : 'fecha no informada'}.</p>
        <p>{""}<FinixUiText text={"Fuente:"} />{" "}{context.source || 'no informada'}. {context.delay || 'Demora no informada.'}</p>
        {(context.priceUnit || context.volumeUnit) && <p>{context.priceUnit} · {context.volumeUnit}</p>}
        {context.note && <p>{context.note}</p>}
    </div>;
}
