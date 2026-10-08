import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
    imports: [
        MulterModule.register({}),
        MessagesModule,
    ],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule { }
