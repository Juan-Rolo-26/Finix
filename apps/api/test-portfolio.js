"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const portfolios = await prisma.portfolio.findMany({
        include: {
            holdings: { include: { asset: true } },
            transactions: { include: { asset: true }, orderBy: { date: 'desc' } },
            cashAccounts: true,
        },
        take: 1
    });
    console.log('Portfolios:', portfolios.length);
}
run().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-portfolio.js.map