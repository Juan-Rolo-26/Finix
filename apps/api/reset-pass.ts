import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const password = await argon2.hash('Juampi26_08');

    // Check if the user exists
    let user = await prisma.user.findUnique({
        where: { email: 'juanpablorolo2007@gmail.com' }
    });

    if (user) {
        // Update password if exists
        user = await prisma.user.update({
            where: { email: 'juanpablorolo2007@gmail.com' },
            data: { password }
        });
        console.log('✅ Contraseña actualizada con éxito para juanpablorolo2007@gmail.com');
    } else {
        // Create full user if doesn't exist
        user = await prisma.user.create({
            data: {
                email: 'juanpablorolo2007@gmail.com',
                username: 'Juampi26',
                password,
                role: 'ADMIN',
                avatarUrl: 'https://i.pravatar.cc/150?u=juampi',
                bio: 'Fundador de Finix',
            }
        });
        console.log('✅ Usuario creado y contraseña asignada con éxito a juanpablorolo2007@gmail.com');
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
