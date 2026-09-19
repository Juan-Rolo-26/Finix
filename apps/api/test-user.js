"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'juanpablorolo2007@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found!');
        return;
    }
    console.log('User role:', user.role);
    const isValid = await bcrypt.compare('Juampi26_08', user.password);
    console.log('Password valid:', isValid);
}
main().then(() => prisma.$disconnect()).catch(console.error);
//# sourceMappingURL=test-user.js.map