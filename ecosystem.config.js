module.exports = {
  apps: [
    {
      name: "melodia",
      script: "npx",
      args: "next dev -p 3000",
      cwd: "/home/z/my-project",
      env: {
        NODE_ENV: "development",
        // Force Neon PostgreSQL - prevent shell DATABASE_URL override
        DATABASE_URL: "postgresql://neondb_owner:npg_28QEXTLOPVtl@ep-dawn-bread-ay3hjwsa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
        DATABASE_URL_DIRECT: "postgresql://neondb_owner:npg_28QEXTLOPVtl@ep-dawn-bread-ay3hjwsa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
      },
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      autorestart: true,
    },
  ],
};
