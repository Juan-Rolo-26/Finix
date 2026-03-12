require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_OWNER_EMAIL || process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    throw new Error('Defini ADMIN_OWNER_EMAIL o pasa el email como primer argumento');
  }

  await prisma.user.updateMany({
    where: { email },
    data: { role: 'ADMIN' }
  });
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, username: true, role: true, status: true },
  });
  console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
