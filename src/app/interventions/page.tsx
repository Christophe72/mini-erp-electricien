import Link from 'next/link';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { toEuro } from '@/lib/money';

const STATUS_LABELS: Record<InterventionStatus, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

function buildMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

const selectCls = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:focus:border-slate-400';

export default async function InterventionsPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; statut?: string }>;
}) {
  const { mois, statut } = await searchParams;

  const monthOptions = buildMonthOptions();

  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (mois) {
    const [year, month] = mois.split('-').map(Number);
    dateFilter = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  const interventions = await prisma.intervention.findMany({
    where: {
      ...(dateFilter ? { date: dateFilter } : {}),
      ...(statut ? { status: statut as InterventionStatus } : {}),
    },
    include: { client: true },
    orderBy: { date: 'desc' },
  });

  const totalVisible = interventions.reduce((sum, i) => sum + Number(i.receivedAmount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interventions</h2>
        <Link href="/interventions/nouveau" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          Ajouter
        </Link>
      </div>

      <form method="GET" className="flex flex-wrap gap-3">
        <select name="mois" defaultValue={mois ?? ''} className={selectCls}>
          <option value="">Tous les mois</option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select name="statut" defaultValue={statut ?? ''} className={selectCls}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <button type="submit" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          Filtrer
        </button>

        {(mois || statut) && (
          <Link href="/interventions" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Effacer
          </Link>
        )}
      </form>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        {(mois || statut) && (
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            {interventions.length} intervention{interventions.length !== 1 ? 's' : ''} — total encaissé : <strong className="text-slate-900 dark:text-slate-100">{toEuro(totalVisible)}</strong>
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Client</th>
                <th className="px-3 py-2 font-semibold">Travail</th>
                <th className="px-3 py-2 font-semibold">Statut</th>
                <th className="px-3 py-2 font-semibold">Prévu</th>
                <th className="px-3 py-2 font-semibold">Encaissé</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-3 py-2">{new Date(item.date).toLocaleDateString('fr-BE')}</td>
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/clients/${item.clientId}`} className="hover:underline">
                      {item.client.firstName} {item.client.lastName}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{item.workType}</td>
                  <td className="px-3 py-2">{STATUS_LABELS[item.status]}</td>
                  <td className="px-3 py-2">{toEuro(Number(item.plannedAmount))}</td>
                  <td className="px-3 py-2 font-medium">{toEuro(Number(item.receivedAmount))}</td>
                  <td className="px-3 py-2">
                    <Link href={`/interventions/${item.id}/edit`} className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
              {interventions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500 dark:text-slate-500">
                    Aucune intervention pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
