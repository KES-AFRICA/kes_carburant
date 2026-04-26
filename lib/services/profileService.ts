import { Profile, UpdateProfileDTO, ChangePasswordDTO } from '@/lib/types/profile';
import { profileApi } from '@/lib/api/profile';

class ProfileService {
  private profileCache: Profile | null = null;

  async getProfile(forceRefresh = false): Promise<Profile> {
    if (!forceRefresh && this.profileCache) {
      return this.profileCache;
    }

    const profile = await profileApi.getProfile();
    this.profileCache = profile;
    return profile;
  }

  async updateProfile(data: UpdateProfileDTO): Promise<Profile> {
    const profile = await profileApi.updateProfile(data);
    this.profileCache = profile;
    
    // Mettre à jour le localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.nom = profile.nom;
        user.prenom = profile.prenom;
        user.email = profile.email;
        user.telephone = profile.telephone;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
    
    return profile;
  }

  async changePassword(ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> {
    await profileApi.changePassword({ ancienMotDePasse, nouveauMotDePasse });
  }

  clearCache(): void {
    this.profileCache = null;
  }
}

export const profileService = new ProfileService();