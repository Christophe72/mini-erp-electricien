import { prisma } from '@/lib/db';
import { getReste, isNonSoldee, NON_SOLDEE_DB_WHERE, EXCLUDE_ANNULEE_WHERE } from '@/lib/interventions';

export async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    settings,
    clientsCount,
    interventionsCount,
    monthInterventions,
    recentInterventions,
    inProgressCount,
    unpaidInterventions,
  ] = await Promise.all([
    prisma.userSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, activityName: 'Activité électricité', monthlyLimit: 1500, currency: 'EUR' },
    }),
    prisma.client.count(),
    prisma.intervention.count({
      where: { date: { gte: monthStart, lt: monthEnd }, ...EXCLUDE_ANNULEE_WHERE },
    }),
    prisma.intervention.findMany({
      where: { date: { gte: monthStart, lt: monthEnd }, ...EXCLUDE_ANNULEE_WHERE },
      select: { receivedAmount: true },
    }),
    prisma.intervention.findMany({
      include: { client: true },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.intervention.count({
      where: { status: 'EN_COURS' },
    }),
    prisma.intervention.findMany({
      where: NON_SOLDEE_DB_WHERE,
      select: { plannedAmount: true, receivedAmount: true, status: true },
    }),
  ]);

  const totalMonth = monthInterventions.reduce((sum, i) => sum + Number(i.receivedAmount), 0);
  const totalToCollect = unpaidInterventions.reduce((sum, i) => {
    const planned  = Number(i.plannedAmount);
    const received = Number(i.receivedAmount);
    if (!isNonSoldee(i.status as string, planned, received)) return sum;
    return sum + getReste(planned, received);
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
    totalToCollect,
    inProgressCount,
    monthlyLimit,
    remaining,
    ratio,
    level,
    recentInterventions,
  };
}
