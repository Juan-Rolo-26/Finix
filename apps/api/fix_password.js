const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.update({
        where: { email: 'test@finixarg.com' },
        data: { password: '$argon2id$v=19$m=65536,t=3,p=4$k0D5vgz6xbG1tUmgpjYRaQ$3szn8qIjXDmMUt4rahnLAz3WsGIslN5ezjORKbYkLgk' }
    });
    console.log('Password fixed!');
    await prisma.$disconnect();
}

main();
