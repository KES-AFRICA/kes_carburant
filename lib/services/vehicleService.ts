import { Vehicle, CreateVehicleDTO, UpdateVehicleDTO } from '@/lib/types/vehicle';
import { vehiclesApi } from '@/lib/api/vehicles';

class VehicleService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private getCacheKey(method: string, params?: unknown): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  async getAllVehicles(forceRefresh = false): Promise<Vehicle[]> {
    const cacheKey = this.getCacheKey('getAllVehicles');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as Vehicle[];
    }

    const vehicles = await vehiclesApi.getAll();
    this.setCache(cacheKey, vehicles);
    return vehicles;
  }

  async getVehicleById(id: number, forceRefresh = false): Promise<Vehicle> {
    const cacheKey = this.getCacheKey('getVehicleById', id);
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as Vehicle;
    }

    const vehicle = await vehiclesApi.getById(id);
    this.setCache(cacheKey, vehicle);
    return vehicle;
  }

  async createVehicle(data: CreateVehicleDTO): Promise<Vehicle> {
    const vehicle = await vehiclesApi.create(data);
    this.clearCache();
    return vehicle;
  }

  async updateVehicle(id: number, data: UpdateVehicleDTO): Promise<Vehicle> {
    const vehicle = await vehiclesApi.update(id, data);
    this.clearCache();
    this.setCache(this.getCacheKey('getVehicleById', id), vehicle);
    return vehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    await vehiclesApi.delete(id);
    this.clearCache();
  }

  async uploadPhoto(id: number, file: File): Promise<string> {
    const photoUrl = await vehiclesApi.uploadPhoto(id, file);
    this.clearCache();
    return photoUrl;
  }
}

export const vehicleService = new VehicleService();