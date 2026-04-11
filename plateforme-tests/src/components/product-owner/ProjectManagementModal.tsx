"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Project, CreateProjectPayload, UpdateProjectPayload } from "@/types";
import { suggestProjectFields } from "@/features/projects/api";

type PromptTheme = "ecommerce" | "rh" | "support" | "finance" | "education" | "general";

const THEME_KEYWORDS: Record<PromptTheme, string[]> = {
  ecommerce: ["e-commerce", "ecommerce", "catalogue", "panier", "commande", "paiement", "livraison"],
  rh: ["rh", "ressources humaines", "onboarding", "conges", "talent", "recrutement", "evaluation"],
  support: ["support", "ticket", "incident", "sla", "helpdesk", "service client"],
  finance: ["finance", "facture", "comptabilite", "budget", "tresorerie", "paiement fournisseur"],
  education: ["education", "ecole", "cours", "etudiant", "formation", "classe", "elearning"],
  general: [],
};

const THEME_SUGGESTION_BASE: Record<PromptTheme, string> = {
  ecommerce: "Plateforme e-commerce B2B avec catalogue, panier, commandes, paiements et suivi livraison.",
  rh: "Plateforme RH pour onboarding, gestion des conges, evaluations et plan de formation.",
  support: "Portail support client avec tickets, SLA, base de connaissance et escalade automatique.",
  finance: "Solution finance pour facturation, rapprochement bancaire, budget et reporting mensuel.",
  education: "Plateforme e-learning avec cours, quiz, progression des etudiants et certificats.",
  general: "Plateforme collaborative avec gestion utilisateurs, workflow metier, notifications et reporting.",
};

function detectTheme(text: string): PromptTheme {
  const normalized = text.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as Array<[PromptTheme, string[]]>) {
    if (theme === "general") continue;
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return theme;
    }
  }
  return "general";
}

function getThemeLabel(theme: PromptTheme): string {
  switch (theme) {
    case "ecommerce":
      return "E-commerce";
    case "rh":
      return "Ressources humaines";
    case "support":
      return "Support client";
    case "finance":
      return "Finance";
    case "education":
      return "Education";
    default:
      return "General";
  }
}

function buildSingleSuggestion(theme: PromptTheme, input: string): string {
  const cleanInput = input.trim().replace(/\s+/g, " ");
  const base = THEME_SUGGESTION_BASE[theme] || THEME_SUGGESTION_BASE.general;

  if (!cleanInput) {
    return base;
  }

  if (cleanInput.length < 24) {
    return `${base} Contexte cible: ${cleanInput}.`;
  }

  return cleanInput.endsWith(".") ? cleanInput : `${cleanInput}.`;
}

