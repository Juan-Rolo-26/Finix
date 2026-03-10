import { AdminPermission } from './admin-permissions';
export declare const ADMIN_PERMISSIONS_KEY = "admin_permissions";
export declare const RequireAdminPermissions: (...permissions: AdminPermission[]) => import("@nestjs/common").CustomDecorator<string>;
