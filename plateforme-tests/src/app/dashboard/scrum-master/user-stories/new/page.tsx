"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { createUserStory } from "@/features/userstories/api";
import { Project, Module, Epic, PrioriteUS } from "@/types";

export default function NewUserStoryPage() {
  return (
    <Suspense fallback={null}>
      <NewUserStoryContent />
    </Suspense>
  );
}

function NewUserStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("project_id");
  const moduleIdParam = searchParams.get("module_id");
  const epicIdParam = searchParams.get("epic_id");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(
    projectIdParam ? parseInt(projectIdParam) : null
  );
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(
    moduleIdParam ? parseInt(moduleIdParam) : null
  );
  const [epics, setEpics] = useState<Epic[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<number | null>(
    epicIdParam ? parseInt(epicIdParam) : null
  );

  const [titre, setTitre] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [benefice, setBenefice] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const [dureeEstimee, setDureeEstimee] = useState<number | null>(null);
  const [priorite, setPriorite] = useState<PrioriteUS>("must_have");
  const [criteresAcceptation, setCriteresAcceptation] = useState("");

  const [isLoading, setIsLoading] = useState(false);
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
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadModules(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && selectedModule) {
      loadEpics(selectedProject, selectedModule);
    }
  }, [selectedProject, selectedModule]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjectsAsMember();
      setProjects(projectsData);
      if (!selectedProject && projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement projets:", error);
      setError("Impossible de charger les projets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadModules = async (projectId: number) => {
    try {
      const modulesData = await getModules(projectId);
      setModules(modulesData);
      if (!selectedModule && modulesData.length > 0) {
        setSelectedModule(modulesData[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement modules:", error);
    }
  };

  const loadEpics = async (projectId: number, moduleId: number) => {
    try {
      const epicsData = await getEpics(projectId, moduleId);
      setEpics(epicsData);
      if (!selectedEpic && epicsData.length > 0) {
        setSelectedEpic(epicsData[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement epics:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !selectedModule || !selectedEpic) {
      setError("Veuillez sélectionner un projet, module et epic");
      return;
    }

    if (!titre.trim() || !role.trim() || !action.trim()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!points && !dureeEstimee) {
      setError("Veuillez fournir soit les points d'effort, soit la durée estimée");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createUserStory(
        selectedProject,
        selectedModule,
        selectedEpic,
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

      router.push(`${ROUTES.SCRUM_MASTER}/user-stories`);
    } catch (error: any) {
      console.error("Erreur création user story:", error);
      setError(
        error.response?.data?.detail ||
          "Erreur lors de la création de la user story"
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
          title="Nouvelle User Story"
          subtitle="Créer une nouvelle user story pour un epic"
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

          {/* Project/Module/Epic Selection */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 space-y-4">
            <h3 className="text-white text-lg font-bold mb-4">Sélection de l'Epic</h3>
            
            {/* Project Selector */}
            <div>
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                Projet <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedProject || ""}
                onChange={(e) => {
                  setSelectedProject(Number(e.target.value));
                  setSelectedModule(null);
                  setSelectedEpic(null);
                }}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                required
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Module Selector */}
            {modules.length > 0 && (
              <div>
                <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                  Module <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedModule || ""}
                  onChange={(e) => {
                    setSelectedModule(Number(e.target.value));
                    setSelectedEpic(null);
                  }}
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Sélectionner un module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Epic Selector */}
            {epics.length > 0 && (
              <div>
                <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
                  Epic <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedEpic || ""}
                  onChange={(e) => setSelectedEpic(Number(e.target.value))}
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Sélectionner un epic</option>
                  {epics.map((epic) => (
                    <option key={epic.id} value={epic.id}>
                      {epic.reference ? `[${epic.reference}] ` : ''}${epic.titre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

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
                Alternative aux points d'effort. Vous devez fournir soit les points, soit la durée estimée.
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
            <Link
              href={`${ROUTES.SCRUM_MASTER}/user-stories`}
              className="px-6 py-2.5 bg-[#283039] border border-[#3b4754] text-white text-sm font-bold rounded-lg hover:bg-[#3b4754] transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? "Création..." : "Créer la User Story"}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
