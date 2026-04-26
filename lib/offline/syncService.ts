// lib/offline/syncService.ts
import { 
  getPendingRefuels, 
  removePendingRefuel, 
  updatePendingRefuelRetry,
  getPendingRefuelById,
  markAsSynced,
  getPendingCount
} from './db';

const API_BASE = '/api/user/refuels';

async function uploadPhoto(file: File, rechargeId: number, type: 'TABLEAU_BORD' | 'POMPE'): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('rechargeId', rechargeId.toString());
    formData.append('type', type);
    formData.append('photo', file);

    const response = await fetch('/api/upload/photo', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return response.ok && data.success;
  } catch {
    return false;
  }
}

async function syncSingleRefuel(refuelId: string): Promise<boolean> {
  const refuel = await getPendingRefuelById(refuelId);
  
  if (!refuel) return true;

  try {
    // Créer la recharge
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refuel.data),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erreur création');
    }

    const createdRefuelId = data.data.id;

    // Upload des photos
    let allPhotosUploaded = true;
    
    if (refuel.dashboardPhoto) {
      const uploaded = await uploadPhoto(refuel.dashboardPhoto, createdRefuelId, 'TABLEAU_BORD');
      if (!uploaded) allPhotosUploaded = false;
    }
    
    if (refuel.pumpPhoto) {
      const uploaded = await uploadPhoto(refuel.pumpPhoto, createdRefuelId, 'POMPE');
      if (!uploaded) allPhotosUploaded = false;
    }

    // Marquer comme synchronisé
    await markAsSynced(createdRefuelId);
    await removePendingRefuel(refuelId);
    
    return true;
  } catch (error) {
    console.error(`Erreur sync refuel ${refuelId}:`, error);
    
    // Incrémenter le compteur de retry
    await updatePendingRefuelRetry(refuelId, refuel.retryCount + 1);
    return false;
  }
}

export async function syncAllPendingRefuels(): Promise<{ success: number; failed: number }> {
  const refuels = await getPendingRefuels();
  let success = 0;
  let failed = 0;

  for (const refuel of refuels) {
    // Limiter à 3 tentatives
    if (refuel.retryCount >= 3) {
      await removePendingRefuel(refuel.id);
      failed++;
      continue;
    }

    const synced = await syncSingleRefuel(refuel.id);
    if (synced) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

export async function getSyncStatus(): Promise<{ pending: number; isOnline: boolean }> {
  const pending = await getPendingCount();
  return {
    pending,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}