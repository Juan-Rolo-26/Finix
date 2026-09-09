"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const hash = await bcrypt.hash('Juampi26_08', 12);
    await prisma.user.update({
        where: { email: 'juanpablorolo2007@gmail.com' },
        data: { password: hash }
    });
    console.log('Password updated successfully for juanpablorolo2007@gmail.com');
}
main();
//# sourceMappingURL=update-pass.js.map