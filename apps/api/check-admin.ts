import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const email = 'juanpablorolo2007@gmail.com';
    const password = 'Juampi26_08';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Hash: ${user.password}`);
    
    if (user.password?.startsWith('$2')) {
        const matches = await bcrypt.compare(password, user.password);
        console.log(`Bcrypt matches: ${matches}`);
    } else if (user.password?.startsWith('$argon2')) {
        const matches = await argon2.verify(user.password, password);
        console.log(`Argon2 matches: ${matches}`);
    } else {
        console.log(`Unknown hash format.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
