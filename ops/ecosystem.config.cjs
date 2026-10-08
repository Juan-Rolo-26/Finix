const path = require('path');
const fs = require('fs');

// PM2 Ecosystem Config — Production
// Usage: pm2 start ecosystem.config.cjs

const rootDir = process.env.FINIX_ROOT || path.resolve(__dirname, '..');
const logDir = process.env.FINIX_LOG_DIR || path.join(rootDir, 'logs');
const environmentFile = path.join(rootDir, 'apps/api/.env');
const apiEnvironment = fs.existsSync(environmentFile)
    ? require('dotenv').parse(fs.readFileSync(environmentFile)) : {};

module.exports = {
    apps: [
        {
            name: 'finix-api',
            script: 'dist/main.js',
            cwd: path.join(rootDir, 'apps/api'),

            // ── Instances ────────────────────────────────────────────────────
            // Socket.IO rooms, caches and scheduled jobs are process-local. Running
            // multiple workers currently duplicates jobs and can lose broadcasts.
            // Enable a shared adapter/job locking before enabling cluster mode.
            instances: 1,
            exec_mode: 'fork',

            // ── Env ──────────────────────────────────────────────────────────
            env_production: {
                // Override old PM2 values as well as shell values. dotenv/config
                // alone does not replace a previously exported DATABASE_URL.
                ...apiEnvironment,
                NODE_ENV: 'production',
                PORT: 3010,
                FINIX_COMMIT: process.env.FINIX_COMMIT || 'unknown',
            },

            // ── Restart policy ───────────────────────────────────────────────
            watch: false,
            max_memory_restart: '512M',
            restart_delay: 5000,   // 5s between restarts
            max_restarts: 10,
            min_uptime: '10s',

            // ── Logs ─────────────────────────────────────────────────────────
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            out_file: path.join(logDir, 'pm2-api.out.log'),
            error_file: path.join(logDir, 'pm2-api.err.log'),
            merge_logs: true,
            log_type: 'json',

            // ── Graceful shutdown ─────────────────────────────────────────────
            kill_timeout: 10000,     // 10s grace period
            wait_ready: false,       // Health check is authoritative for readiness
        },
    ],
};
