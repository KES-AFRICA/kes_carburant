"use client";

import { useState, useCallback } from "react";
import { Photo, PhotoType, UploadPhotoDTO } from "@/lib/types/photo";
import { photoService } from "@/lib/services/photoService";
import { toast } from "react-toastify";
interface UsePhotosReturn {
  uploading: boolean;
  uploadProgress: number;
  uploadPhoto: (rechargeId: number, type: PhotoType, file: File) => Promise<Photo | null>;
  deletePhoto: (id: number) => Promise<boolean>;
}

export function usePhotos(): UsePhotosReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 1024;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadPhoto = useCallback(async (
    rechargeId: number,
    type: PhotoType,
    file: File
  ): Promise<Photo | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10 Mo');
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      setUploadProgress(30);
      const compressedFile = await compressImage(file);
      setUploadProgress(60);

      const result = await photoService.uploadPhoto({
        rechargeId,
        type,
        file: compressedFile,
      });
      setUploadProgress(100);

      toast.success(`Photo ${type === 'TABLEAU_BORD' ? 'tableau de bord' : 'pompe'} uploadée`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur upload';
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const deletePhoto = useCallback(async (id: number): Promise<boolean> => {
    try {
      await photoService.deletePhoto(id);
      toast.success('Photo supprimée');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur suppression';
      toast.error(message);
      return false;
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadPhoto,
    deletePhoto,
  };
}