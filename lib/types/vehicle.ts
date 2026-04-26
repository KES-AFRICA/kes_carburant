export type TypeCarburant = 'ESSENCE' | 'DIESEL' | 'GASOIL' | 'ELECTRIQUE' | 'HYBRIDE';
export type StatutVehicule = 'ACTIF' | 'ARCHIVE';

export interface Vehicle {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  typeCarburant: TypeCarburant;
  consommationTheorique: number | null;
  capaciteReservoir: number | null;
  photoUrl: string | null;
  statut: StatutVehicule;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDTO {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  typeCarburant: TypeCarburant;
  consommationTheorique?: number;
  capaciteReservoir?: number;
  photoUrl?: string;
}

export interface UpdateVehicleDTO {
  immatriculation?: string;
  marque?: string;
  modele?: string;
  annee?: number;
  typeCarburant?: TypeCarburant;
  consommationTheorique?: number | null;
  capaciteReservoir?: number | null;
  photoUrl?: string | null;
  statut?: StatutVehicule;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}