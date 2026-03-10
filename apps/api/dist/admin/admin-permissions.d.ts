export declare enum AdminPermission {
    DASHBOARD_READ = "dashboard:read",
    USERS_READ = "users:read",
    USERS_MODERATE = "users:moderate",
    USERS_ROLE_CHANGE = "users:role:change",
    POSTS_READ = "posts:read",
    POSTS_MODERATE = "posts:moderate",
    REPORTS_READ = "reports:read",
    REPORTS_RESOLVE = "reports:resolve",
    LOGS_READ = "logs:read"
}
export declare const getAdminPermissions: (role?: string | null) => Set<AdminPermission>;
export declare const hasAdminPermission: (role: string | undefined | null, permission: AdminPermission) => boolean;
