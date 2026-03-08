"use client";

import React, { useState } from "react";
import { CasTest, StatutTest, TypeTest, UpdateCasTestPayload } from "@/types";
import { updateCasTest } from "./api";

interface EditCasTestModalProps {
  projectId: number;
  cahierId: number;
  casTest: CasTest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCasTestModal({
  projectId,
  cahierId,
  casTest,
  isOpen,
  onClose,
  onSuccess,
}: EditCasTestModalProps) {
  const [formData, setFormData] = useState<UpdateCasTestPayload>({
    test_case: casTest.test_case,
    scenario_test: casTest.scenario_test || "",
    resultat_attendu: casTest.resultat_attendu || "",
    resultat_obtenu: casTest.resultat_obtenu || "",
    fail_logs: casTest.fail_logs || "",
    type_test: casTest.type_test,
    statut_test: casTest.statut_test,
    commentaire: casTest.commentaire || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateCasTest(projectId, cahierId, casTest.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-dark rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#3b4754]">
        <div className="sticky top-0 bg-surface-dark border-b border-[#3b4754] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Modifier le Test - {casTest.test_ref}
          </h2>
          <button
            onClick={onClose}
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

          {/* Informations générales (non modifiables) */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#283039] rounded">
            <div>
              <p className="text-xs text-[#9dabb9]">Sprint</p>
              <p className="font-medium text-white">{casTest.sprint || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9dabb9]">Module</p>
              <p className="font-medium text-white">{casTest.module || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9dabb9]">Sous-module</p>
              <p className="font-medium text-white">{casTest.sous_module || "N/A"}</p>
            </div>
          </div>

          {/* Test Case */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Cas de Test
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.test_case}
              onChange={(e) =>
                setFormData({ ...formData, test_case: e.target.value })
              }
            />
          </div>

          {/* Scénario */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Scénario de Test
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.scenario_test}
              onChange={(e) =>
                setFormData({ ...formData, scenario_test: e.target.value })
              }
            />
          </div>

          {/* Résultat Attendu */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Résultat Attendu
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.resultat_attendu}
              onChange={(e) =>
                setFormData({ ...formData, resultat_attendu: e.target.value })
              }
            />
          </div>

          {/* Résultat Obtenu */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Résultat Obtenu (après exécution)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.resultat_obtenu}
              onChange={(e) =>
                setFormData({ ...formData, resultat_obtenu: e.target.value })
              }
              placeholder="Décrivez le résultat après l'exécution du test"
            />
          </div>

          {/* Logs d'Erreur */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Logs d'Erreur
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              value={formData.fail_logs}
              onChange={(e) =>
                setFormData({ ...formData, fail_logs: e.target.value })
              }
              placeholder="Collez les logs d'erreur si le test a échoué"
            />
          </div>

          {/* Type & Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Type de Test
              </label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.type_test}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type_test: e.target.value as TypeTest,
                  })
                }
              >
                <option value="Manuel">Manuel</option>
                <option value="Automatisé">Automatisé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Statut
              </label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={formData.statut_test}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statut_test: e.target.value as StatutTest,
                  })
                }
              >
                <option value="Non exécuté">Non exécuté</option>
                <option value="Réussi">Réussi</option>
                <option value="Échoué">Échoué</option>
                <option value="Bloqué">Bloqué</option>
              </select>
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Commentaire
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.commentaire}
              onChange={(e) =>
                setFormData({ ...formData, commentaire: e.target.value })
              }
              placeholder="Notes supplémentaires..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#3b4754]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#3b4754] rounded-md text-white hover:bg-[#283039]"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
