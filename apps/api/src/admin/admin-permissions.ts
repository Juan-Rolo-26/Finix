export enum AdminPermission {
    DASHBOARD_READ = 'dashboard:read',
    USERS_READ = 'users:read',
    USERS_MODERATE = 'users:moderate',
    USERS_ROLE_CHANGE = 'users:role:change',
    POSTS_READ = 'posts:read',
    POSTS_MODERATE = 'posts:moderate',
    REPORTS_READ = 'reports:read',
    REPORTS_RESOLVE = 'reports:resolve',
    LOGS_READ = 'logs:read',
}

const ADMIN_PERMISSIONS: AdminPermission[] = [
    AdminPermission.DASHBOARD_READ,
    AdminPermission.USERS_READ,
    AdminPermission.USERS_MODERATE,
    AdminPermission.POSTS_READ,
    AdminPermission.POSTS_MODERATE,
    AdminPermission.REPORTS_READ,
    AdminPermission.REPORTS_RESOLVE,
    AdminPermission.LOGS_READ,
];

const SUPER_ADMIN_EXTRA: AdminPermission[] = [
    AdminPermission.USERS_ROLE_CHANGE,
];

const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
    ADMIN: ADMIN_PERMISSIONS,
    SUPER_ADMIN: [...ADMIN_PERMISSIONS, ...SUPER_ADMIN_EXTRA],
};

export const getAdminPermissions = (role?: string | null): Set<AdminPermission> => {
    if (!role) {
        return new Set();
    }

    const normalized = role.toUpperCase();
    return new Set(ROLE_PERMISSIONS[normalized] || []);
};

export const hasAdminPermission = (role: string | undefined | null, permission: AdminPermission) => {
    return getAdminPermissions(role).has(permission);
};
