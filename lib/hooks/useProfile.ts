"use client";

import { useState, useEffect, useCallback } from "react";
import { Profile, UpdateProfileDTO } from "@/lib/types/profile";
import { profileService } from "@/lib/services/profileService";
import { toast } from "react-toastify";
interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (data: UpdateProfileDTO) => Promise<Profile | null>;
  changePassword: (ancienMotDePasse: string, nouveauMotDePasse: string) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await profileService.getProfile();

        if (isMounted) {
          setProfile(data);
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
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile(true);
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur rechargement";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileDTO): Promise<Profile | null> => {
    try {
      const updated = await profileService.updateProfile(data);
      setProfile(updated);
      toast.success("Profil mis à jour");
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur mise à jour";
      toast.error(message);
      return null;
    }
  }, []);

  const changePassword = useCallback(async (ancienMotDePasse: string, nouveauMotDePasse: string): Promise<boolean> => {
    try {
      await profileService.changePassword(ancienMotDePasse, nouveauMotDePasse);
      toast.success("Mot de passe modifié");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur changement mot de passe";
      toast.error(message);
      return false;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
    changePassword,
  };
}