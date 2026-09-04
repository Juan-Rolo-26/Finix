require('dotenv').config({ path: '/home/juampi26/Finix/apps/api/.env' });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: 'juan@test.com',
        password: 'password123'
    });

    if (error) {
        console.error("Auth error:", error);
        return;
    }

    // find another user
    const other = await prisma.user.findFirst({ where: { email: 'maria@test.com' } });
    if (!other) { console.error("No other user"); return; }

    // Create/get convesation
    const res = await fetch('http://localhost:3010/api/messages/conversations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: other.id
        })
    });
    const conv = await res.json();
    console.log("Conversation:", conv);
    if (!conv.id) { console.log("Failed to create conv"); return; }

    // Send message exactly as the frontend does
    const resMsg = await fetch(`http://localhost:3010/api/messages/conversations/${conv.id}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: "Test chart message",
            attachment: {
                type: "chart",
                url: "/uploads/charts/test.png",
                meta: {
                    symbol: "AAPL",
                    interval: "1D",
                    analysisType: "technical",
                    riskLevel: "low"
                }
            }
        })
    });

    console.log("Status:", resMsg.status);
    const text = await resMsg.text();
    console.log("Response:", text);
    process.exit(0);
}

main().catch(console.error);
