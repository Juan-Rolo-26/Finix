import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { CommunityPermissionsService } from './community-permissions.service';
import { CreatorGuard } from './guards/creator.guard';
import { StripeModule } from '../stripe/stripe.module';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

@Module({
    imports: [StripeModule, MercadoPagoModule],
    controllers: [CommunitiesController],
    providers: [
        CommunitiesService,
        CommunityPermissionsService,
        CreatorGuard,
    ],
    exports: [
        CommunitiesService,
        CommunityPermissionsService,
    ],
})
export class CommunitiesModule { }
