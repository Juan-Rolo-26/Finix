const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const port = Number(process.env.WEBHOOK_PORT || 4000);
const webhookSecret = process.env.WEBHOOK_SECRET || '';

app.use(express.json());

let isDeploying = false;

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'finix-webhook-server', isDeploying });
});

app.post('/webhook', (req, res) => {
    // Si se configuró WEBHOOK_SECRET, verificar encabezado de GitHub o token
    if (webhookSecret) {
        const ghSig = req.headers['x-hub-signature-256'];
        const customToken = req.headers['x-webhook-secret'] || req.query.secret;

        if (ghSig) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
            if (ghSig !== digest) {
                console.warn('[Webhook] Firma de GitHub inválida.');
                return res.status(403).json({ error: 'Firma no autorizada' });
            }
        } else if (customToken !== webhookSecret) {
            console.warn('[Webhook] Token secreto no coincide.');
            return res.status(403).json({ error: 'Token no autorizado' });
        }
    }

    const branch = req.body?.ref;

    // Aceptamos push a rama 'main' o llamada manual
    if (!branch || branch === 'refs/heads/main') {
        if (isDeploying) {
            console.log(`[${new Date().toISOString()}] Ya hay un despliegue en ejecución. Solicitud omitida.`);
            return res.status(429).json({ message: 'Despliegue ya en curso. Intentá de nuevo en unos minutos.' });
        }

        console.log(`[${new Date().toISOString()}] Push detectado en main. Iniciando bash deploy.sh...`);
        isDeploying = true;

        // Responder rápido a GitHub/cliente para evitar timeout (30s)
        res.status(200).json({ status: 'success', message: 'Webhook recibido. Despliegue iniciado.' });

        exec('bash deploy.sh', { cwd: __dirname }, (error, stdout, stderr) => {
            isDeploying = false;
            if (error) {
                console.error(`[${new Date().toISOString()}] ❌ Error en deploy: ${error.message}`);
                return;
            }
            if (stderr) {
                console.warn(`[${new Date().toISOString()}] Logs de advertencia:\n${stderr}`);
            }
            console.log(`[${new Date().toISOString()}] ✅ Resultado exitoso:\n${stdout}`);
            console.log('================ DEPLOY COMPLETADO ================');
        });
    } else {
        res.status(200).json({ status: 'ignored', message: `Rama ${branch} ignorada (solo main).` });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Finix Webhook Server corriendo en el puerto ${port}...`);
});
