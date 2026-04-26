// lib/hooks/useStatistics.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ConsumptionData, 
  MonthlyExpense, 
  ConsumptionEvolution, 
  Alert, 
  DashboardStats, 
  ConsumptionByUser
} from "@/lib/types/statistics";
import { statisticsService } from "@/lib/services/statisticsService";
import { toast } from "react-toastify";

interface UseStatisticsReturn {
  dashboardStats: DashboardStats | null;
  consumptionData: ConsumptionData[];
  monthlyExpenses: MonthlyExpense[];
  evolutionData: ConsumptionEvolution[];
  alerts: Alert[];
  consumptionByUser: ConsumptionByUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStatistics(): UseStatisticsReturn {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [evolutionData, setEvolutionData] = useState<ConsumptionEvolution[]>([]);
  const [consumptionByUser, setConsumptionByUser] = useState<ConsumptionByUser[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [stats, consumption, monthly, evolution, alertes, userConsumption] = await Promise.all([
        statisticsService.getDashboardStats(),
        statisticsService.getConsumptionByVehicle(),
        statisticsService.getMonthlyExpenses(),
        statisticsService.getConsumptionEvolution(),
        statisticsService.getAlerts(),
        statisticsService.getConsumptionByUser(), 
      ]);

      setDashboardStats(stats);
      setConsumptionData(consumption);
      setMonthlyExpenses(monthly);
      setEvolutionData(evolution);
      setAlerts(alertes);
      setConsumptionByUser(userConsumption);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const [stats, consumption, monthly, evolution, alertes, userConsumption] = await Promise.all([
          statisticsService.getDashboardStats(),
          statisticsService.getConsumptionByVehicle(),
          statisticsService.getMonthlyExpenses(),
          statisticsService.getConsumptionEvolution(),
          statisticsService.getAlerts(),
          statisticsService.getConsumptionByUser(), // ✅ AJOUTÉ
        ]);

        if (isMounted) {
          setDashboardStats(stats);
          setConsumptionData(consumption);
          setMonthlyExpenses(monthly);
          setEvolutionData(evolution);
          setAlerts(alertes);
          setConsumptionByUser(userConsumption); // ✅ AJOUTÉ
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

  const refetch = useCallback(async () => {
    statisticsService.refreshAll();
    await loadAllData();
  }, [loadAllData]);

  return {
    dashboardStats,
    consumptionData,
    monthlyExpenses,
    evolutionData,
    alerts,
    consumptionByUser,
    loading,
    error,
    refetch,
  };
}