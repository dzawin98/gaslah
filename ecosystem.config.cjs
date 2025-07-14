module.exports = {
  apps: [
    {
      name: 'rtrw-backend',
      script: './backend/dist/index.js',
      cwd: '/opt/rtrw',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'rtrw-frontend',
      script: 'http-server',
      args: 'dist -p 3000 -a 0.0.0.0',
      cwd: '/opt/rtrw',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};