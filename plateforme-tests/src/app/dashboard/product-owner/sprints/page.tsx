"use client";

import { useState, useEffect } from "react";
import { Sprint, Project } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function SprintsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/validation-tests`, icon: "check_circle", label: "Validation Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSprints(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projectsData = await getMyProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadSprints = async (projectId: number) => {
    setIsLoadingSprints(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // const data = await getSprintsByProject(projectId);
      
      // Mock data for demonstration
      const mockSprints: Sprint[] = [
        {
          id: 1,
          nom: "Sprint 1 - Foundation",
          dateDebut: "2026-02-01T00:00:00",
          dateFin: "2026-02-15T00:00:00",
          objectifSprint: "Mise en place de l'architecture de base et des fonctionnalités principales",
          capaciteEquipe: 40,
          velocite: 35,
          statut: "termine",
          projet_id: projectId,
          userstories: [
            { id: 1, titre: "Authentification utilisateur", statut: "done", points: 8 },
            { id: 2, titre: "Dashboard principal", statut: "done", points: 13 },
            { id: 3, titre: "Gestion des rôles", statut: "done", points: 8 },
          ],
          rapport_qa: {
            id: 1,
            dateGeneration: "2026-02-15T18:00:00",
            statut: "valide",
            tauxReussite: 92.5,
            nombreTestsExecutes: 120,
            nombreTestsReussis: 111,
            nombreTestsEchoues: 9,
          },
        },
        {
          id: 2,
          nom: "Sprint 2 - Core Features",
          dateDebut: "2026-02-16T00:00:00",
          dateFin: "2026-03-01T00:00:00",
          objectifSprint: "Développement des fonctionnalités métier principales",
          capaciteEquipe: 42,
          velocite: 38,
          statut: "en_cours",
          projet_id: projectId,
          userstories: [
            { id: 4, titre: "Gestion des projets", statut: "done", points: 13 },
            { id: 5, titre: "Gestion des modules", statut: "in_progress", points: 8 },
            { id: 6, titre: "Gestion des epics", statut: "to_do", points: 13 },
          ],
        },
        {
          id: 3,
          nom: "Sprint 3 - QA & Tests",
          dateDebut: "2026-03-02T00:00:00",
          dateFin: "2026-03-16T00:00:00",
          objectifSprint: "Amélioration de la qualité et tests automatisés",
          capaciteEquipe: 40,
          velocite: 0,
          statut: "planifie",
          projet_id: projectId,
          userstories: [
            { id: 7, titre: "Tests unitaires", statut: "to_do", points: 8 },
            { id: 8, titre: "Tests d'intégration", statut: "to_do", points: 13 },
          ],
        },
      ];
      
      setSprints(mockSprints);
    } catch (error) {
      console.error("Failed to load sprints:", error);
    } finally {
      setIsLoadingSprints(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "termine":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "en_cours":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "planifie":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "termine":
        return "Terminé";
      case "en_cours":
        return "En Cours";
      case "planifie":
        return "Planifié";
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateProgress = (sprint: Sprint) => {
    if (!sprint.userstories || sprint.userstories.length === 0) return 0;
    const completed = sprint.userstories.filter((us) => us.statut === "done").length;
    return Math.round((completed / sprint.userstories.length) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Product Owner"
          subtitle="Agile & QA Platform"
          icon="account_tree"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Sprints"
          subtitle="Consultation de l'avancement des sprints et validation des livrables"
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Sélectionner un projet
        </label>
        <select
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
          className="w-full md:w-96 bg-surface-dark border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Sprints List */}
      {isLoadingSprints ? (
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement des sprints...</p>
        </div>
      ) : sprints.length === 0 ? (
        <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-600">
            event_busy
          </span>
          <p className="text-gray-400 mt-4">Aucun sprint trouvé pour ce projet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sprints.map((sprint) => {
            const progress = calculateProgress(sprint);
            const daysLeft = sprint.dateFin
              ? Math.ceil(
                  (new Date(sprint.dateFin).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <div
                key={sprint.id}
                className="bg-surface-dark border border-[#3b4754] rounded-lg p-6 hover:border-blue-500/50 transition-colors"
              >
                {/* Sprint Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{sprint.nom}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          sprint.statut
                        )}`}
                      >
                        {getStatusLabel(sprint.statut)}
                      </span>
                    </div>
                    {sprint.objectifSprint && (
                      <p className="text-gray-400 text-sm">{sprint.objectifSprint}</p>
                    )}
                  </div>
                  {sprint.statut === "en_cours" && daysLeft !== null && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2 text-center">
                      <div className="text-2xl font-bold text-blue-400">{daysLeft}</div>
                      <div className="text-xs text-blue-300">jours restants</div>
                    </div>
                  )}
                </div>

                {/* Sprint Dates & Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date Début</div>
                    <div className="text-sm font-medium text-white">
                      {formatDate(sprint.dateDebut)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date Fin</div>
                    <div className="text-sm font-medium text-white">
                      {formatDate(sprint.dateFin)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Capacité</div>
                    <div className="text-sm font-medium text-white">
                      {sprint.capaciteEquipe} points
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Vélocité</div>
                    <div className="text-sm font-medium text-white">
                      {sprint.velocite} points
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progression</span>
                    <span className="text-sm font-semibold text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-surface-dark rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(progress)} transition-all`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* User Stories */}
                {sprint.userstories && sprint.userstories.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      User Stories ({sprint.userstories.length})
                    </h4>
                    <div className="space-y-2">
                      {sprint.userstories.map((us) => (
                        <div
                          key={us.id}
                          className="flex items-center justify-between bg-surface-dark rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`material-symbols-outlined text-sm ${
                                us.statut === "done"
                                  ? "text-green-400"
                                  : us.statut === "in_progress"
                                  ? "text-blue-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {us.statut === "done"
                                ? "check_circle"
                                : us.statut === "in_progress"
                                ? "pending"
                                : "radio_button_unchecked"}
                            </span>
                            <span className="text-sm text-white">{us.titre}</span>
                          </div>
                          {us.points && (
                            <span className="text-xs text-gray-400 bg-[#283039] px-2 py-1 rounded">
                              {us.points} pts
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QA Report */}
                {sprint.rapport_qa && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-green-400">
                        verified
                      </span>
                      <h4 className="text-sm font-semibold text-green-400">
                        Rapport QA Disponible
                      </h4>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Taux de Réussite</div>
                        <div className="text-lg font-bold text-green-400">
                          {sprint.rapport_qa.tauxReussite}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Tests Exécutés</div>
                        <div className="text-lg font-bold text-white">
                          {sprint.rapport_qa.nombreTestsExecutes}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Réussis</div>
                        <div className="text-lg font-bold text-green-400">
                          {sprint.rapport_qa.nombreTestsReussis}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Échoués</div>
                        <div className="text-lg font-bold text-red-400">
                          {sprint.rapport_qa.nombreTestsEchoues}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-400 text-xl">info</span>
        <div className="flex-1 text-sm text-blue-300">
          <strong>Note:</strong> Les données affichées sont actuellement des exemples. Les
          endpoints API pour les sprints seront bientôt disponibles dans le backend.
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
