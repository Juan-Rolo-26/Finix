const fetch = require('node-fetch');

async function testApi() {
    try {
        console.log('Testing GET /api/portfolios...');
        const resGet = await fetch('http://localhost:3001/api/portfolios');
        console.log('GET status:', resGet.status);
        if (resGet.ok) {
            console.log('GET response:', await resGet.json());
        } else {
            console.log('GET error text:', await resGet.text());
        }

        console.log('\nTesting POST /api/portfolios...');
        const resPost = await fetch('http://localhost:3001/api/portfolios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: 'Test Portfolio',
                monedaBase: 'USD',
                nivelRiesgo: 'medio'
            })
        });
        console.log('POST status:', resPost.status);
        if (resPost.ok) {
            console.log('POST response:', await resPost.json());
        } else {
            console.log('POST error text:', await resPost.text());
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
