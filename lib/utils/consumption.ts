export interface ConsumptionResult {
  distanceParcourue: number;
  consoCalculee: number;
  coutAuKm: number;
  ecartConstructeur: number | null;
}

export function calculateConsumption(
  kmActuel: number,
  kmPrecedent: number | null,
  quantiteLitres: number,
  montant: number,
  consommationTheorique?: number | null
): ConsumptionResult | null {
  if (!kmPrecedent || kmActuel <= kmPrecedent) {
    return null;
  }

  const distanceParcourue = kmActuel - kmPrecedent;
  const consoCalculee = (quantiteLitres / distanceParcourue) * 100;
  const coutAuKm = montant / distanceParcourue;

  let ecartConstructeur: number | null = null;
  if (consommationTheorique && consommationTheorique > 0) {
    ecartConstructeur = ((consoCalculee - consommationTheorique) / consommationTheorique) * 100;
  }

  return {
    distanceParcourue: parseFloat(distanceParcourue.toFixed(2)),
    consoCalculee: parseFloat(consoCalculee.toFixed(2)),
    coutAuKm: parseFloat(coutAuKm.toFixed(2)),
    ecartConstructeur: ecartConstructeur ? parseFloat(ecartConstructeur.toFixed(2)) : null,
  };
}

export function getFuelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ESSENCE: 'Essence',
    DIESEL: 'Diesel',
    GASOIL: 'Gasoil',
    ELECTRIQUE: 'Électrique',
    HYBRIDE: 'Hybride',
  };
  return labels[type] || type;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}