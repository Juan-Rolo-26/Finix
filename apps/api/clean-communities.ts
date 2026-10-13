import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Community" CASCADE;`);
    console.log('All communities and relations truncated.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
