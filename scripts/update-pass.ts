import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
    const hash = await bcrypt.hash('Juampi26_08', 12);
    await prisma.user.update({
        where: { email: 'juanpablorolo2007@gmail.com' },
        data: { password: hash }
    });
    console.log('Password updated successfully for juanpablorolo2007@gmail.com');
}
main();
