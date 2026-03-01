"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Module, CreateModulePayload, UpdateModulePayload } from "@/types";

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateModulePayload | UpdateModulePayload) => Promise<void>;
  module?: Module | null;
  mode: "create" | "edit";
}

export default function ModuleModal({
  isOpen,
  onClose,
  onSubmit,
  module,
  mode,
}: ModuleModalProps) {
  const [formData, setFormData] = useState<CreateModulePayload>({
    nom: "",
    description: "",
    ordre: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && module) {
      setFormData({
        nom: module.nom,
        description: module.description || "",
        ordre: module.ordre,
      });
    } else if (mode === "create") {
      setFormData({
        nom: "",
        description: "",
        ordre: 0,
      });
    }
    setError(null);
  }, [module, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: CreateModulePayload | UpdateModulePayload = {
        nom: formData.nom,
        description: formData.description || undefined,
        ordre: formData.ordre,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Créer un Module" : "Modifier le Module"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nom du module"
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          required
          placeholder="Ex: Authentification & Sécurité"
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Décrivez le périmètre et les fonctionnalités du module..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-[#1e252d] border border-gray-300 dark:border-[#29323d] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <Input
          label="Ordre d'affichage"
          type="number"
          value={formData.ordre}
          onChange={(e) =>
            setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })
          }
          min={0}
          placeholder="0"
        />

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#29323d] rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Enregistrement..."
              : mode === "create"
              ? "Créer"
              : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
