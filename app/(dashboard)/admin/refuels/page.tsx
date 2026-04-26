/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/refuels/page.tsx
"use client";

import { useState, useMemo, Key } from "react";
import { useAdminRefuels } from "@/lib/hooks/useAdminRefuels";
import Image from "next/image";
import { Trash2, X, Filter, Calendar, User, Fuel, Camera, Eye, ChevronLeft, ChevronRight, AlertTriangle, Gauge, Droplet, Maximize2, XCircle, Search } from "lucide-react";
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
    hour: '2-digit',
    minute: '2-digit',
  });
};

type FilterPeriod = "all" | "today" | "week" | "month" | "custom";

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

export default function AdminRefuelsPage() {
  const { refuels, filters, loading, error, deleteRefuel } = useAdminRefuels();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUtilisateur, setSelectedUtilisateur] = useState<string>("");
  const [selectedVehicule, setSelectedVehicule] = useState<string>("");
  const [selectedRefuel, setSelectedRefuel] = useState<typeof refuels[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [detailAnimation, setDetailAnimation] = useState<'enter' | 'exit' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; alt: string } | null>(null);
  
  // États pour les filtres de date
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  const itemsPerPage = 10;

  // Fonction pour filtrer les données selon la période
  const filterDataByPeriod = (data: any[], dateField: string) => {
    if (!data || data.length === 0) return [];
    
    if (filterPeriod === "all") return data;
    
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

  // Appliquer les filtres utilisateur, véhicule et recherche
  const finalFilteredRefuels = useMemo(() => {
    let filtered = [...filteredByDate];
    
    // Filtre recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(refuel => 
        refuel.vehiculeName?.toLowerCase().includes(term) ||
        refuel.vehiculeImmatriculation?.toLowerCase().includes(term) ||
        refuel.utilisateurName?.toLowerCase().includes(term) ||
        refuel.utilisateurEmail?.toLowerCase().includes(term)
      );
    }
    
    if (selectedUtilisateur) {
      filtered = filtered.filter(refuel => refuel.utilisateurId === parseInt(selectedUtilisateur));
    }
    if (selectedVehicule) {
      filtered = filtered.filter(refuel => refuel.vehiculeId === parseInt(selectedVehicule));
    }
    
    return filtered;
  }, [filteredByDate, searchTerm, selectedUtilisateur, selectedVehicule]);

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedUtilisateur) count++;
    if (selectedVehicule) count++;
    if (filterPeriod !== "all") count++;
    return count;
  }, [searchTerm, selectedUtilisateur, selectedVehicule, filterPeriod]);

  // Reset des filtres de date
  const resetDateFilters = () => {
    setFilterPeriod("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setShowCustomPicker(false);
  };

  const handleResetAll = () => {
    setSearchTerm("");
    setSelectedUtilisateur("");
    setSelectedVehicule("");
    resetDateFilters();
    setCurrentPage(1);
  };

  const openDetailSheet = (refuel: typeof refuels[0]) => {
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

  const handleDeleteClick = (id: number, name: string) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      await deleteRefuel(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const totalPages = Math.ceil(finalFilteredRefuels.length / itemsPerPage);
  const paginatedRefuels = finalFilteredRefuels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case "all": return "Toutes";
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Recharges carburant</h1>
          <p className="text-sm text-gray-500 mt-1">
            {finalFilteredRefuels.length} recharge{finalFilteredRefuels.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
            showFilters 
              ? "bg-blue-600 text-white" 
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter size={16} />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Barre de recherche - toujours visible */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par véhicule, immatriculation ou utilisateur..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Filtres - masqués par défaut */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Filtres avancés
            </h2>
            <button onClick={handleResetAll} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition cursor-pointer">
              <X size={14} /> Tout effacer
            </button>
          </div>

          {/* Filtres de date rapides */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setFilterPeriod("all"); setShowCustomPicker(false); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                  filterPeriod === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={() => { setFilterPeriod("today"); setShowCustomPicker(false); setCurrentPage(1); }}
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
                onClick={() => { setFilterPeriod("week"); setShowCustomPicker(false); setCurrentPage(1); }}
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
                onClick={() => { setFilterPeriod("month"); setShowCustomPicker(false); setCurrentPage(1); }}
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
            </div>
          </div>

          {/* Picker date personnalisé */}
          {showCustomPicker && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (customStartDate && customEndDate) {
                        setFilterPeriod("custom");
                        setShowCustomPicker(false);
                        setCurrentPage(1);
                      }
                    }}
                    disabled={!customStartDate || !customEndDate}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={selectedUtilisateur}
                onChange={(e) => {
                  setSelectedUtilisateur(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tous les utilisateurs</option>
                {filters?.utilisateurs?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={selectedVehicule}
                onChange={(e) => {
                  setSelectedVehicule(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tous les véhicules</option>
                {filters?.vehicules?.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de filtre actif */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500">Filtres actifs :</span>
          {filterPeriod !== "all" && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              📅 {getPeriodLabel()}
            </span>
          )}
          {selectedUtilisateur && filters?.utilisateurs?.find(u => u.id.toString() === selectedUtilisateur) && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              👤 {filters.utilisateurs.find(u => u.id.toString() === selectedUtilisateur)?.name}
            </span>
          )}
          {selectedVehicule && filters?.vehicules?.find(v => v.id.toString() === selectedVehicule) && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              🚗 {filters.vehicules.find(v => v.id.toString() === selectedVehicule)?.name}
            </span>
          )}
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              🔍 {searchTerm}
            </span>
          )}
        </div>
      )}

      {/* Liste */}
      {finalFilteredRefuels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Fuel size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune recharge trouvée</p>
          {activeFiltersCount > 0 && (
            <button onClick={handleResetAll} className="mt-3 text-sm text-blue-600 hover:text-blue-700">
              Effacer tous les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedRefuels.map((refuel) => (
              <div key={refuel.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Fuel size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {refuel.vehiculeName} ({refuel.vehiculeImmatriculation})
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <User size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{refuel.utilisateurName}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDate(refuel.dateHeure)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip text="Voir les détails">
                        <button
                          onClick={() => openDetailSheet(refuel)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        >
                          <Eye size={18} />
                        </button>
                      </Tooltip>
                      <Tooltip text="Supprimer">
                        <button
                          onClick={() => handleDeleteClick(refuel.id, `${refuel.vehiculeName} - ${formatDate(refuel.dateHeure)}`)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Distance</p>
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
                    </div>
                  )}

                  {/* Photos avec fullscreen */}
                  {refuel.photos && refuel.photos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{refuel.photos.length} photo(s)</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {refuel.photos.map((photo: { id: Key | null | undefined; url: string; type: string; }) => (
                          <div
                            key={photo.id}
                            className="relative group cursor-pointer"
                            onClick={() => setFullscreenImage({
                              src: photo.url,
                              alt: photo.type === "TABLEAU_BORD" ? "Tableau de bord" : "Photo pompe"
                            })}
                          >
                            <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-105 duration-200">
                              <Image 
                                src={photo.url} 
                                alt={photo.type === "TABLEAU_BORD" ? "Tableau de bord" : "Pompe"} 
                                fill 
                                className="object-cover"
                                unoptimized={true}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                                <Maximize2 size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white ${
                              photo.type === "TABLEAU_BORD" 
                                ? "bg-blue-500" 
                                : "bg-green-500"
                            }`}>
                              {photo.type === "TABLEAU_BORD" ? (
                                <div className="flex items-center gap-0.5">
                                  <Gauge size={10} />
                                  <span>Dashboard</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-0.5">
                                  <Droplet size={10} />
                                  <span>Pompe</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100">
              <div className="text-sm text-gray-500">{finalFilteredRefuels.length} recharge(s)</div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 cursor-pointer">
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-1 text-sm text-gray-700">Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 cursor-pointer">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Sheet Détails - gardé identique */}
      {showDetailSheet && (
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
            {selectedRefuel && (
              <>
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Détail de la recharge #{selectedRefuel.id}</h3>
                  <button onClick={closeDetailSheet} className="text-gray-400 hover:text-gray-500 cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Utilisateur</p>
                      <p className="font-medium">{selectedRefuel.utilisateurName}</p>
                      <p className="text-sm text-gray-500">{selectedRefuel.utilisateurEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Véhicule</p>
                      <p className="font-medium">{selectedRefuel.vehiculeName}</p>
                      <p className="text-sm text-gray-500">{selectedRefuel.vehiculeImmatriculation}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="font-medium">{formatDate(selectedRefuel.dateHeure)}</p>
                    </div>
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
                        {selectedRefuel.photos.map((photo) => (
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
                            <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white flex items-center gap-1 ${
                              photo.type === "TABLEAU_BORD" 
                                ? "bg-blue-600" 
                                : "bg-green-600"
                            }`}>
                              {photo.type === "TABLEAU_BORD" ? (
                                <>
                                  <Gauge size={12} />
                                  <span>Tableau de bord</span>
                                </>
                              ) : (
                                <>
                                  <Droplet size={12} />
                                  <span>Pompe</span>
                                </>
                              )}
                            </div>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 transition-opacity duration-200" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl transition-all duration-200 scale-100 opacity-100">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Supprimer la recharge</h2>
              <p className="text-gray-500 mb-4">
                Êtes-vous sûr de vouloir supprimer cette recharge ?<br />
                <span className="text-sm font-medium text-gray-700">{confirmDelete.name}</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition cursor-pointer"
                >
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