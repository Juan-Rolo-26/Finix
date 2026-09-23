import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { StripeModule } from '../stripe/stripe.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
    imports: [AccessModule, StripeModule, MercadoPagoModule],
    controllers: [BillingController],
    providers: [BillingService],
    exports: [BillingService],
})
export class BillingModule { }
