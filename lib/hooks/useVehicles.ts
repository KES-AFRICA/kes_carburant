"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Vehicle,
  CreateVehicleDTO,
  UpdateVehicleDTO,
} from "@/lib/types/vehicle";
import { vehicleService } from "@/lib/services/vehicleService";
import { toast } from "react-toastify";
interface UseVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createVehicle: (data: CreateVehicleDTO) => Promise<Vehicle | null>;
  updateVehicle: (id: number, data: UpdateVehicleDTO) => Promise<Vehicle | null>;
  deleteVehicle: (id: number) => Promise<boolean>;
  uploadPhoto: (id: number, file: File) => Promise<string | null>;
}

export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Gardé pour refetch (nom inchangé)
  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await vehicleService.getAllVehicles();
      setVehicles(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur chargement";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 FIX : plus de dépendance loadVehicles
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await vehicleService.getAllVehicles();

        if (isMounted) setVehicles(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur chargement";

        if (isMounted) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // 🔹 Create (optimistic update)
  const createVehicle = useCallback(
    async (data: CreateVehicleDTO): Promise<Vehicle | null> => {
      try {
        const result = await vehicleService.createVehicle(data);

        toast.success("Véhicule créé avec succès");

        setVehicles((prev) => [...prev, result]);

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur création";
        toast.error(message);
        return null;
      }
    },
    []
  );

  // 🔹 Update (optimistic)
  const updateVehicle = useCallback(
    async (
      id: number,
      data: UpdateVehicleDTO
    ): Promise<Vehicle | null> => {
      try {
        const updated = await vehicleService.updateVehicle(id, data);

        toast.success("Véhicule modifié");

        setVehicles((prev) =>
          prev.map((v) => (v.id === id ? updated : v))
        );

        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur modification";
        toast.error(message);
        return null;
      }
    },
    []
  );

  // 🔹 Delete (optimistic)
  const deleteVehicle = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await vehicleService.deleteVehicle(id);

        toast.success("Véhicule archivé");

        setVehicles((prev) => prev.filter((v) => v.id !== id));

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur suppression";
        toast.error(message);
        return false;
      }
    },
    []
  );

  // 🔹 Upload photo (optimistic)
  const uploadPhoto = useCallback(
    async (id: number, file: File): Promise<string | null> => {
      try {
        const photoUrl = await vehicleService.uploadPhoto(id, file);

        toast.success("Photo uploadée");

        setVehicles((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, photo: photoUrl } : v
          )
        );

        return photoUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur upload";
        toast.error(message);
        return null;
      }
    },
    []
  );

  return {
    vehicles,
    loading,
    error,
    refetch: loadVehicles, 
    createVehicle,
    updateVehicle,
    deleteVehicle,
    uploadPhoto,
  };
}