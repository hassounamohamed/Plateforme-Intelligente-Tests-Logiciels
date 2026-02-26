"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { RoleDefinition, Permission } from "@/features/roles/types";

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleDefinition | null;
  allPermissions: Permission[];
  onSubmit: (roleData: any) => void;
}

export function RoleManagementModal({
  isOpen,
  onClose,
  role,
  allPermissions,
  onSubmit,
}: RoleManagementModalProps) {
  const [formData, setFormData] = useState({
    nom: role?.nom || "",
    code: role?.code || "",
    description: role?.description || "",
    niveau_acces: role?.niveau_acces || 1,
  });

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(
    new Set(role?.permissions.map((p) => p.id) || [])
  );

  // Réinitialiser le formulaire quand le modal s'ouvre avec un nouveau rôle
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nom: role?.nom || "",
        code: role?.code || "",
        description: role?.description || "",
        niveau_acces: role?.niveau_acces || 1,
      });
      setSelectedPermissionIds(
        new Set(role?.permissions.map((p) => p.id) || [])
      );
    }
  }, [isOpen, role]);

  const handlePermissionToggle = (permissionId: number) => {
    const newPermissions = new Set(selectedPermissionIds);
    
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }

    setSelectedPermissionIds(newPermissions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      ...formData,
      permission_ids: Array.from(selectedPermissionIds),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={role ? "Modifier le rôle" : "Créer un rôle"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Nom du rôle
          </label>
          <Input
            type="text"
            value={formData.nom}
            onChange={(e) =>
              setFormData({ ...formData, nom: e.target.value })
            }
            placeholder="Super Administrateur"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Code du rôle
          </label>
          <Input
            type="text"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="SUPER_ADMIN"
            disabled={!!role}
            required
          />
          {role && (
            <p className="text-xs text-[#9dabb9] mt-1">
              Le code ne peut pas être modifié
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Niveau d'accès
          </label>
          <Input
            type="number"
            min="1"
            max="100"
            value={formData.niveau_acces}
            onChange={(e) =>
              setFormData({ ...formData, niveau_acces: parseInt(e.target.value) })
            }
            placeholder="1"
            required
          />
          <p className="text-xs text-[#9dabb9] mt-1">
            Plus le niveau est élevé, plus les privilèges sont importants
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description du rôle..."
            rows={3}
            className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Permissions ({selectedPermissionIds.size} sélectionnées)
          </label>
          <div className="space-y-4 bg-[#1e293b] border border-[#3b4754] rounded-lg p-4 max-h-80 overflow-y-auto">
            {allPermissions.length === 0 ? (
              <p className="text-[#9dabb9] text-sm text-center py-4">
                Aucune permission disponible
              </p>
            ) : (
              // Grouper les permissions par ressource
              Object.entries(
                allPermissions.reduce((acc, permission) => {
                  if (!acc[permission.resource]) {
                    acc[permission.resource] = [];
                  }
                  acc[permission.resource].push(permission);
                  return acc;
                }, {} as Record<string, Permission[]>)
              ).map(([resource, permissions]) => (
                <div key={resource} className="border-b border-[#3b4754] pb-3 last:border-b-0">
                  <h4 className="text-white font-semibold mb-2 capitalize flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      folder
                    </span>
                    {resource}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 text-sm text-[#9dabb9] hover:text-white cursor-pointer"
                        title={permission.description || permission.nom}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.has(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="w-4 h-4 text-primary bg-[#283039] border-[#3b4754] rounded focus:ring-primary"
                        />
                        <span className="capitalize">{permission.action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#283039] hover:bg-[#3b4754] text-white"
          >
            Annuler
          </Button>
          <Button type="submit" className="bg-primary hover:bg-blue-600 text-white">
            {role ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
