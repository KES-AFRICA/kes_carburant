import { User, LoginCredentials, ChangePasswordData } from '@/lib/types/auth';
import { authApi } from '@/lib/api/auth';

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await authApi.login(credentials);
    this.token = response.token;
    this.user = response.user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return { user: response.user, token: response.token };
  }

  async getCurrentUser(forceRefresh = false): Promise<User | null> {
    if (!forceRefresh && this.user) {
      return this.user;
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const user = await authApi.getMe();
      this.user = user;
      return user;
    } catch {
      this.logout();
      return null;
    }
  }

  async changePassword(ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> {
    await authApi.changePassword({ ancienMotDePasse, nouveauMotDePasse });
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return this.token;
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    authApi.logout();
    this.token = null;
    this.user = null;
  }
}

export const authService = new AuthService();