import { LoginCredentials, LoginResponse, ChangePasswordData, User, ApiResponse } from '@/lib/types/auth';

const API_BASE = '/api/auth';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur de connexion');
    }
    return data;
  },

  async getMe(): Promise<User> {
    const response = await fetch(`${API_BASE}/me`);
    const data: ApiResponse<User> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur récupération profil');
    }
    return data.data!;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    const response = await fetch(`${API_BASE}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<void> = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur changement mot de passe');
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  },
};