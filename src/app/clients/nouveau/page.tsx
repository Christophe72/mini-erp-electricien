import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

async function createClient(formData: FormData) {
  'use server';

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();

  if (!firstName || !lastName) {
    throw new Error('Prénom et nom obligatoires');
  }

  await prisma.client.create({
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
  redirect('/clients');
}

const inputCls = 'rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-400';

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-2xl font-bold">Nouveau client</h2>

      <form action={createClient} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="firstName" placeholder="Prénom" className={inputCls} required />
          <input name="lastName" placeholder="Nom" className={inputCls} required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input name="phone" placeholder="Téléphone" className={inputCls} />
          <input name="email" placeholder="Email" className={inputCls} />
        </div>

        <input name="address" placeholder="Adresse" className={inputCls} />

        <div className="grid gap-4 md:grid-cols-2">
          <input name="postalCode" placeholder="Code postal" className={inputCls} />
          <input name="city" placeholder="Ville" className={inputCls} />
        </div>

        <textarea name="notes" placeholder="Notes" className={`min-h-28 ${inputCls}`} />

        <button className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
