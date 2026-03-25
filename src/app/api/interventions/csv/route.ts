import { NextRequest } from 'next/server';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

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

const STATUS_LABELS: Record<InterventionStatus, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  FACTUREE: 'Facturée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
};

const PAYMENT_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
  AUTRE: 'Autre',
};

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

  const interventions = await prisma.intervention.findMany({
    where: {
      ...(dateFilter ? { date: dateFilter } : {}),
      ...(statut ? { status: statut as InterventionStatus } : {}),
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(nonSoldees === '1' ? {
        status: { notIn: ['ANNULEE', 'PAYEE'] as InterventionStatus[] },
        plannedAmount: { gt: 0 },
      } : {}),
    },
    include: { client: true },
    orderBy: { date: 'desc' },
  });

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

  const lines = interventions.map((i) => {
    const reste = Number(i.plannedAmount) - Number(i.receivedAmount);
    return csvRow([
      new Date(i.date).toLocaleDateString('fr-BE'),
      `${i.client.lastName} ${i.client.firstName}`,
      i.workType,
      i.description ?? '',
      STATUS_LABELS[i.status],
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
