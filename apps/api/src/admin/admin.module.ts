import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminGuard } from './admin.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminPermissionsGuard } from './permissions.guard';
import { AdminAuditService } from './admin-audit.service';
import { AdminManagementService } from './admin-management.service';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'secretKey',
        }),
    ],
    controllers: [AdminController, AdminAuthController],
    providers: [AdminGuard, AdminPermissionsGuard, AdminAuditService, AdminAuthService, AdminManagementService],
    exports: [AdminGuard],
})
export class AdminModule { }
