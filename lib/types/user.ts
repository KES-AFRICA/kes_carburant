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

export interface CreateUserDTO {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: 'ADMIN' | 'USER';
}

export interface UpdateUserDTO {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  actif?: boolean;
  role?: 'ADMIN' | 'USER';
}

export interface UserWithPassword extends User {
  motDePasseGenere: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}