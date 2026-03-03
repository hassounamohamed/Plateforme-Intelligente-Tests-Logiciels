"use client";

import { useState, useEffect } from "react";
import { Sprint, Project } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { getSprints } from "@/features/sprints/api";
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
  const [error, setError] = useState<string | null>(null);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
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
    setError(null);
    try {
      const data = await getSprints(projectId);
      setSprints(data);
    } catch (error: any) {
      console.error("Failed to load sprints:", error);
      setError("Impossible de charger les sprints");
      setSprints([]);
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

  // Calculate sprint statistics
  const sprintStats = {
    total: sprints.length,
    active: sprints.filter((s) => s.statut === "en_cours").length,
    completed: sprints.filter((s) => s.statut === "termine").length,
    planned: sprints.filter((s) => s.statut === "planifie").length,
    avgVelocity: sprints.length > 0
      ? Math.round(sprints.reduce((sum, s) => sum + (s.velocite || 0), 0) / sprints.length)
      : 0,
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
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        <div className="bg-linear-to-r from-surface-dark to-[#1e2936] border border-[#3b4754] rounded-xl p-6 shadow-lg">
          <label className="block text-sm font-bold text-white mb-3 items-center gap-2">
            <span className="material-symbols-outlined text-primary">folder_open</span>
            Sélectionner un projet
          </label>
          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="w-full bg-[#283039] border-2 border-[#3b4754] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Sprint Statistics Cards */}
        {!isLoadingSprints && sprints.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Total Sprints */}
            <div className="bg-linear-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-5 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-blue-400 text-3xl">
                  event_note
                </span>
                <div className="text-3xl font-bold text-blue-400">{sprintStats.total}</div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Total Sprints</p>
            </div>

            {/* Active Sprints */}
            <div className="bg-linear-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-5 hover:shadow-lg hover:shadow-green-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-green-400 text-3xl">
                  play_circle
                </span>
                <div className="text-3xl font-bold text-green-400">{sprintStats.active}</div>
              </div>
              <p className="text-sm text-gray-300 font-medium">En Cours</p>
            </div>

            {/* Completed Sprints */}
            <div className="bg-linear-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-5 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-purple-400 text-3xl">
                  check_circle
                </span>
                <div className="text-3xl font-bold text-purple-400">{sprintStats.completed}</div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Terminés</p>
            </div>

            {/* Planned Sprints */}
            <div className="bg-linear-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-5 hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-yellow-400 text-3xl">
                  schedule
                </span>
                <div className="text-3xl font-bold text-yellow-400">{sprintStats.planned}</div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Planifiés</p>
            </div>

            {/* Average Velocity */}
            <div className="bg-linear-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-5 hover:shadow-lg hover:shadow-primary/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-primary text-3xl">
                  speed
                </span>
                <div className="text-3xl font-bold text-primary">{sprintStats.avgVelocity}</div>
              </div>
              <p className="text-sm text-gray-300 font-medium">Vélocité Moy.</p>
            </div>
          </div>
        )}

      {/* Sprints List */}
      {isLoadingSprints ? (
        <div className="bg-linear-to-r from-primary-500/10 to-primary-600/5 border-2 border-primary-500/30 rounded-xl p-12 flex flex-col items-center justify-center gap-4 shadow-lg">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg mb-1">Chargement des sprints</p>
            <p className="text-white/50 text-sm">Veuillez patienter...</p>
          </div>
        </div>
      ) : sprints.length === 0 ? (
        <div className="bg-linear-to-br from-gray-500/10 to-gray-600/5 border-2 border-gray-500/30 rounded-xl p-16 text-center shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gray-500/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-6xl">
                event_busy
              </span>
            </div>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Aucun sprint trouvé</h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
            Aucun sprint n'est disponible pour ce projet. Les sprints seront créés par le Scrum Master.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {sprints.map((sprint) => {
            const progress = calculateProgress(sprint);
            const daysLeft = sprint.dateFin
              ? Math.ceil(
                  (new Date(sprint.dateFin).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;
            
            const totalPoints = sprint.userstories?.reduce((sum, us) => sum + (us.points || 0), 0) || 0;
            const completedPoints = sprint.userstories?.filter(us => us.statut === "done").reduce((sum, us) => sum + (us.points || 0), 0) || 0;
            const pointsProgress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

            return (
              <div
                key={sprint.id}
                className="bg-linear-to-br from-surface-dark to-[#1e2936] border-2 border-[#3b4754] rounded-2xl p-6 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
              >
                {/* Sprint Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        sprint
                      </span>
                      <h3 className="text-2xl font-bold text-white">{sprint.nom}</h3>
                      <span
                        className={`px-4 py-1.5 text-xs font-bold rounded-full border-2 ${getStatusColor(
                          sprint.statut
                        )}`}
                      >
                        {getStatusLabel(sprint.statut)}
                      </span>
                    </div>
                    {sprint.objectifSprint && (
                      <div className="flex items-start gap-2 bg-[#283039]/50 rounded-lg p-3 border border-[#3b4754]">
                        <span className="material-symbols-outlined text-primary text-lg mt-0.5">
                          flag
                        </span>
                        <p className="text-gray-300 text-sm leading-relaxed">{sprint.objectifSprint}</p>
                      </div>
                    )}
                  </div>
                  {sprint.statut === "en_cours" && daysLeft !== null && (
                    <div className="bg-linear-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/40 rounded-xl px-6 py-4 text-center ml-4">
                      <div className="text-4xl font-black text-blue-400">{daysLeft}</div>
                      <div className="text-xs text-blue-300 font-semibold uppercase tracking-wide mt-1">jours restants</div>
                    </div>
                  )}
                </div>

                {/* Sprint Dates & Metrics - Enhanced */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#283039]/50 border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-green-400 text-lg">
                        event
                      </span>
                      <div className="text-xs text-gray-400 font-semibold uppercase">Date Début</div>
                    </div>
                    <div className="text-base font-bold text-white">
                      {formatDate(sprint.dateDebut)}
                    </div>
                  </div>
                  <div className="bg-[#283039]/50 border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-red-400 text-lg">
                        event
                      </span>
                      <div className="text-xs text-gray-400 font-semibold uppercase">Date Fin</div>
                    </div>
                    <div className="text-base font-bold text-white">
                      {formatDate(sprint.dateFin)}
                    </div>
                  </div>
                  <div className="bg-[#283039]/50 border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-yellow-400 text-lg">
                        inventory
                      </span>
                      <div className="text-xs text-gray-400 font-semibold uppercase">Capacité</div>
                    </div>
                    <div className="text-base font-bold text-white">
                      {sprint.capaciteEquipe} <span className="text-sm text-gray-400">pts</span>
                    </div>
                  </div>
                  <div className="bg-[#283039]/50 border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-lg">
                        speed
                      </span>
                      <div className="text-xs text-gray-400 font-semibold uppercase">Vélocité</div>
                    </div>
                    <div className="text-base font-bold text-primary">
                      {sprint.velocite || 0} <span className="text-sm text-gray-400">pts</span>
                    </div>
                  </div>
                </div>

                {/* Progress Section - Enhanced with dual progress bars */}
                <div className="bg-[#283039]/30 border border-[#3b4754] rounded-xl p-5 mb-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Stories Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-400 text-lg">
                            checklist
                          </span>
                          <span className="text-sm text-gray-300 font-semibold">Progression Stories</span>
                        </div>
                        <span className="text-lg font-black text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-[#1a1f2e] rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-3 rounded-full ${getProgressColor(progress)} transition-all duration-500 shadow-lg`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{sprint.userstories?.filter(us => us.statut === "done").length || 0} terminées</span>
                        <span>{sprint.userstories?.length || 0} total</span>
                      </div>
                    </div>

                    {/* Points Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-lg">
                            analytics
                          </span>
                          <span className="text-sm text-gray-300 font-semibold">Progression Points</span>
                        </div>
                        <span className="text-lg font-black text-white">{pointsProgress}%</span>
                      </div>
                      <div className="w-full bg-[#1a1f2e] rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-3 rounded-full ${getProgressColor(pointsProgress)} transition-all duration-500 shadow-lg`}
                          style={{ width: `${pointsProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{completedPoints} pts complétés</span>
                        <span>{totalPoints} pts total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Stories */}
                {sprint.userstories && sprint.userstories.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>
                        User Stories
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold">
                          {sprint.userstories.length}
                        </span>
                      </h4>
                    </div>
                    <div className="grid gap-3">
                      {sprint.userstories.map((us) => (
                        <div
                          key={us.id}
                          className="flex items-center justify-between bg-[#283039]/50 border border-[#3b4754] rounded-lg p-4 hover:border-primary/30 hover:bg-[#283039]/80 transition-all group"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Status Icon */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              us.statut === "done"
                                ? "bg-green-500/20 border-2 border-green-500/50"
                                : us.statut === "in_progress"
                                ? "bg-blue-500/20 border-2 border-blue-500/50"
                                : "bg-gray-500/20 border-2 border-gray-500/50"
                            }`}>
                              <span
                                className={`material-symbols-outlined text-lg ${
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
                            </div>
                            
                            {/* Story Title */}
                            <div className="flex-1">
                              <span className="text-sm text-white font-medium group-hover:text-primary transition-colors">
                                {us.titre}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  us.statut === "done"
                                    ? "bg-green-500/20 text-green-400"
                                    : us.statut === "in_progress"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}>
                                  {us.statut === "done" ? "Terminée" : us.statut === "in_progress" ? "En cours" : "À faire"}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Points Badge */}
                          {us.points && (
                            <div className="bg-primary/20 border border-primary/40 px-4 py-2 rounded-lg">
                              <span className="text-primary font-black text-sm">{us.points}</span>
                              <span className="text-primary/70 text-xs ml-1">pts</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* QA Report - Enhanced Design */}
                {sprint.rapport_qa && (
                  <div className="bg-linear-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full">
                        <span className="material-symbols-outlined text-green-400 text-2xl">
                          verified
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-green-400">
                          Rapport QA Disponible
                        </h4>
                        <p className="text-xs text-green-300/70">
                          Tests validés et rapport généré
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Success Rate */}
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-black text-green-400 mb-1">
                          {sprint.rapport_qa.tauxReussite}%
                        </div>
                        <div className="text-xs text-green-300/80 font-semibold uppercase tracking-wide">
                          Taux de Réussite
                        </div>
                      </div>
                      
                      {/* Tests Executed */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-black text-blue-400 mb-1">
                          {sprint.rapport_qa.nombreTestsExecutes}
                        </div>
                        <div className="text-xs text-blue-300/80 font-semibold uppercase tracking-wide">
                          Tests Exécutés
                        </div>
                      </div>
                      
                      {/* Tests Passed */}
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-black text-green-400 mb-1">
                          {sprint.rapport_qa.nombreTestsReussis}
                        </div>
                        <div className="text-xs text-green-300/80 font-semibold uppercase tracking-wide">
                          Réussis
                        </div>
                      </div>
                      
                      {/* Tests Failed */}
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                        <div className="text-3xl font-black text-red-400 mb-1">
                          {sprint.rapport_qa.nombreTestsEchoues}
                        </div>
                        <div className="text-xs text-red-300/80 font-semibold uppercase tracking-wide">
                          Échoués
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

      {/* Error Message */}
      {error && (
        <div className="bg-linear-to-r from-red-500/10 to-red-600/5 border-2 border-red-500/40 rounded-xl p-6 flex items-start gap-4 shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full shrink-0">
            <span className="material-symbols-outlined text-red-400 text-2xl">error</span>
          </div>
          <div className="flex-1">
            <h3 className="text-red-400 font-bold text-lg mb-1">Erreur de chargement</h3>
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
