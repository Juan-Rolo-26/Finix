"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAuth_1 = require("../middlewares/adminAuth");
const adminCtrl = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
router.use(adminAuth_1.requireAdmin);
router.get('/kpis', adminCtrl.getKPIs);
router.get('/users', adminCtrl.getUsers);
router.patch('/users/:id', adminCtrl.updateUser);
router.get('/posts', adminCtrl.getPosts);
router.patch('/posts/:id', adminCtrl.updatePost);
router.get('/reports', adminCtrl.getReports);
router.patch('/reports/:id', adminCtrl.resolveReport);
router.get('/audit-logs', adminCtrl.getAuditLogs);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map