const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const passwordHash = '$argon2id$v=65536,t=3,p=4$QJZtNvsU7qcE8jRv1y3ieQ$cjTH6yRKoaliPhT1v6BicUKi6+UJjJEAOnBP4srRW3M';

    const users = [
        { email: 'juan@test.com', username: 'juanperez', id: 'ae3d5263-2832-4155-aecb-ac2dac4c536f' },
        { email: 'maria@test.com', username: 'mariagomez', id: 'be3d5263-2832-4155-aecb-ac2dac4c536g' },
        { email: 'carlos@test.com', username: 'carloslopez', id: 'ce3d5263-2832-4155-aecb-ac2dac4c536h' },
        { email: 'lana@test.com', username: 'lanamartinez', id: 'de3d5263-2832-4155-aecb-ac2dac4c536i' }
    ];

    for (const u of users) {
        try {
            const user = await prisma.user.upsert({
                where: { email: u.email },
                update: {},
                create: {
                    // id: u.id,
                    email: u.email,
                    username: u.username,
                    password: passwordHash,
                    emailVerified: true,
                },
            });
            console.log(`User created or exists in Prisma: ${user.email} (Username: ${user.username})`);
        } catch (error) {
            console.error(`Error creating user ${u.email}:`, error);
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
