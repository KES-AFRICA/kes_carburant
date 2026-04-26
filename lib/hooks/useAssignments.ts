"use client";

import { useState, useEffect, useCallback } from "react";
import { UserWithVehicles, VehicleWithUsers, AssignVehicleDTO } from "@/lib/types/assignment";
import { assignmentService } from "@/lib/services/assignmentService";
import { toast } from "react-toastify";
interface UseAssignmentsReturn {
  usersWithVehicles: UserWithVehicles[];
  vehiclesWithUsers: VehicleWithUsers[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  assignVehicle: (data: AssignVehicleDTO) => Promise<boolean>;
  removeVehicle: (utilisateurId: number, vehiculeId: number) => Promise<boolean>;
}

export function useAssignments(): UseAssignmentsReturn {
  const [usersWithVehicles, setUsersWithVehicles] = useState<UserWithVehicles[]>([]);
  const [vehiclesWithUsers, setVehiclesWithUsers] = useState<VehicleWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [users, vehicles] = await Promise.all([
        assignmentService.getUsersWithVehicles(),
        assignmentService.getVehiclesWithUsers(),
      ]);
      setUsersWithVehicles(users);
      setVehiclesWithUsers(vehicles);
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

        const [users, vehicles] = await Promise.all([
          assignmentService.getUsersWithVehicles(),
          assignmentService.getVehiclesWithUsers(),
        ]);

        if (isMounted) {
          setUsersWithVehicles(users);
          setVehiclesWithUsers(vehicles);
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

  const assignVehicle = useCallback(async (data: AssignVehicleDTO): Promise<boolean> => {
    try {
      const assignment = await assignmentService.assign(data);

      toast.success("Véhicule assigné avec succès");

      setUsersWithVehicles((prev) =>
        prev.map((user) =>
          user.id === data.utilisateurId
            ? {
                ...user,
                vehicles: [...user.vehicles, assignment.vehicule],
              }
            : user
        )
      );

      setVehiclesWithUsers((prev) =>
        prev.map((vehicle) =>
          vehicle.id === data.vehiculeId
            ? {
                ...vehicle,
                users: [...vehicle.users, assignment.utilisateur],
              }
            : vehicle
        )
      );

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur assignation";
      toast.error(message);
      return false;
    }
  }, []);

  const removeVehicle = useCallback(async (utilisateurId: number, vehiculeId: number): Promise<boolean> => {
    try {
      await assignmentService.remove(utilisateurId, vehiculeId);

      toast.success("Véhicule retiré");

      setUsersWithVehicles((prev) =>
        prev.map((user) =>
          user.id === utilisateurId
            ? {
                ...user,
                vehicles: user.vehicles.filter((v) => v.id !== vehiculeId),
              }
            : user
        )
      );

      setVehiclesWithUsers((prev) =>
        prev.map((vehicle) =>
          vehicle.id === vehiculeId
            ? {
                ...vehicle,
                users: vehicle.users.filter((u) => u.id !== utilisateurId),
              }
            : vehicle
        )
      );

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur retrait";
      toast.error(message);
      return false;
    }
  }, []);

  return {
    usersWithVehicles,
    vehiclesWithUsers,
    loading,
    error,
    refetch: loadData,
    assignVehicle,
    removeVehicle,
  };
}