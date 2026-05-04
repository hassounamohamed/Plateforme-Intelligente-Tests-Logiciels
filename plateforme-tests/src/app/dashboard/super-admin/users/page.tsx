"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES, ROLES } from "@/lib/constants";
import { Modal } from "@/components/Modal";
import { UserManagementModal } from "@/components/super-admin/UserManagementModal";
import type { Project, User } from "@/types";
import type { RoleDefinition } from "@/features/roles/types";
import { useAuthStore } from "@/features/auth/store";
import { 
  getUsersApi, 
  getPendingUsersApi,
  createUserApi, 
  updateUserApi, 
  activateUserApi, 
  deactivateUserApi, 
  deleteUserApi 
} from "@/features/users/api";
import { getUserProjects } from "@/features/projects/api";
import { getRolesApi } from "@/features/roles/api";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const confirmDialog = useConfirmDialog();
  const isSuperAdmin = currentUser?.role?.code === ROLES.SUPER_ADMIN;

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [detailsProjects, setDetailsProjects] = useState<Project[]>([]);
  const [isDetailsProjectsLoading, setIsDetailsProjectsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, pendingUsersData, rolesData] = await Promise.all([
        getUsersApi(),
        getPendingUsersApi(),
        getRolesApi(),
      ]);
      setUsers(usersData);
      setPendingUsers(pendingUsersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.SUPER_ADMIN, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SUPER_ADMIN}/users`, icon: "group", label: "Utilisateurs" },
    { href: `${ROUTES.SUPER_ADMIN}/roles`, icon: "shield", label: "Rôles" },
    { href: `${ROUTES.SUPER_ADMIN}/logs`, icon: "terminal", label: "Logs" },
    { href: `${ROUTES.SUPER_ADMIN}/profile`, icon: "account_circle", label: "Mon Profil" },
    { href: `${ROUTES.SUPER_ADMIN}/settings`, icon: "settings", label: "Paramètres" },
  ];

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    const confirmed = await confirmDialog({
      title: "Supprimer l'utilisateur",
      description:
        "Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      confirmVariant: "destructive",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteUserApi(userId);
      await loadData();
      alert("Utilisateur supprimé avec succès");
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const handleUserSubmit = async (userData: any) => {
    try {
      if (selectedUser) {
        const { nom, email, role, actif } = userData;
        const roleId = typeof role === 'string' ? 
          roles.find(r => r.code === role)?.id : 
          role;

        await updateUserApi(selectedUser.id, {
          nom,
          actif,
          role_id: roleId,
        });
        alert("Utilisateur modifié avec succès");
      } else {
        const { nom, email, password, role, telephone } = userData;
        const roleId = typeof role === 'string' ? 
          roles.find(r => r.code === role)?.id || 2 : 
          role || 2;

        await createUserApi({
          nom,
          email,
          motDePasse: password,
          telephone,
          role_id: roleId,
        });
        alert("Utilisateur créé avec succès");
      }
      await loadData();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      alert(error?.response?.data?.detail || "Erreur lors de la sauvegarde de l'utilisateur");
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      if (user.actif) {
        await deactivateUserApi(user.id);
      } else {
        await activateUserApi(user.id);
      }
      await loadData();
      alert(`Utilisateur ${user.actif ? 'désactivé' : 'activé'} avec succès`);
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  const handleViewDetails = (user: User) => {
    setDetailsUser(user);
    setDetailsProjects([]);
    setIsDetailsModalOpen(true);
    setIsDetailsProjectsLoading(true);

    getUserProjects(user.id)
      .then((projectsData) => {
        setDetailsProjects(projectsData);
      })
      .catch((error) => {
        console.error("Failed to load user projects:", error);
        setDetailsProjects([]);
      })
      .finally(() => {
        setIsDetailsProjectsLoading(false);
      });
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const userMatchesSearch = (user: User) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    const searchableValues = [
      user.nom,
      user.email,
      user.role?.nom,
      user.role?.code,
      user.actif ? "actif" : "inactif",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableValues.includes(normalizedSearchTerm);
  };

  const activeUsers = users.filter((user) => user.actif);
  const filteredPendingUsers = pendingUsers.filter(userMatchesSearch);
  const filteredActiveUsers = activeUsers.filter(userMatchesSearch);

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Super Admin"
          subtitle="FlowPilot Platform"
          icon="admin_panel_settings"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Gestion des Utilisateurs"
          subtitle="Créer, modifier et gérer les comptes utilisateurs"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h3 className="text-white text-lg font-bold">Gestion des Utilisateurs</h3>
            <div className="flex items-center gap-3">
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-[#1e293b] border border-[#3b4754] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleCreateUser}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Créer
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#283039]">
              <h3 className="text-white text-lg font-bold">Utilisateurs inactifs en attente d'activation</h3>
              <p className="text-[#9dabb9] text-sm mt-1">Comptes à valider par le Super Admin</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e293b]/50 border-b border-[#283039]">
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Utilisateur</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Rôle</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Statut</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Dernière Connexion</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#9dabb9]">Chargement des données...</td>
                    </tr>
                  ) : filteredPendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#9dabb9]">
                        {pendingUsers.length === 0 ? "Aucun utilisateur en attente d'activation" : "Aucun utilisateur inactif ne correspond à la recherche"}
                      </td>
                    </tr>
                  ) : (
                    filteredPendingUsers.map((user) => (
                      <tr key={user.id} className="border-b border-[#283039] hover:bg-[#283039]/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/20 rounded-full h-9 w-9 flex items-center justify-center text-primary font-bold text-sm">
                              {user.nom?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-sm font-medium">{user.nom}</span>
                              <span className="text-[#9dabb9] text-xs">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                            {user.role?.code?.replace("_", " ") || "N/A"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            <span className="text-sm font-medium text-gray-400">Inactif</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[#9dabb9] text-sm">
                            {user.derniereConnexion
                              ? new Date(user.derniereConnexion).toLocaleDateString("fr-FR")
                              : "Jamais connecté"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="text-[#9dabb9] hover:text-primary transition-colors"
                              title="Voir détails"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-[#9dabb9] hover:text-primary transition-colors"
                              title="Modifier"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className="text-[#9dabb9] hover:text-[#0bda5b] transition-colors"
                              title="Activer"
                            >
                              <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-[#9dabb9] hover:text-red-400 transition-colors"
                                title="Supprimer définitivement"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#283039]">
              <h3 className="text-white text-lg font-bold">Utilisateurs actifs</h3>
              <p className="text-[#9dabb9] text-sm mt-1">Comptes actuellement actifs sur la plateforme</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e293b]/50 border-b border-[#283039]">
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Utilisateur</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Rôle</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Statut</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Dernière Connexion</th>
                    <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#9dabb9]">Chargement des données...</td>
                    </tr>
                  ) : filteredActiveUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#9dabb9]">
                        {activeUsers.length === 0 ? "Aucun utilisateur actif" : "Aucun utilisateur actif ne correspond à la recherche"}
                      </td>
                    </tr>
                  ) : (
                    filteredActiveUsers.map((user) => (
                      <tr key={user.id} className="border-b border-[#283039] hover:bg-[#283039]/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/20 rounded-full h-9 w-9 flex items-center justify-center text-primary font-bold text-sm">
                              {user.nom?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-sm font-medium">{user.nom}</span>
                              <span className="text-[#9dabb9] text-xs">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                            {user.role?.code?.replace("_", " ") || "N/A"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#0bda5b]"></div>
                            <span className="text-sm font-medium text-[#0bda5b]">Actif</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[#9dabb9] text-sm">
                            {user.derniereConnexion
                              ? new Date(user.derniereConnexion).toLocaleDateString("fr-FR")
                              : "Jamais connecté"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="text-[#9dabb9] hover:text-primary transition-colors"
                              title="Voir détails"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-[#9dabb9] hover:text-primary transition-colors"
                              title="Modifier"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className="text-[#9dabb9] hover:text-yellow-400 transition-colors"
                              title="Désactiver"
                            >
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-[#9dabb9] hover:text-red-400 transition-colors"
                                title="Supprimer définitivement"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserSubmit}
        user={selectedUser}
      />

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Détails utilisateur : ${detailsUser?.nom || ""}`}
        size="lg"
      >
        {detailsUser && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Nom</p>
                  <p className="text-white font-semibold">{detailsUser.nom}</p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Email</p>
                  <p className="text-white">{detailsUser.email}</p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Rôle</p>
                  <p className="text-white">{detailsUser.role?.code?.replace("_", " ") || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Statut</p>
                  <p className={detailsUser.actif ? "text-[#0bda5b] font-semibold" : "text-gray-400 font-semibold"}>
                    {detailsUser.actif ? "Actif" : "Inactif"}
                  </p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Téléphone</p>
                  <p className="text-white">{detailsUser.telephone || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Dernière connexion</p>
                  <p className="text-white">
                    {detailsUser.derniereConnexion
                      ? new Date(detailsUser.derniereConnexion).toLocaleString("fr-FR")
                      : "Jamais connecté"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-lg mb-3">Projets assignés</h4>
              {isDetailsProjectsLoading ? (
                <div className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-4 text-[#9dabb9] text-sm">
                  Chargement des projets assignés...
                </div>
              ) : detailsProjects.length === 0 ? (
                <div className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-4 text-[#9dabb9] text-sm">
                  Aucun projet assigné à cet utilisateur.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detailsProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-4"
                    >
                      <p className="text-white font-semibold">{project.nom}</p>
                      <p className="text-[#9dabb9] text-xs mt-1 line-clamp-2">
                        {project.description || "Aucune description"}
                      </p>
                      <div className="mt-3">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                          {project.statut}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
