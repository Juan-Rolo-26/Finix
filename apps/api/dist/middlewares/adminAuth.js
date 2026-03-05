"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const jwt_1 = require("../utils/jwt");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const ADMIN_ALLOWLIST = (process.env.ADMIN_ALLOWLIST || '').split(',').map(e => e.trim().toLowerCase());
const requireAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access denied' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyJwt)(token);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(401).json({ error: 'Access denied' });
            return;
        }
        if (user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        if (ADMIN_ALLOWLIST.length > 0 && ADMIN_ALLOWLIST[0] !== '' && !ADMIN_ALLOWLIST.includes(user.email.toLowerCase())) {
            console.error(`ALERTA: Usuario intentando acceder a admin: ${user.email}`);
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Access denied' });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=adminAuth.js.map