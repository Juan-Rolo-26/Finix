import { SetMetadata } from '@nestjs/common';
import { PlanType } from './plan-permissions';

export const REQUIRE_PLAN_KEY = 'require_plan';
export const RequirePlan = (...plans: PlanType[]) => SetMetadata(REQUIRE_PLAN_KEY, plans);
