/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, clearAllPending } from '@/lib/offline/db';
import { syncAllPendingRefuels, getSyncStatus } from '@/lib/offline/syncService';
import { toast } from 'react-toastify';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  clearPending: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    updatePendingCount();

    const handleOnline = async () => {
      setIsOnline(true);
      toast.success('Connexion rétablie');
      
      // Synchronisation automatique
      const { pending } = await getSyncStatus();
      if (pending > 0) {
        toast.loading(`Synchronisation de ${pending} élément(s)...`);
        const { success, failed } = await syncAllPendingRefuels();
        toast.dismiss('sync');
        if (success > 0) toast.success(`${success} élément(s) synchronisé(s)`);
        if (failed > 0) toast.error(`${failed} élément(s) non synchronisé(s)`);
        await updatePendingCount();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connexion perdue - Mode hors ligne actif');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error('Impossible de synchroniser hors ligne');
      return;
    }

    if (pendingCount === 0) {
      toast.success('Aucune donnée à synchroniser');
      return;
    }

    setIsSyncing(true);
    toast.loading(`Synchronisation de ${pendingCount} élément(s)...`);
    
    const { success, failed } = await syncAllPendingRefuels();
    
    toast.dismiss('sync');
    if (success > 0) toast.success(`${success} élément(s) synchronisé(s)`);
    if (failed > 0) toast.error(`${failed} élément(s) non synchronisé(s)`);
    
    await updatePendingCount();
    setIsSyncing(false);
  }, [isOnline, pendingCount, updatePendingCount]);

  const clearPending = useCallback(async () => {
    await clearAllPending();
    await updatePendingCount();
    toast.success('File d\'attente vidée');
  }, [updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
    clearPending,
  };
}