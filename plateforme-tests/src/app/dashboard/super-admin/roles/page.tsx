"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { Modal } from "@/components/Modal";
import { RoleManagementModal } from "@/components/super-admin/RoleManagementModal";
import type { RoleDefinition, CreateRolePayload, UpdateRolePayload, Permission } from "@/features/roles/types";
import { 
  getRolesApi, 
  createRoleApi, 
  updateRoleApi,
  getPermissionsApi,
  assignPermissionsToRoleApi 
} from "@/features/roles/api";

export default function RolesPage() {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [detailsRole, setDetailsRole] = useState<RoleDefinition | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        getRolesApi(),
        getPermissionsApi(),
      ]);
      setRoles(rolesData);
      setAllPermissions(permissionsData);
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
    { href: `${ROUTES.SUPER_ADMIN}/projects`, icon: "view_kanban", label: "Projets" },
    { href: `${ROUTES.SUPER_ADMIN}/logs`, icon: "terminal", label: "Logs" },
    { href: `${ROUTES.SUPER_ADMIN}/profile`, icon: "account_circle", label: "Mon Profil" },
    { href: `${ROUTES.SUPER_ADMIN}/settings`, icon: "settings", label: "Paramètres" },
  ];

  const handleRoleSubmit = async (roleData: any) => {
    try {
      const { nom, code, description, niveau_acces, permission_ids } = roleData;

      if (selectedRole) {
        // Mode modification - utiliser PUT
        const updatePayload: UpdateRolePayload = {
          nom,
          description: description || undefined,
          niveau_acces,
        };
        
        await updateRoleApi(selectedRole.id, updatePayload);
        
        // Assigner les permissions au rôle
        if (permission_ids && permission_ids.length > 0) {
          await assignPermissionsToRoleApi(selectedRole.id, {
            permission_ids,
          });
        }
        
        alert("Rôle modifié avec succès");
      } else {
        // Mode création - utiliser POST
        const createPayload: CreateRolePayload = {
          nom,
          code,
          description: description || undefined,
          niveau_acces,
        };
        
        const newRole = await createRoleApi(createPayload);
        
        // Assigner les permissions au nouveau rôle
        if (permission_ids && permission_ids.length > 0) {
          await assignPermissionsToRoleApi(newRole.id, {
            permission_ids,
          });
        }
        
        alert("Rôle créé avec succès");
      }
      
      // Recharger les données
      await loadData();
      setIsRoleModalOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      console.error("Failed to save role:", error);
      const errorMessage = error.response?.data?.detail || "Erreur lors de la sauvegarde du rôle";
      alert(errorMessage);
    }
  };

  const handleViewDetails = (role: RoleDefinition) => {
    setDetailsRole(role);
    setIsDetailsModalOpen(true);
  };

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
          title="Gestion des Rôles et Permissions"
          subtitle="Définir les rôles et leurs permissions associées"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[#283039] flex items-center justify-between">
            <h3 className="text-white text-lg font-bold">Liste des Rôles</h3>
            <button
              onClick={() => {
                setSelectedRole(null);
                setIsRoleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Créer un Rôle
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {isLoading ? (
              <div className="col-span-full text-center text-[#9dabb9] py-8">
                Chargement des rôles...
              </div>
            ) : roles.length === 0 ? (
              <div className="col-span-full text-center text-[#9dabb9] py-8">
                Aucun rôle trouvé
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">
                        shield
                      </span>
                      <h4 className="text-white font-bold text-sm">
                        {role.nom ? role.nom.replace("_", " ") : role.code.replace("_", " ")}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setIsRoleModalOpen(true);
                        }}
                        className="text-[#9dabb9] hover:text-primary transition-colors"
                        title="Modifier"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[#9dabb9] text-xs mb-4">
                    {role.description || "Aucune description"}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9dabb9]">
                      <span className="font-bold text-white">
                        {role.permissions?.length || 0}
                      </span>{" "}
                      permissions
                    </span>
                    <button
                      onClick={() => handleViewDetails(role)}
                      className="text-primary hover:underline"
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Role Management Modal */}
      <RoleManagementModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSubmit={handleRoleSubmit}
        role={selectedRole}
        allPermissions={allPermissions}
      />

      {/* Role Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Détails du rôle : ${detailsRole?.nom || ""}`}
        size="lg"
      >
        {detailsRole && (
          <div className="space-y-6">
            {/* Role Info */}
            <div className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Nom du rôle</p>
                  <p className="text-white font-semibold">
                    {detailsRole.nom || detailsRole.code}
                  </p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Code</p>
                  <p className="text-white font-mono text-sm">
                    {detailsRole.code}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#9dabb9] text-sm mb-1">Description</p>
                  <p className="text-white">
                    {detailsRole.description || "Aucune description"}
                  </p>
                </div>
                <div>
                  <p className="text-[#9dabb9] text-sm mb-1">Niveau d'accès</p>
                  <p className="text-white font-semibold">
                    {detailsRole.niveau_acces}
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  security
                </span>
                Permissions ({detailsRole.permissions?.length || 0})
              </h3>
              
              {detailsRole.permissions && detailsRole.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detailsRole.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="bg-[#1e293b] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                          check_circle
                        </span>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm mb-1">
                            {permission.nom}
                          </h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[#9dabb9]">
                              Action:
                            </span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-mono">
                              {permission.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-[#9dabb9]">
                              Ressource:
                            </span>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded font-mono">
                              {permission.resource}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#9dabb9]">
                  Aucune permission assignée à ce rôle
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
