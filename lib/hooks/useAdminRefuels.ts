/* eslint-disable react-hooks/set-state-in-effect */
// lib/hooks/useAdminRefuels.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { Refuel, RefuelFilters } from "@/lib/types/refuel";
import { adminRefuelService } from "@/lib/services/adminRefuelService";
import { toast } from "react-toastify";

interface UseAdminRefuelsReturn {
  refuels: Refuel[];
  filters: RefuelFilters | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: {
    utilisateurId?: number;
    vehiculeId?: number;
    dateDebut?: string;
    dateFin?: string;
  }) => Promise<void>;
  deleteRefuel: (id: number) => Promise<boolean>;
}

export function useAdminRefuels(): UseAdminRefuelsReturn {
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [filters, setFilters] = useState<RefuelFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des filtres
  const loadFilters = useCallback(async () => {
    try {
      const data = await adminRefuelService.getFilters();
      setFilters(data);
    } catch (err) {
      console.error("Erreur chargement filtres:", err);
    }
  }, []);

  // Chargement des recharges
  const fetchRefuels = useCallback(async (params?: {
    utilisateurId?: number;
    vehiculeId?: number;
    dateDebut?: string;
    dateFin?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminRefuelService.getRefuels(params);
      setRefuels(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Suppression
  const deleteRefuel = useCallback(async (id: number): Promise<boolean> => {
    try {
      await adminRefuelService.deleteRefuel(id);
      toast.success("Recharge supprimée");
      setRefuels(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur suppression";
      toast.error(message);
      return false;
    }
  }, []);

  // Initialisation
  useEffect(() => {
    loadFilters();
    fetchRefuels();
  }, [loadFilters, fetchRefuels]);

  return {
    refuels,
    filters,
    loading,
    error,
    refetch: fetchRefuels,
    deleteRefuel,
  };
}