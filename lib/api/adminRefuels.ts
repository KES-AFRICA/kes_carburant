// lib/api/adminRefuels.ts
import { Refuel, RefuelFilters, ApiResponse } from '@/lib/types/refuel';

const API_BASE = '/api/admin/refuels';

export const adminRefuelsApi = {
  // Récupérer les filtres (utilisateurs + véhicules)
  async getFilters(): Promise<RefuelFilters> {
    const response = await fetch(`${API_BASE}?filters=true`);
    const data: ApiResponse<RefuelFilters> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement filtres');
    }
    return data.data!;
  },

  // Récupérer les recharges avec filtres optionnels
  async getRefuels(params?: {
    utilisateurId?: number;
    vehiculeId?: number;
    dateDebut?: string;
    dateFin?: string;
  }): Promise<Refuel[]> {
    const searchParams = new URLSearchParams();
    if (params?.utilisateurId) searchParams.append('utilisateurId', String(params.utilisateurId));
    if (params?.vehiculeId) searchParams.append('vehiculeId', String(params.vehiculeId));
    if (params?.dateDebut) searchParams.append('dateDebut', params.dateDebut);
    if (params?.dateFin) searchParams.append('dateFin', params.dateFin);

    const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
    const data: ApiResponse<Refuel[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement recharges');
    }
    return data.data!;
  },

  // Récupérer une recharge par ID
  async getRefuelById(id: number): Promise<Refuel> {
    const response = await fetch(`${API_BASE}/${id}`);
    const data: ApiResponse<Refuel> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Recharge non trouvée');
    }
    return data.data!;
  },

  // Supprimer une recharge
  async deleteRefuel(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    const data: ApiResponse<void> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur suppression');
    }
  },
};