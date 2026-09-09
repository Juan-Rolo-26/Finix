"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'juanpablorolo2007@gmail.com' } });
    console.log(user ? `User found: ${user.id} - ${user.role}` : 'User NOT found in database');
}
main();
//# sourceMappingURL=user-check.js.map