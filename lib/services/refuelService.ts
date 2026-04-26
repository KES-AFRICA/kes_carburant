import { Refuel, CreateRefuelDTO, UpdateRefuelDTO, VehicleForRefuel } from '@/lib/types/refuel';
import { refuelsApi } from '@/lib/api/refuels';

class RefuelService {
  async getAllRefuels(): Promise<Refuel[]> {
    return refuelsApi.getAll();
  }

  async getRefuelById(id: number): Promise<Refuel> {
    return refuelsApi.getById(id);
  }

  async getMyVehicles(): Promise<VehicleForRefuel[]> {
    return refuelsApi.getMyVehicles();
  }

  async createRefuel(data: CreateRefuelDTO): Promise<Refuel> {
    return refuelsApi.create(data);
  }

  async updateRefuel(id: number, data: UpdateRefuelDTO): Promise<Refuel> {
    return refuelsApi.update(id, data);
  }

  async deleteRefuel(id: number): Promise<void> {
    await refuelsApi.delete(id);
  }
}

export const refuelService = new RefuelService();