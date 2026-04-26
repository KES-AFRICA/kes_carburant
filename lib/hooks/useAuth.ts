"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, LoginCredentials } from "@/lib/types/auth";
import { authService } from "@/lib/services/authService";
import { toast } from 'react-toastify'; 

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  changePassword: (
    ancienMotDePasse: string,
    nouveauMotDePasse: string
  ) => Promise<boolean>;
  refetchUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Chargement utilisateur (au montage)
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // 🔹 Login
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      try {
        setLoading(true);

        const { user: loggedUser } = await authService.login(credentials);

        setUser(loggedUser);

        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur de connexion"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 🔹 Logout
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    router.push("/login");
    toast.success("Déconnexion réussie");
  }, [router]);

  // 🔹 Changement mot de passe
  const changePassword = useCallback(
    async (
      ancienMotDePasse: string,
      nouveauMotDePasse: string
    ): Promise<boolean> => {
      try {
        await authService.changePassword(
          ancienMotDePasse,
          nouveauMotDePasse
        );
        toast.success("Mot de passe modifié avec succès");
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur changement mot de passe"
        );
        return false;
      }
    },
    []
  );

  // 🔹 Recharger utilisateur
  const refetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser(true);
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Auth basé sur le state (fiable)
  const isAuthenticated = !!user;

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    changePassword,
    refetchUser,
  };
}