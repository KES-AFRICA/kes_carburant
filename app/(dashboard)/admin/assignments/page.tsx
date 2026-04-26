/* eslint-disable react-hooks/set-state-in-effect */
// app/admin/assignments/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAssignments } from '@/lib/hooks/useAssignments';
import { 
  Search, 
  Plus, 
  X, 
  Car, 
  User, 
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle
} from 'lucide-react';

// Composant Tooltip
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default function AdminAssignmentsPage() {
  const { usersWithVehicles, vehiclesWithUsers, loading, error, assignVehicle, removeVehicle } = useAssignments();
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [sheetAnimation, setSheetAnimation] = useState<'enter' | 'exit' | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicleId, setFilterVehicleId] = useState<string>('');
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [confirmRemove, setConfirmRemove] = useState<{ userId: number; vehicleId: number; userName: string; vehicleName: string } | null>(null);

  // Expandre tous les utilisateurs par défaut
  useEffect(() => {
    if (usersWithVehicles.length > 0) {
      const allUserIds = new Set(usersWithVehicles.map(u => u.id));
      setExpandedUsers(allUserIds);
    }
  }, [usersWithVehicles]);

  // Filtrer les utilisateurs
  const filteredUsers = useMemo(() => {
    let filtered = [...usersWithVehicles];
    
    // Recherche par nom
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.prenom.toLowerCase().includes(term) ||
        user.nom.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Filtre par véhicule (par ID pour éviter les problèmes)
    if (filterVehicleId) {
      const vehicleIdNum = parseInt(filterVehicleId);
      filtered = filtered.filter(user =>
        user.vehicles.some(v => v.id === vehicleIdNum)
      );
    }
    
    return filtered;
  }, [usersWithVehicles, searchTerm, filterVehicleId]);

  // Obtenir tous les véhicules uniques pour le filtre
  const allVehicles = useMemo(() => {
    const vehicleMap = new Map();
    vehiclesWithUsers.forEach(vehicle => {
      vehicleMap.set(vehicle.id, {
        id: vehicle.id,
        name: `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
      });
    });
    return Array.from(vehicleMap.values());
  }, [vehiclesWithUsers]);

  // Gestion animation sheet
  const openAssignSheet = () => {
    setSheetAnimation('enter');
    setShowAssignSheet(true);
  };

  const closeAssignSheet = () => {
    setSheetAnimation('exit');
    setTimeout(() => {
      setShowAssignSheet(false);
      setSelectedUserId(null);
      setSelectedVehicleId(null);
      setSheetAnimation(null);
    }, 300);
  };

  const toggleUserExpand = (userId: number) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && selectedVehicleId) {
      await assignVehicle({ utilisateurId: selectedUserId, vehiculeId: selectedVehicleId });
      closeAssignSheet();
    }
  };

  const handleRemoveClick = (userId: number, vehicleId: number, userName: string, vehicleName: string) => {
    setConfirmRemove({ userId, vehicleId, userName, vehicleName });
  };

  const handleConfirmRemove = async () => {
    if (confirmRemove) {
      await removeVehicle(confirmRemove.userId, confirmRemove.vehicleId);
      setConfirmRemove(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterVehicleId('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Assignations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} • 
            {usersWithVehicles.reduce((acc, u) => acc + u.vehicles.length, 0)} véhicule(s) assigné(s)
          </p>
        </div>
        <button
          onClick={openAssignSheet}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus size={18} />
          Assigner un véhicule
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur (nom, prénom, email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="relative sm:w-72">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white appearance-none"
          >
            <option value="">Tous les véhicules</option>
            {allVehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {(searchTerm || filterVehicleId) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Liste des utilisateurs avec leurs véhicules */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Car size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUsers.has(user.id);
            const hasVehicles = user.vehicles.length > 0;
            
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                {/* En-tête utilisateur */}
                <div 
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer"
                  onClick={() => toggleUserExpand(user.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {user.prenom} {user.nom}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {user.vehicles.length} véhicule{user.vehicles.length > 1 ? 's' : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Véhicules assignés (expandable) - TOUJOURS VISIBLE car ouvert par défaut */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    {!hasVehicles ? (
                      <p className="text-sm text-gray-400 italic py-2">Aucun véhicule assigné</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {user.vehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 transition"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Car size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">
                                {vehicle.marque} {vehicle.modele}
                              </span>
                              <span className="text-xs text-gray-400 truncate">
                                {vehicle.immatriculation}
                              </span>
                            </div>
                            <Tooltip text="Retirer l'assignation">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveClick(
                                    user.id,
                                    vehicle.id,
                                    `${user.prenom} ${user.nom}`,
                                    `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
                                  );
                                }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded transition ml-2 flex-shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet latérale - Assignation */}
      {showAssignSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              sheetAnimation === 'enter' ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeAssignSheet}
          />
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-out ${
              sheetAnimation === 'enter' ? 'translate-x-0' : 'translate-x-full'
            } overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Assigner un véhicule</h2>
              <button
                onClick={closeAssignSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {usersWithVehicles.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={selectedVehicleId || ""}
                  onChange={(e) => setSelectedVehicleId(parseInt(e.target.value))}
                  required
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehiclesWithUsers.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.marque} {vehicle.modele} - {vehicle.immatriculation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAssignSheet}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression d'assignation */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmRemove(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Retirer l&apos;assignation</h2>
              <p className="text-gray-500 mb-4">
                Êtes-vous sûr de vouloir retirer ce véhicule ?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-700">{confirmRemove.userName}</p>
                <p className="text-sm text-gray-500">⟶ {confirmRemove.vehicleName}</p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition cursor-pointer"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}