// ---------------------------------------------------------------------------
// Labels et styles d'affichage — source unique de vérité
// ---------------------------------------------------------------------------
export const STATUS_LABELS: Record<string, string> = {
  A_FAIRE:  'À faire',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  FACTUREE: 'Facturée',
  PAYEE:    'Payée',
  ANNULEE:  'Annulée',
};

/** Classes Tailwind pour les badges de statut. Fallback : badge neutre. */
export const STATUS_BADGE: Record<string, string> = {
  A_FAIRE:  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  EN_COURS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  TERMINEE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  FACTUREE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  PAYEE:    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  ANNULEE:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export const STATUS_BADGE_DEFAULT = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';

export const PAYMENT_LABELS: Record<string, string> = {
  ESPECES:  'Espèces',
  VIREMENT: 'Virement',
  CARTE:    'Carte',
  AUTRE:    'Autre',
};

// ---------------------------------------------------------------------------
// Calculs métier
// ---------------------------------------------------------------------------

/** Montant restant à percevoir. Jamais négatif. */
export function getReste(planned: number, received: number): number {
  return Math.max(planned - received, 0);
}

/**
 * Une intervention est non soldée si :
 *  - elle n'est pas annulée
 *  - elle n'est pas payée (statut PAYEE)
 *  - le montant encaissé est inférieur au montant prévu
 */
export function isNonSoldee(status: string, planned: number, received: number): boolean {
  if (status === 'ANNULEE' || status === 'PAYEE') return false;
  return received < planned;
}

/**
 * Règle : PAYEE n'est valide que si le montant encaissé couvre le montant prévu.
 */
export function canMarkAsPayee(planned: number, received: number): boolean {
  return received >= planned;
}

/**
 * Résout la date de paiement à partir du statut, de la valeur brute du formulaire
 * et du montant encaissé.
 *
 * Règles :
 * - Encaissé = 0 et statut ≠ PAYEE → null (pas de paiement = pas de date)
 * - Date saisie → utilisée telle quelle
 * - Statut PAYEE sans date → aujourd'hui
 * - Sinon → null
 */
export function resolvePaymentDate(status: string, rawDate: string, received: number): Date | null {
  if (received === 0 && status !== 'PAYEE') return null;
  if (rawDate) return new Date(rawDate);
  if (status === 'PAYEE') return new Date();
  return null;
}

// ---------------------------------------------------------------------------
// Filtres Prisma
// ---------------------------------------------------------------------------

/** Exclut les interventions annulées — pour les calculs financiers. */
export const EXCLUDE_ANNULEE_WHERE = {
  status: { not: 'ANNULEE' as const },
} as const;

/** Filtre DB pour "non soldées" — à affiner en JS avec isNonSoldee. */
export const NON_SOLDEE_DB_WHERE = EXCLUDE_ANNULEE_WHERE;
