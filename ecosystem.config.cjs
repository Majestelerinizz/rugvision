/**
 * PM2 — Contabo / CloudPanel production
 *
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart rugvision
 *   pm2 logs rugvision
 */
module.exports = {
  apps: [
    {
      name: "rugvision",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
