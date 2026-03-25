import { NextRequest } from 'next/server';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { STATUS_LABELS, PAYMENT_LABELS, getReste, isNonSoldee, NON_SOLDEE_DB_WHERE } from '@/lib/interventions';

function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mois = searchParams.get('mois');
  const statut = searchParams.get('statut');
  const clientId = searchParams.get('clientId');
  const nonSoldees = searchParams.get('nonSoldees');

  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (mois) {
    const [year, month] = mois.split('-').map(Number);
    dateFilter = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  }

  const knownStatuses = new Set<string>(Object.values(InterventionStatus));
  const safeStatut = statut && knownStatuses.has(statut) ? statut as InterventionStatus : undefined;

  const interventions = await prisma.intervention.findMany({
    where: {
      ...(dateFilter ? { date: dateFilter } : {}),
      ...(nonSoldees === '1'
        ? NON_SOLDEE_DB_WHERE
        : safeStatut ? { status: safeStatut } : {}),
      ...(clientId ? { clientId: Number(clientId) } : {}),
    },
    include: { client: true },
    orderBy: { date: 'desc' },
  });

  const rows = nonSoldees === '1'
    ? interventions.filter((i) => isNonSoldee(i.status, Number(i.plannedAmount), Number(i.receivedAmount)))
    : interventions;

  const header = csvRow([
    'Date',
    'Client',
    'Type de travail',
    'Description',
    'Statut',
    'Durée estimée (h)',
    'Durée réelle (h)',
    'Montant prévu (€)',
    'Montant encaissé (€)',
    'Reste à payer (€)',
    'Mode de paiement',
    'Date de paiement',
    'Notes',
  ]);

  const lines = rows.map((i) => {
    const reste = getReste(Number(i.plannedAmount), Number(i.receivedAmount));
    return csvRow([
      new Date(i.date).toLocaleDateString('fr-BE'),
      `${i.client.lastName} ${i.client.firstName}`,
      i.workType,
      i.description ?? '',
      STATUS_LABELS[i.status] ?? i.status,
      i.estimatedDurationHours ?? '',
      i.actualDurationHours ?? '',
      Number(i.plannedAmount).toFixed(2),
      Number(i.receivedAmount).toFixed(2),
      reste > 0 ? reste.toFixed(2) : '',
      PAYMENT_LABELS[i.paymentMethod] ?? i.paymentMethod,
      i.paymentDate ? new Date(i.paymentDate).toLocaleDateString('fr-BE') : '',
      i.notes ?? '',
    ]);
  });

  const csv = [header, ...lines].join('\r\n');
  const filename = mois ? `interventions-${mois}.csv` : 'interventions.csv';

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
