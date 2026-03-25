import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { STATUS_LABELS, getReste } from '@/lib/interventions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PdfIntervention {
  date: Date;
  clientLastName: string;
  clientFirstName: string;
  workType: string;
  status: string;
  plannedAmount: number;
  receivedAmount: number;
  paymentDate: Date | null;
}

export interface InterventionsPdfProps {
  interventions: PdfIntervention[];
  activityName: string;
  filterLabel: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function eur(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('fr-BE');
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 28,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },

  // En-tête
  header: { marginBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  activity: { fontSize: 8, color: '#64748b', marginTop: 2 },
  meta: { fontSize: 8, color: '#64748b', textAlign: 'right' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginTop: 10 },

  // Tableau — en-tête
  thead: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 14,
  },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: '#f8fafc' },

  // Tableau — lignes
  trow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  trowAlt: { backgroundColor: '#f8fafc' },
  td: { fontSize: 8, color: '#334155' },
  tdAmber: { fontSize: 8, color: '#d97706' },

  // Largeurs des colonnes (total = 100%)
  cDate:     { width: '9%' },
  cClient:   { width: '17%' },
  cWork:     { width: '22%' },
  cStatus:   { width: '10%' },
  cPlanned:  { width: '11%', textAlign: 'right' },
  cReceived: { width: '12%', textAlign: 'right' },
  cRemain:   { width: '11%', textAlign: 'right' },
  cPayDate:  { width: '8%', textAlign: 'right' },

  // Pied de page du tableau
  tfoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 2,
  },
  tfootItem: { marginLeft: 20 },
  tfootLabel: { fontSize: 8, color: '#64748b' },
  tfootValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 1 },

  // Numéro de page
  pageNum: {
    position: 'absolute',
    bottom: 18,
    right: 28,
    fontSize: 7,
    color: '#94a3b8',
  },
  pageNumLeft: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    fontSize: 7,
    color: '#94a3b8',
  },
});

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------
export function InterventionsPdfDocument({
  interventions,
  activityName,
  filterLabel,
  generatedAt,
}: InterventionsPdfProps) {
  const totalPlanned  = interventions.reduce((s, i) => s + i.plannedAmount, 0);
  const totalReceived = interventions.reduce((s, i) => s + i.receivedAmount, 0);
  const totalRemain   = interventions.reduce((s, i) => s + getReste(i.plannedAmount, i.receivedAmount), 0);

  return (
    <Document title="Interventions" author={activityName}>
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.title}>Interventions</Text>
              <Text style={s.activity}>{activityName}</Text>
            </View>
            <View>
              <Text style={s.meta}>{filterLabel}</Text>
              <Text style={s.meta}>Généré le {generatedAt}</Text>
            </View>
          </View>
          <View style={s.divider} />
        </View>

        {/* En-tête du tableau */}
        <View style={s.thead}>
          <Text style={[s.th, s.cDate]}>Date</Text>
          <Text style={[s.th, s.cClient]}>Client</Text>
          <Text style={[s.th, s.cWork]}>Type de travail</Text>
          <Text style={[s.th, s.cStatus]}>Statut</Text>
          <Text style={[s.th, s.cPlanned]}>Prévu</Text>
          <Text style={[s.th, s.cReceived]}>Encaissé</Text>
          <Text style={[s.th, s.cRemain]}>Reste</Text>
          <Text style={[s.th, s.cPayDate]}>Payé le</Text>
        </View>

        {/* Lignes */}
        {interventions.map((item, idx) => {
          const reste = getReste(item.plannedAmount, item.receivedAmount);
          return (
            <View key={idx} style={[s.trow, idx % 2 === 1 ? s.trowAlt : {}]}>
              <Text style={[s.td, s.cDate]}>{fmtDate(item.date)}</Text>
              <Text style={[s.td, s.cClient]}>{item.clientLastName} {item.clientFirstName}</Text>
              <Text style={[s.td, s.cWork]}>{item.workType}</Text>
              <Text style={[s.td, s.cStatus]}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              <Text style={[s.td, s.cPlanned]}>{eur(item.plannedAmount)}</Text>
              <Text style={[s.td, s.cReceived]}>{eur(item.receivedAmount)}</Text>
              <Text style={[reste > 0 ? s.tdAmber : s.td, s.cRemain]}>
                {reste > 0 ? eur(reste) : '—'}
              </Text>
              <Text style={[s.td, s.cPayDate]}>
                {item.paymentDate ? fmtDate(item.paymentDate) : ''}
              </Text>
            </View>
          );
        })}

        {/* Totaux */}
        <View style={s.tfoot}>
          <View style={s.tfootItem}>
            <Text style={s.tfootLabel}>{interventions.length} intervention{interventions.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={s.tfootItem}>
            <Text style={s.tfootLabel}>Total prévu</Text>
            <Text style={s.tfootValue}>{eur(totalPlanned)}</Text>
          </View>
          <View style={s.tfootItem}>
            <Text style={s.tfootLabel}>Total encaissé</Text>
            <Text style={s.tfootValue}>{eur(totalReceived)}</Text>
          </View>
          {totalRemain > 0 && (
            <View style={s.tfootItem}>
              <Text style={s.tfootLabel}>Reste à percevoir</Text>
              <Text style={[s.tfootValue, { color: '#d97706' }]}>{eur(totalRemain)}</Text>
            </View>
          )}
        </View>

        {/* Numéro de page */}
        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
        <Text style={s.pageNumLeft} fixed>{activityName}</Text>
      </Page>
    </Document>
  );
}
