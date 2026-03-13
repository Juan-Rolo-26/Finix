import type { Request } from 'express';
import { MailService } from '../mail/mail.service';
import { ContactDto } from './dto/contact.dto';
export declare class ContactController {
    private readonly mailService;
    constructor(mailService: MailService);
    create(dto: ContactDto, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
}
