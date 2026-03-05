const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
});
prisma.user.findMany().then(users => console.log(users)).finally(() => prisma.$disconnect());
