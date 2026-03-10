import { Module } from '@nestjs/common';
import { EventsGateway } from '../events.gateway';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
    controllers: [MessagesController],
    providers: [MessagesService, EventsGateway],
    exports: [MessagesService, EventsGateway],
})
export class MessagesModule { }
