import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

async function saveSettings(formData: FormData) {
  'use server';

  const activityName = String(formData.get('activityName') ?? '').trim() || 'Activité électricité';
  const monthlyLimit = Number(formData.get('monthlyLimit') || 0);
  const currency = String(formData.get('currency') ?? 'EUR').trim() || 'EUR';

  await prisma.userSetting.upsert({
    where: { id: 1 },
    update: {
      activityName,
      monthlyLimit,
      currency,
    },
    create: {
      id: 1,
      activityName,
      monthlyLimit,
      currency,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/parametres');
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-400';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

export default async function ParametresPage() {
  const settings = await prisma.userSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      activityName: 'Activité électricité',
      monthlyLimit: 1500,
      currency: 'EUR',
    },
  });

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-2xl font-bold">Paramètres</h2>

      <form action={saveSettings} className="mt-6 grid gap-4">
        <div>
          <label className={labelCls}>Nom de l&apos;activité</label>
          <input
            name="activityName"
            defaultValue={settings.activityName}
            className={inputCls}
            placeholder="Nom activité"
          />
        </div>

        <div>
          <label className={labelCls}>Seuil mensuel (€)</label>
          <input
            type="number"
            step="0.01"
            name="monthlyLimit"
            defaultValue={Number(settings.monthlyLimit)}
            className={inputCls}
            placeholder="Seuil mensuel"
          />
        </div>

        <div>
          <label className={labelCls}>Devise</label>
          <input
            name="currency"
            defaultValue={settings.currency}
            className={inputCls}
            placeholder="Devise"
          />
        </div>

        <button className="rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
