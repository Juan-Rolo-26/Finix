import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { NewsletterController } from './newsletter.controller';

@Module({
    controllers: [ContactController, NewsletterController],
})
export class ContactModule { }
