// PM2 Ecosystem Config — Production
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
    apps: [
        {
            name: 'finix-api',
            script: 'dist/main.js',
            cwd: '/srv/finix/current/apps/api',

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
            out_file: '/var/log/finix/api.out.log',
            error_file: '/var/log/finix/api.err.log',
            merge_logs: true,
            log_type: 'json',

            // ── Graceful shutdown ─────────────────────────────────────────────
            kill_timeout: 10000,     // 10s grace period
            wait_ready: true,        // Wait for app to signal ready
            listen_timeout: 60000,   // Max time to wait for ready signal
        },
    ],
};
