import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { toEuro } from '@/lib/money';
import {
  STATUS_LABELS,
  STATUS_BADGE,
  STATUS_BADGE_DEFAULT,
  getReste,
  isNonSoldee,
} from '@/lib/interventions';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      interventions: {
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!client) notFound();

  const { interventions } = client;

  // Calculs financiers — ANNULEE exclue des totaux
  const actives = interventions.filter((i) => i.status !== 'ANNULEE');
  const totalPrevu    = actives.reduce((s, i) => s + Number(i.plannedAmount), 0);
  const totalEncaisse = actives.reduce((s, i) => s + Number(i.receivedAmount), 0);
  const totalReste    = actives.reduce((s, i) => s + getReste(Number(i.plannedAmount), Number(i.receivedAmount)), 0);
  const nonSoldeesCount = actives.filter((i) => isNonSoldee(i.status, Number(i.plannedAmount), Number(i.receivedAmount))).length;
  // Dernière intervention active (non ANNULEE) — actives est déjà trié par date desc
  const derniereIntervention = actives[0] ?? null;

  return (
    <div className="space-y-6">

      {/* Informations client */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{client.firstName} {client.lastName}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {[client.phone, client.city].filter(Boolean).join(' · ') || 'Aucune coordonnée'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/clients/${client.id}/edit`}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Modifier
            </Link>
            <Link
              href="/interventions/nouveau"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Nouvelle intervention
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          {client.email && (
            <p className="text-slate-700 dark:text-slate-300">
              <span className="font-medium text-slate-500 dark:text-slate-400">Email </span>
              {client.email}
            </p>
          )}
          {(client.address || client.postalCode || client.city) && (
            <p className="text-slate-700 dark:text-slate-300">
              <span className="font-medium text-slate-500 dark:text-slate-400">Adresse </span>
              {[client.address, client.postalCode, client.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {client.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {client.notes}
          </div>
        )}
      </div>

      {/* Résumé financier — masqué si toutes les interventions sont annulées */}
      {actives.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total prévu</p>
            <p className="mt-2 text-xl font-bold">{toEuro(totalPrevu)}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total encaissé</p>
            <p className="mt-2 text-xl font-bold">{toEuro(totalEncaisse)}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Reste à percevoir</p>
            <p className={`mt-2 text-xl font-bold ${totalReste > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-50'}`}>
              {totalReste > 0 ? toEuro(totalReste) : '—'}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Dernière intervention</p>
            {derniereIntervention ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                  {derniereIntervention.workType}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Date(derniereIntervention.date).toLocaleDateString('fr-BE')}
                  {nonSoldeesCount > 0 && (
                    <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                      {nonSoldeesCount} non soldée{nonSoldeesCount > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">—</p>
            )}
          </div>

        </div>
      )}

      {/* Table des interventions */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h3 className="text-lg font-semibold">
          Interventions
          {interventions.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({interventions.length})
            </span>
          )}
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Type de travail</th>
                <th className="px-3 py-2 font-semibold">Statut</th>
                <th className="px-3 py-2 font-semibold text-right">Prévu</th>
                <th className="px-3 py-2 font-semibold text-right">Encaissé</th>
                <th className="px-3 py-2 font-semibold text-right">Reste</th>
                <th className="px-3 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((item) => {
                const reste = getReste(Number(item.plannedAmount), Number(item.receivedAmount));
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${
                      item.status === 'ANNULEE' ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {new Date(item.date).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-3 py-2 font-medium">{item.workType}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[item.status] ?? STATUS_BADGE_DEFAULT}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{toEuro(Number(item.plannedAmount))}</td>
                    <td className="px-3 py-2 text-right font-medium">{toEuro(Number(item.receivedAmount))}</td>
                    <td className="px-3 py-2 text-right">
                      {reste > 0 && item.status !== 'ANNULEE'
                        ? <span className="font-medium text-amber-600 dark:text-amber-400">{toEuro(reste)}</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/interventions/${item.id}/edit`}
                        className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {interventions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500 dark:text-slate-500">
                    Aucune intervention liée à ce client.
                  </td>
                </tr>
              )}
            </tbody>
            {actives.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  <td colSpan={3} className="px-3 py-2 text-xs font-medium uppercase tracking-wide">
                    Total (hors annulées)
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-50">
                    {toEuro(totalPrevu)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-50">
                    {toEuro(totalEncaisse)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {totalReste > 0
                      ? <span className="text-amber-600 dark:text-amber-400">{toEuro(totalReste)}</span>
                      : <span className="text-slate-400">—</span>
                    }
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
