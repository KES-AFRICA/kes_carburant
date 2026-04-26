export interface Profile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  derniereConnexion: string | null;
}

export interface UpdateProfileDTO {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | null;
}

export interface ChangePasswordDTO {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}