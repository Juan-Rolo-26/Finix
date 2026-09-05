const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const targetEmail = 'juanpablorolo2007@gmail.com';
    console.log('Starting REST cleanup...');

    const tablesToClear = [
        'PostReport', 'Save', 'Repost', 'Like', 'CommentLike', 'Comment', 'PostMedia', 'Post',
        'Follow', 'CreatorApplication', 'AdminAuditLog', 'AdminSession', 'Report', 'Notification',
        'CommunityMember', 'CommunityEvent', 'CommunityPlan', 'CommunityPayment', 'CommunityResource', 'Community',
        'FinixRevenue', 'Payout', 'CreatorBalance', 'Subscription',
        'Transaction', 'Holding', 'CashAccount', 'Watchlist', 'Portfolio', 'Asset',
        'News', 'NewsCategory', 'NewsSource',
        'FundamentalData', 'FundamentalSnapshot',
        'DirectMessage', 'ConversationParticipant', 'Conversation',
        'StoryView', 'Story',
        'HubMessage', 'HubComment', 'HubPost', 'HubEvent', 'HubResource'
    ];

    // Quick trick to delete everything: delete where id is not null
    for (const table of tablesToClear) {
        console.log(`Clearing ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', 'nonexistent-uuid-1234');
        if (error) console.log(`  Skipped/Error on ${table}: ${error.message}`);
    }

    try {
        const { data: users, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        console.log(`Found ${users.users.length} users in Auth...`);
        const toDelete = users.users.filter(u => u.email !== targetEmail);
        console.log(`${toDelete.length} users to delete.`);

        for (const user of toDelete) {
            console.log(`  Deleting Auth User: ${user.email} (${user.id})`);
            const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
            if (delErr) {
                console.log(`    Failed to delete auth user ${user.email}: ${delErr.message}`);
            }
        }

    } catch (e) {
        console.log('Auth API error:', e.message);
    }

    // Also clear from public.User if auth cascade didn't catch them
    console.log('Clearing public.User table except target...');
    const { error: userErr } = await supabase
        .from('User')
        .delete()
        .neq('email', targetEmail);

    if (userErr) console.log(`Error clearing public.User: ${userErr.message}`);
    else console.log('Successfully cleared public.User');

    console.log('Cleanup finished!');
}

main();
