import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessModule } from '../access/access.module';
import { StripeModule } from '../stripe/stripe.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
    imports: [AccessModule, StripeModule],
    controllers: [BillingController],
    providers: [BillingService, PrismaService],
    exports: [BillingService],
})
export class BillingModule { }

