import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PendingRefuel {
  id: string;
  data: {
    vehiculeId: number;
    dateHeure: string;
    quantiteLitres: number;
    montant: number;
    kmActuel: number;
    pleinComplet: boolean;
    lieuNom?: string;
    lieuAdresse?: string;
    notes?: string;
  };
  dashboardPhoto: File | null;
  pumpPhoto: File | null;
  createdAt: Date;
  retryCount: number;
}

export interface PendingPhoto {
  id: string;
  refuelId: string;
  file: File;
  type: 'TABLEAU_BORD' | 'POMPE';
  createdAt: Date;
}

interface KESDatabase extends DBSchema {
  pendingRefuels: {
    key: string;
    value: PendingRefuel;
    indexes: { 'by-createdAt': Date };
  };
  pendingPhotos: {
    key: string;
    value: PendingPhoto;
    indexes: { 'by-refuelId': string };
  };
  syncedRefuels: {
    key: number;
    value: { id: number; syncedAt: Date };
  };
}

let dbInstance: IDBPDatabase<KESDatabase> | null = null;

export async function getOfflineDB(): Promise<IDBPDatabase<KESDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<KESDatabase>('kes-carburant-offline', 2, {
    upgrade(db, oldVersion) {
      // Stockage des recharges en attente
      if (!db.objectStoreNames.contains('pendingRefuels')) {
        const refuelStore = db.createObjectStore('pendingRefuels', { keyPath: 'id' });
        refuelStore.createIndex('by-createdAt', 'createdAt');
      }

      // Stockage des photos en attente
      if (!db.objectStoreNames.contains('pendingPhotos')) {
        const photoStore = db.createObjectStore('pendingPhotos', { keyPath: 'id' });
        photoStore.createIndex('by-refuelId', 'refuelId');
      }

      // Stockage des IDs déjà synchronisés
      if (!db.objectStoreNames.contains('syncedRefuels')) {
        db.createObjectStore('syncedRefuels', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Gestion des recharges en attente
export async function savePendingRefuel(refuel: Omit<PendingRefuel, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
  const db = await getOfflineDB();
  const id = crypto.randomUUID();
  
  const pendingRefuel: PendingRefuel = {
    id,
    data: refuel.data,
    dashboardPhoto: refuel.dashboardPhoto,
    pumpPhoto: refuel.pumpPhoto,
    createdAt: new Date(),
    retryCount: 0,
  };
  
  await db.add('pendingRefuels', pendingRefuel);
  return id;
}

export async function getPendingRefuels(): Promise<PendingRefuel[]> {
  const db = await getOfflineDB();
  const index = db.transaction('pendingRefuels', 'readonly').store.index('by-createdAt');
  return index.getAll();
}

export async function getPendingRefuelById(id: string): Promise<PendingRefuel | undefined> {
  const db = await getOfflineDB();
  return db.get('pendingRefuels', id);
}

export async function updatePendingRefuelRetry(id: string, retryCount: number): Promise<void> {
  const db = await getOfflineDB();
  const refuel = await db.get('pendingRefuels', id);
  if (refuel) {
    refuel.retryCount = retryCount;
    await db.put('pendingRefuels', refuel);
  }
}

export async function removePendingRefuel(id: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('pendingRefuels', id);
  
  // Supprimer aussi les photos associées
  const photos = await getPendingPhotosByRefuelId(id);
  for (const photo of photos) {
    await removePendingPhoto(photo.id);
  }
}

// Gestion des photos
export async function savePendingPhoto(refuelId: string, file: File, type: 'TABLEAU_BORD' | 'POMPE'): Promise<string> {
  const db = await getOfflineDB();
  const id = crypto.randomUUID();
  
  const pendingPhoto: PendingPhoto = {
    id,
    refuelId,
    file,
    type,
    createdAt: new Date(),
  };
  
  await db.add('pendingPhotos', pendingPhoto);
  return id;
}

export async function getPendingPhotosByRefuelId(refuelId: string): Promise<PendingPhoto[]> {
  const db = await getOfflineDB();
  const index = db.transaction('pendingPhotos', 'readonly').store.index('by-refuelId');
  return index.getAll(refuelId);
}

export async function getAllPendingPhotos(): Promise<PendingPhoto[]> {
  const db = await getOfflineDB();
  return db.getAll('pendingPhotos');
}

export async function removePendingPhoto(id: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('pendingPhotos', id);
}

// Gestion des synchronisations
export async function markAsSynced(id: number): Promise<void> {
  const db = await getOfflineDB();
  await db.put('syncedRefuels', { id, syncedAt: new Date() });
}

export async function isAlreadySynced(id: number): Promise<boolean> {
  const db = await getOfflineDB();
  const result = await db.get('syncedRefuels', id);
  return !!result;
}

export async function clearAllPending(): Promise<void> {
  const db = await getOfflineDB();
  const refuels = await getPendingRefuels();
  for (const refuel of refuels) {
    await removePendingRefuel(refuel.id);
  }
}

export async function getPendingCount(): Promise<number> {
  const refuels = await getPendingRefuels();
  return refuels.length;
}