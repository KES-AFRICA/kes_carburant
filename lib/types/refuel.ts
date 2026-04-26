export interface VehicleForRefuel {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  consommationTheorique: number | null;
}


export interface RefuelPhoto {
  id: number;
  type: 'TABLEAU_BORD' | 'POMPE';
  url: string;
}

export interface CreateRefuelDTO {
  vehiculeId: number;
  dateHeure: string;
  quantiteLitres: number;
  montant: number;
  kmActuel: number;
  pleinComplet: boolean;
  lieuNom?: string;
  lieuAdresse?: string;
  notes?: string;
}

export interface UpdateRefuelDTO {
  dateHeure?: string;
  quantiteLitres?: number;
  montant?: number;
  kmActuel?: number;
  pleinComplet?: boolean;
  lieuNom?: string;
  lieuAdresse?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}


// lib/types/refuel.ts
export interface Refuel {
  id: number;
  vehiculeId: number;
  vehiculeName: string;
  vehiculeImmatriculation: string;
  utilisateurId: number;
  utilisateurName: string;
  utilisateurEmail: string;
  dateHeure: string;
  quantiteLitres: number;
  montant: number;
  prixUnitaire: number;
  kmActuel: number;
  kmPrecedent: number | null;
  distanceParcourue: number | null;
  consoCalculee: number | null;
  coutAuKm: number | null;
  pleinComplet: boolean;
  notes: string | null;
  photos: { id: number; type: string; url: string }[];
  createdAt: string;
}

export interface RefuelFilters {
  utilisateurs: { id: number; name: string }[];
  vehicules: { id: number; name: string }[];
}

