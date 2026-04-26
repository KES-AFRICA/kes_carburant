/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { usePhotos } from "@/lib/hooks/usePhotos";
import { PhotoType } from "@/lib/types/photo";

interface PhotoUploadProps {
  rechargeId: number;
  type: PhotoType;
  existingPhoto?: {
    id: number;
    url: string;
  } | null;
  onUploadComplete?: (photo: any) => void;
  onDeleteComplete?: () => void;
}

export function PhotoUpload({
  rechargeId,
  type,
  existingPhoto,
  onUploadComplete,
  onDeleteComplete,
}: PhotoUploadProps) {
  const { uploading, uploadProgress, uploadPhoto, deletePhoto } = usePhotos();
  const [preview, setPreview] = useState<string | null>(existingPhoto?.url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const label = type === "TABLEAU_BORD" ? "Tableau de bord" : type === "POMPE" ? "Pompe" : "Véhicule";
  const required = type !== "VEHICULE";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadPhoto(rechargeId, type, file);
    if (result) {
      setPreview(result.url);
      onUploadComplete?.(result);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (existingPhoto) {
      const success = await deletePhoto(existingPhoto.id);
      if (success) {
        setPreview(null);
        onDeleteComplete?.();
      }
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <label className="font-medium text-gray-700">
          Photo {label} {required && <span className="text-red-500">*</span>}
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 text-sm"
            disabled={uploading}
          >
            Supprimer
          </button>
        )}
      </div>

      {preview ? (
        <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt={`Photo ${label}`}
            fill
            className="object-contain"
             unoptimized={true}
          />
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            required={required && !preview}
          />
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Cliquez pour uploader une photo
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG (max 10MB)
          </p>
        </div>
      )}

      {uploading && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Upload en cours... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
}