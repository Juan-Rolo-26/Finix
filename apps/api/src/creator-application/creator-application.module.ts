import { Module } from '@nestjs/common';
import { CreatorApplicationController } from './creator-application.controller';
import { CreatorApplicationService } from './creator-application.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [CreatorApplicationController],
    providers: [CreatorApplicationService],
    exports: [CreatorApplicationService],
})
export class CreatorApplicationModule { }
