import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

async function createIntervention(formData: FormData) {
  'use server';

  const clientId = Number(formData.get('clientId'));
  const date = String(formData.get('date') ?? '').trim();
  const workType = String(formData.get('workType') ?? '').trim();

  if (!clientId || !date || !workType) {
    throw new Error('Client, date et type de travail obligatoires');
  }

  await prisma.intervention.create({
    data: {
      clientId,
      date: new Date(date),
      workType,
      description: String(formData.get('description') ?? '').trim() || null,
      estimatedDurationHours: Number(formData.get('estimatedDurationHours') || 0) || null,
      actualDurationHours: Number(formData.get('actualDurationHours') || 0) || null,
      status: (String(formData.get('status') ?? 'A_FAIRE') as 'A_FAIRE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'),
      plannedAmount: Number(formData.get('plannedAmount') || 0),
      receivedAmount: Number(formData.get('receivedAmount') || 0),
      paymentMethod: (String(formData.get('paymentMethod') ?? 'VIREMENT') as 'ESPECES' | 'VIREMENT' | 'CARTE' | 'AUTRE'),
      notes: String(formData.get('notes') ?? '').trim() || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/interventions');
  redirect('/interventions');
}

const inputCls = 'rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-400';

export default async function NewInterventionPage() {
  const clients = await prisma.client.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-2xl font-bold">Nouvelle intervention</h2>

      <form action={createIntervention} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <select name="clientId" className={inputCls} required>
            <option value="">Choisir un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>

          <input type="date" name="date" className={inputCls} required />
        </div>

        <input name="workType" placeholder="Type de travail" className={inputCls} required />
        <textarea name="description" placeholder="Description" className={`min-h-24 ${inputCls}`} />

        <div className="grid gap-4 md:grid-cols-2">
          <input type="number" step="0.5" name="estimatedDurationHours" placeholder="Durée estimée (h)" className={inputCls} />
          <input type="number" step="0.5" name="actualDurationHours" placeholder="Durée réelle (h)" className={inputCls} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select name="status" className={inputCls} defaultValue="A_FAIRE">
            <option value="A_FAIRE">À faire</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
            <option value="ANNULEE">Annulée</option>
          </select>

          <select name="paymentMethod" className={inputCls} defaultValue="VIREMENT">
            <option value="VIREMENT">Virement</option>
            <option value="ESPECES">Espèces</option>
            <option value="CARTE">Carte</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input type="number" step="0.01" name="plannedAmount" placeholder="Montant prévu" className={inputCls} />
          <input type="number" step="0.01" name="receivedAmount" placeholder="Montant encaissé" className={inputCls} />
        </div>

        <textarea name="notes" placeholder="Notes" className={`min-h-24 ${inputCls}`} />

        <button className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
