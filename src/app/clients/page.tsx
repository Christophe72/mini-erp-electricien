import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import SearchInput from '@/components/SearchInput';

async function ClientTable({ q }: { q?: string }) {
  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { city: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-700 dark:text-slate-400">
            <th className="px-3 py-2 font-semibold">Nom</th>
            <th className="px-3 py-2 font-semibold">Téléphone</th>
            <th className="px-3 py-2 font-semibold">Ville</th>
            <th className="px-3 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="px-3 py-2 font-medium">{client.firstName} {client.lastName}</td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{client.phone ?? '-'}</td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{client.city ?? '-'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-4">
                  <Link href={`/clients/${client.id}`} className="font-medium text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                    Ouvrir
                  </Link>
                  <Link href={`/clients/${client.id}/edit`} className="font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    Modifier
                  </Link>
                </div>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-slate-500 dark:text-slate-500">
                {q ? `Aucun client pour « ${q} ».` : 'Aucun client enregistré.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Clients</h2>
        <Link href="/clients/nouveau" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          Ajouter
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="mb-4">
          <Suspense>
            <SearchInput placeholder="Rechercher par nom, ville, téléphone…" />
          </Suspense>
        </div>
        <ClientTable q={q} />
      </div>
    </div>
  );
}
