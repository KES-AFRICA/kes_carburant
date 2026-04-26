import { Refuel, CreateRefuelDTO, UpdateRefuelDTO, VehicleForRefuel, ApiResponse } from '@/lib/types/refuel';

const API_BASE = '/api/user/refuels';

export const refuelsApi = {
  async getAll(): Promise<Refuel[]> {
    const response = await fetch(API_BASE);
    const data: ApiResponse<Refuel[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement recharges');
    }
    return data.data!;
  },

  async getById(id: number): Promise<Refuel> {
    const response = await fetch(`${API_BASE}/${id}`);
    const data: ApiResponse<Refuel> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement recharge');
    }
    return data.data!;
  },

  async getMyVehicles(): Promise<VehicleForRefuel[]> {
    const response = await fetch(`${API_BASE}/vehicles`);
    const data: ApiResponse<VehicleForRefuel[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement véhicules');
    }
    return data.data!;
  },

  async create(data: CreateRefuelDTO): Promise<Refuel> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Refuel> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur création recharge');
    }
    return result.data!;
  },

  async update(id: number, data: UpdateRefuelDTO): Promise<Refuel> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Refuel> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur mise à jour recharge');
    }
    return result.data!;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur suppression recharge');
    }
  },
};