import { PlanType } from './plan-permissions';
export declare const REQUIRE_PLAN_KEY = "require_plan";
export declare const RequirePlan: (...plans: PlanType[]) => import("@nestjs/common").CustomDecorator<string>;
