import { Profile, UpdateProfileDTO, ChangePasswordDTO, ApiResponse } from '@/lib/types/profile';

const API_BASE = '/api/user/profile';

export const profileApi = {
  async getProfile(): Promise<Profile> {
    const response = await fetch(API_BASE);
    const data: ApiResponse<Profile> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur chargement profil');
    }
    return data.data!;
  },

  async updateProfile(data: UpdateProfileDTO): Promise<Profile> {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Profile> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur mise à jour profil');
    }
    return result.data!;
  },

  async changePassword(data: ChangePasswordDTO): Promise<void> {
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
};