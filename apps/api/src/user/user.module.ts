import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MarketModule } from '../market/market.module';

@Module({
    imports: [NotificationsModule, MarketModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
