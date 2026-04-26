import { Vehicle, CreateVehicleDTO, UpdateVehicleDTO, ApiResponse } from '@/lib/types/vehicle';

const API_BASE = '/api/admin/vehicles';

export const vehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    const response = await fetch(API_BASE);
    const data: ApiResponse<Vehicle[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement véhicules');
    }
    return data.data!;
  },

  async getById(id: number): Promise<Vehicle> {
    const response = await fetch(`${API_BASE}/${id}`);
    const data: ApiResponse<Vehicle> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement véhicule');
    }
    return data.data!;
  },

  async create(data: CreateVehicleDTO): Promise<Vehicle> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Vehicle> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur création véhicule');
    }
    return result.data!;
  },

  async update(id: number, data: UpdateVehicleDTO): Promise<Vehicle> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Vehicle> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur mise à jour véhicule');
    }
    return result.data!;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur suppression véhicule');
    }
  },

  async uploadPhoto(id: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_BASE}/${id}/photo`, {
      method: 'POST',
      body: formData,
    });
    const result: ApiResponse<{ photoUrl: string }> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur upload photo');
    }
    return result.data!.photoUrl;
  },
};