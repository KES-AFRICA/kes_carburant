/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useMemo, useEffect, Key } from "react";
import { useRefuels } from "@/lib/hooks/useRefuels";
import { CreateRefuelDTO, UpdateRefuelDTO } from "@/lib/types/refuel";
import { savePendingRefuel, getPendingRefuels } from "@/lib/offline/db";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import { toast } from "react-toastify";
import Image from "next/image";
import { 
  Search, 
  Plus, 
  X, 
  Fuel, 
  Calendar, 
  Camera, 
  Trash2, 
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  WifiOff,
  Wifi,
  Loader2,
  Eye,
  Edit2,
  Maximize2,
  XCircle
} from "lucide-react";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

const formatFCFA = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('XAF', 'FCFA');
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type FilterPeriod = "today" | "week" | "month" | "custom";

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

// Composant Fullscreen Image Modal
const FullscreenImage = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition z-10"
      >
        <XCircle size={32} />
      </button>
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized={true}
        />
      </div>
    </div>
  );
};

export default function UserRefuelsPage() {
  const { refuels, vehicles, loading, error, createRefuel, updateRefuel, deleteRefuel } = useRefuels();
  const { isOnline } = useOfflineSync();
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [sheetAnimation, setSheetAnimation] = useState<'enter' | 'exit' | null>(null);
  const [offlineRefuels, setOfflineRefuels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicleId, setFilterVehicleId] = useState<string>('');
  const [expandedRefuels, setExpandedRefuels] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [detailAnimation, setDetailAnimation] = useState<'enter' | 'exit' | null>(null);
  const [selectedRefuel, setSelectedRefuel] = useState<any>(null);
  
  // États pour l'édition
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editAnimation, setEditAnimation] = useState<'enter' | 'exit' | null>(null);
  const [editingRefuel, setEditingRefuel] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États pour les filtres de date
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // État pour le fullscreen image
  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; alt: string } | null>(null);
  
  const dashboardPhotoFileInput = useRef<HTMLInputElement>(null);
  const pumpPhotoFileInput = useRef<HTMLInputElement>(null);

  // Créer un Map pour accéder rapidement aux véhicules
  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach(vehicle => {
      map.set(vehicle.id, vehicle);
    });
    return map;
  }, [vehicles]);

  // Filtrer les recharges par période
  const filterDataByPeriod = (data: any[], dateField: string) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    switch (filterPeriod) {
      case "today":
        startDate = today;
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          return data;
        }
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Filtrer les recharges par période
  const filteredByDate = useMemo(() => {
    if (!refuels || refuels.length === 0) return [];
    return filterDataByPeriod(refuels, "dateHeure");
  }, [refuels, filterPeriod, customStartDate, customEndDate]);

  // Filtrer les recharges (recherche + véhicule + date)
  const filteredRefuels = useMemo(() => {
    let filtered = [...filteredByDate];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(refuel => {
        const vehicle = vehicleMap.get(refuel.vehiculeId);
        return vehicle?.marque?.toLowerCase().includes(term) ||
               vehicle?.modele?.toLowerCase().includes(term) ||
               vehicle?.immatriculation?.toLowerCase().includes(term);
      });
    }
    
    if (filterVehicleId) {
      const vehicleIdNum = parseInt(filterVehicleId);
      filtered = filtered.filter(refuel => refuel.vehiculeId === vehicleIdNum);
    }
    
    return filtered;
  }, [filteredByDate, searchTerm, filterVehicleId, vehicleMap]);

  // Compter le nombre de recharges avant filtres
  const totalBeforeFilters = refuels.length;

  // Appliquer les filtres personnalisés
  const applyCustomFilter = () => {
    if (customStartDate && customEndDate) {
      setFilterPeriod("custom");
      setShowCustomPicker(false);
    }
  };

  // Reset des filtres de date
  const resetDateFilters = () => {
    setFilterPeriod("week");
    setCustomStartDate("");
    setCustomEndDate("");
    setShowCustomPicker(false);
  };

  // Expandre toutes les recharges par défaut
  useEffect(() => {
    if (refuels.length > 0) {
      const allIds = new Set(refuels.map(r => r.id));
      setExpandedRefuels(allIds);
    }
  }, [refuels]);

  // Charger les recharges offline
  const loadOfflineRefuels = async () => {
    const pending = await getPendingRefuels();
    setOfflineRefuels(pending);
  };

  useEffect(() => {
    loadOfflineRefuels();
  }, []);

  // Gestion animation sheet de création
  const openCreateSheet = () => {
    setSheetAnimation('enter');
    setShowCreateSheet(true);
  };

  const closeCreateSheet = () => {
    setSheetAnimation('exit');
    setTimeout(() => {
      setShowCreateSheet(false);
      setSheetAnimation(null);
    }, 300);
  };

  const openDetailSheet = (refuel: any) => {
    setSelectedRefuel(refuel);
    setDetailAnimation('enter');
    setShowDetailSheet(true);
  };

  const closeDetailSheet = () => {
    setDetailAnimation('exit');
    setTimeout(() => {
      setShowDetailSheet(false);
      setSelectedRefuel(null);
      setDetailAnimation(null);
    }, 300);
  };

  // Gestion sheet d'édition
  const openEditSheet = (refuel: any) => {
    setEditingRefuel(refuel);
    setEditAnimation('enter');
    setShowEditSheet(true);
  };

  const closeEditSheet = () => {
    setEditAnimation('exit');
    setTimeout(() => {
      setShowEditSheet(false);
      setEditingRefuel(null);
      setEditAnimation(null);
    }, 300);
  };

  const toggleRefuelExpand = (id: number) => {
    setExpandedRefuels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const uploadPhoto = async (rechargeId: number, file: File, type: string) => {
    const uploadFormData = new FormData();
    uploadFormData.append("photo", file);
    uploadFormData.append("type", type);
    uploadFormData.append("rechargeId", rechargeId.toString());

    const response = await fetch("/api/upload/photo", {
      method: "POST",
      body: uploadFormData,
    });
    return response.json();
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      vehiculeId: parseInt(formData.get("vehiculeId") as string),
      dateHeure: new Date(formData.get("dateHeure") as string).toISOString(),
      quantiteLitres: parseFloat(formData.get("quantiteLitres") as string),
      montant: parseFloat(formData.get("montant") as string),
      kmActuel: parseFloat(formData.get("kmActuel") as string),
      pleinComplet: formData.get("pleinComplet") === "true",
      lieuNom: formData.get("lieuNom") as string || undefined,
      lieuAdresse: formData.get("lieuAdresse") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    };

    const dashboardPhotoFile = dashboardPhotoFileInput.current?.files?.[0];
    const pumpPhotoFile = pumpPhotoFileInput.current?.files?.[0];

    // Mode offline
    if (!isOnline) {
      if (!dashboardPhotoFile || !pumpPhotoFile) {
        toast.error("Les photos du tableau de bord et de la pompe sont obligatoires");
        setIsSubmitting(false);
        return;
      }
      
      await savePendingRefuel({
        data,
        dashboardPhoto: dashboardPhotoFile,
        pumpPhoto: pumpPhotoFile,
      });
      
      toast.success("Recharge sauvegardée localement (mode hors ligne)");
      closeCreateSheet();
      loadOfflineRefuels();
      setIsSubmitting(false);
      e.currentTarget.reset();
      if (dashboardPhotoFileInput.current) dashboardPhotoFileInput.current.value = "";
      if (pumpPhotoFileInput.current) pumpPhotoFileInput.current.value = "";
      return;
    }

    // Mode online - 1. Créer la recharge
    const refuelData: CreateRefuelDTO = {
      vehiculeId: data.vehiculeId,
      dateHeure: data.dateHeure,
      quantiteLitres: data.quantiteLitres,
      montant: data.montant,
      kmActuel: data.kmActuel,
      pleinComplet: data.pleinComplet,
      lieuNom: data.lieuNom,
      lieuAdresse: data.lieuAdresse,
      notes: data.notes,
    };
    
    const result = await createRefuel(refuelData);
    
    if (!result) {
      setIsSubmitting(false);
      return;
    }

    // Mode online - 2. Uploader les photos directement
    let uploadSuccess = true;
    
    if (dashboardPhotoFile) {
      try {
        await uploadPhoto(result.id, dashboardPhotoFile, "TABLEAU_BORD");
      } catch (error) {
        console.error("Erreur upload photo tableau de bord:", error);
        uploadSuccess = false;
      }
    }
    
    if (pumpPhotoFile) {
      try {
        await uploadPhoto(result.id, pumpPhotoFile, "POMPE");
      } catch (error) {
        console.error("Erreur upload photo pompe:", error);
        uploadSuccess = false;
      }
    }
    
    if (uploadSuccess) {
      toast.success("Recharge et photos ajoutées avec succès");
    } else {
      toast.warning("Recharge créée mais certaines photos n'ont pas pu être uploadées");
    }
    
    closeCreateSheet();
    setIsSubmitting(false);
    e.currentTarget.reset();
    if (dashboardPhotoFileInput.current) dashboardPhotoFileInput.current.value = "";
    if (pumpPhotoFileInput.current) pumpPhotoFileInput.current.value = "";
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRefuel) return;
    
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    
    const updateData: UpdateRefuelDTO = {
      dateHeure: new Date(formData.get("dateHeure") as string).toISOString(),
      quantiteLitres: parseFloat(formData.get("quantiteLitres") as string),
      montant: parseFloat(formData.get("montant") as string),
      kmActuel: parseFloat(formData.get("kmActuel") as string),
      pleinComplet: formData.get("pleinComplet") === "true",
      lieuNom: formData.get("lieuNom") as string || undefined,
      lieuAdresse: formData.get("lieuAdresse") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    };
    
    const success = await updateRefuel(editingRefuel.id, updateData);
    
    if (success) {
      closeEditSheet();
    }
    
    setIsUpdating(false);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      setDeletingId(confirmDelete.id);
      const success = await deleteRefuel(confirmDelete.id);
      setDeletingId(null);
      if (success) {
        toast.success("Recharge supprimée");
      }
      setConfirmDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterVehicleId('');
    resetDateFilters();
  };

  // Obtenir tous les véhicules uniques pour le filtre
  const allVehicles = useMemo(() => {
    const vehicleArray = Array.from(vehicleMap.values());
    return vehicleArray.map(vehicle => ({
      id: vehicle.id,
      name: `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`
    }));
  }, [vehicleMap]);

  // Helper pour obtenir les infos du véhicule
  const getVehicleInfo = (vehiculeId: number) => {
    return vehicleMap.get(vehiculeId) || { marque: '?', modele: '?', immatriculation: '?' };
  };

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case "today": return "Aujourd'hui";
      case "week": return "7 derniers jours";
      case "month": return "30 derniers jours";
      case "custom": return `${customStartDate} au ${customEndDate}`;
      default: return "";
    }
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

  const hasAnyRefuel = refuels.length > 0 || offlineRefuels.length > 0;

  return (
    <div className="space-y-6">
      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <FullscreenImage
          src={fullscreenImage.src}
          alt={fullscreenImage.alt}
          onClose={() => setFullscreenImage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Mes recharges</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredRefuels.length} recharge{filteredRefuels.length > 1 ? 's' : ''} {totalBeforeFilters !== filteredRefuels.length && `(filtré sur ${totalBeforeFilters} total)`}
          </p>
        </div>
        <button
          onClick={openCreateSheet}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus size={18} />
          Nouvelle recharge
        </button>
      </div>

      {/* Alertes offline */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <WifiOff size={20} className="text-yellow-600" />
          <div className="flex-1">
            <p className="text-yellow-800 text-sm font-medium">Mode hors ligne actif</p>
            <p className="text-yellow-600 text-xs">Les recharges seront sauvegardées localement et synchronisées automatiquement</p>
          </div>
        </div>
      )}

      {isOnline && offlineRefuels.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Wifi size={20} className="text-green-600" />
          <div className="flex-1">
            <p className="text-green-800 text-sm font-medium">Connexion rétablie</p>
            <p className="text-green-600 text-xs">{offlineRefuels.length} recharge(s) en attente de synchronisation</p>
          </div>
        </div>
      )}

      {/* Filtres - Design amélioré */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        {/* Boutons de période */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setFilterPeriod("today"); setShowCustomPicker(false); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
              filterPeriod === "today"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => { setFilterPeriod("week"); setShowCustomPicker(false); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
              filterPeriod === "week"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cette semaine
          </button>
          <button
            type="button"
            onClick={() => { setFilterPeriod("month"); setShowCustomPicker(false); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
              filterPeriod === "month"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ce mois
          </button>
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer flex items-center gap-2 ${
              filterPeriod === "custom"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Calendar size={16} />
            Personnalisé
          </button>
          
          {filterPeriod !== "week" && filterPeriod !== "custom" && (
            <button
              type="button"
              onClick={resetDateFilters}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Picker date personnalisé */}
        {showCustomPicker && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={applyCustomFilter}
                  disabled={!customStartDate || !customEndDate}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Appliquer
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicateur de période active */}
        {filterPeriod !== "week" && filterPeriod !== "custom" && (
          <div className="text-xs text-blue-600 flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
            Période: {getPeriodLabel()}
          </div>
        )}

        {/* Barre de recherche et filtre véhicule */}
        {hasAnyRefuel && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par véhicule..."
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
        )}
      </div>

      {/* Liste des recharges */}
      {filteredRefuels.length === 0 && offlineRefuels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Fuel size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune recharge trouvée pour cette période</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recharges offline */}
          {offlineRefuels.map((offlineRefuel, idx) => {
            const vehicle = vehicleMap.get(offlineRefuel.data.vehiculeId);
            return (
              <div key={`offline-${idx}`} className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
                <div className="p-4 border-b border-yellow-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Fuel size={18} className="text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {vehicle?.marque} {vehicle?.modele} ({vehicle?.immatriculation || '?'})
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDateTime(offlineRefuel.data.dateHeure)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
                      <WifiOff size={12} />
                      Hors ligne
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Quantité</p>
                      <p className="text-base font-semibold text-gray-900">{offlineRefuel.data.quantiteLitres} L</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Montant</p>
                      <p className="text-base font-semibold text-gray-900">{formatFCFA(offlineRefuel.data.montant)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Kilométrage</p>
                      <p className="text-base font-semibold text-gray-900">{offlineRefuel.data.kmActuel.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Statut</p>
                      <p className="text-sm font-medium text-yellow-600">En attente de synchro</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Recharges synchronisées */}
          {filteredRefuels.map((refuel) => {
            const isExpanded = expandedRefuels.has(refuel.id);
            const vehicle = getVehicleInfo(refuel.vehiculeId);
            
            return (
              <div key={refuel.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                {/* En-tête */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
                  onClick={() => toggleRefuelExpand(refuel.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Fuel size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {vehicle.marque} {vehicle.modele} ({vehicle.immatriculation})
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDateTime(refuel.dateHeure)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">{refuel.quantiteLitres} L</span>
                        <span className="text-xs text-gray-400 ml-1">• {formatFCFA(refuel.montant)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip text="Modifier">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSheet(refuel);
                            }}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Voir les détails">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailSheet(refuel);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                        </Tooltip>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenu expansé */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Quantité</p>
                        <p className="text-base font-semibold text-gray-900">{refuel.quantiteLitres} L</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Montant</p>
                        <p className="text-base font-semibold text-gray-900">{formatFCFA(refuel.montant)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Prix unitaire</p>
                        <p className="text-base font-semibold text-gray-900">{formatFCFA(refuel.prixUnitaire)}/L</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Kilométrage</p>
                        <p className="text-base font-semibold text-gray-900">{refuel.kmActuel.toLocaleString()} km</p>
                      </div>
                    </div>

                    {refuel.consoCalculee && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Distance parcourue</p>
                          <p className="text-sm font-medium text-green-600">{refuel.distanceParcourue?.toLocaleString()} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Consommation</p>
                          <p className="text-sm font-medium text-blue-600">{refuel.consoCalculee.toFixed(2)} L/100km</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Coût au km</p>
                          <p className="text-sm font-medium text-orange-600">{formatFCFA(refuel.coutAuKm || 0)}/km</p>
                        </div>
                      </div>
                    )}

                    {/* Photos */}
{refuel.photos && refuel.photos.length > 0 && (
  <div className="mb-4 pt-4 border-t border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      <Camera size={14} className="text-gray-400" />
      <span className="text-xs text-gray-500">{refuel.photos.length} photo(s)</span>
    </div>
    <div className="flex gap-2">
      {refuel.photos.map((photo: { id: Key | null | undefined; url: string; type: string }) => (
        <div 
          key={photo.id} 
          className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setFullscreenImage({
              src: photo.url,
              alt: photo.type === "TABLEAU_BORD" ? "Tableau de bord" : "Pompe"
            });
          }}
        >
          <Image
            src={photo.url}
            alt={photo.type === "TABLEAU_BORD" ? "Tableau de bord" : "Pompe"}
            fill
            className="object-cover"
            unoptimized={true}
          />
          <span className="absolute bottom-1 left-1 text-[8px] text-white bg-black/50 px-1 py-0.5 rounded">
            {photo.type === "TABLEAU_BORD" ? "Dashboard" : "Pompe"}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

                    {/* Actions */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Tooltip text="Supprimer cette recharge">
                        <button
                          onClick={() => handleDeleteClick(refuel.id, `${formatDate(refuel.dateHeure)} - ${vehicle.marque} ${vehicle.modele}`)}
                          disabled={deletingId === refuel.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === refuel.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Supprimer
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet latérale - Création */}
      {showCreateSheet && (
        <div className="fixed inset-0 z-50">
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              sheetAnimation === 'enter' ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeCreateSheet}
          />
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-out ${
              sheetAnimation === 'enter' ? 'translate-x-0' : 'translate-x-full'
            } overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle recharge</h2>
              <button
                onClick={closeCreateSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule *</label>
                <select name="vehiculeId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marque} {v.modele}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                <input name="dateHeure" type="datetime-local" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (Litres) *</label>
                <input name="quantiteLitres" type="number" step="0.01" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                <input name="montant" type="number" step="0.01" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage actuel *</label>
                <input name="kmActuel" type="number" step="1" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plein complet ?</label>
                <select name="pleinComplet" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  
                  <option value="false">Non (ajout partiel)</option>
                  <option value="true">Oui (calcul précis de consommation)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lieu</label>
                <input name="lieuNom" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Station Total, ..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Informations complémentaires..." />
              </div>
{/* Photos obligatoires */}
<div className="space-y-4 border-t pt-4">
  <h3 className="font-semibold text-gray-900">Photos obligatoires</h3>
  <p className="text-sm text-gray-500">Photos du tableau de bord et de la pompe</p>
  
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Photo tableau de bord</label>
    <input
      ref={dashboardPhotoFileInput}
      type="file"
      accept="image/*"
      capture="environment"
      className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Photo pompe</label>
    <input
      ref={pumpPhotoFileInput}
      type="file"
      accept="image/*"
      capture="environment"
      className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  </div>
</div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCreateSheet}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer la recharge"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheet latérale - Modification */}
      {showEditSheet && editingRefuel && (
        <div className="fixed inset-0 z-50">
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              editAnimation === 'enter' ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeEditSheet}
          />
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-out ${
              editAnimation === 'enter' ? 'translate-x-0' : 'translate-x-full'
            } overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Modifier la recharge #{editingRefuel.id}</h2>
              <button
                onClick={closeEditSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
                <div className="w-full px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {vehicleMap.get(editingRefuel.vehiculeId)?.marque} {vehicleMap.get(editingRefuel.vehiculeId)?.modele} ({vehicleMap.get(editingRefuel.vehiculeId)?.immatriculation})
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure *</label>
                <input 
                  name="dateHeure" 
                  type="datetime-local" 
                  required 
                  defaultValue={new Date(editingRefuel.dateHeure).toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (Litres) *</label>
                <input 
                  name="quantiteLitres" 
                  type="number" 
                  step="0.01" 
                  required 
                  defaultValue={editingRefuel.quantiteLitres}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                <input 
                  name="montant" 
                  type="number" 
                  step="0.01" 
                  required 
                  defaultValue={editingRefuel.montant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage actuel *</label>
                <input 
                  name="kmActuel" 
                  type="number" 
                  step="1" 
                  required 
                  defaultValue={editingRefuel.kmActuel}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plein complet ?</label>
                <select 
                  name="pleinComplet" 
                  defaultValue={editingRefuel.pleinComplet ? "true" : "false"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="true">Oui (calcul précis de consommation)</option>
                  <option value="false">Non (ajout partiel)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lieu</label>
                <input 
                  name="lieuNom" 
                  defaultValue={editingRefuel.lieuNom || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Station Total, ..." 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  name="notes" 
                  rows={3} 
                  defaultValue={editingRefuel.notes || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Informations complémentaires..." 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditSheet}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sheet Détails */}
      {showDetailSheet && selectedRefuel && (
        <div className="fixed inset-0 z-50">
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              detailAnimation === 'enter' ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeDetailSheet}
          />
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl transition-transform duration-300 ease-out ${
              detailAnimation === 'enter' ? 'translate-x-0' : 'translate-x-full'
            } overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Détail de la recharge #{selectedRefuel.id}</h3>
              <button onClick={closeDetailSheet} className="text-gray-400 hover:text-gray-500 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Véhicule</p>
                  <p className="font-medium">{selectedRefuel.vehiculeName || `${selectedRefuel.vehicule?.marque} ${selectedRefuel.vehicule?.modele}`}</p>
                  <p className="text-sm text-gray-500">{selectedRefuel.vehiculeImmatriculation || selectedRefuel.vehicule?.immatriculation}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="font-medium">{formatDateTime(selectedRefuel.dateHeure)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Plein complet</p>
                  <p className={`font-medium ${selectedRefuel.pleinComplet ? 'text-green-600' : 'text-gray-500'}`}>
                    {selectedRefuel.pleinComplet ? "Oui" : "Non"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Quantité</p>
                  <p className="font-bold">{selectedRefuel.quantiteLitres} L</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Montant</p>
                  <p className="font-bold">{formatFCFA(selectedRefuel.montant)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Prix/L</p>
                  <p className="font-bold">{formatFCFA(selectedRefuel.prixUnitaire)}</p>
                </div>
              </div>
              {selectedRefuel.consoCalculee && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-600">Distance</p>
                    <p className="font-bold text-green-700">{selectedRefuel.distanceParcourue?.toLocaleString()} km</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600">Consommation</p>
                    <p className="font-bold text-blue-700">{selectedRefuel.consoCalculee.toFixed(2)} L/100km</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-orange-600">Coût/km</p>
                    <p className="font-bold text-orange-700">{formatFCFA(selectedRefuel.coutAuKm || 0)}</p>
                  </div>
                </div>
              )}
              {selectedRefuel.notes && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">Notes</p>
                  <p className="text-sm">{selectedRefuel.notes}</p>
                </div>
              )}
              {selectedRefuel.photos && selectedRefuel.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Photos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRefuel.photos.map((photo: any) => (
                      <div 
                        key={photo.id} 
                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => setFullscreenImage({
                          src: photo.url,
                          alt: photo.type === "TABLEAU_BORD" ? "Tableau de bord" : "Photo pompe"
                        })}
                      >
                        <Image src={photo.url} alt="Recharge" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized={true}/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded">
                          {photo.type === "TABLEAU_BORD" ? "Tableau de bord" : "Pompe"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-3 flex justify-end">
              <button onClick={closeDetailSheet} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Supprimer la recharge</h2>
              <p className="text-gray-500 mb-4">
                Êtes-vous sûr de vouloir supprimer cette recharge ?
              </p>
              <p className="text-sm text-gray-400 mb-4">{confirmDelete.name}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition cursor-pointer flex items-center gap-2"
                >
                  {deletingId && <Loader2 size={16} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}