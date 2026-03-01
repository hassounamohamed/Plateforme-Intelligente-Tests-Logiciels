"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Project, CreateProjectPayload, UpdateProjectPayload } from "@/types";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
  project?: Project | null;
  mode: "create" | "edit";
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  mode,
}: ProjectModalProps) {
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

        <Input
          label="Nom du projet"
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          required
          placeholder="Ex: Refonte du système de paiement"
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
            placeholder="Décrivez les objectifs et le contexte du projet..."
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-[#1e252d] border border-gray-300 dark:border-[#29323d] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de début"
            type="date"
            value={formData.dateDebut}
            onChange={(e) =>
              setFormData({ ...formData, dateDebut: e.target.value })
            }
          />

          <Input
            label="Date de fin"
            type="date"
            value={formData.dateFin}
            onChange={(e) =>
              setFormData({ ...formData, dateFin: e.target.value })
            }
          />
        </div>

        <Input
          label="Objectif principal"
          type="text"
          value={formData.objectif}
          onChange={(e) =>
            setFormData({ ...formData, objectif: e.target.value })
          }
          placeholder="Ex: Augmenter le taux de conversion de 15%"
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
