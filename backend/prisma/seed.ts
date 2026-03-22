import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Admin',
    },
  });
  console.log(`✓ User: ${user.email}`);

  // Create sample clients
  const acmeCorp = await prisma.client.upsert({
    where: { id: 'seed-client-1' },
    update: {},
    create: {
      id: 'seed-client-1',
      userId: user.id,
      name: 'Acme Corp',
      billingType: 'HOURLY',
      hourlyRate: 150,
      monthlyBudget: 3000,
      notes: 'Enterprise client — billing monthly',
      tags: ['enterprise', 'priority'],
    },
  });

  const designCo = await prisma.client.upsert({
    where: { id: 'seed-client-2' },
    update: {},
    create: {
      id: 'seed-client-2',
      userId: user.id,
      name: 'Design Co',
      billingType: 'FIXED',
      fixedRate: 200,
      monthlyBudget: 1600,
      notes: 'Per-session design review',
      tags: ['design'],
    },
  });

  const startupXyz = await prisma.client.upsert({
    where: { id: 'seed-client-3' },
    update: {},
    create: {
      id: 'seed-client-3',
      userId: user.id,
      name: 'Startup XYZ',
      billingType: 'HOURLY',
      hourlyRate: 120,
      monthlyBudget: 2400,
      tags: ['startup'],
    },
  });

  console.log(`✓ Clients: ${acmeCorp.name}, ${designCo.name}, ${startupXyz.name}`);

  // Create sample past sessions for current month
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sessionsData = [
    {
      clientId: acmeCorp.id,
      userId: user.id,
      startTime: new Date(thisMonth.getTime() + 1 * 24 * 3600 * 1000 + 9 * 3600 * 1000),
      durationSecs: 5400, // 1.5h
      billingType: 'HOURLY' as const,
      billingSnapshot: 150,
      cost: 225,
      status: 'COMPLETED' as const,
      notes: 'Initial planning meeting',
    },
    {
      clientId: acmeCorp.id,
      userId: user.id,
      startTime: new Date(thisMonth.getTime() + 3 * 24 * 3600 * 1000 + 14 * 3600 * 1000),
      durationSecs: 7200, // 2h
      billingType: 'HOURLY' as const,
      billingSnapshot: 150,
      cost: 300,
      status: 'COMPLETED' as const,
      notes: 'Architecture review',
    },
    {
      clientId: designCo.id,
      userId: user.id,
      startTime: new Date(thisMonth.getTime() + 2 * 24 * 3600 * 1000 + 10 * 3600 * 1000),
      durationSecs: 3600, // 1h
      billingType: 'FIXED' as const,
      billingSnapshot: 200,
      cost: 200,
      status: 'COMPLETED' as const,
      notes: 'Logo review session',
    },
    {
      clientId: startupXyz.id,
      userId: user.id,
      startTime: new Date(thisMonth.getTime() + 4 * 24 * 3600 * 1000 + 11 * 3600 * 1000),
      durationSecs: 4500, // 1.25h
      billingType: 'HOURLY' as const,
      billingSnapshot: 120,
      cost: 150,
      status: 'COMPLETED' as const,
      notes: 'Sprint planning',
    },
  ];

  for (const s of sessionsData) {
    await prisma.session.create({
      data: {
        ...s,
        endTime: new Date(s.startTime.getTime() + s.durationSecs * 1000),
      },
    });
  }
  console.log(`✓ Sessions: ${sessionsData.length} sample sessions created`);

  console.log('\nSeed complete.');
  console.log('Login with: admin@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
