const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash('password123');

    const user = await prisma.user.upsert({
        where: { email: 'juanpablorolo2007@gmail.com' },
        update: { password, role: 'ADMIN' },
        create: {
            email: 'juanpablorolo2007@gmail.com',
            username: 'juanpablorolo',
            password: password,
            role: 'ADMIN',
            isVerified: true
        }
    });

    console.log('User juanpablorolo2007@gmail.com created/reset with password: password123');
}

main()
    .catch((e) => {
        console.error('Error creating user:', e);
    })
    .finally(() => prisma.$disconnect());
