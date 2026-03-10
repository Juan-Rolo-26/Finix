import { Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { RequireProGuard } from './require-pro.guard';
import { LimitFreePortfolioGuard } from './limit-free-portfolio.guard';
import { RequirePaidCommunityAccessGuard } from './require-paid-community-access.guard';

@Module({
    providers: [
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
