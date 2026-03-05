const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const password = await argon2.hash('password123');
  await prisma.user.update({
    where: { email: 'juanpablorolo2007@gmail.com' },
    data: { password }
  });
  console.log('Successfully reset password for juanpablorolo2007@gmail.com to: password123');
}

main()
  .catch((e) => {
    console.error('Error resetting password:', e);
  })
  .finally(() => prisma.$disconnect());
