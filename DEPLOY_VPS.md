# 🚀 Manual de Despliegue en Producción - FINIX (`finixarg.com` y `admin.finixarg.com`)

Esta guía describe paso a paso cómo desplegar la plataforma completa de **Finix** en un servidor VPS (Ubuntu/Debian), con HTTPS automático, pasarelas de pago (Mercado Pago y Stripe), autenticación segura con 2FA para el panel de administración, envío de correos con Resend y despliegue continuo (CI/CD) automático en cada `git commit` / `git push`.

---

## 🌐 1. Dominios y Configuración DNS

En el panel donde administres tu dominio `finixarg.com` (Cloudflare, Namecheap, DonWeb, etc.), creá los siguientes registros **Tipo A** apuntando a la dirección IP pública de tu VPS:

| Tipo | Host / Nombre | Valor / Destino | Propósito |
|---|---|---|---|
| **A** | `@` (o `finixarg.com`) | `IP_DE_TU_VPS` | Web Principal (Frontend de usuarios) |
| **A** | `www` | `IP_DE_TU_VPS` | Redirección o alias web |
| **A** | `admin` | `IP_DE_TU_VPS` | Panel de Control de Administración |

> 💡 *Si usás Cloudflare, podés dejar el proxy (nube naranja) activado o en "DNS only" (gris) para obtener el certificado SSL con Let's Encrypt / Certbot directamente en el VPS.*

---

## 🖥️ 2. Preparación del VPS (Instalación Inicial)

Conectate a tu servidor VPS mediante terminal SSH:

```bash
ssh root@IP_DE_TU_VPS
```

Ejecutá los siguientes comandos para preparar el entorno:

```bash
# 1. Actualizar el sistema operativo
sudo apt update && sudo apt upgrade -y

# 2. Instalar herramientas base
sudo apt install -y curl git nginx certbot python3-certbot-nginx build-essential

# 3. Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Instalar PM2 de manera global para mantener el backend siempre activo
sudo npm install -g pm2

# 5. Clonar el repositorio en /var/www/finix
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/TU_USUARIO/Finix.git finix
cd /var/www/finix

# 6. Asignar permisos y hacer ejecutables los scripts
sudo chown -R $USER:$USER /var/www/finix
chmod +x deploy.sh scripts/push-deploy.sh
```

---

## ⚙️ 3. Configuración de Variables de Entorno (`.env`)

Dentro de `/var/www/finix`:

### 3.1. Backend API (`apps/api/.env`)
Creá el archivo `apps/api/.env`:

```bash
nano apps/api/.env
```

Pegá y completá con tus claves reales:

```env
# ── Servidor y URLs ─────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3001
API_URL=https://finixarg.com
FRONTEND_URL=https://finixarg.com
APP_URL=https://finixarg.com
ADMIN_URL=https://admin.finixarg.com
ALLOWED_ORIGINS=https://finixarg.com,https://www.finixarg.com,https://admin.finixarg.com

# ── Base de Datos (Supabase o PostgreSQL propio) ───────────────────────────
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.TU_PROYECTO.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.TU_PROYECTO.supabase.co:5432/postgres"

# ── Seguridad y Autenticación ──────────────────────────────────────────────
# Generar una clave secreta segura (ejemplo con: openssl rand -base64 64)
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_aqui

# Supabase Auth
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_JWT_SECRET=tu_supabase_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# ── Administrador y Autenticación 2FA ───────────────────────────────────────
ADMIN_OWNER_EMAIL=admin@finixarg.com
ADMIN_ALLOWLIST=admin@finixarg.com

# ── Servicio de Emails (Resend) ─────────────────────────────────────────────
RESEND_API_KEY=re_tu_clave_resend_aqui
EMAIL_FROM=Finix <onboarding@finixarg.com>
CONTACT_EMAIL_TO=admin@finixarg.com

# ── Pasarela de Pagos 1: Mercado Pago (Argentina - ARS) ───────────────────
MP_ACCESS_TOKEN=APP_USR-tu_access_token_de_mercadopago
MP_PUBLIC_KEY=APP_USR-tu_public_key_de_mercadopago
MP_PRO_PRICE_ARS=6500
MP_CREATOR_PRICE_ARS=29900

# ── Pasarela de Pagos 2: Stripe (Internacional - USD) ──────────────────────
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta_stripe
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_stripe
STRIPE_PRO_INVESTOR_PRICE_ID=price_tu_price_id_pro
STRIPE_PRO_CREATOR_PRICE_ID=price_tu_price_id_creator
```

### 3.2. Frontend Web (`apps/web/.env`)
Creá el archivo `apps/web/.env`:

```bash
nano apps/web/.env
```

Pegá:

```env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_publica
```

### 3.3. Panel Admin (`apps/admin/.env`)
En producción no requiere variables adicionales porque Nginx hace proxy transparente de `/api` directamente a la API local de forma Same-Origin (lo cual protege las cookies de sesión y 2FA). Si deseás crear el archivo de referencia:

```bash
nano apps/admin/.env
```

```env
VITE_ADMIN_BASE_PATH="/"
```

---

## 🔒 4. Configuración de NGINX y Certificados SSL (HTTPS)

### 4.1. Instalar la configuración del sitio
Copia el archivo de configuración listo para producción:

