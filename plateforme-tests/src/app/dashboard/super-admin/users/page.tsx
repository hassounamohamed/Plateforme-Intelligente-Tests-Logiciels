"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES, ROLES } from "@/lib/constants";
import { UserManagementModal } from "@/components/super-admin/UserManagementModal";
import type { User } from "@/types";
import type { RoleDefinition } from "@/features/roles/types";
import { useAuthStore } from "@/features/auth/store";
import { 
  getUsersApi, 
  createUserApi, 
  updateUserApi, 
  activateUserApi, 
  deactivateUserApi, 
  deleteUserApi 
} from "@/features/users/api";
import { getRolesApi } from "@/features/roles/api";

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role?.code === ROLES.SUPER_ADMIN;

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        getUsersApi(),
        getRolesApi(),
      ]);
      setUsers(usersData);
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
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.")) {
      try {
        await deleteUserApi(userId);
        await loadData();
        alert("Utilisateur supprimé avec succès");
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("Erreur lors de la suppression de l'utilisateur");
      }
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
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
  });

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Super Admin"
          subtitle="Agile & QA Platform"
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
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#283039] flex items-center justify-between">
            <h3 className="text-white text-lg font-bold">Liste des Utilisateurs</h3>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b]/50 border-b border-[#283039]">
                  <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                    Dernière Connexion
                  </th>
                  <th className="p-4 text-[#9dabb9] text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#9dabb9]">
                      Chargement des données...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#9dabb9]">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#9dabb9]">
                      Aucun utilisateur ne correspond à la recherche
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#283039] hover:bg-[#283039]/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/20 rounded-full h-9 w-9 flex items-center justify-center text-primary font-bold text-sm">
                            {user.nom?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">
                              {user.nom}
                            </span>
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
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.actif ? "bg-[#0bda5b]" : "bg-gray-500"
                            }`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${
                              user.actif
                                ? "text-[#0bda5b]"
                                : "text-gray-400"
                            }`}
                          >
                            {user.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[#9dabb9] text-sm">
                          {user.derniereConnexion 
                            ? new Date(user.derniereConnexion).toLocaleDateString('fr-FR')
                            : "Jamais connecté"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-[#9dabb9] hover:text-primary transition-colors"
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className="text-[#9dabb9] hover:text-yellow-400 transition-colors"
                            title={user.actif ? "Désactiver" : "Activer"}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {user.actif ? "block" : "check_circle"}
                            </span>
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-[#9dabb9] hover:text-red-400 transition-colors"
                              title="Supprimer définitivement"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
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

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserSubmit}
        user={selectedUser}
      />
    </DashboardLayout>
  );
}
