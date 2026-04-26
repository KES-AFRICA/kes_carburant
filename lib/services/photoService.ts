import { Photo, UploadPhotoDTO } from '@/lib/types/photo';
import { photosApi } from '@/lib/api/photos';

class PhotoService {
  async uploadPhoto(data: UploadPhotoDTO): Promise<Photo> {
    return photosApi.upload(data);
  }

  async deletePhoto(id: number): Promise<void> {
    await photosApi.delete(id);
  }
}

export const photoService = new PhotoService();