interface ProjectSubmitOptions {
  initialAttachment?: File | null;
}

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateProjectPayload | UpdateProjectPayload,
    options?: ProjectSubmitOptions
  ) => Promise<void>;
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
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [initialAttachment, setInitialAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectedTheme = useMemo(() => {
    const source = [aiPrompt, formData.nom, formData.description, formData.objectif]
      .join(" ")
      .trim();
    return detectTheme(source);
  }, [aiPrompt, formData.nom, formData.description, formData.objectif]);

  const aiSingleSuggestion = useMemo(
    () => buildSingleSuggestion(detectedTheme, aiPrompt),
    [detectedTheme, aiPrompt]
  );

  const completedCount = [
    formData.nom,
    formData.description,
    formData.objectif,
    formData.dateDebut,
    formData.dateFin,
  ].filter((value) => Boolean((value || "").trim())).length;
  const completionPercent = Math.round((completedCount / 5) * 100);
  const isDateRangeInvalid =
    Boolean(formData.dateDebut) &&
    Boolean(formData.dateFin) &&
    String(formData.dateFin) < String(formData.dateDebut);

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
      setAiPrompt("");
      setInitialAttachment(null);
    }
    setError(null);
  }, [project, mode, isOpen]);

  const handleAISuggest = async () => {
    if (!aiPrompt.trim()) {
      setError("Décrivez d'abord le contexte pour générer les champs avec l'IA.");
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const suggestion = await suggestProjectFields(aiPrompt.trim());
      setFormData((prev) => ({
        ...prev,
        nom: suggestion.nom?.trim() || prev.nom,
        description: suggestion.description?.trim() || prev.description,
        objectif: suggestion.objectif?.trim() || prev.objectif,
        dateDebut: suggestion.dateDebut || prev.dateDebut,
        dateFin: suggestion.dateFin || prev.dateFin,
      }));
      alert("Suggestions IA appliquées au formulaire.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Impossible de générer des suggestions IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDateRangeInvalid) {
      setError("La date de fin doit être postérieure ou égale à la date de début.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateProjectPayload | UpdateProjectPayload = {
        nom: formData.nom,
        description: formData.description || undefined,
        dateDebut: formData.dateDebut || undefined,
        dateFin: formData.dateFin || undefined,
        objectif: formData.objectif || undefined,
      };

      await onSubmit(payload, {
        initialAttachment: mode === "create" ? initialAttachment : null,
      });
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-[#3b4754] bg-linear-to-r from-[#0f172a] via-[#111827] to-[#0b1220] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#9dabb9]">Progression formulaire</p>
              <p className="text-sm font-semibold text-white">{completionPercent}% complété</p>
            </div>
            <span className="rounded-full border border-[#3b4754] bg-[#1e293b] px-2.5 py-1 text-xs font-medium text-[#cbd5e1]">
              {completedCount}/5 champs
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#1e293b]">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#0ea5e9] to-[#2563eb] transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {mode === "create" && (
          <div className="rounded-xl border border-[#3b4754] bg-[#0f172a]/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Assistant IA</p>
              <span className="rounded-full bg-[#1e293b] px-2.5 py-1 text-[11px] text-[#9dabb9]">
                Pré-remplissage intelligent
              </span>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="Ex: Plateforme e-commerce B2B pour gérer catalogue, commandes et support SAV..."
              className="w-full px-3 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
            />
            {aiPrompt.trim() && (
              <div className="rounded-lg border border-[#3b4754] bg-[#111827] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#9dabb9]">
                    Suggestion IA ({getThemeLabel(detectedTheme)})
                  </p>
                  <button
                    type="button"
                    onClick={() => setAiPrompt(aiSingleSuggestion)}
                    className="rounded-md border border-[#3b4754] px-2 py-1 text-[11px] font-medium text-[#cbd5e1] hover:text-white hover:border-[#4b5a6a]"
                  >
                    Utiliser
                  </button>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#dbe5ef]">
                  {aiSingleSuggestion}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading}
                className="px-3 py-2 text-xs font-semibold bg-[#2563eb] hover:bg-primary-700 text-white rounded-md disabled:opacity-60"
              >
                {aiLoading ? "Génération..." : "Aider avec IA"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#3b4754] bg-[#111827]/80 p-4 space-y-4">
          <p className="text-sm font-semibold text-white">Informations du projet</p>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {isDateRangeInvalid && (
            <p className="text-xs text-amber-400">
              Vérifiez les dates: la date de fin ne peut pas être antérieure à la date de début.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Objectif principal
            </label>
            <textarea
              value={formData.objectif}
              onChange={(e) =>
                setFormData({ ...formData, objectif: e.target.value })
              }
              placeholder="Ex: Augmenter le taux de conversion de 15%"
              rows={2}
              className="w-full px-3 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
            />
          </div>
        </div>

        {mode === "create" && (
          <div className="rounded-xl border border-dashed border-[#3b4754] bg-[#0b1220]/70 p-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Fichier initial (photo, PDF, DOCX, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setInitialAttachment(e.target.files?.[0] || null)}
              accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.txt"
              className="w-full px-3 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg text-white text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-[#283039] file:text-white"
            />
            {initialAttachment && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#3b4754] bg-[#111827] px-3 py-2">
                <p className="text-xs text-[#9dabb9] truncate pr-3">
                  {initialAttachment.name}
                </p>
                <button
                  type="button"
                  onClick={() => setInitialAttachment(null)}
                  className="text-xs text-red-300 hover:text-red-200"
                >
                  Retirer
                </button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-[#3b4754] bg-[#0f172a]/80 p-4">
          <p className="text-sm font-semibold text-white mb-2">Aperçu rapide</p>
          <p className="text-lg font-semibold text-white/95">{formData.nom || "Nom du projet"}</p>
          <p className="text-sm text-[#9dabb9] mt-1 line-clamp-2">
            {formData.description || "La description du projet apparaîtra ici..."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#1e293b] px-2.5 py-1 text-xs text-[#cbd5e1]">
              Début: {formData.dateDebut || "Non défini"}
            </span>
            <span className="rounded-full bg-[#1e293b] px-2.5 py-1 text-xs text-[#cbd5e1]">
              Fin: {formData.dateFin || "Non défini"}
            </span>
          </div>
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
