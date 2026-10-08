import {
    Controller,
    Post,
    Get,
    Param,
    Req,
    Query,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Headers,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { getAccessMode } from '../access/free-access';
import { WATCHLIST_CONFIG } from '../watchlist/watchlist.config';
import { PLAN_PERMISSIONS } from '../access/plan-permissions';

@Controller('mercadopago')
export class MercadoPagoController {
    constructor(private readonly mpService: MercadoPagoService) {}

    @UseGuards(JwtAuthGuard)
    @Post('checkout/pro')
    createProCheckout(@Req() req: any, @Body() body?: { autoRenew?: boolean }) {
        return this.mpService.createPreference(req.user.id, 'pro', body?.autoRenew === true);
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout/creator')
    createCreatorCheckout(@Req() req: any, @Body() body?: { autoRenew?: boolean }) {
        return this.mpService.createPreference(req.user.id, 'creator', body?.autoRenew === true);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    handleWebhook(@Body() body: any, @Query() query: any, @Headers('x-signature') signature?: string, @Headers('x-request-id') requestId?: string) {
        return this.mpService.handleWebhook(body, query, signature, requestId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('status/:paymentId')
    getStatus(@Param('paymentId') paymentId: string, @Req() req: any) {
        return this.mpService.getStatus(paymentId, req.user.id);
    }

    @Get('config')
    getConfig() {
        return {
            ...getAccessMode(),
            configured: this.mpService.isCheckoutReady(),
            credentialsConfigured: this.mpService.isConfigured(),
            production: this.mpService.isProductionCredential(),
            checkoutReady: this.mpService.isCheckoutReady(),
            communityCurrency: 'ARS',
            proPriceArs: this.mpService.getProPrice(),
            creatorPriceArs: this.mpService.getCreatorPrice(),
            planLimits: {
                FREE: { ...WATCHLIST_CONFIG.FREE, maxPortfolios: PLAN_PERMISSIONS.free.maxPortfolios },
                PRO: { ...WATCHLIST_CONFIG.PRO, maxPortfolios: null },
                CREATOR: { ...WATCHLIST_CONFIG.CREATOR, maxPortfolios: null },
            },
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('subscription-status')
    recurringStatus(@Query('reference') reference: string, @Req() req: any) {
        return this.mpService.getRecurringStatus(reference, req.user.id);
    }
}
