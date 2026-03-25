'use client';

import { useSearchParams } from 'next/navigation';

export default function ExportCsvButton() {
  const searchParams = useSearchParams();

  function handleClick() {
    const params = new URLSearchParams();
    const mois = searchParams.get('mois');
    const statut = searchParams.get('statut');
    if (mois) params.set('mois', mois);
    if (statut) params.set('statut', statut);
    const qs = params.toString();
    window.location.href = `/api/interventions/csv${qs ? `?${qs}` : ''}`;
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      ↓ Export CSV
    </button>
  );
}
