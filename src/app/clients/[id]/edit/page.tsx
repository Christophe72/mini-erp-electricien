import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import DeleteButton from '@/components/DeleteButton';

async function updateClient(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();

  if (!id || !firstName || !lastName) throw new Error('Client invalide');

  await prisma.client.update({
    where: { id },
    data: {
      firstName,
      lastName,
      phone: String(formData.get('phone') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      address: String(formData.get('address') ?? '').trim() || null,
      postalCode: String(formData.get('postalCode') ?? '').trim() || null,
      city: String(formData.get('city') ?? '').trim() || null,
      notes: String(formData.get('notes') ?? '').trim() || null,
    },
  });

  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

async function deleteClient(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));
  if (!id) throw new Error('Client invalide');

  await prisma.client.delete({ where: { id } });

  revalidatePath('/clients');
  revalidatePath('/dashboard');
  redirect('/clients');
}

const inputCls = 'rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-400';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id: Number(id) } });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Modifier le client</h2>
          <Link href={`/clients/${client.id}`} className="text-sm font-medium text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            ← Retour fiche
          </Link>
        </div>

        <form action={updateClient} className="grid gap-4">
          <input type="hidden" name="id" value={client.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <input name="firstName" defaultValue={client.firstName} placeholder="Prénom" className={inputCls} required />
            <input name="lastName" defaultValue={client.lastName} placeholder="Nom" className={inputCls} required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input name="phone" defaultValue={client.phone ?? ''} placeholder="Téléphone" className={inputCls} />
            <input name="email" defaultValue={client.email ?? ''} placeholder="Email" className={inputCls} />
          </div>

          <input name="address" defaultValue={client.address ?? ''} placeholder="Adresse" className={inputCls} />

          <div className="grid gap-4 md:grid-cols-2">
            <input name="postalCode" defaultValue={client.postalCode ?? ''} placeholder="Code postal" className={inputCls} />
            <input name="city" defaultValue={client.city ?? ''} placeholder="Ville" className={inputCls} />
          </div>

          <textarea name="notes" defaultValue={client.notes ?? ''} placeholder="Notes" className={`min-h-28 ${inputCls}`} />

          <button className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
            Enregistrer les modifications
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Zone dangereuse</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Supprimer ce client supprimera également toutes ses interventions liées. Cette action est irréversible.
        </p>
        <form action={deleteClient} className="mt-4">
          <input type="hidden" name="id" value={client.id} />
          <DeleteButton
            label="Supprimer le client"
            confirmMessage={`Supprimer ${client.firstName} ${client.lastName} et toutes ses interventions ?`}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          />
        </form>
      </div>
    </div>
  );
}
