const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tables = [
        'Community', 'CommunityPlan', 'CommunityMember', 'CommunityEvent',
        'CommunityResource', 'CommunityPayment', 'Post', 'Comment', 'Like',
        'Follow', 'User', 'PostMedia', 'PostReport', 'Save', 'Repost'
    ];
    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            console.log('RLS enabled on', table);
        } catch (e) {
            console.error('Failed on', table, e.message);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
