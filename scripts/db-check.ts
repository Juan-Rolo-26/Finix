import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const user = await prisma.user.findFirst({
        where: { email: 'juanpablorolo2007@gmail.com' }
    });
    console.log("DB User:", user);
    await prisma.$disconnect();
}
run().catch(console.error);
