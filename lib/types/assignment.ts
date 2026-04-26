export interface UserBasic {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

export interface VehicleBasic {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}

export interface Assignment {
  vehiculeId: number;
  utilisateurId: number;
  assignedAt: string;
  vehicule: VehicleBasic;
  utilisateur: UserBasic;
}

export interface UserWithVehicles extends UserBasic {
  vehicles: VehicleBasic[];
}

export interface VehicleWithUsers extends VehicleBasic {
  users: UserBasic[];
}

export interface AssignVehicleDTO {
  utilisateurId: number;
  vehiculeId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}