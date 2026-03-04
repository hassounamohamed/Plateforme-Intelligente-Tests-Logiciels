"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprints, deleteSprint, startSprint, closeSprint } from "@/features/sprints/api";
import { Project, Sprint } from "@/types";

export default function SprintsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSprints(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjectsAsMember();
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement projets:", error);
      setError("Impossible de charger les projets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSprints = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const sprintsData = await getSprints(projectId);
      setSprints(sprintsData);
    } catch (error: any) {
      console.error("Erreur chargement sprints:", error);
      setError("Impossible de charger les sprints");
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSprint = async (sprintId: number) => {
    if (!selectedProject) return;
    setActionLoading(sprintId);
    try {
      await startSprint(selectedProject, sprintId);
      await loadSprints(selectedProject);
    } catch (error: any) {
      alert("Erreur lors du démarrage du sprint: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseSprint = async (sprintId: number) => {
    if (!selectedProject) return;
    if (!confirm("Êtes-vous sûr de vouloir clôturer ce sprint ?")) return;
    setActionLoading(sprintId);
    try {
      await closeSprint(selectedProject, sprintId);
      await loadSprints(selectedProject);
    } catch (error: any) {
      alert("Erreur lors de la clôture du sprint: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!selectedProject) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce sprint ?")) return;
    setActionLoading(sprintId);
    try {
      await deleteSprint(selectedProject, sprintId);
      await loadSprints(selectedProject);
    } catch (error: any) {
      alert("Erreur lors de la suppression du sprint: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
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

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "bg-primary/20 text-primary";
      case "termine":
        return "bg-[#0bda5b]/20 text-[#0bda5b]";
      case "planifie":
      default:
        return "bg-[#9dabb9]/20 text-[#9dabb9]";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "En cours";
      case "termine":
        return "Terminé";
      case "planifie":
      default:
        return "Planifié";
    }
  };

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
          title="Gestion des Sprints"
          subtitle="Planifiez et suivez vos sprints"
          actions={
            selectedProject && (
              <Link
                href={`${ROUTES.SCRUM_MASTER}/sprints/new?project=${selectedProject}`}
                className="flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden xs:inline">Nouveau Sprint</span>
                <span className="xs:hidden">Nouveau</span>
              </Link>
            )
          }
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
            <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Projet</label>
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nom}
                </option>
              ))}
            </select>
          </div>
        )}

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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Sprints List */}
        {!isLoading && sprints.length === 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">calendar_month</span>
            <h3 className="text-white text-lg font-bold mb-2">Aucun sprint</h3>
            <p className="text-[#9dabb9] text-sm mb-4">
              Commencez par créer votre premier sprint
            </p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints/new${selectedProject ? `?project=${selectedProject}` : ''}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nouveau Sprint</span>
            </Link>
          </div>
        )}

        {!isLoading && sprints.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-xl font-bold">Sprints ({sprints.length})</h2>
              {selectedProject && (
                <Link
                  href={`${ROUTES.SCRUM_MASTER}/sprints/new?project=${selectedProject}`}
                  className="sm:hidden flex items-center gap-2 px-3 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Nouveau</span>
                </Link>
              )}
            </div>
            <div className="space-y-4">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white text-lg font-bold">{sprint.nom}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(sprint.statut)}`}>
                        {getStatusLabel(sprint.statut)}
                      </span>
                    </div>
                    {sprint.objectifSprint && (
                      <p className="text-[#9dabb9] text-sm mb-3">{sprint.objectifSprint}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {sprint.dateDebut && sprint.dateFin && (
                        <div className="flex items-center gap-1 text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">event</span>
                          <span>
                            {new Date(sprint.dateDebut).toLocaleDateString("fr-FR")} -{" "}
                            {new Date(sprint.dateFin).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                      {sprint.capaciteEquipe && (
                        <div className="flex items-center gap-1 text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">speed</span>
                          <span>Capacité: {sprint.capaciteEquipe} pts</span>
                        </div>
                      )}
                      {sprint.userstories && (
                        <div className="flex items-center gap-1 text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          <span>{sprint.userstories.length} user stories</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`${ROUTES.SCRUM_MASTER}/sprints/${sprint.id}`}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Voir détails"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-primary">visibility</span>
                    </Link>
                    <Link
                      href={`${ROUTES.SCRUM_MASTER}/sprints/${sprint.id}/edit`}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Modifier"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-primary">edit</span>
                    </Link>
                    {sprint.statut === "planifie" && (
                      <button
                        onClick={() => handleStartSprint(sprint.id)}
                        disabled={actionLoading === sprint.id}
                        className="p-2 hover:bg-[#0bda5b]/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Démarrer"
                      >
                        <span className="material-symbols-outlined text-[#0bda5b]">play_arrow</span>
                      </button>
                    )}
                    {sprint.statut === "en_cours" && (
                      <button
                        onClick={() => handleCloseSprint(sprint.id)}
                        disabled={actionLoading === sprint.id}
                        className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Clôturer"
                      >
                        <span className="material-symbols-outlined text-yellow-500">check_circle</span>
                      </button>
                    )}
                    {sprint.statut === "planifie" && (
                      <button
                        onClick={() => handleDeleteSprint(sprint.id)}
                        disabled={actionLoading === sprint.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-red-400">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {sprint.userstories && sprint.userstories.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#9dabb9] mb-2">
                      <span>Progression</span>
                      <span>
                        {sprint.userstories.filter((us) => us.statut === "done").length} /{" "}
                        {sprint.userstories.length} terminées
                      </span>
                    </div>
                    <div className="w-full bg-[#283039] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${
                            (sprint.userstories.filter((us) => us.statut === "done").length /
                              sprint.userstories.length) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
