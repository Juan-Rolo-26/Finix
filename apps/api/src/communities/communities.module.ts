import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { PrismaService } from '../prisma.service';
import { AccessModule } from '../access/access.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
    imports: [AccessModule, StripeModule],
    controllers: [CommunitiesController],
    providers: [CommunitiesService, PrismaService],
    exports: [CommunitiesService]
})
export class CommunitiesModule { }
