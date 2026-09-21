import { Controller, Get, Post, Query, Header } from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';

@Controller('email-preferences')
export class EmailPreferencesController {
    constructor(private readonly emails: EmailMarketingService) {}
    @Get('unsubscribe')
    @Header('Content-Type', 'text/html; charset=utf-8')
    confirm() {
        return '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Finix</title><h1>Emails de Finix</h1><form method="post"><button>Confirmar cancelacion de suscripcion</button></form>';
    }
    @Post('unsubscribe')
    unsubscribe(@Query('user') user: string, @Query('token') token: string) { return this.emails.unsubscribe(user, token); }
}
