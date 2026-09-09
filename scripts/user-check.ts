import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'juanpablorolo2007@gmail.com' } });
    console.log(user ? `User found: ${user.id} - ${user.role}` : 'User NOT found in database');
}
main();
