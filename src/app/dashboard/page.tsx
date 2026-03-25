import Link from 'next/link';
import { getDashboardData } from '@/lib/dashboard';
import { toEuro } from '@/lib/money';
import { STATUS_LABELS } from '@/lib/interventions';

function levelStyles(level: 'green' | 'orange' | 'red') {
  if (level === 'red') return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700';
  if (level === 'orange') return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700';
  return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 lg:col-span-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total encaissé du mois</p>
          <p className="mt-2 text-2xl font-bold">{toEuro(data.totalMonth)}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 lg:col-span-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Restant à encaisser</p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{toEuro(data.totalToCollect)}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">En cours</p>
          <p className="mt-2 text-2xl font-bold">{data.inProgressCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Interventions ce mois</p>
          <p className="mt-2 text-2xl font-bold">{data.interventionsCount}</p>
        </div>
      </section>

      {/* Seuil mensuel */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Suivi du seuil mensuel</h2>
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${levelStyles(data.level)}`}>
              {data.ratio.toFixed(0)} % utilisé
            </span>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full transition-all ${
                data.level === 'red' ? 'bg-red-500' : data.level === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(data.ratio, 100)}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            Seuil : {toEuro(data.monthlyLimit)} — reste {toEuro(data.remaining)} avant dépassement.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Vue rapide</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <p>Clients : <strong className="text-slate-900 dark:text-slate-50">{data.clientsCount}</strong></p>
            <p>Activité : <strong className="text-slate-900 dark:text-slate-50">{data.settings.activityName}</strong></p>
            <p>Devise : <strong className="text-slate-900 dark:text-slate-50">{data.settings.currency}</strong></p>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <Link className="rounded-lg bg-slate-900 px-3 py-2 text-center font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600" href="/clients/nouveau">
              Nouveau client
            </Link>
            <Link className="rounded-lg bg-slate-100 px-3 py-2 text-center font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" href="/interventions/nouveau">
              Nouvelle intervention
            </Link>
          </div>
        </div>
      </section>

      {/* Interventions récentes */}
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Interventions récentes</h2>
          <Link className="text-sm font-semibold text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100" href="/interventions">
            Voir tout
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Client</th>
                <th className="px-3 py-2 font-semibold">Travail</th>
                <th className="px-3 py-2 font-semibold">Statut</th>
                <th className="px-3 py-2 font-semibold">Encaissé</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInterventions.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-3 py-2">{new Date(item.date).toLocaleDateString('fr-BE')}</td>
                  <td className="px-3 py-2 font-medium">{item.client.firstName} {item.client.lastName}</td>
                  <td className="px-3 py-2">{item.workType}</td>
                  <td className="px-3 py-2">{STATUS_LABELS[item.status] ?? item.status}</td>
                  <td className="px-3 py-2 font-medium">{toEuro(Number(item.receivedAmount))}</td>
                </tr>
              ))}
              {data.recentInterventions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-500">
                    Aucune intervention pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
