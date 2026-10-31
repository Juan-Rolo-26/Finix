interface SentEmail {
    id: string;
    userId: string;
    campaignId: string;
    status: string;
    sentAt: Date | null;
    deliveredAt: Date | null;
}
export const emailNotificationId = (recipientId: string) => 'email:' + recipientId;
export function emailNotificationDelivery(email: SentEmail) {
    const deliveryStatus = email.status === 'BOUNCED' ? 'BOUNCED' : email.deliveredAt ? 'DELIVERED' : 'SENT';
    return {
        message: deliveryStatus === 'BOUNCED'
            ? 'No se pudo entregar en tu correo. Podés leer el mensaje en Finix.'
            : deliveryStatus === 'DELIVERED'
                ? 'Entrega confirmada en tu correo. También podés leerlo en Finix.'
                : 'Finix te envió este correo. También podés leerlo acá.',
        metadata: JSON.stringify({ recipientId: email.id, campaignId: email.campaignId, deliveryStatus,
            sentAt: email.sentAt?.toISOString() || null, deliveredAt: email.deliveredAt?.toISOString() || null }),
    };
}
export function emailNotification(email: SentEmail & { campaign: { subject: string } }) {
    return { id: emailNotificationId(email.id), userId: email.userId, type: 'EMAIL_FINIX', priority: 'NORMAL',
        title: email.campaign.subject, link: '/notifications/emails/' + encodeURIComponent(email.id),
        entityType: 'EMAIL_CAMPAIGN_RECIPIENT', entityId: email.id,
        createdAt: email.sentAt || new Date(), ...emailNotificationDelivery(email) };
}
