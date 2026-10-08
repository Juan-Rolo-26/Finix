import { PLAN_NAMES } from '@/lib/plans';
import { usePlanCheckout } from '@/hooks/usePlanCheckout';
import { SubscriptionRenewalChoice } from './SubscriptionRenewalChoice';

export function PlanCheckoutDialog({ checkout }: { checkout: ReturnType<typeof usePlanCheckout> }) {
    return <SubscriptionRenewalChoice
        open={checkout.selectedPlan !== null}
        planName={checkout.selectedPlan ? PLAN_NAMES[checkout.selectedPlan] : ''}
        monthlyPrice={checkout.selectedPrice?.toLocaleString('es-AR') || ''}
        busy={checkout.busy}
        error={checkout.error}
        mercadoPagoAvailable={checkout.catalog?.mercadoPagoAvailable === true && checkout.selectedPrice != null}
        stripeAvailable={checkout.catalog?.stripeAvailable === true}
        stripeMonthlyPrice={checkout.selectedPlan === 'PRO' ? checkout.catalog?.proPriceUsd : null}
        onClose={checkout.close}
        onConfirm={autoRenew => { void checkout.confirm('mercadopago', autoRenew); }}
        onConfirmStripe={() => { void checkout.confirm('stripe'); }}
    />;
}
