import Link from 'next/link';
import { Suspense } from 'react';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { toEuro } from '@/lib/money';
import { STATUS_LABELS, STATUS_BADGE, STATUS_BADGE_DEFAULT, getReste, isNonSoldee, NON_SOLDEE_DB_WHERE } from '@/lib/interventions';
import ExportCsvButton from '@/components/ExportCsvButton';
import ExportPdfButton from '@/components/ExportPdfButton';


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
  searchParams: Promise<{ mois?: string; statut?: string; clientId?: string; nonSoldees?: string }>;
}) {
  const { mois, statut, clientId, nonSoldees } = await searchParams;

  const knownStatuses = new Set<string>(Object.values(InterventionStatus));
  const safeStatut = statut && knownStatuses.has(statut) ? statut as InterventionStatus : undefined;

  const [clients, interventions] = await Promise.all([
    prisma.client.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
    prisma.intervention.findMany({
      where: {
        ...(mois ? (() => {
          const [y, m] = mois.split('-').map(Number);
          return { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } };
        })() : {}),
        ...(nonSoldees === '1'
          ? NON_SOLDEE_DB_WHERE
          : safeStatut ? { status: safeStatut } : {}),
        ...(clientId ? { clientId: Number(clientId) } : {}),
      },
      include: { client: true },
      orderBy: { date: 'desc' },
    }),
  ]);

  const displayedInterventions = nonSoldees === '1'
    ? interventions.filter((i) => isNonSoldee(i.status, Number(i.plannedAmount), Number(i.receivedAmount)))
    : interventions;

  const hasFilter = !!(mois || statut || clientId || nonSoldees);
  const totalEncaisse = displayedInterventions.reduce((s, i) => s + Number(i.receivedAmount), 0);
  const totalReste = displayedInterventions.reduce((s, i) => s + getReste(Number(i.plannedAmount), Number(i.receivedAmount)), 0);

  const monthOptions = buildMonthOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interventions</h2>
        <Link href="/interventions/nouveau" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          Ajouter
        </Link>
      </div>

      {/* Filtres */}
      <form method="GET" className="flex flex-wrap items-center gap-3">
        <select name="mois" defaultValue={mois ?? ''} className={selectCls}>
          <option value="">Tous les mois</option>
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select name="statut" defaultValue={statut ?? ''} className={selectCls}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select name="clientId" defaultValue={clientId ?? ''} className={selectCls}>
          <option value="">Tous les clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.lastName} {c.firstName}</option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            name="nonSoldees"
            value="1"
            defaultChecked={nonSoldees === '1'}
            className="accent-slate-700"
          />
          Non soldées
        </label>

        <button type="submit" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          Filtrer
        </button>

        {hasFilter && (
          <Link href="/interventions" className="text-sm font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Effacer
          </Link>
        )}

        <Suspense>
          <ExportCsvButton />
        </Suspense>
        <Suspense>
          <ExportPdfButton />
        </Suspense>
      </form>

      {/* Table */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        {hasFilter && (
          <div className="mb-3 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span>{displayedInterventions.length} intervention{displayedInterventions.length !== 1 ? 's' : ''}</span>
            <span>Encaissé : <strong className="text-slate-900 dark:text-slate-100">{toEuro(totalEncaisse)}</strong></span>
            {totalReste > 0 && (
              <span>Reste à percevoir : <strong className="text-amber-600 dark:text-amber-400">{toEuro(totalReste)}</strong></span>
            )}
          </div>
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
                <th className="px-3 py-2 font-semibold">Reste</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedInterventions.map((item) => {
                const reste = getReste(Number(item.plannedAmount), Number(item.receivedAmount));
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-3 py-2">{new Date(item.date).toLocaleDateString('fr-BE')}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/clients/${item.clientId}`} className="hover:underline">
                        {item.client.lastName} {item.client.firstName}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{item.workType}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[item.status] ?? STATUS_BADGE_DEFAULT}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">{toEuro(Number(item.plannedAmount))}</td>
                    <td className="px-3 py-2 font-medium">{toEuro(Number(item.receivedAmount))}</td>
                    <td className="px-3 py-2">
                      {reste > 0 ? (
                        <span className="font-medium text-amber-600 dark:text-amber-400">{toEuro(reste)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/interventions/${item.id}/edit`} className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {interventions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500 dark:text-slate-500">
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
