"use client";

import { useOfflineSync } from "@/lib/hooks/useOfflineSync";

export function SyncStatus() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-4 ${
      isOnline ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {isSyncing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
          ) : (
            <span className="text-xl">{isOnline ? '📡' : '📴'}</span>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${isOnline ? 'text-yellow-800' : 'text-red-800'}`}>
            {isOnline ? 'Mode hors ligne' : 'Hors ligne'}
          </p>
          <p className="text-xs text-gray-600">
            {pendingCount} recharge(s) en attente de synchronisation
          </p>
        </div>
        {isOnline && pendingCount > 0 && (
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
          >
            {isSyncing ? 'Synchro...' : 'Sync'}
          </button>
        )}
      </div>
    </div>
  );
}