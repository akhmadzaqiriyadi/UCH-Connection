module.exports = {
  apps: [{
    name: 'uch-app',
    script: 'bun',
    args: 'run src/index.ts',
    cwd: '/home/uch/UCH-Connection',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env.production',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    restart_delay: 4000
  }]
};
