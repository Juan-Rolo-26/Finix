import { AccountPlanType } from '@finix/shared';
export declare const PLANS_KEY = "plans";
export declare const RequirePlan: (...plans: AccountPlanType[]) => import("@nestjs/common").CustomDecorator<string>;
