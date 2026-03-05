import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

@Module({
    controllers: [StripeController],
    providers: [StripeService, PrismaService],
    exports: [StripeService],
})
export class StripeModule { }

