import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { toEuro } from '@/lib/money';

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

  const total = client.interventions.reduce((sum, item) => sum + Number(item.receivedAmount), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{client.firstName} {client.lastName}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{client.phone ?? '-'} · {client.city ?? '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/clients/${client.id}/edit`} className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              Modifier
            </Link>
            <Link href="/interventions/nouveau" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
              Nouvelle intervention
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Email :</strong> {client.email ?? '-'}</p>
          <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Adresse :</strong> {client.address ?? '-'}</p>
          <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Code postal :</strong> {client.postalCode ?? '-'}</p>
          <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Total encaissé :</strong> {toEuro(total)}</p>
        </div>

        {client.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {client.notes}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Interventions liées</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Statut</th>
                <th className="px-3 py-2 font-semibold">Encaissé</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {client.interventions.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-3 py-2">{new Date(item.date).toLocaleDateString('fr-BE')}</td>
                  <td className="px-3 py-2 font-medium">{item.workType}</td>
                  <td className="px-3 py-2">{item.status}</td>
                  <td className="px-3 py-2 font-medium">{toEuro(Number(item.receivedAmount))}</td>
                  <td className="px-3 py-2">
                    <Link href={`/interventions/${item.id}/edit`} className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
              {client.interventions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500 dark:text-slate-500">
                    Aucune intervention liée à ce client.
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
