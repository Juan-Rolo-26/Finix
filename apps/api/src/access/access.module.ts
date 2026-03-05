import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccessControlService } from './access-control.service';
import { RequireProGuard } from './require-pro.guard';
import { LimitFreePortfolioGuard } from './limit-free-portfolio.guard';
import { RequirePaidCommunityAccessGuard } from './require-paid-community-access.guard';

@Module({
    providers: [
        PrismaService,
        AccessControlService,
        RequireProGuard,
        LimitFreePortfolioGuard,
        RequirePaidCommunityAccessGuard,
    ],
    exports: [
        AccessControlService,
        RequireProGuard,
        LimitFreePortfolioGuard,
        RequirePaidCommunityAccessGuard,
    ],
})
export class AccessModule { }

