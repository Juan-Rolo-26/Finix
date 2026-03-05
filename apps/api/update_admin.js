const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'juanpablorolo2007@gmail.com' },
    data: { role: 'ADMIN' }
  });
  const users = await prisma.user.findMany({ select: { email: true, username: true, role: true } });
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
