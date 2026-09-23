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
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
    handleWebhook(@Body() body: any, @Query() query: any) {
        return this.mpService.handleWebhook(body, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('status/:paymentId')
    getStatus(@Param('paymentId') paymentId: string, @Req() req: any) {
        return this.mpService.getStatus(paymentId, req.user.id);
    }

    @Get('config')
    getConfig() {
        return {
            configured: this.mpService.isConfigured(),
            proPriceArs: this.mpService.getProPrice(),
            creatorPriceArs: this.mpService.getCreatorPrice(),
        };
    }
}
