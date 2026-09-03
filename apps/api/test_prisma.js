"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Connecting...");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Success:", users.length);
}
main().catch(e => {
    console.error("PRISMA ERROR:", e);
}).finally(() => prisma.$disconnect());
//# sourceMappingURL=test_prisma.js.map