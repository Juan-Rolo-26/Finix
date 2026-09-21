import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushService } from './push.service';
import { Throttle } from '@nestjs/throttler';

@Controller('notifications/push')
@UseGuards(JwtAuthGuard)
export class PushController {
    constructor(private readonly push: PushService) {}
    @Get('config')
    config() { return this.push.config(); }
    @Post('status')
    status(@Req() req: any, @Body('endpoint') endpoint: string) { return this.push.status(req.user.id, endpoint || ''); }
    @Post('subscribe')
    subscribe(@Req() req: any, @Body() body: unknown) { return this.push.subscribe(req.user.id, body); }
    @Post('unsubscribe')
    unsubscribe(@Req() req: any, @Body('endpoint') endpoint: unknown) { return this.push.remove(req.user.id, endpoint); }
    @Post('test')
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    test(@Req() req: any) { return this.push.test(req.user.id); }
}
