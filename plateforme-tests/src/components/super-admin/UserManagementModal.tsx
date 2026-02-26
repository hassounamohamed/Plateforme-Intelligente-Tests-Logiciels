"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { User, Role } from "@/types";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (userData: any) => void;  // Flexible pour accepter les données du formulaire
}

export function UserManagementModal({
  isOpen,
  onClose,
  user,
  onSubmit,
}: UserManagementModalProps) {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    nom: user?.nom || "",
    role: (user?.role?.code || "DEVELOPPEUR") as Role,
    password: "",
    actif: user?.actif ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const roles: Role[] = ["SUPER_ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER", "DEVELOPPEUR", "TESTEUR_QA"];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? "Modifier l'utilisateur" : "Créer un utilisateur"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Nom complet
          </label>
          <Input
            type="text"
            value={formData.nom}
            onChange={(e) =>
              setFormData({ ...formData, nom: e.target.value })
            }
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john.doe@example.com"
            required
          />
        </div>

        {!user && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Mot de passe
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              required={!user}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Rôle
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as Role })
            }
            className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="actif"
            checked={formData.actif}
            onChange={(e) =>
              setFormData({ ...formData, actif: e.target.checked })
            }
            className="w-4 h-4 text-primary bg-[#1e293b] border-[#3b4754] rounded focus:ring-primary"
          />
          <label htmlFor="actif" className="text-sm text-white">
            Compte actif
          </label>
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
            {user ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
