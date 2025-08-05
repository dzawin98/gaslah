module.exports = {
  apps: [
    {
      name: 'rtrw-backend',
      script: './backend/dist/index.js',
      cwd: 'C:/gaslah',  // Sesuaikan dengan path project Anda
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
      script: 'npx',
      args: 'http-server C:/gaslah/dist -p 8080 --cors --no-dotfiles',
      cwd: 'C:/gaslah',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 3000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};