"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'juanpablorolo2007@gmail.com';
    const newPassword = 'Juampi26_08';
    const hash = await bcrypt.hash(newPassword, 12);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hash,
            role: 'ADMIN',
        },
        create: {
            email,
            username: 'JuanPabloAdmin',
            password: hash,
            role: 'ADMIN',
            avatarUrl: 'https://i.pravatar.cc/150?u=juampi',
            bio: 'Admin',
        },
    });
    console.log(`\n\nUsuario actualizado exitosamente!`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Rol: ${user.role}\n\n`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reset-admin.js.map