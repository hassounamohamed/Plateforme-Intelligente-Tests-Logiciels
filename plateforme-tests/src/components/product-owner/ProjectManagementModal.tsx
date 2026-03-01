"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Project, CreateProjectPayload, UpdateProjectPayload } from "@/types";

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
  project?: Project | null;
  mode: "create" | "edit";
}

export default function ProjectManagementModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  mode,
}: ProjectManagementModalProps) {
  const [formData, setFormData] = useState<CreateProjectPayload>({
    nom: "",
    description: "",
    dateDebut: "",
    dateFin: "",
    objectif: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && project) {
      setFormData({
        nom: project.nom,
        description: project.description || "",
        dateDebut: project.dateDebut ? project.dateDebut.split("T")[0] : "",
        dateFin: project.dateFin ? project.dateFin.split("T")[0] : "",
        objectif: project.objectif || "",
      });
    } else if (mode === "create") {
      setFormData({
        nom: "",
        description: "",
        dateDebut: "",
        dateFin: "",
        objectif: "",
      });
    }
    setError(null);
  }, [project, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: CreateProjectPayload | UpdateProjectPayload = {
        nom: formData.nom,
        description: formData.description || undefined,
        dateDebut: formData.dateDebut || undefined,
        dateFin: formData.dateFin || undefined,
        objectif: formData.objectif || undefined,
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
      title={mode === "create" ? "Créer un Projet" : "Modifier le Projet"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Nom du projet
          </label>
          <Input
            type="text"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
            placeholder="Ex: Refonte du système de paiement"
          />
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
            placeholder="Décrivez les objectifs et le contexte du projet..."
            rows={4}
            className="w-full px-3 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Date de début
            </label>
            <Input
              type="date"
              value={formData.dateDebut}
              onChange={(e) =>
                setFormData({ ...formData, dateDebut: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Date de fin
            </label>
            <Input
              type="date"
              value={formData.dateFin}
              onChange={(e) =>
                setFormData({ ...formData, dateFin: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Objectif principal
          </label>
          <Input
            type="text"
            value={formData.objectif}
            onChange={(e) =>
              setFormData({ ...formData, objectif: e.target.value })
            }
            placeholder="Ex: Augmenter le taux de conversion de 15%"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#9dabb9] hover:bg-[#283039] rounded-lg transition-colors"
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
