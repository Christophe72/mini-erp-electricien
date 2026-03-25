import Link from 'next/link';
import { prisma } from '@/lib/db';
import { toEuro } from '@/lib/money';

function levelStyles(level: 'green' | 'orange' | 'red') {
  if (level === 'red') return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
  if (level === 'orange') return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700';
  return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
}

function levelLabel(level: 'green' | 'orange' | 'red') {
  if (level === 'red') return 'Dépassé';
  if (level === 'orange') return 'Attention';
  return 'OK';
}

export default async function TresoreriePage() {
  const now = new Date();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      date: d,
      slug: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' }),
    };
  });

  const earliest = months[months.length - 1].date;
  const latest = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [allInterventions, settings] = await Promise.all([
    prisma.intervention.findMany({
      where: { date: { gte: earliest, lt: latest } },
      select: { date: true, receivedAmount: true },
    }),
    prisma.userSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, activityName: 'Activité électricité', monthlyLimit: 1500, currency: 'EUR' },
    }),
  ]);

  const monthlyLimit = Number(settings.monthlyLimit);

  const rows = months.map(({ year, month, date, slug, label }) => {
    const items = allInterventions.filter((i) => {
      const d = new Date(i.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const total = items.reduce((sum, i) => sum + Number(i.receivedAmount), 0);
    const ratio = monthlyLimit > 0 ? (total / monthlyLimit) * 100 : 0;
    let level: 'green' | 'orange' | 'red' = 'green';
    if (ratio >= 100) level = 'red';
    else if (ratio >= 80) level = 'orange';

    return { year, month, date, slug, label, count: items.length, total, ratio, level };
  });

  const yearTotal = rows
    .filter((r) => r.year === now.getFullYear())
    .reduce((sum, r) => sum + r.total, 0);

  const activeMonths = rows.filter((r) => r.total > 0).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Trésorerie</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total {now.getFullYear()}</p>
          <p className="mt-2 text-2xl font-bold">{toEuro(yearTotal)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Seuil mensuel</p>
          <p className="mt-2 text-2xl font-bold">{toEuro(monthlyLimit)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Mois actifs (12 derniers)</p>
          <p className="mt-2 text-2xl font-bold">{activeMonths}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-2 font-semibold">Mois</th>
                <th className="px-3 py-2 font-semibold">Interventions</th>
                <th className="px-3 py-2 font-semibold">Encaissé</th>
                <th className="px-3 py-2 font-semibold">Seuil</th>
                <th className="px-3 py-2 font-semibold">Consommé</th>
                <th className="px-3 py-2 font-semibold">Statut</th>
                <th className="px-3 py-2 font-semibold">Détail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.slug}
                  className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                    row.slug === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                      ? 'font-semibold'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 capitalize">{row.label}</td>
                  <td className="px-3 py-2 text-center">{row.count || '-'}</td>
                  <td className="px-3 py-2">{row.total > 0 ? toEuro(row.total) : '-'}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{toEuro(monthlyLimit)}</td>
                  <td className="px-3 py-2">
                    {row.total > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full ${row.level === 'red' ? 'bg-red-500' : row.level === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(row.ratio, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{row.ratio.toFixed(0)} %</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.total > 0 && (
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${levelStyles(row.level)}`}>
                        {levelLabel(row.level)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.count > 0 && (
                      <div className="flex gap-3">
                        <Link
                          href={`/interventions?mois=${row.slug}`}
                          className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Filtrer
                        </Link>
                        <Link
                          href={`/rapport/${row.slug}`}
                          className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Rapport
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
