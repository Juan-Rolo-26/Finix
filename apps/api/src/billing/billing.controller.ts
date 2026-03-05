import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { PayoutRequestDto } from './dto/payout-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Get('overview')
    getOverview(@Req() req: any) {
        return this.billingService.getPaymentOverview(req.user.id);
    }

    @Get('history')
    getHistory(@Req() req: any) {
        return this.billingService.getPaymentHistory(req.user.id);
    }

    @Post('subscription/cancel')
    cancelSubscription(@Req() req: any) {
        return this.billingService.cancelProSubscription(req.user.id);
    }

    @Get('creator/summary')
    getCreatorSummary(@Req() req: any) {
        return this.billingService.getCreatorSummary(req.user.id);
    }

    @Post('creator/settle')
    settlePendingBalance(@Req() req: any) {
        return this.billingService.settlePendingBalance(req.user.id);
    }

    @Post('creator/payout')
    requestPayout(@Req() req: any, @Body() body: PayoutRequestDto) {
        return this.billingService.requestPayout(req.user.id, Number(body.amount));
    }

    @Get('creator/payouts')
    listPayouts(@Req() req: any) {
        return this.billingService.listPayouts(req.user.id);
    }

    @Get('admin/settings')
    getAdminSettings(@Req() req: any) {
        this.assertAdmin(req);
        return this.billingService.getAdminSettings();
    }

    @Post('admin/commission')
    updateCommission(@Req() req: any, @Body() body: { rate?: number }) {
        this.assertAdmin(req);
        return this.billingService.updateCommissionRate(Number(body.rate));
    }

    private assertAdmin(req: any) {
        if (req?.user?.role !== 'ADMIN') {
            throw new ForbiddenException('Acceso denegado: solo ADMIN');
        }
    }
}
