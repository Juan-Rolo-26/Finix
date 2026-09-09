const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 4000;

app.use(express.json());

app.post('/webhook', (req, res) => {
    const branch = req.body.ref;

    // Solo reaccionamos si el push ocurre en la rama 'main'
    if (branch === 'refs/heads/main') {
        console.log(`[${new Date().toISOString()}] Push detectado en main. Iniciando deploy de Finix...`);

        // Ejecutar el deploy.sh asincrónicamente
        exec('./deploy.sh', { cwd: '/var/www/finix' }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error en deploy: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Logs (stderr): ${stderr}`);
            }
            console.log(`Resultado exitoso:\n${stdout}`);
            console.log('----- DEPLOY COMPLETADO -----');
        });

        // Respondemos rápidamente a GitHub para que no dé timeout
        res.status(200).send('Webhook recibido. Deploy en proceso...');
    } else {
        res.status(200).send('Ignorando push (no es la rama main).');
    }
});

app.listen(port, () => {
    console.log(`Finix Webhook Server corriendo en el puerto ${port}...`);
});
