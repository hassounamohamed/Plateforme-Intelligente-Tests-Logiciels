"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getUserStoryById, updateUserStory } from "@/features/userstories/api";
import { PrioriteUS } from "@/types";

export default function EditUserStoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const userStoryId = parseInt(params.id as string);
  const projectId = parseInt(searchParams.get("project") || "0");
  const moduleId = parseInt(searchParams.get("module") || "0");
  const epicId = parseInt(searchParams.get("epic") || "0");

  const [titre, setTitre] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [benefice, setBenefice] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const [dureeEstimee, setDureeEstimee] = useState<number | null>(null);
  const [priorite, setPriorite] = useState<PrioriteUS>("must_have");
  const [criteresAcceptation, setCriteresAcceptation] = useState("");
  const [reference, setReference] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];
  const priorites: { value: PrioriteUS; label: string; color: string }[] = [
    { value: "must_have", label: "Must Have", color: "text-red-400" },
    { value: "should_have", label: "Should Have", color: "text-orange-400" },
    { value: "could_have", label: "Could Have", color: "text-yellow-400" },
    { value: "wont_have", label: "Won't Have", color: "text-gray-400" },
  ];

  useEffect(() => {
    if (projectId && moduleId && epicId && userStoryId) {
      loadUserStory();
    }
  }, [projectId, moduleId, epicId, userStoryId]);

  const loadUserStory = async () => {
    setIsLoading(true);
    try {
      const us = await getUserStoryById(projectId, moduleId, epicId, userStoryId);
      setTitre(us.titre);
      setReference(us.reference || "");
      
      // Parse description to extract role, action, benefice
      if (us.description) {
        const regex = /En tant que\s+(.+?),\s*je veux\s+(.+?)(?:,\s*afin de\s+(.+))?\.?$/i;
        const match = us.description.match(regex);
        if (match) {
          setRole(match[1] || "");
          setAction(match[2] || "");
          setBenefice(match[3] || "");
        }
      }
      
      setPoints(us.points || null);
      setDureeEstimee(us.duree_estimee || null);
      setPriorite(us.priorite || "must_have");
      setCriteresAcceptation(us.criteresAcceptation || "");
    } catch (error: any) {
      console.error("Erreur chargement user story:", error);
      setError("Impossible de charger la user story");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim() || !role.trim() || !action.trim()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserStory(
        projectId,
        moduleId,
        epicId,
        userStoryId,
        {
          titre: titre.trim(),
          role: role.trim(),
          action: action.trim(),
          benefice: benefice.trim() || undefined,
          points: points || undefined,
          duree_estimee: dureeEstimee || undefined,
          priorite,
          criteresAcceptation: criteresAcceptation.trim() || undefined,
        }
      );

      // Close window after update
      window.close();
    } catch (error: any) {
      console.error("Erreur modification user story:", error);
      setError(
        error.response?.data?.detail ||
          "Erreur lors de la modification de la user story"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
    { href: `${ROUTES.SCRUM_MASTER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Scrum Master"
            subtitle="Agile & QA Platform"
            icon="groups"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Modifier User Story"
            subtitle="Chargement..."
          />
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Scrum Master"
          subtitle="Agile & QA Platform"
          icon="groups"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title={`Modifier User Story ${reference || `#${userStoryId}`}`}
          subtitle="Modifier une user story existante"
        />
      }
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400 text-xl">error</span>
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">Erreur</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* User Story Definition */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 space-y-4">
            <h3 className="text-white text-lg font-bold mb-4">Définition de la User Story</h3>
            
            <div className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 mb-4">
              <p className="text-[#9dabb9] text-sm">
                Format: <span className="text-white font-medium">En tant que [RÔLE], je veux [ACTION] afin de [BÉNÉFICE]</span>
              </p>
            </div>

            {/* Titre */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Titre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="ex: Authentification utilisateur"
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Rôle (En tant que...) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="ex: utilisateur, admin, développeur"
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Action */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Action (Je veux...) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="ex: pouvoir créer un nouveau projet"
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Benefice */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Bénéfice (Afin de...)
              </label>
              <input
                type="text"
                value={benefice}
                onChange={(e) => setBenefice(e.target.value)}
                placeholder="ex: organiser mon travail efficacement"
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Details */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 space-y-4">
            <h3 className="text-white text-lg font-bold mb-4">Détails</h3>

            {/* Points (Fibonacci) */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Points d'Effort (Fibonacci)
              </label>
              <div className="grid grid-cols-7 gap-2">
                {fibonacciPoints.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => setPoints(point)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      points === point
                        ? "bg-primary text-white"
                        : "bg-[#283039] text-[#9dabb9] hover:bg-[#3b4754]"
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
              {points && (
                <button
                  type="button"
                  onClick={() => setPoints(null)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Durée estimée (heures) */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Durée Estimée (heures)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={dureeEstimee || ""}
                onChange={(e) => setDureeEstimee(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Ex: 8 heures"
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary"
              />
              <p className="text-[#9dabb9] text-xs mt-2">
                Alternative aux points d'effort. Vous pouvez fournir soit les points, soit la durée estimée, ou les deux.
              </p>
            </div>

            {/* Priority (MoSCoW) */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Priorité (MoSCoW) <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {priorites.map((prio) => (
                  <button
                    key={prio.value}
                    type="button"
                    onClick={() => setPriorite(prio.value)}
                    className={`py-3 px-4 rounded-lg text-sm font-bold transition-all border ${
                      priorite === prio.value
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-[#283039] border-[#3b4754] hover:bg-[#3b4754]"
                    }`}
                  >
                    <span className={priorite === prio.value ? "text-primary" : prio.color}>
                      {prio.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Critères d'Acceptation
              </label>
              <textarea
                value={criteresAcceptation}
                onChange={(e) => setCriteresAcceptation(e.target.value)}
                placeholder="Listez les critères d'acceptation pour cette user story"
                rows={6}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white placeholder-[#9dabb9]/50 focus:outline-none focus:border-primary resize-none"
              />
              <p className="text-[#9dabb9] text-xs mt-2">
                Conseil: Utilisez une liste à puces pour définir les critères (un par ligne)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => window.close()}
              className="px-6 py-2.5 bg-[#283039] border border-[#3b4754] text-white text-sm font-bold rounded-lg hover:bg-[#3b4754] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
