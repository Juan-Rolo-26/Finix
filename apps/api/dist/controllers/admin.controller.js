"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.resolveReport = exports.getReports = exports.updatePost = exports.getPosts = exports.updateUser = exports.getUsers = exports.getKPIs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getKPIs = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const activeUsersCount = await prisma.user.count({ where: { status: 'ACTIVE' } });
        const totalPosts = await prisma.post.count({ where: { deletedAt: null } });
        const pendingReports = await prisma.report.count({ where: { status: 'OPEN' } });
        res.json({
            ok: true,
            kpis: {
                totalUsers,
                activeUsersCount,
                totalPosts,
                pendingReports
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching KPIs' });
    }
};
exports.getKPIs = getKPIs;
const getUsers = async (req, res) => {
    try {
        const { search, role, status, page = '1', limit = '50' } = req.query;
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { username: { contains: search } },
                { email: { contains: search } }
            ];
        }
        if (role)
            whereClause.role = role;
        if (status)
            whereClause.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const users = await prisma.user.findMany({
            where: whereClause,
            take: Number(limit),
            skip,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                shadowbanned: true,
                lastLogin: true,
                createdAt: true,
                flags: true
            }
        });
        const total = await prisma.user.count({ where: whereClause });
        res.json({ ok: true, data: users, total, page: Number(page), limit: Number(limit) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching users' });
    }
};
exports.getUsers = getUsers;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, shadowbanned, role } = req.body;
        const adminUser = req.user;
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status, shadowbanned, role }
        });
        await prisma.adminAuditLog.create({
            data: {
                action: status === 'BANNED' ? 'BAN_USER' : 'UPDATE_USER',
                actorId: adminUser.id,
                targetId: id,
                metadata: JSON.stringify({ status, shadowbanned, role })
            }
        });
        res.json({ ok: true, data: updatedUser });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating user' });
    }
};
exports.updateUser = updateUser;
const getPosts = async (req, res) => {
    try {
        const { search, visibility, page = '1', limit = '50' } = req.query;
        const whereClause = { deletedAt: null };
        if (search) {
            whereClause.content = { contains: search };
        }
        if (visibility)
            whereClause.visibility = visibility;
        const skip = (Number(page) - 1) * Number(limit);
        const posts = await prisma.post.findMany({
            where: whereClause,
            take: Number(limit),
            skip,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, username: true, avatarUrl: true }
                },
                _count: {
                    select: { likes: true, comments: true, reports: true }
                }
            }
        });
        const total = await prisma.post.count({ where: whereClause });
        res.json({ ok: true, data: posts, total, page: Number(page), limit: Number(limit) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching posts' });
    }
};
exports.getPosts = getPosts;
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { visibility, deleted } = req.body;
        const adminUser = req.user;
        const updateData = {};
        if (visibility)
            updateData.visibility = visibility;
        if (deleted === true)
            updateData.deletedAt = new Date();
        const updatedPost = await prisma.post.update({
            where: { id },
            data: updateData
        });
        await prisma.adminAuditLog.create({
            data: {
                action: deleted ? 'DELETE_POST' : (visibility === 'HIDDEN' ? 'HIDE_POST' : 'UPDATE_POST'),
                actorId: adminUser.id,
                targetId: id,
                metadata: JSON.stringify({ visibility, deleted })
            }
        });
        res.json({ ok: true, data: updatedPost });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating post' });
    }
};
exports.updatePost = updatePost;
const getReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: {
                    select: { id: true, username: true }
                }
            }
        });
        res.json({ ok: true, data: reports });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching reports' });
    }
};
exports.getReports = getReports;
const resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNote } = req.body;
        const adminUser = req.user;
        const updatedReport = await prisma.report.update({
            where: { id },
            data: { status, resolutionNote }
        });
        await prisma.adminAuditLog.create({
            data: {
                action: 'RESOLVE_REPORT',
                actorId: adminUser.id,
                targetId: id,
                metadata: JSON.stringify({ status, resolutionNote })
            }
        });
        res.json({ ok: true, data: updatedReport });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error resolving report' });
    }
};
exports.resolveReport = resolveReport;
const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.adminAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                actor: {
                    select: { id: true, username: true }
                }
            }
        });
        res.json({ ok: true, data: logs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching audit logs' });
    }
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=admin.controller.js.map