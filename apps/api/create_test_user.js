const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.create({
            data: {
                email: 'test@finixarg.com',
                username: 'testuser',
                password: '$argon2id$v=19$m=65536,t=3,p=4$QJZtNvsU7qcE8jRv1y3ieQ$cjTH6yRKoaliPhT1v6BicUKi6+UJjJEAOnBP4srRW3M',
                emailVerified: true,
            },
        });
        console.log('User created:', user.email);
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('User already exists');
        } else {
            console.error(error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
