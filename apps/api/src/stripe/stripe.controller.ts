import { Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Headers('stripe-signature') signature: string | undefined,
        @Req() req: Request & { body: Buffer },
    ) {
        return this.stripeService.handleWebhook(signature, req.body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('subscriptions/pro/checkout')
    createProSubscription(@Req() req: any) {
        return this.stripeService.createSubscription(req.user.id, 'pro_investor');
    }

    @UseGuards(JwtAuthGuard)
    @Post('subscriptions/pro/cancel')
    cancelProSubscription(@Req() req: any) {
        return this.stripeService.cancelSubscription(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('communities/:communityId/checkout')
    createCommunityPayment(@Req() req: any, @Param('communityId') communityId: string) {
        return this.stripeService.createCommunityPayment(req.user.id, communityId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('invoices/me')
    listMyInvoices(@Req() req: any) {
        return this.stripeService.listInvoices(req.user.id);
    }
}

