export declare class AdminPaginationDto {
    page: number;
    limit: number;
}
export declare class AdminUsersQueryDto extends AdminPaginationDto {
    search?: string;
    role?: string;
    status?: string;
}
export declare class AdminUpdateUserDto {
    status?: string;
    shadowbanned?: boolean;
    role?: string;
}
export declare class AdminPostsQueryDto extends AdminPaginationDto {
    search?: string;
    visibility?: string;
}
export declare class AdminUpdatePostDto {
    visibility?: string;
    deleted?: boolean;
}
export declare class AdminResolveReportDto {
    status?: string;
    resolutionNote?: string;
}
export declare class AdminAuditLogsQueryDto extends AdminPaginationDto {
    action?: string;
    adminId?: string;
    from?: string;
    to?: string;
}
