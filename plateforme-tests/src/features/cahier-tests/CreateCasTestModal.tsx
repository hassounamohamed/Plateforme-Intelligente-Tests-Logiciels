"use client";

import React, { useEffect, useState } from "react";
import { CahierUserStoryOption, CreateCasTestPayload, TypeTest } from "@/types";
import { createCasTest, getCahierUserStories } from "./api";
import { getProjectById } from "@/features/projects/api";
import { AxiosError } from "axios";

interface CreateCasTestModalProps {
  projectId: number;
  cahierId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialState: CreateCasTestPayload = {
  user_story_id: undefined,
  test_case: "",
  sprint: "",
  test_purpose: "",
  type_utilisateur: "",
  scenario_test: "",
  resultat_attendu: "",
  execution_time_seconds: undefined,
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
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingUserStories, setLoadingUserStories] = useState(false);
  const [projectMembers, setProjectMembers] = useState<{ id: number; nom: string; email: string }[]>([]);
  const [userStories, setUserStories] = useState<CahierUserStoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadProjectMembers = async () => {
      setLoadingMembers(true);
      try {
        const project = await getProjectById(projectId);
        setProjectMembers(project.membres ?? []);
      } catch (err) {
        console.error("Erreur lors du chargement des membres du projet:", err);
        setProjectMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    const loadUserStories = async () => {
      setLoadingUserStories(true);
      try {
        const stories = await getCahierUserStories(projectId);
        setUserStories(stories);
      } catch (err) {
        console.error("Erreur lors du chargement des user stories:", err);
        setUserStories([]);
      } finally {
        setLoadingUserStories(false);
      }
    };

    loadProjectMembers();
    loadUserStories();
  }, [isOpen, projectId]);

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
    if (!formData.user_story_id) {
      setError("La sélection d'une User Story est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      const selectedStory = userStories.find((story) => story.id === formData.user_story_id);
      await createCasTest(projectId, cahierId, {
        ...formData,
        sprint: selectedStory?.sprint_nom || formData.sprint,
        test_case: formData.test_case.trim(),
      });
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const apiError = err as AxiosError<{ detail?: string }>;
      setError(apiError.response?.data?.detail || "Erreur lors de la création du cas de test");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-surface-dark rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#3b4754]">
        <div className="sticky top-0 bg-surface-dark border-b border-[#3b4754] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Nouveau cas de test
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#9dabb9] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">User Story *</label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md disabled:opacity-60"
                value={formData.user_story_id ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    user_story_id: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                disabled={loadingUserStories}
              >
                <option value="">{loadingUserStories ? "Chargement des user stories..." : "Sélectionner une user story"}</option>
                {userStories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {(story.reference || `US-${story.id}`)} 
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Sprint (auto)</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md opacity-80"
                value={
                  userStories.find((story) => story.id === formData.user_story_id)?.sprint_nom ||
                  "Non assignée"
                }
                readOnly
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
              <label className="block text-sm font-medium text-white mb-1">Membre assigné</label>
              <select
                className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md disabled:opacity-60"
                value={formData.type_utilisateur || ""}
                onChange={(e) => updateField("type_utilisateur", e.target.value)}
                disabled={loadingMembers}
              >
                <option value="">{loadingMembers ? "Chargement des membres..." : "Non assigné"}</option>
                {projectMembers.map((member) => (
                  <option key={member.id} value={member.nom}>
                    {member.nom} ({member.email})
                  </option>
                ))}
              </select>
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

          <div>
            <label className="block text-sm font-medium text-white mb-1">Duration / Execution Time (sec)</label>
            <input
              type="number"
              min={0}
              className="w-full px-3 py-2 bg-[#283039] border border-[#3b4754] text-white rounded-md"
              value={formData.execution_time_seconds ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  execution_time_seconds:
                    e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                }))
              }
              placeholder="Ex: 45"
            />
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
