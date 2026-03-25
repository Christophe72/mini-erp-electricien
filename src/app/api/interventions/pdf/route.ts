import { NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { InterventionsPdfDocument } from '@/lib/pdf/interventions-document';

const STATUS_LABELS: Record<InterventionStatus, string> = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  FACTUREE: 'Facturée',
  PAYEE: 'Payée',
  ANNULEE: 'Annulée',
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

  const [settings, interventions] = await Promise.all([
    prisma.userSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, activityName: 'Activité électricité', monthlyLimit: 1500, currency: 'EUR' },
    }),
    prisma.intervention.findMany({
      where: {
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(statut ? { status: statut as InterventionStatus } : {}),
        ...(clientId ? { clientId: Number(clientId) } : {}),
        ...(nonSoldees === '1' ? {
          status: { not: 'ANNULEE' as InterventionStatus },
          plannedAmount: { gt: 0 },
        } : {}),
      },
      include: { client: true },
      orderBy: { date: 'desc' },
    }),
  ]);

  // PAYEE may not exist in DB enum yet — filter in JS
  const filteredInterventions = nonSoldees === '1'
    ? interventions.filter((i) => (i.status as string) !== 'PAYEE')
    : interventions;

  // Build filter label
  const parts: string[] = [];
  if (mois) {
    const [y, m] = mois.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });
    parts.push(label.charAt(0).toUpperCase() + label.slice(1));
  }
  if (statut) parts.push(STATUS_LABELS[statut as InterventionStatus] ?? statut);
  if (nonSoldees === '1') parts.push('Non soldées');
  const filterLabel = parts.length > 0 ? parts.join(' · ') : 'Toutes les interventions';

  const pdfData = filteredInterventions.map((i) => ({
    date: i.date,
    clientLastName: i.client.lastName,
    clientFirstName: i.client.firstName,
    workType: i.workType,
    status: i.status,
    plannedAmount: Number(i.plannedAmount),
    receivedAmount: Number(i.receivedAmount),
    paymentDate: i.paymentDate,
  }));

  const generatedAt = new Date().toLocaleDateString('fr-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const buffer = await renderToBuffer(
    React.createElement(InterventionsPdfDocument, {
      interventions: pdfData,
      activityName: settings.activityName,
      filterLabel,
      generatedAt,
    })
  );

  const filename = mois ? `interventions-${mois}.pdf` : 'interventions.pdf';

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
