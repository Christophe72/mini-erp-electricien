import { NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { InterventionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { InterventionsPdfDocument } from '@/lib/pdf/interventions-document';
import { STATUS_LABELS, isNonSoldee, NON_SOLDEE_DB_WHERE } from '@/lib/interventions';

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

  const [settings, interventions] = await Promise.all([
    prisma.userSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, activityName: 'Activité électricité', monthlyLimit: 1500, currency: 'EUR' },
    }),
    prisma.intervention.findMany({
      where: {
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(nonSoldees === '1'
          ? NON_SOLDEE_DB_WHERE
          : safeStatut ? { status: safeStatut } : {}),
        ...(clientId ? { clientId: Number(clientId) } : {}),
      },
      include: { client: true },
      orderBy: { date: 'desc' },
    }),
  ]);

  const filteredInterventions = nonSoldees === '1'
    ? interventions.filter((i) => isNonSoldee(i.status, Number(i.plannedAmount), Number(i.receivedAmount)))
    : interventions;

  // Build filter label
  const parts: string[] = [];
  if (mois) {
    const [y, m] = mois.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });
    parts.push(label.charAt(0).toUpperCase() + label.slice(1));
  }
  if (statut && nonSoldees !== '1') parts.push(STATUS_LABELS[statut] ?? statut);
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
    }) as Parameters<typeof renderToBuffer>[0]
  );

  const filename = mois ? `interventions-${mois}.pdf` : 'interventions.pdf';

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
