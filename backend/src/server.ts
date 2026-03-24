import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

async function main() {
  // Verify DB connection before starting
  await prisma.$connect();
  console.log('✓ Database connected');

  app.listen(env.PORT, () => {
    console.log(`✓ Server running on http://localhost:${env.PORT}`);
    console.log(`  Environment: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
