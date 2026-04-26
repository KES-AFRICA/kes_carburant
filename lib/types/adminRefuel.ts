export interface AdminRefuel {
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
  lieuNom: string | null;
  notes: string | null;
  createdAt: string;
  photos: AdminRefuelPhoto[];
}

export interface AdminRefuelPhoto {
  id: number;
  type: 'TABLEAU_BORD' | 'POMPE';
  url: string;
}

export interface RefuelFilters {
  utilisateurId?: number;
  vehiculeId?: number;
  dateDebut?: string;
  dateFin?: string;
}

export interface FilterOptions {
  utilisateurs: { id: number; name: string }[];
  vehicules: { id: number; name: string }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}