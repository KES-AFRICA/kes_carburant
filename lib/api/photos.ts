import { Photo, UploadPhotoDTO, ApiResponse } from '@/lib/types/photo';

const API_BASE = '/api/upload/photo';

export const photosApi = {
  async upload(data: UploadPhotoDTO): Promise<Photo> {
    const formData = new FormData();
    formData.append('rechargeId', data.rechargeId.toString());
    formData.append('type', data.type);
    formData.append('photo', data.file);

    const response = await fetch(API_BASE, {
      method: 'POST',
      body: formData,
    });
    const result: ApiResponse<Photo> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur upload photo');
    }
    return result.data!;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur suppression photo');
    }
  },
};