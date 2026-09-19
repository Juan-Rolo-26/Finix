"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = require("fs");
const prisma = new client_1.PrismaClient();
async function run() {
    const sql = fs.readFileSync('prisma/migrations/20260913000000_add_news_slots_system/migration.sql', 'utf-8');
    const stmts = sql.split(';');
    for (const stmt of stmts) {
        if (stmt.trim()) {
            try {
                console.log('Running:', stmt.substring(0, 50));
                await prisma.$executeRawUnsafe(stmt);
            }
            catch (e) {
                console.error('Error on statement:', e.message);
            }
        }
    }
}
run().then(() => prisma.$disconnect()).catch(console.error);
//# sourceMappingURL=migrate_script.js.map