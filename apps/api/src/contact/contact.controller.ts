import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { MailService } from '../mail/mail.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
    constructor(private readonly mailService: MailService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async create(@Body() dto: ContactDto, @Req() req: Request) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ipAddress = typeof forwardedFor === 'string'
            ? forwardedFor.split(',')[0].trim()
            : req.ip || req.socket.remoteAddress || 'unknown';
        const userAgentHeader = req.headers['user-agent'];
        const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader.join(' ') : userAgentHeader;

        await this.mailService.sendContactMessage({
            name: dto.name.trim(),
            email: dto.email.trim().toLowerCase(),
            subject: dto.subject.trim(),
            message: dto.message.trim(),
            ipAddress,
            userAgent,
        });

        return {
            success: true,
            message: 'Tu mensaje fue enviado. Te responderemos pronto.',
        };
    }
}
