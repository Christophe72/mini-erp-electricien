import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { toEuro } from '@/lib/money';
import PrintButton from '@/components/PrintButton';

const STATUS_LABELS: Record<InterventionStatus, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  FACTUREE: 'Facturée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

export default async function RapportPage({
  params,
}: {
  params: Promise<{ mois: string }>;
}) {
  const { mois } = await params;

  const match = mois.match(/^(\d{4})-(\d{2})$/);
  if (!match) notFound();

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) notFound();

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const monthLabel = monthStart.toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });

  const [settings, interventions] = await Promise.all([
    prisma.userSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, activityName: 'Activité électricité', monthlyLimit: 1500, currency: 'EUR' },
    }),
    prisma.intervention.findMany({
      where: { date: { gte: monthStart, lt: monthEnd } },
      include: { client: true },
      orderBy: { date: 'asc' },
    }),
  ]);

  const totalReceived = interventions.reduce((sum, i) => sum + Number(i.receivedAmount), 0);
  const totalPlanned = interventions.reduce((sum, i) => sum + Number(i.plannedAmount), 0);
  const monthlyLimit = Number(settings.monthlyLimit);
  const ratio = monthlyLimit > 0 ? (totalReceived / monthlyLimit) * 100 : 0;
  const remaining = Math.max(monthlyLimit - totalReceived, 0);

  const byStatus = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: interventions.filter((i) => i.status === status).length,
  })).filter((s) => s.count > 0);

  return (
    <div>
      {/* Barre d'actions — masquée à l'impression */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/tresorerie" className="text-sm font-medium text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          ← Trésorerie
        </Link>
        <div className="flex gap-3">
          <a
            href={`/api/interventions/csv?mois=${mois}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ↓ Export CSV
          </a>
          <a
            href={`/api/interventions/pdf?mois=${mois}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ↓ Export PDF
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Rapport */}
      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm print:shadow-none dark:bg-slate-900 print:dark:bg-white print:text-black">

        {/* En-tête */}
        <div className="border-b border-slate-200 pb-4 print:border-slate-400">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500 print:text-slate-600">
            {settings.activityName}
          </p>
          <h1 className="mt-1 text-2xl font-bold capitalize">{monthLabel}</h1>
        </div>

        {/* Résumé chiffré */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Interventions', value: String(interventions.length) },
            { label: 'Total encaissé', value: toEuro(totalReceived) },
            { label: 'Total prévu', value: toEuro(totalPlanned) },
            { label: 'Reste avant seuil', value: toEuro(remaining) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-200 p-4 print:border-slate-400">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 print:text-slate-600">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Barre de seuil */}
        {monthlyLimit > 0 && (
          <div>
            <div className="mb-1 flex justify-between text-sm text-slate-600 dark:text-slate-400 print:text-slate-600">
              <span>Seuil mensuel : {toEuro(monthlyLimit)}</span>
              <span>{ratio.toFixed(1)} % utilisé</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 print:bg-slate-200">
              <div
                className={`h-full ${ratio >= 100 ? 'bg-red-500' : ratio >= 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(ratio, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Répartition par statut */}
        {byStatus.length > 0 && (
          <div className="flex flex-wrap gap-3 text-sm">
            {byStatus.map(({ label, count }) => (
              <span key={label} className="rounded-lg border border-slate-200 px-3 py-1 print:border-slate-400">
                {label} : <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Table des interventions */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 print:border-slate-400 print:text-slate-700 dark:border-slate-700 dark:text-slate-400">
                <th className="px-2 py-2 font-semibold">Date</th>
                <th className="px-2 py-2 font-semibold">Client</th>
                <th className="px-2 py-2 font-semibold">Type de travail</th>
                <th className="px-2 py-2 font-semibold">Statut</th>
                <th className="px-2 py-2 font-semibold">Paiement</th>
                <th className="px-2 py-2 text-right font-semibold">Prévu</th>
                <th className="px-2 py-2 text-right font-semibold">Encaissé</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 print:border-slate-300 dark:border-slate-800">
                  <td className="px-2 py-2">{new Date(item.date).toLocaleDateString('fr-BE')}</td>
                  <td className="px-2 py-2 font-medium">{item.client.firstName} {item.client.lastName}</td>
                  <td className="px-2 py-2">{item.workType}</td>
                  <td className="px-2 py-2">{STATUS_LABELS[item.status]}</td>
                  <td className="px-2 py-2 text-slate-600 dark:text-slate-400 print:text-slate-600">{item.paymentMethod}</td>
                  <td className="px-2 py-2 text-right">{toEuro(Number(item.plannedAmount))}</td>
                  <td className="px-2 py-2 text-right font-medium">{toEuro(Number(item.receivedAmount))}</td>
                </tr>
              ))}
              {interventions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2 py-6 text-center text-slate-500">
                    Aucune intervention ce mois.
                  </td>
                </tr>
              )}
            </tbody>
            {interventions.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-semibold print:border-slate-500">
                  <td colSpan={5} className="px-2 py-2">Total</td>
                  <td className="px-2 py-2 text-right">{toEuro(totalPlanned)}</td>
                  <td className="px-2 py-2 text-right">{toEuro(totalReceived)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pied de page */}
        <p className="hidden text-xs text-slate-400 print:block print:text-slate-500">
          Généré le {new Date().toLocaleDateString('fr-BE')} — {settings.activityName}
        </p>
      </div>
    </div>
  );
}
