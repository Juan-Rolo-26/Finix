const jwt = require('jsonwebtoken');

async function main() {
    const token = jwt.sign(
        {
            sub: 'ae3d5263-2832-4155-aecb-ac2dac4c536f',
            aud: 'authenticated',
            role: 'authenticated'
        },
        '9bf8a268-cf27-44da-847c-f1a4431e7b39',
        { expiresIn: '1h' }
    );

    // First, find a conversation id for this user.
    const resConv = await fetch('http://localhost:3010/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const convs = await resConv.json();
    console.log(convs);
    if (!convs.length) return;

    const convId = convs[0].id;
    console.log("Using conv:", convId);

    const resMsg = await fetch(`http://localhost:3010/api/messages/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
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
}
main().catch(console.error);
