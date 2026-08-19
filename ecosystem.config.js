module.exports = {
  apps: [
    {
      name: "melodia",
      script: "npx",
      args: "next start -p 3000",
      cwd: "/home/z/my-project/melodia-v2",
      env: {
        NODE_ENV: "production",
        // Database URL should be set via .env file — never hardcode credentials
      },
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      autorestart: true,
    },
  ],
};
