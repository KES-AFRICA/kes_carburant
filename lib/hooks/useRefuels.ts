/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Refuel, CreateRefuelDTO, UpdateRefuelDTO, VehicleForRefuel } from "@/lib/types/refuel";
import { refuelService } from "@/lib/services/refuelService";
import { toast } from "react-toastify";
interface UseRefuelsReturn {
  refuels: Refuel[];
  vehicles: VehicleForRefuel[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createRefuel: (data: CreateRefuelDTO) => Promise<Refuel | null>;
  updateRefuel: (id: number, data: UpdateRefuelDTO) => Promise<Refuel | null>;
  deleteRefuel: (id: number) => Promise<boolean>;
}

export function useRefuels(): UseRefuelsReturn {
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [vehicles, setVehicles] = useState<VehicleForRefuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const [refuelsData, vehiclesData] = await Promise.all([
          refuelService.getAllRefuels(),
          refuelService.getMyVehicles(),
        ]);

        if (isMounted) {
          setRefuels(refuelsData);
          setVehicles(vehiclesData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur chargement";
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

  const createRefuel = useCallback(async (data: CreateRefuelDTO): Promise<Refuel | null> => {
    try {
      const result = await refuelService.createRefuel(data);
      toast.success("Recharge enregistrée");
      setRefuels((prev) => [result, ...prev]);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur création";
      toast.error(message);
      return null;
    }
  }, []);

  const updateRefuel = useCallback(async (id: number, data: UpdateRefuelDTO): Promise<Refuel | null> => {
    try {
      const updated = await refuelService.updateRefuel(id, data);
      toast.success("Recharge modifiée");
      setRefuels((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur modification";
      toast.error(message);
      return null;
    }
  }, []);

  const deleteRefuel = useCallback(async (id: number): Promise<boolean> => {
    try {
      await refuelService.deleteRefuel(id);
      toast.success("Recharge supprimée");
      setRefuels((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur suppression";
      toast.error(message);
      return false;
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      const [refuelsData, vehiclesData] = await Promise.all([
        refuelService.getAllRefuels(),
        refuelService.getMyVehicles(),
      ]);
      setRefuels(refuelsData);
      setVehicles(vehiclesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur rechargement";
      toast.error(message);
    }
  }, []);

  return {
    refuels,
    vehicles,
    loading,
    error,
    refetch,
    createRefuel,
    updateRefuel,
    deleteRefuel,
  };
}

interface UseRefuelReturn {
  refuel: Refuel | null;
  loading: boolean;
  error: string | null;
}

export function useRefuel(id: number | null): UseRefuelReturn {
  const [refuel, setRefuel] = useState<Refuel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadRefuel = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await refuelService.getRefuelById(id);
        if (isMounted) setRefuel(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur chargement";
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRefuel();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { refuel, loading, error };
}