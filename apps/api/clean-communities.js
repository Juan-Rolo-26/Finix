"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Community" CASCADE;`);
    console.log('All communities and relations truncated.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=clean-communities.js.map