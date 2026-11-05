import { ForbiddenException } from '@nestjs/common';

/** Temporarily hidden from new subscriptions. Existing billing and access remain valid. */
export const CREATOR_PLAN_AVAILABLE = false;
export function assertCreatorPlanAvailable(): void {
    if (!CREATOR_PLAN_AVAILABLE) throw new ForbiddenException('El plan Creador no está disponible para nuevas contrataciones por el momento.');
}
