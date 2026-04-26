import { User, CreateUserDTO, UpdateUserDTO, UserWithPassword, ApiResponse } from '@/lib/types/user';

const API_BASE = '/api/admin/users';

export const usersApi = {
  async getAll(): Promise<User[]> {
    const response = await fetch(API_BASE);
    const data: ApiResponse<User[]> = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement utilisateurs');
    }
    return data.data!;
  },

  async getById(id: number): Promise<User> {
    const response = await fetch(`${API_BASE}/${id}`);
    const data: ApiResponse<User> = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement utilisateur');
    }
    return data.data!;
  },

  async create(data: CreateUserDTO): Promise<UserWithPassword> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<UserWithPassword> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur création utilisateur');
    }
    return result.data!;
  },

  async update(id: number, data: UpdateUserDTO): Promise<User> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<User> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur mise à jour utilisateur');
    }
    return result.data!;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur suppression utilisateur');
    }
  },

  async resetPassword(id: number): Promise<string> {
    const response = await fetch(`${API_BASE}/${id}/reset-password`, {
      method: 'POST',
    });
    const result: ApiResponse<{ motDePasse: string }> = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur réinitialisation mot de passe');
    }
    return result.data!.motDePasse;
  },
};