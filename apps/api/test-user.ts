import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.FINIX_TEST_EMAIL;
  const password = process.env.FINIX_TEST_PASSWORD;
  if (!email || !password) throw new Error('Set FINIX_TEST_EMAIL and FINIX_TEST_PASSWORD for an isolated test account');
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log('User role:', user.role);
  
  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password valid:', isValid);
}
main().then(() => prisma.$disconnect()).catch(console.error);
