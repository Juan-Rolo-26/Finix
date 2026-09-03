"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    const user = await prisma.user.findFirst({
        where: { email: 'juanpablorolo2007@gmail.com' }
    });
    console.log("DB User:", user);
    await prisma.$disconnect();
}
run().catch(console.error);
//# sourceMappingURL=db-check.js.map