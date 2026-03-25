import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { InterventionStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/db';
import DeleteButton from '@/components/DeleteButton';

async function updateIntervention(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));
  const clientId = Number(formData.get('clientId'));
  const date = String(formData.get('date') ?? '').trim();
  const workType = String(formData.get('workType') ?? '').trim();

  if (!id || !clientId || !date || !workType) throw new Error('Intervention invalide');

  const status = String(formData.get('status') ?? 'A_FAIRE') as InterventionStatus;
  const paymentDateRaw = String(formData.get('paymentDate') ?? '').trim();

  // Auto-date de paiement si statut PAYEE et aucune date fournie
  let paymentDate: Date | null = null;
  if (paymentDateRaw) {
    paymentDate = new Date(paymentDateRaw);
  } else if (status === 'PAYEE') {
    paymentDate = new Date();
  }

  await prisma.intervention.update({
    where: { id },
    data: {
      clientId,
      date: new Date(date),
      workType,
      description: String(formData.get('description') ?? '').trim() || null,
      estimatedDurationHours: Number(formData.get('estimatedDurationHours') || 0) || null,
      actualDurationHours: Number(formData.get('actualDurationHours') || 0) || null,
      status,
      plannedAmount: Number(formData.get('plannedAmount') || 0),
      receivedAmount: Number(formData.get('receivedAmount') || 0),
      paymentMethod: String(formData.get('paymentMethod') ?? 'VIREMENT') as PaymentMethod,
      paymentDate,
      notes: String(formData.get('notes') ?? '').trim() || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/interventions');
  redirect('/interventions');
}

async function deleteIntervention(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));
  if (!id) throw new Error('Intervention invalide');

  await prisma.intervention.delete({ where: { id } });

  revalidatePath('/dashboard');
  revalidatePath('/interventions');
  redirect('/interventions');
}

const inputCls = 'rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-400';
const labelCls = 'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400';

export default async function EditInterventionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [intervention, clients] = await Promise.all([
    prisma.intervention.findUnique({ where: { id: Number(id) } }),
    prisma.client.findMany({ orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] }),
  ]);

  if (!intervention) notFound();

  const dateValue = new Date(intervention.date).toISOString().slice(0, 10);
  const paymentDateValue = intervention.paymentDate
    ? new Date(intervention.paymentDate).toISOString().slice(0, 10)
    : '';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Modifier l'intervention</h2>
          <Link href="/interventions" className="text-sm font-medium text-slate-600 underline hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            ← Retour liste
          </Link>
        </div>

        <form action={updateIntervention} className="grid gap-5">
          <input type="hidden" name="id" value={intervention.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Client</label>
              <select name="clientId" defaultValue={intervention.clientId} className={inputCls} required>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.lastName} {c.firstName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" name="date" defaultValue={dateValue} className={inputCls} required />
            </div>
          </div>

          <div>
            <label className={labelCls}>Type de travail</label>
            <input name="workType" defaultValue={intervention.workType} placeholder="Type de travail" className={inputCls} required />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea name="description" defaultValue={intervention.description ?? ''} placeholder="Description" className={`min-h-24 ${inputCls}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Durée estimée (h)</label>
              <input type="number" step="0.5" name="estimatedDurationHours" defaultValue={intervention.estimatedDurationHours ?? ''} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Durée réelle (h)</label>
              <input type="number" step="0.5" name="actualDurationHours" defaultValue={intervention.actualDurationHours ?? ''} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Statut</label>
              <select name="status" defaultValue={intervention.status} className={inputCls}>
                <option value="A_FAIRE">À faire</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINEE">Terminée</option>
                <option value="FACTUREE">Facturée</option>
                <option value="PAYEE">Payée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Mode de paiement</label>
              <select name="paymentMethod" defaultValue={intervention.paymentMethod} className={inputCls}>
                <option value="VIREMENT">Virement</option>
                <option value="ESPECES">Espèces</option>
                <option value="CARTE">Carte</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Montant prévu (€)</label>
              <input type="number" step="0.01" name="plannedAmount" defaultValue={Number(intervention.plannedAmount)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Montant encaissé (€)</label>
              <input type="number" step="0.01" name="receivedAmount" defaultValue={Number(intervention.receivedAmount)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date de paiement</label>
              <input type="date" name="paymentDate" defaultValue={paymentDateValue} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea name="notes" defaultValue={intervention.notes ?? ''} placeholder="Notes libres" className={`min-h-24 ${inputCls}`} />
          </div>

          <button className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
            Enregistrer les modifications
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Zone dangereuse</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Cette intervention sera supprimée définitivement.
        </p>
        <form action={deleteIntervention} className="mt-4">
          <input type="hidden" name="id" value={intervention.id} />
          <DeleteButton
            label="Supprimer l'intervention"
            confirmMessage={`Supprimer « ${intervention.workType} » du ${new Date(intervention.date).toLocaleDateString('fr-BE')} ?`}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          />
        </form>
      </div>
    </div>
  );
}
