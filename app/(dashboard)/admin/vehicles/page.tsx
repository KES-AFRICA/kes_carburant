// app/admin/vehicles/page.tsx
'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { CreateVehicleDTO, TypeCarburant } from '@/lib/types/vehicle';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Fuel, 
  Calendar, 
  Gauge, 
  Droplet,
  Camera,
  AlertTriangle,
  Eye,
  Maximize2,
  XCircle
} from 'lucide-react';

const TYPE_CARBURANT_OPTIONS: { value: TypeCarburant; label: string; color: string }[] = [
  { value: 'ESSENCE', label: 'Essence', color: 'bg-blue-100 text-blue-700' },
  { value: 'DIESEL', label: 'Diesel', color: 'bg-orange-100 text-orange-700' },
  { value: 'GASOIL', label: 'Gasoil', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ELECTRIQUE', label: 'Électrique', color: 'bg-green-100 text-green-700' },
  { value: 'HYBRIDE', label: 'Hybride', color: 'bg-purple-100 text-purple-700' },
];

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
      className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center"
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

export default function AdminVehiclesPage() {
  const { vehicles, loading, error, createVehicle, updateVehicle, deleteVehicle, uploadPhoto } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<typeof vehicles[0] | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [sheetAnimation, setSheetAnimation] = useState<'enter' | 'exit' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; alt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Filtrer les véhicules par recherche
  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter(vehicle => 
      vehicle.marque.toLowerCase().includes(term) ||
      vehicle.modele.toLowerCase().includes(term) ||
      vehicle.immatriculation.toLowerCase().includes(term)
    );
  }, [vehicles, searchTerm]);

  // Gestion animation sheet
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

  const openEditSheet = (vehicle: typeof vehicles[0]) => {
    setEditingVehicle(vehicle);
    setSheetAnimation('enter');
  };

  const closeEditSheet = () => {
    setSheetAnimation('exit');
    setTimeout(() => {
      setEditingVehicle(null);
      setSheetAnimation(null);
    }, 300);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: CreateVehicleDTO = {
      immatriculation: formData.get('immatriculation') as string,
      marque: formData.get('marque') as string,
      modele: formData.get('modele') as string,
      annee: parseInt(formData.get('annee') as string),
      typeCarburant: formData.get('typeCarburant') as TypeCarburant,
      consommationTheorique: parseFloat(formData.get('consommationTheorique') as string) || undefined,
      capaciteReservoir: parseFloat(formData.get('capaciteReservoir') as string) || undefined,
    };
    await createVehicle(data);
    closeCreateSheet();
    e.currentTarget.reset();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVehicle) return;
    const formData = new FormData(e.currentTarget);
    await updateVehicle(editingVehicle.id, {
      immatriculation: formData.get('immatriculation') as string,
      marque: formData.get('marque') as string,
      modele: formData.get('modele') as string,
      annee: parseInt(formData.get('annee') as string),
      typeCarburant: formData.get('typeCarburant') as TypeCarburant,
      consommationTheorique: parseFloat(formData.get('consommationTheorique') as string) || null,
      capaciteReservoir: parseFloat(formData.get('capaciteReservoir') as string) || null,
    });
    closeEditSheet();
  };

  const handleUploadPhoto = async (id: number, file: File) => {
    setUploadingId(id);
    await uploadPhoto(id, file);
    setUploadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const handleDeleteClick = (id: number, name: string) => {
    setConfirmDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      await deleteVehicle(confirmDelete.id);
      setConfirmDelete(null);
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Véhicules</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''} enregistré(s)
          </p>
        </div>
        <button
          onClick={openCreateSheet}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus size={18} />
          Nouveau véhicule
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par marque, modèle ou immatriculation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Grille des véhicules */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Fuel size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucun véhicule trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Image - clic pour fullscreen */}
              <div className="relative h-48 bg-linear-to-br from-gray-100 to-gray-200 group">
                {vehicle.photoUrl ? (
                  <>
                    <Image
                      src={vehicle.photoUrl}
                      alt={`${vehicle.marque} ${vehicle.modele}`}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => setFullscreenImage({
                        src: vehicle.photoUrl? vehicle.photoUrl : '',
                        alt: `${vehicle.marque} ${vehicle.modele}`
                      })}
                      unoptimized={true}
                    />
                    {/* Overlay fullscreen au survol */}
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center cursor-pointer"
                      onClick={() => setFullscreenImage({
                        src: vehicle.photoUrl? vehicle.photoUrl : '',
                        alt: `${vehicle.marque} ${vehicle.modele}`
                      })}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white/90 rounded-full p-2">
                          <Maximize2 size={20} className="text-gray-800" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Fuel size={48} className="text-gray-300" />
                  </div>
                )}
                

                
                {uploadingId === vehicle.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
                
                {/* Badge carburant */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    TYPE_CARBURANT_OPTIONS.find(t => t.value === vehicle.typeCarburant)?.color
                  }`}>
                    {TYPE_CARBURANT_OPTIONS.find(t => t.value === vehicle.typeCarburant)?.label}
                  </span>
                </div>
              </div>

              {/* Infos */}
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900">
                  {vehicle.marque} {vehicle.modele}
                </h3>
                <p className="text-sm text-gray-500">{vehicle.immatriculation}</p>
                
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar size={14} />
                    <span>{vehicle.annee}</span>
                  </div>
                  {vehicle.consommationTheorique && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Gauge size={14} />
                      <span>{vehicle.consommationTheorique} L/100km</span>
                    </div>
                  )}
                  {vehicle.capaciteReservoir && (
                    <div className="flex items-center gap-1 text-gray-500 col-span-2">
                      <Droplet size={14} />
                      <span>{vehicle.capaciteReservoir} L</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 items-center">
                                  {/* Upload button */}
                    <Tooltip text="Changer la photo">
      <label className="cursor-pointer p-1.5 text-gray-500 rounded-lg transition">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadPhoto(vehicle.id, file);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <Camera size={16} />
      </label>
    </Tooltip>
                  <Tooltip text="Voir les détails">
                    <button
                      onClick={() => openEditSheet(vehicle)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip text="Modifier">
                    <button
                      onClick={() => openEditSheet(vehicle)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip text="Archiver">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(vehicle.id, `${vehicle.marque} ${vehicle.modele} (${vehicle.immatriculation})`); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
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
              <h2 className="text-lg font-semibold text-gray-900">Nouveau véhicule</h2>
              <button
                onClick={closeCreateSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation *</label>
                <input
                  name="immatriculation"
                  required
                  placeholder="AB-123-CD"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
                <input
                  name="marque"
                  required
                  placeholder="Renault"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle *</label>
                <input
                  name="modele"
                  required
                  placeholder="Clio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                <input
                  name="annee"
                  type="number"
                  required
                  placeholder="2022"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type carburant *</label>
                <select
                  name="typeCarburant"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {TYPE_CARBURANT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consommation théorique (L/100km)</label>
                <input
                  name="consommationTheorique"
                  type="number"
                  step="0.1"
                  placeholder="6.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacité réservoir (Litres)</label>
                <input
                  name="capaciteReservoir"
                  type="number"
                  step="1"
                  placeholder="55"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheet latérale - Modification */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50">
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              sheetAnimation === 'enter' ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closeEditSheet}
          />
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-out ${
              sheetAnimation === 'enter' ? 'translate-x-0' : 'translate-x-full'
            } overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Modifier véhicule</h2>
              <button
                onClick={closeEditSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Aperçu de l'image dans le formulaire d'édition */}
            {editingVehicle.photoUrl && (
              <div className="px-5 pt-4">
                <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={editingVehicle.photoUrl}
                    alt={`${editingVehicle.marque} ${editingVehicle.modele}`}
                    fill
                    className="object-cover cursor-pointer"
                    onClick={() => setFullscreenImage({
                      src: editingVehicle.photoUrl? editingVehicle.photoUrl : '',
                      alt: `${editingVehicle.marque} ${editingVehicle.modele}`
                    })}
                    unoptimized={true}
                  />
                  <div className="absolute bottom-2 right-2">
                    <label className="cursor-pointer bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadPhoto(editingVehicle.id, file);
                        }}
                      />
                      <Camera size={14} className="text-gray-600" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                <input
                  name="immatriculation"
                  defaultValue={editingVehicle.immatriculation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                <input
                  name="marque"
                  defaultValue={editingVehicle.marque}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                <input
                  name="modele"
                  defaultValue={editingVehicle.modele}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  name="annee"
                  type="number"
                  defaultValue={editingVehicle.annee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type carburant</label>
                <select
                  name="typeCarburant"
                  defaultValue={editingVehicle.typeCarburant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {TYPE_CARBURANT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consommation théorique (L/100km)</label>
                <input
                  name="consommationTheorique"
                  type="number"
                  step="0.1"
                  defaultValue={editingVehicle.consommationTheorique || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacité réservoir (Litres)</label>
                <input
                  name="capaciteReservoir"
                  type="number"
                  step="1"
                  defaultValue={editingVehicle.capaciteReservoir || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Archiver le véhicule</h2>
              <p className="text-gray-500 mb-4">
                Êtes-vous sûr de vouloir archiver ce véhicule ?<br />
                <span className="text-sm font-medium text-gray-700">{confirmDelete.name}</span>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Le véhicule ne sera plus disponible pour les assignations.
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
                  Archiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}