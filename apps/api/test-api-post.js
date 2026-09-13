const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

(async () => {
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst();
    if(!user) return console.log("no user");

    // create token - wait, the JWT secret in .env? Let's see
    require('dotenv').config({ path: '/home/juampi26/Finix/apps/api/.env' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecrettest', { expiresIn: '1d' });

    console.log("Token:", token);

    const res = await fetch('http://localhost:3010/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            content: "jajajaj",
            tickers: [],
            type: "opinion"
        })
    });
    const data = await res.text();
    console.log("Response:", res.status, data);
    prisma.$disconnect();
})();
