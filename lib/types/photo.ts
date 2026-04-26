export type PhotoType = 'TABLEAU_BORD' | 'POMPE' | 'VEHICULE';

export interface Photo {
  id: number;
  rechargeId: number;
  type: PhotoType;
  url: string;
  taille: number | null;
  mimeType: string | null;
  createdAt: string;
}

export interface UploadPhotoDTO {
  rechargeId: number;
  type: PhotoType;
  file: File;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}