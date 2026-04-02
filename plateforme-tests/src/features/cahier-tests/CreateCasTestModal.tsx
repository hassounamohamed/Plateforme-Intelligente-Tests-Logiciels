"use client";

import React, { useState } from "react";
import { CreateCasTestPayload, TypeTest } from "@/types";
import { createCasTest } from "./api";

interface CreateCasTestModalProps {
  projectId: number;
  cahierId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialState: CreateCasTestPayload = {
  test_case: "",
  sprint: "",
  module: "",
  sous_module: "",
  test_purpose: "",
  type_utilisateur: "",
  scenario_test: "",
  resultat_attendu: "",
  type_test: "Manuel",
  commentaire: "",
};

export default function CreateCasTestModal({
  projectId,
  cahierId,
  isOpen,
  onClose,
  onSuccess,
}: CreateCasTestModalProps) {
  const [formData, setFormData] = useState<CreateCasTestPayload>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof CreateCasTestPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setFormData(initialState);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.test_case?.trim()) {
      setError("Le champ 'Cas de Test' est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      await createCasTest(projectId, cahierId, {
        ...formData,
        test_case: formData.test_case.trim(),
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la création du cas de test");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-dark rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#3b4754]">
        <div className="sticky top-0 bg-surface-dark border-b border-[#3b4754] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Nouveau cas de test
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#9dabb9] hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Sprint</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
                value={formData.sprint || ""}
                onChange={(e) => updateField("sprint", e.target.value)}
                placeholder="Ex: Sprint 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Module</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
                value={formData.module || ""}
                onChange={(e) => updateField("module", e.target.value)}
                placeholder="Ex: Authentification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Sous-module</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
                value={formData.sous_module || ""}
                onChange={(e) => updateField("sous_module", e.target.value)}
                placeholder="Ex: Connexion"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Cas de Test *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
              value={formData.test_case}
              onChange={(e) => updateField("test_case", e.target.value)}
              placeholder="Ex: Connexion avec identifiants valides"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Objectif du test</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
              value={formData.test_purpose || ""}
              onChange={(e) => updateField("test_purpose", e.target.value)}
              placeholder="Ex: Vérifier que l'utilisateur peut se connecter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Scénario de test</label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
              value={formData.scenario_test || ""}
              onChange={(e) => updateField("scenario_test", e.target.value)}
              placeholder="1. Ouvrir la page..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Résultat attendu</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
              value={formData.resultat_attendu || ""}
              onChange={(e) => updateField("resultat_attendu", e.target.value)}
              placeholder="Le système affiche..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Type utilisateur</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
                value={formData.type_utilisateur || ""}
                onChange={(e) => updateField("type_utilisateur", e.target.value)}
                placeholder="Ex: QA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Type de test</label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
                value={formData.type_test || "Manuel"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type_test: e.target.value as TypeTest,
                  }))
                }
              >
                <option value="Manuel">Manuel</option>
                <option value="Automatisé">Automatisé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Commentaire</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
                value={formData.commentaire || ""}
                onChange={(e) => updateField("commentaire", e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer le cas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
