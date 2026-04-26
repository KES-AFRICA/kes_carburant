import { 
  ConsumptionData, 
  MonthlyExpense, 
  ConsumptionEvolution, 
  Alert, 
  DashboardStats,
  ApiResponse, 
  ConsumptionByUser
} from '@/lib/types/statistics';

const API_BASE = '/api/admin/stats';

export const statisticsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE}?type=stats`);
    const data: ApiResponse<DashboardStats> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement statistiques');
    }
    return data.data!;
  },

  async getConsumptionByVehicle(): Promise<ConsumptionData[]> {
    const response = await fetch(`${API_BASE}?type=consumption`);
    const data: ApiResponse<ConsumptionData[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement consommation');
    }
    return data.data!;
  },

  async getMonthlyExpenses(): Promise<MonthlyExpense[]> {
    const response = await fetch(`${API_BASE}?type=monthly`);
    const data: ApiResponse<MonthlyExpense[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement dépenses');
    }
    return data.data!;
  },

  async getConsumptionEvolution(): Promise<ConsumptionEvolution[]> {
    const response = await fetch(`${API_BASE}?type=evolution`);
    const data: ApiResponse<ConsumptionEvolution[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement évolution');
    }
    return data.data!;
  },

  async getAlerts(): Promise<Alert[]> {
    const response = await fetch(`${API_BASE}?type=alerts`);
    const data: ApiResponse<Alert[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement alertes');
    }
    return data.data!;
  },

  async getConsumptionByUser(): Promise<ConsumptionByUser[]> {
    const response = await fetch(`${API_BASE}?type=user-consumption`);
    const data: ApiResponse<ConsumptionByUser[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement consommation par utilisateur');
    }
    return data.data!;
  }
};