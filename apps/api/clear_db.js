const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting database cleanup...');
    const targetEmail = 'juanpablorolo2007@gmail.com';

    // 1. Array of table names to clear completely
    const tablesToClear = [
        'commentLike',
        'comment',
        'postMedia',
        'like',
        'repost',
        'save',
        'postReport',
        'post',
        'follow',
        'creatorApplication',
        'adminAuditLog',
        'adminSession',
        'report',
        'notification',
        'communityMember',
        'communityEvent',
        'communityPlan',
        'communityPayment',
        'communityResource',
        'community',
        'subscription',
        'payout',
        'creatorBalance',
        'finixRevenue',
        'holding',
        'transaction',
        'cashAccount',
        'portfolio',
        'asset',
        'watchlist',
        // 'news', // Probably keep news or clear it if he wants everything. Let's clear it, it says "vacia todo".
        'news',
        'newsCategory',
        'newsSource',
        'fundamentalData',
        'fundamentalSnapshot',
        'conversationParticipant',
        'conversation',
        'storyView',
        'story',
        'directMessage', // Just in case it's defined
        'hubMessage',
        'hubComment',
        'hubPost',
        'hubEvent',
        'hubResource'
    ];

    for (const table of tablesToClear) {
        if (prisma[table]) {
            try {
                await prisma[table].deleteMany({});
                console.log(`Cleared table: ${table}`);
            } catch (e) {
                console.log(`Skipped/Error clearing ${table}: ${e.message}`);
            }
        }
    }

    // 2. Delete all users except target
    try {
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                email: {
                    not: targetEmail
                }
            }
        });
        console.log(`Deleted ${deletedUsers.count} users.`);
    } catch (e) {
        console.log(`Error deleting users: ${e.message}`);
    }

    console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
