import { Assignment, UserWithVehicles, VehicleWithUsers, AssignVehicleDTO, ApiResponse } from '@/lib/types/assignment';

const API_BASE = '/api/admin/assignments';

export const assignmentsApi = {
  async getAllAssignments(): Promise<Assignment[]> {
    const response = await fetch(API_BASE);
    const data: ApiResponse<Assignment[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement assignations');
    }
    return data.data!;
  },

  async getUsersWithVehicles(): Promise<UserWithVehicles[]> {
    const response = await fetch(`${API_BASE}?view=users`);
    const data: ApiResponse<UserWithVehicles[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement utilisateurs');
    }
    return data.data!;
  },

  async getVehiclesWithUsers(): Promise<VehicleWithUsers[]> {
    const response = await fetch(`${API_BASE}?view=vehicles`);
    const data: ApiResponse<VehicleWithUsers[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement véhicules');
    }
    return data.data!;
  },

  async assign(data: AssignVehicleDTO): Promise<Assignment> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Assignment> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur assignation');
    }
    return result.data!;
  },

  async remove(utilisateurId: number, vehiculeId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${utilisateurId}/${vehiculeId}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur retrait assignation');
    }
  },
};