// lib/services/adminRefuelService.ts
import { Refuel, RefuelFilters } from '@/lib/types/refuel';
import { adminRefuelsApi } from '@/lib/api/adminRefuels';

class AdminRefuelService {
  async getFilters(): Promise<RefuelFilters> {
    return adminRefuelsApi.getFilters();
  }

  async getRefuels(params?: {
    utilisateurId?: number;
    vehiculeId?: number;
    dateDebut?: string;
    dateFin?: string;
  }): Promise<Refuel[]> {
    return adminRefuelsApi.getRefuels(params);
  }

  async getRefuelById(id: number): Promise<Refuel> {
    return adminRefuelsApi.getRefuelById(id);
  }

  async deleteRefuel(id: number): Promise<void> {
    return adminRefuelsApi.deleteRefuel(id);
  }
}

export const adminRefuelService = new AdminRefuelService();