"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  UserWithPassword,
} from "@/lib/types/user";
import { userService } from "@/lib/services/userService";
import { toast } from "react-toastify";
interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createUser: (data: CreateUserDTO) => Promise<UserWithPassword | null>;
  updateUser: (id: number, data: UpdateUserDTO) => Promise<User | null>;
  deleteUser: (id: number) => Promise<boolean>;
  resetPassword: (id: number) => Promise<string | null>;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fonction interne sécurisée
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur chargement";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Chargement initial (SANS dépendance problématique)
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await userService.getAllUsers();

        if (isMounted) setUsers(data);
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

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // 🔹 Refetch public
  const refetch = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  // 🔹 Create
  const createUser = useCallback(
    async (data: CreateUserDTO): Promise<UserWithPassword | null> => {
      try {
        const result = await userService.createUser(data);

        toast.success("Utilisateur créé avec succès");

        // ⚡ update optimiste
        setUsers((prev) => [...prev, result]);

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

  // 🔹 Update
  const updateUser = useCallback(
    async (id: number, data: UpdateUserDTO): Promise<User | null> => {
      try {
        const updated = await userService.updateUser(id, data);

        toast.success("Utilisateur modifié");

        // ⚡ update optimiste
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? updated : u))
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

  // 🔹 Delete
  const deleteUser = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await userService.deleteUser(id);

        toast.success("Utilisateur désactivé");

        // ⚡ update optimiste
        setUsers((prev) => prev.filter((u) => u.id !== id));

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

  // 🔹 Reset password
  const resetPassword = useCallback(
    async (id: number): Promise<string | null> => {
      try {
        const password = await userService.resetPassword(id);

        toast.success("Mot de passe réinitialisé");

        return password;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur réinitialisation";
        toast.error(message);
        return null;
      }
    },
    []
  );

  return {
    users,
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
}