import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma.service';

@Module({
    imports: [
        MulterModule.register({}),
    ],
    controllers: [SettingsController],
    providers: [SettingsService, PrismaService],
    exports: [SettingsService],
})
export class SettingsModule { }
