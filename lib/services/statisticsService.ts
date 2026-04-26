import { 
  ConsumptionData, 
  MonthlyExpense, 
  ConsumptionEvolution, 
  Alert, 
  DashboardStats, 
  ConsumptionByUser
} from '@/lib/types/statistics';
import { statisticsApi } from '@/lib/api/statistics';

class StatisticsService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000;

  private getCacheKey(method: string): string {
    return method;
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

  async getDashboardStats(forceRefresh = false): Promise<DashboardStats> {
    const cacheKey = this.getCacheKey('dashboardStats');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as DashboardStats;
    }

    const stats = await statisticsApi.getDashboardStats();
    this.setCache(cacheKey, stats);
    return stats;
  }

  async getConsumptionByVehicle(forceRefresh = false): Promise<ConsumptionData[]> {
    const cacheKey = this.getCacheKey('consumptionByVehicle');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as ConsumptionData[];
    }

    const data = await statisticsApi.getConsumptionByVehicle();
    this.setCache(cacheKey, data);
    return data;
  }

  async getMonthlyExpenses(forceRefresh = false): Promise<MonthlyExpense[]> {
    const cacheKey = this.getCacheKey('monthlyExpenses');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as MonthlyExpense[];
    }

    const data = await statisticsApi.getMonthlyExpenses();
    this.setCache(cacheKey, data);
    return data;
  }

  async getConsumptionEvolution(forceRefresh = false): Promise<ConsumptionEvolution[]> {
    const cacheKey = this.getCacheKey('consumptionEvolution');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as ConsumptionEvolution[];
    }

    const data = await statisticsApi.getConsumptionEvolution();
    this.setCache(cacheKey, data);
    return data;
  }

  async getAlerts(forceRefresh = false): Promise<Alert[]> {
    const cacheKey = this.getCacheKey('alerts');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as Alert[];
    }

    const data = await statisticsApi.getAlerts();
    this.setCache(cacheKey, data);
    return data;
  }

  refreshAll(): void {
    this.clearCache();
  }

  async getConsumptionByUser(forceRefresh = false): Promise<ConsumptionByUser[]> {
    const cacheKey = this.getCacheKey('consumptionByUser');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as ConsumptionByUser[];
    }

    const data = await statisticsApi.getConsumptionByUser();
    this.setCache(cacheKey, data);
    return data;
  }
}

export const statisticsService = new StatisticsService();