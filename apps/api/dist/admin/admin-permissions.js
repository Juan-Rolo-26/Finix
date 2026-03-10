"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAdminPermission = exports.getAdminPermissions = exports.AdminPermission = void 0;
var AdminPermission;
(function (AdminPermission) {
    AdminPermission["DASHBOARD_READ"] = "dashboard:read";
    AdminPermission["USERS_READ"] = "users:read";
    AdminPermission["USERS_MODERATE"] = "users:moderate";
    AdminPermission["USERS_ROLE_CHANGE"] = "users:role:change";
    AdminPermission["POSTS_READ"] = "posts:read";
    AdminPermission["POSTS_MODERATE"] = "posts:moderate";
    AdminPermission["REPORTS_READ"] = "reports:read";
    AdminPermission["REPORTS_RESOLVE"] = "reports:resolve";
    AdminPermission["LOGS_READ"] = "logs:read";
})(AdminPermission || (exports.AdminPermission = AdminPermission = {}));
const ADMIN_PERMISSIONS = [
    AdminPermission.DASHBOARD_READ,
    AdminPermission.USERS_READ,
    AdminPermission.USERS_MODERATE,
    AdminPermission.POSTS_READ,
    AdminPermission.POSTS_MODERATE,
    AdminPermission.REPORTS_READ,
    AdminPermission.REPORTS_RESOLVE,
    AdminPermission.LOGS_READ,
];
const SUPER_ADMIN_EXTRA = [
    AdminPermission.USERS_ROLE_CHANGE,
];
const ROLE_PERMISSIONS = {
    ADMIN: ADMIN_PERMISSIONS,
    SUPER_ADMIN: [...ADMIN_PERMISSIONS, ...SUPER_ADMIN_EXTRA],
};
const getAdminPermissions = (role) => {
    if (!role) {
        return new Set();
    }
    const normalized = role.toUpperCase();
    return new Set(ROLE_PERMISSIONS[normalized] || []);
};
exports.getAdminPermissions = getAdminPermissions;
const hasAdminPermission = (role, permission) => {
    return (0, exports.getAdminPermissions)(role).has(permission);
};
exports.hasAdminPermission = hasAdminPermission;
//# sourceMappingURL=admin-permissions.js.map