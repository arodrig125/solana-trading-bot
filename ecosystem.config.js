const os = require('os');

module.exports = {
  apps: [{
    name: 'solarbot-master',
    script: 'cluster.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PM2_GRACEFUL_TIMEOUT: 4000,
      PM2_GRACEFUL_KILL_TIMEOUT: 6000
    },
    max_memory_restart: '1G',
    error_file: 'logs/master-err.log',
    out_file: 'logs/master-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'  
  }, {
    name: 'solarbot-worker',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    increment_var: 'INSTANCE_ID',
    instance_var: 'INSTANCE_ID',
    exp_backoff_restart_delay: 100,
    kill_timeout: 5000,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 5000,
    // Add monitoring metrics
    monitor: {
      memory: true,
      cpu: true,
      latency: true
    }
  }, {
    name: 'api',
    script: 'api/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
