export interface ConsumptionData {
  vehiculeId: number;
  vehiculeName: string;
  consommationMoyenne: number;
  totalLitres: number;
  totalKm: number;
  totalMontant: number;
  nombreRecharges: number;
}

export interface MonthlyExpense {
  mois: string;
  montant: number;
  litres: number;
  kmParcourus: number;
}

export interface ConsumptionEvolution {
  date: string;
  consommation: number;
  vehiculeId: number;
  vehiculeName: string;
}

export interface Alert {
  id: number;
  vehiculeId: number;
  vehiculeName: string;
  date: string;
  consoCalculee: number;
  consommationTheorique: number;
  ecart: number;
  message: string;
}

export interface DashboardStats {
  totalDepenses: number;
  totalLitres: number;
  totalKm: number;
  consommationMoyenneGenerale: number;
  nombreRecharges: number;
  vehiculesActifs: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConsumptionByUser {
  userId: number;
  nom: string;
  prenom: string;
  email: string;
  totalLitres: number;
  totalKm: number;
  totalMontant: number;
  consoMoyenneVehicules: number;
  consoMoyennePar100km: number;
  nombreRecharges: number;
  vehiculesParcourt: number;
}