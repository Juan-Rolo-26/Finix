import re

with open('/home/juampi26/Finix/apps/api/src/stripe/stripe.service.ts', 'r') as f:
    text = f.read()

old_block = """    async createCommunityPayment(userId: string, communityId: string) {
        this.ensureStripeConfigured();

        const [user, community] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    plan: true,
                    subscriptionStatus: true,
                    stripeCustomerId: true,
                },
            }),
            this.prisma.community.findUnique({
                where: { id: communityId },
                select: {
                    id: true,
                    name: true,
                    creatorId: true,
                    isPaid: true,
                    price: true,
                    billingType: true,
                    maxMembers: true,
                },
            }),
        ]);

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (!community) {
            throw new NotFoundException('Comunidad no encontrada');
        }

        if (!community.isPaid) {
            throw new BadRequestException('La comunidad es gratuita, usa el endpoint de join.');
        }"""

new_block = """    async createCommunityPayment(userId: string, communityId: string, planId: string) {
        this.ensureStripeConfigured();

        const [user, community, plan] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, plan: true, subscriptionStatus: true, stripeCustomerId: true },
            }),
            this.prisma.community.findUnique({
                where: { id: communityId },
                select: { id: true, name: true, creatorId: true, privacyType: true, maxMembers: true },
            }),
            this.prisma.communityPlan.findUnique({
                where: { id: planId }
            })
        ]);

        if (!user) throw new NotFoundException('Usuario no encontrado');
        if (!community || !plan) throw new NotFoundException('Comunidad o plan no encontrado');

        if (Number(plan.price) <= 0) {
            throw new BadRequestException('El plan es gratuito, usa el endpoint de join.');
        }"""

text = text.replace(old_block, new_block)

old_price_block = """        const customerId = await this.getOrCreateCustomer(user.id, user.email);
        const interval = community.billingType === 'yearly' ? 'year' : 'month';
        const unitAmount = Math.round(Number(community.price) * 100);"""

new_price_block = """        const customerId = await this.getOrCreateCustomer(user.id, user.email);
        const interval = (plan.interval === 'yearly' || plan.interval === 'year') ? 'year' : 'month';
        const unitAmount = Math.round(Number(plan.price) * 100);"""

text = text.replace(old_price_block, new_price_block)

old_metadata_block = """                userId: user.id,
                communityId: community.id,
                creatorId: community.creatorId,
            }"""

new_metadata_block = """                userId: user.id,
                communityId: community.id,
                creatorId: community.creatorId,
                planId: plan.id,
            }"""

text = text.replace(old_metadata_block, new_metadata_block)

with open('/home/juampi26/Finix/apps/api/src/stripe/stripe.service.ts', 'w') as f:
    f.write(text)
