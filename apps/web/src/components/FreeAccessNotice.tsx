import { UiText as FinixUiText } from '@/i18n/UiText';
import { usePlatformAccessStore } from '@/stores/platformAccessStore';

export default function FreeAccessNotice() {
    const freeAccess = usePlatformAccessStore(state => state.freeAccessEnabled);
    if (!freeAccess) return null;
    return <div role="status" className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
        <strong>{""}<FinixUiText text={"PRO y Creador están bonificados."} />{""}</strong> {" "}<FinixUiText text={"Durante esta etapa, las funciones de PRO y Creador están incluidas sin pagar con una cuenta de Finix. Las nuevas compras están pausadas."} />{" "}</div>;
}
