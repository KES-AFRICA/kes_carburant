import { User, CreateUserDTO, UpdateUserDTO, UserWithPassword } from '@/lib/types/user';
import { usersApi } from '../api/users';

class UserService {
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

  async getAllUsers(forceRefresh = false): Promise<User[]> {
    const cacheKey = this.getCacheKey('getAllUsers');
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as User[];
    }

    const users = await usersApi.getAll();
    this.setCache(cacheKey, users);
    return users;
  }

  async getUserById(id: number, forceRefresh = false): Promise<User> {
    const cacheKey = this.getCacheKey('getUserById', id);
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as User;
    }

    const user = await usersApi.getById(id);
    this.setCache(cacheKey, user);
    return user;
  }

  async createUser(data: CreateUserDTO): Promise<UserWithPassword> {
    const result = await usersApi.create(data);
    this.clearCache();
    return result;
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<User> {
    const user = await usersApi.update(id, data);
    this.clearCache();
    this.setCache(this.getCacheKey('getUserById', id), user);
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await usersApi.delete(id);
    this.clearCache();
  }

  async resetPassword(id: number): Promise<string> {
    const password = await usersApi.resetPassword(id);
    this.clearCache();
    return password;
  }
}

export const userService = new UserService();