```bash
sudo cp /var/www/finix/deploy/nginx/finixarg.com.conf /etc/nginx/sites-available/finixarg.com.conf
sudo ln -sf /etc/nginx/sites-available/finixarg.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Comprobá la sintaxis:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2. Obtener Certificados SSL Gratuitos (HTTPS)
Con Certbot obtenés certificados automáticos para todos tus subdominios en un solo comando:

```bash
sudo certbot --nginx -d finixarg.com -d www.finixarg.com -d admin.finixarg.com
```

> Certbot configurará automáticamente la renovación periódica y el desvío de tráfico HTTP hacia HTTPS.

---

## 🚀 5. Primer Despliegue Manual

Para compilar todo por primera vez y dejar el backend corriendo en PM2:

```bash
cd /var/www/finix
bash deploy.sh
```

Verificarás en pantalla:
- `[1/7] Descargando últimos cambios...`
- `[2/7] Instalando dependencias NPM...`
- `[3/7] Sincronizando base de datos con Prisma...`
- `[4/7] Compilando Backend (NestJS)...`
- `[5/7] Compilando Frontend Web (finixarg.com)...`
- `[6/7] Compilando Panel Admin (admin.finixarg.com)...`
- `[7/7] Gestionando proceso en PM2...`
- `✅ ¡Despliegue finalizado exitosamente!`

Para configurar que PM2 arranque automáticamente si se reinicia el servidor VPS:
```bash
pm2 startup
pm2 save
```

---

## 🛡️ 6. Autenticación y 2FA del Administrador (`admin.finixarg.com`)

El panel cuenta con protección de doble factor (2FA) de grado bancario:

1. **Email en Allowlist**: El usuario debe tener rol `ADMIN` o coincidir con `ADMIN_OWNER_EMAIL`.
2. **Paso 1 - Credenciales**: Ingresás tu correo y contraseña en `https://admin.finixarg.com/login`.
3. **Paso 2 - Código OTP al Correo**: El sistema genera un código de un solo uso y te lo envía por Resend a tu correo electrónico. Lo ingresás en la pantalla.
4. **Paso 3 - Configuración TOTP (Primera vez)**: La pantalla te muestra un **Código QR**. Lo escaneás con **Google Authenticator**, **Authy** o **1Password**.
5. **Paso 4 - Confirmación 2FA**: Ingresás el código de 6 dígitos de tu app autenticadora y accedés al panel con tu sesión cifrada en cookies `HttpOnly`.

---

## 💳 7. Pasarelas de Pago (Webhooks de Producción)

### Mercado Pago
- En el panel de desarrolladores de Mercado Pago, configurá la URL de notificaciones (Webhooks IPN):
  `https://finixarg.com/api/mercadopago/webhook`
- Eventos a escuchar: `payment`.

### Stripe
- En el dashboard de Stripe (sección Developers > Webhooks), agregá un Endpoint:
  `https://finixarg.com/api/stripe/webhook`
- Eventos a escuchar: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`.
- Copiá el secreto del webhook (`whsec_...`) en tu variable `STRIPE_WEBHOOK_SECRET`.

---

## 🔄 8. Despliegue Automático en Cada Commit / Push (CI/CD)

Tenés 3 alternativas para que cada cambio que hagas se refleje automáticamente en el VPS:

### Opción A: Con GitHub Actions (Recomendada y 100% Automática)
El repositorio ya incluye el flujo configurado en `.github/workflows/deploy.yml`.

1. En tu repositorio de GitHub, andá a: **Settings > Secrets and variables > Actions > New repository secret**.
2. Agregá los siguientes secrets:
   - `VPS_HOST`: La IP pública de tu VPS (ej. `195.201.x.x`).
   - `VPS_USERNAME`: Tu usuario SSH del VPS (ej. `root` o tu usuario sudo).
   - `VPS_PASSWORD`: La contraseña de tu usuario VPS (o podés usar `VPS_SSH_KEY` con tu clave privada).
   - `VPS_PORT`: (Opcional, por defecto `22`).

¡Listo! Cada vez que hagas un commit y push a la rama `main`:
```bash
git add .
git commit -m "Mejoras en feed"
git push origin main
```
GitHub Actions se conectará por SSH a tu VPS, ejecutará `deploy.sh` y actualizará automáticamente la Web, el Admin y la API en vivo sin cortes de servicio.

---

### Opción B: Script Local `npm run deploy`
Desde tu computadora de desarrollo podés hacer commit y deploy en un solo paso:

```bash
npm run deploy "Mi mensaje de commit"
```
Este script hace el commit, lo sube a GitHub y desencadena la actualización inmediata en el servidor.

---

### Opción C: Servidor Webhook Autónomo en el VPS (`webhook-server.js`)
Si no deseás usar GitHub Actions con SSH, podés levantar el webhook server que ya viene en el proyecto:

1. En el VPS iniciás el servidor webhook con PM2:
   ```bash
   cd /var/www/finix
   pm2 start webhook-server.js --name "finix-webhook"
   pm2 save
   ```
2. En GitHub vas a: **Settings > Webhooks > Add webhook**:
   - **Payload URL**: `http://IP_DE_TU_VPS:4000/webhook` (o por Nginx en `https://finixarg.com/webhook`)
   - **Content type**: `application/json`
   - **Which events**: `Just the push event`
   - Hacés click en **Add webhook**.

---

## 🛠️ Comandos de Mantenimiento Frecuentes

```bash
# Ver estado de los servicios en PM2
pm2 status

# Ver logs en vivo del Backend
pm2 logs finix-api

# Reiniciar el Backend manualmente
pm2 restart finix-api

# Ejecutar un despliegue completo manual
cd /var/www/finix && bash deploy.sh

# Ver logs de Nginx en caso de problemas de red
sudo tail -f /var/log/nginx/error.log
```

