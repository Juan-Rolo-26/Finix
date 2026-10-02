import { usePlatformAccessStore } from '@/stores/platformAccessStore';

export default function FreeAccessNotice() {
    const freeAccess = usePlatformAccessStore(state => state.freeAccessEnabled);
    if (!freeAccess) return null;
    return <div role="status" className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
        <strong>Finix está gratis para todos.</strong> Durante esta etapa, las funciones de PRO y Creator están incluidas sin pagar. Las nuevas compras están pausadas.
    </div>;
}
