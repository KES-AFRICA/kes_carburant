export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: 'ADMIN' | 'USER';
  actif: boolean;
  derniereConnexion: string | null;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  motDePasse: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ChangePasswordData {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}