// app/admin/users/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useUsers } from '@/lib/hooks/useUsers';
import { User, CreateUserDTO } from '@/lib/types/user';
import { 
  Search, 
  Plus, 
  Trash2, 
  Key, 
  X, 
  Mail,
  Phone,
  User as UserIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';

const formatDate = (date: string | null) => {
  if (!date) return 'Jamais';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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

export default function AdminUsersPage() {
  const { users, loading, error, createUser, updateUser, deleteUser, resetPassword } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset'; userId: number; userName: string } | null>(null);
  const [sheetAnimation, setSheetAnimation] = useState<'enter' | 'exit' | null>(null);
  const [modalAnimation, setModalAnimation] = useState<'enter' | 'exit' | null>(null);

  // Filtrer les utilisateurs non-admin et par recherche
  const filteredUsers = useMemo(() => {
    const nonAdminUsers = users.filter(user => user.role !== 'ADMIN');
    if (!searchTerm.trim()) return nonAdminUsers;
    
    const term = searchTerm.toLowerCase();
    return nonAdminUsers.filter(user => 
      user.nom.toLowerCase().includes(term) ||
      user.prenom.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.telephone && user.telephone.includes(term))
    );
  }, [users, searchTerm]);

  // Gestion animation sheet - ENTRÉE et SORTIE
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

  const openEditSheet = (user: User) => {
    setEditingUser(user);
    setSheetAnimation('enter');
  };

  const closeEditSheet = () => {
    setSheetAnimation('exit');
    setTimeout(() => {
      setEditingUser(null);
      setSheetAnimation(null);
    }, 300);
  };

  const openPasswordModal = (password: string) => {
    setNewPassword(password);
    setModalAnimation('enter');
  };

  const closePasswordModal = () => {
    setModalAnimation('exit');
    setTimeout(() => {
      setNewPassword(null);
      setModalAnimation(null);
    }, 300);
  };

  const confirmDelete = (userId: number, userName: string) => {
    setConfirmAction({ type: 'delete', userId, userName });
  };

  const confirmReset = (userId: number, userName: string) => {
    setConfirmAction({ type: 'reset', userId, userName });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') {
      await deleteUser(confirmAction.userId);
    } else if (confirmAction.type === 'reset') {
      setIsResetting(confirmAction.userId);
      const password = await resetPassword(confirmAction.userId);
      if (password) {
        openPasswordModal(password);
      }
      setIsResetting(null);
    }
    setConfirmAction(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data: CreateUserDTO = {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string || undefined,
      role: 'USER',
    };
    const result = await createUser(data);
    if (result?.motDePasseGenere) {
      openPasswordModal(result.motDePasseGenere);
    }
    setIsSubmitting(false);
    closeCreateSheet();
    e.currentTarget.reset();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await updateUser(editingUser.id, {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      telephone: formData.get('telephone') as string || undefined,
      role: formData.get('role') as 'ADMIN' | 'USER',
    });
    setIsSubmitting(false);
    closeEditSheet();
  };

  const handleToggleActif = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateUser(user.id, { actif: !user.actif });
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreateSheet}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          <Plus size={18} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Grille des utilisateurs */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <UserIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
              onClick={() => openEditSheet(user)}
            >
              {/* En-tête avec avatar */}
              <div className="p-5 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-linear-to-br from-blue-100 to-blue-200 rounded-full">
                      <UserIcon size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {user.prenom} {user.nom}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          user.actif
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.actif ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {user.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Tooltip text="Réinitialiser le mot de passe">
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmReset(user.id, `${user.prenom} ${user.nom}`); }}
                        disabled={isResetting === user.id}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        {isResetting === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        ) : (
                          <Key size={14} />
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip text="Supprimer">
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(user.id, `${user.prenom} ${user.nom}`); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Infos utilisateur */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <span className="text-gray-600 truncate">{user.email}</span>
                </div>
                {user.telephone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span className="text-gray-600">{user.telephone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <span className="text-gray-500 text-xs">
                    Dernière connexion: {formatDate(user.derniereConnexion)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
             
                <Tooltip text={user.actif ? 'Désactiver' : 'Activer'}>
                  <button
                    onClick={(e) => handleToggleActif(user, e)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition ${
                      user.actif
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-red-600 hover:bg-red-50'
                    } cursor-pointer`}
                  >
                    {user.actif ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {user.actif ? 'Actif' : 'Inactif'}
                  </button>
                </Tooltip>
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
              <h2 className="text-lg font-semibold text-gray-900">Nouvel utilisateur</h2>
              <button
                onClick={closeCreateSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  name="nom"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  name="prenom"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  name="telephone"
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
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Création...
                    </>
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sheet latérale - Modification */}
      {editingUser && (
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
              <h2 className="text-lg font-semibold text-gray-900">Modifier utilisateur</h2>
              <button
                onClick={closeEditSheet}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  name="nom"
                  defaultValue={editingUser.nom}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  name="prenom"
                  defaultValue={editingUser.prenom}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingUser.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  name="telephone"
                  defaultValue={editingUser.telephone || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  name="role"
                  defaultValue={editingUser.role}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {confirmAction.type === 'delete' ? 'Désactiver l\'utilisateur' : 'Réinitialiser le mot de passe'}
              </h2>
              <p className="text-gray-500 mb-4">
                {confirmAction.type === 'delete' 
                  ? `Êtes-vous sûr de vouloir désactiver ${confirmAction.userName} ? L'utilisateur ne pourra plus se connecter.`
                  : `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${confirmAction.userName} ? Un nouveau mot de passe temporaire sera généré.`}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition cursor-pointer ${
                    confirmAction.type === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouveau mot de passe */}
      {newPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              modalAnimation === 'enter' ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={closePasswordModal}
          />
          <div 
            className={`relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl transition-all duration-300 ${
              modalAnimation === 'enter' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={24} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe généré</h2>
              <p className="text-gray-500 mb-4">Voici le mot de passe temporaire :</p>
              <div className="bg-gray-100 p-3 rounded-lg text-center font-mono text-lg break-all">
                {newPassword}
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Ce mot de passe ne sera plus affiché. L&apos;utilisateur devra le changer à la prochaine connexion.
              </p>
              <button
                onClick={closePasswordModal}
                className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}