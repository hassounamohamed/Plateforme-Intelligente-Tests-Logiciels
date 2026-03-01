"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Epic, CreateEpicPayload, UpdateEpicPayload, EpicStatus } from "@/types";

interface EpicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEpicPayload | UpdateEpicPayload) => Promise<void>;
  epic?: Epic | null;
  mode: "create" | "edit";
}

export default function EpicModal({
  isOpen,
  onClose,
  onSubmit,
  epic,
  mode,
}: EpicModalProps) {
  const [formData, setFormData] = useState<CreateEpicPayload>({
    titre: "",
    description: "",
    priorite: 0,
    businessValue: "",
    statut: "to_do",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && epic) {
      setFormData({
        titre: epic.titre,
        description: epic.description || "",
        priorite: epic.priorite,
        businessValue: epic.businessValue || "",
        statut: epic.statut,
      });
    } else if (mode === "create") {
      setFormData({
        titre: "",
        description: "",
        priorite: 0,
        businessValue: "",
        statut: "to_do",
      });
    }
    setError(null);
  }, [epic, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: CreateEpicPayload | UpdateEpicPayload = {
        titre: formData.titre,
        description: formData.description || undefined,
        priorite: formData.priorite,
        businessValue: formData.businessValue || undefined,
        ...(mode === "create" && { statut: formData.statut }),
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
      title={mode === "create" ? "Créer un Epic" : "Modifier l'Epic"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Titre de l'epic"
          type="text"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          required
          placeholder="Ex: Migration vers l'authentification OAuth2"
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
            placeholder="Décrivez l'epic en détail..."
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-[#1e252d] border border-gray-300 dark:border-[#29323d] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Priorité"
              type="number"
              value={formData.priorite}
              onChange={(e) =>
                setFormData({ ...formData, priorite: parseInt(e.target.value) || 0 })
              }
              min={0}
              placeholder="0"
            />
            <p className="text-xs text-text-secondary mt-1">Plus élevé = plus prioritaire</p>
          </div>

          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) =>
                  setFormData({ ...formData, statut: e.target.value as EpicStatus })
                }
                className="w-full px-3 py-2 bg-white dark:bg-[#1e252d] border border-gray-300 dark:border-[#29323d] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
        </div>

        <Input
          label="Valeur métier"
          type="text"
          value={formData.businessValue}
          onChange={(e) =>
            setFormData({ ...formData, businessValue: e.target.value })
          }
          placeholder="Ex: Réduction du temps de connexion de 50%"
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
