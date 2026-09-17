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
    createProCheckout(@Req() req: any) {
        return this.mpService.createPreference(req.user.id, 'pro');
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkout/creator')
    createCreatorCheckout(@Req() req: any) {
        return this.mpService.createPreference(req.user.id, 'creator');
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    handleWebhook(@Body() body: any, @Query() query: any) {
        return this.mpService.handleWebhook(body, query);
    }

    @Get('status/:paymentId')
    getStatus(@Param('paymentId') paymentId: string) {
        return this.mpService.getStatus(paymentId);
    }

    @Get('config')
    getConfig() {
        return {
            configured: this.mpService.isConfigured(),
        };
    }
}
