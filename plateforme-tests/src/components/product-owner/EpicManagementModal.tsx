"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Epic, CreateEpicPayload, UpdateEpicPayload, EpicStatus } from "@/types";

interface EpicManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEpicPayload | UpdateEpicPayload) => Promise<void>;
  epic?: Epic | null;
  mode: "create" | "edit";
}

export default function EpicManagementModal({
  isOpen,
  onClose,
  onSubmit,
  epic,
  mode,
}: EpicManagementModalProps) {
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

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Titre de l&apos;epic
          </label>
          <Input
            type="text"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            required
            placeholder="Ex: Migration vers l'authentification OAuth2"
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
            placeholder="Décrivez l'epic en détail..."
            rows={4}
            className="w-full px-3 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Priorité
            </label>
            <Input
              type="number"
              value={formData.priorite}
              onChange={(e) =>
                setFormData({ ...formData, priorite: parseInt(e.target.value) || 0 })
              }
              min={0}
              placeholder="0"
            />
            <p className="text-xs text-[#9dabb9] mt-1">Plus élevé = plus prioritaire</p>
          </div>

          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) =>
                  setFormData({ ...formData, statut: e.target.value as EpicStatus })
                }
                className="w-full px-3 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Valeur métier
          </label>
          <Input
            type="text"
            value={formData.businessValue}
            onChange={(e) =>
              setFormData({ ...formData, businessValue: e.target.value })
            }
            placeholder="Ex: Réduction du temps de connexion de 50%"
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
