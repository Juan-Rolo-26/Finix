const path = require('path');

// PM2 Ecosystem Config — Production
// Usage: pm2 start ecosystem.config.cjs

const rootDir = process.env.FINIX_ROOT || path.resolve(__dirname, '..');
const logDir = path.join(rootDir, 'logs');

module.exports = {
    apps: [
        {
            name: 'finix-api',
            script: 'dist/main.js',
            cwd: path.join(rootDir, 'apps/api'),

            // ── Instances ────────────────────────────────────────────────────
            instances: 2,        // 2 workers — adjust based on CPU cores
            exec_mode: 'cluster',

            // ── Env ──────────────────────────────────────────────────────────
            env_production: {
                NODE_ENV: 'production',
                PORT: 3010,
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
