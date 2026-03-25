import { prisma } from '@/lib/db';

export async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [settings, clientsCount, interventionsCount, interventions, recentInterventions] =
    await Promise.all([
      prisma.userSetting.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          activityName: 'Activité électricité',
          monthlyLimit: 1500,
          currency: 'EUR',
        },
      }),
      prisma.client.count(),
      prisma.intervention.count({
        where: {
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      }),
      prisma.intervention.findMany({
        where: {
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        select: {
          receivedAmount: true,
        },
      }),
      prisma.intervention.findMany({
        include: {
          client: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 5,
      }),
    ]);

  const totalMonth = interventions.reduce((sum, item) => {
    return sum + Number(item.receivedAmount);
  }, 0);

  const monthlyLimit = Number(settings.monthlyLimit);
  const remaining = Math.max(monthlyLimit - totalMonth, 0);
  const ratio = monthlyLimit > 0 ? (totalMonth / monthlyLimit) * 100 : 0;

  let level: 'green' | 'orange' | 'red' = 'green';
  if (ratio >= 100) level = 'red';
  else if (ratio >= 80) level = 'orange';

  return {
    settings,
    clientsCount,
    interventionsCount,
    totalMonth,
    monthlyLimit,
    remaining,
    ratio,
    level,
    recentInterventions,
  };
}
