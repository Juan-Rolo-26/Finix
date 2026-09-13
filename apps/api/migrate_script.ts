import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function run() {
  const sql = fs.readFileSync('prisma/migrations/20260913000000_add_news_slots_system/migration.sql', 'utf-8');
  const stmts = sql.split(';');
  
  for (const stmt of stmts) {
    if (stmt.trim()) {
      try {
        console.log('Running:', stmt.substring(0, 50));
        await prisma.$executeRawUnsafe(stmt);
      } catch (e) {
        console.error('Error on statement:', e.message);
      }
    }
  }
}
run().then(() => prisma.$disconnect()).catch(console.error);
