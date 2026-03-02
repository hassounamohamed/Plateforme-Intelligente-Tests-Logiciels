"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprints, getActiveSprint } from "@/features/sprints/api";
import { getBacklog, getBacklogIndicateurs } from "@/features/backlog/api";
import { Project, Sprint, BacklogIndicateurs } from "@/types";

export default function ScrumMasterDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [backlogIndicateurs, setBacklogIndicateurs] = useState<BacklogIndicateurs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSprints: 0,
    activeSprints: 0,
    totalUserStories: 0,
    completedUserStories: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Chargement des données Scrum Master...");
      const projectsData = await getMyProjectsAsMember();
      console.log("Projets reçus:", projectsData);
      setProjects(projectsData);

      let totalSprints = 0;
      let activeSprints = 0;
      let totalUS = 0;
      let completedUS = 0;

      // Récupérer les données de chaque projet
      for (const project of projectsData) {
        try {
          // Récupérer les sprints du projet
          const sprintsData = await getSprints(project.id);
          totalSprints += sprintsData.length;
          activeSprints += sprintsData.filter((s) => s.statut === "en_cours").length;

          // Récupérer le sprint actif
          try {
            const activeSprintData = await getActiveSprint(project.id);
            setActiveSprint(activeSprintData);
            
            // Compter les user stories du sprint actif
            if (activeSprintData.userstories) {
              totalUS += activeSprintData.userstories.length;
              completedUS += activeSprintData.userstories.filter((us) => us.statut === "done").length;
            }
          } catch (err) {
            console.warn(`Pas de sprint actif pour le projet ${project.id}`);
          }

          // Récupérer les indicateurs du backlog
          try {
            const indicateursData = await getBacklogIndicateurs(project.id);
            setBacklogIndicateurs(indicateursData);
          } catch (err) {
            console.warn(`Impossible de charger les indicateurs du backlog pour le projet ${project.id}`);
          }
        } catch (err) {
          console.warn(`Erreur lors du chargement des données pour le projet ${project.id}:`, err);
        }
      }

      setStats({
        totalSprints,
        activeSprints,
        totalUserStories: totalUS,
        completedUserStories: completedUS,
      });

      console.log("📊 Stats calculées:", {
        totalSprints,
        activeSprints,
        totalUserStories: totalUS,
        completedUserStories: completedUS,
      });
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des données:", error);
      setError(
        error.response?.data?.detail ||
        error.message ||
        "Erreur lors du chargement des données"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
  ];

  const headerActions = activeSprint ? (
    <Link
      href={`${ROUTES.SCRUM_MASTER}/sprints/${activeSprint.id}`}
      className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
    >
      <span className="material-symbols-outlined text-[18px]">event</span>
      <span>Sprint Actif</span>
    </Link>
  ) : (
    <Link
      href={`${ROUTES.SCRUM_MASTER}/sprints/new`}
      className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>Nouveau Sprint</span>
    </Link>
  );

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
          title="Tableau de Bord Scrum Master"
          subtitle="Organisation et suivi du processus Scrum"
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-400 text-xl">error</span>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Erreur de chargement</h3>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Sprints Totaux"
            value={isLoading ? "..." : stats.totalSprints.toString()}
            icon="calendar_month"
            status={{
              text: `${stats.activeSprints} actifs`,
              color: stats.activeSprints > 0 ? "green" : "red",
            }}
          />
          <StatCard
            title="User Stories Sprint"
            value={isLoading ? "..." : stats.totalUserStories.toString()}
            icon="description"
            trend={{
              value: `${stats.completedUserStories} terminées`,
              isPositive: true,
              label: "stories",
            }}
          />
          <StatCard
            title="Backlog Items"
            value={isLoading ? "..." : (backlogIndicateurs?.total_stories || 0).toString()}
            icon="list"
            trend={{
              value: `${backlogIndicateurs?.total_points || 0} points`,
              isPositive: true,
              label: "story points",
            }}
          />
          <StatCard
            title="Vélocité Sprint"
            value={isLoading ? "..." : (activeSprint?.velocite || 0).toString()}
            icon="speed"
            trend={{
              value: activeSprint ? "En cours" : "Aucun sprint",
              isPositive: !!activeSprint,
              label: "",
            }}
          />
        </div>

        {/* Sprint Actif */}
        {activeSprint && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white text-lg font-bold">{activeSprint.nom}</h3>
                <p className="text-[#9dabb9] text-sm">
                  {activeSprint.dateDebut
                    ? new Date(activeSprint.dateDebut).toLocaleDateString("fr-FR")
                    : "Non défini"}{" "}
                  -{" "}
                  {activeSprint.dateFin
                    ? new Date(activeSprint.dateFin).toLocaleDateString("fr-FR")
                    : "Non défini"}
                </p>
              </div>
              <Link
                href={`${ROUTES.SCRUM_MASTER}/sprints/${activeSprint.id}`}
                className="text-primary text-sm font-bold hover:underline"
              >
                Voir Détails
              </Link>
            </div>

            {activeSprint.objectifSprint && (
              <div className="mb-4">
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Objectif</p>
                <p className="text-white text-sm">{activeSprint.objectifSprint}</p>
              </div>
            )}

            {/* User Stories du Sprint */}
            {activeSprint.userstories && activeSprint.userstories.length > 0 && (
              <div>
                <p className="text-[#9dabb9] text-xs font-bold uppercase mb-3">
                  User Stories ({activeSprint.userstories.length})
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeSprint.userstories.map((us) => (
                    <div
                      key={us.id}
                      className="bg-[#283039] border border-[#3b4754] rounded-lg p-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm mb-1">{us.titre}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                us.statut === "done"
                                  ? "bg-[#0bda5b]/20 text-[#0bda5b]"
                                  : us.statut === "in_progress"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-[#9dabb9]/20 text-[#9dabb9]"
                              }`}
                            >
                              {us.statut === "done"
                                ? "Terminée"
                                : us.statut === "in_progress"
                                ? "En cours"
                                : "À faire"}
                            </span>
                            {us.points && (
                              <span className="text-[#9dabb9] text-xs">{us.points} pts</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Backlog & Projets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Indicateurs Backlog */}
          {backlogIndicateurs && (
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">list</span>
                Indicateurs Backlog
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#9dabb9] text-sm">Total Stories</span>
                  <span className="text-white font-bold">{backlogIndicateurs.total_stories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9dabb9] text-sm">Total Points</span>
                  <span className="text-white font-bold">{backlogIndicateurs.total_points}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9dabb9] text-sm">Points Terminés</span>
                  <span className="text-[#0bda5b] font-bold">{backlogIndicateurs.points_done}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9dabb9] text-sm">Items Prioritaires</span>
                  <span className="text-yellow-400 font-bold">
                    {backlogIndicateurs.items_prioritaires}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9dabb9] text-sm">Items Non Estimés</span>
                  <span className="text-red-400 font-bold">
                    {backlogIndicateurs.items_non_estimes}
                  </span>
                </div>
              </div>
              <Link
                href={`${ROUTES.SCRUM_MASTER}/backlog`}
                className="mt-4 text-primary text-sm font-bold hover:underline flex items-center gap-1"
              >
                Voir le Backlog
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Projets */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">Mes Projets</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : projects.length === 0 ? (
              <p className="text-[#9dabb9] text-sm text-center py-4">
                Aucun projet disponible
              </p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`${ROUTES.SCRUM_MASTER}/projects/${project.id}`}
                    className="block bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm mb-1">{project.nom}</h4>
                        {project.description && (
                          <p className="text-[#9dabb9] text-xs line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              project.statut === "actif"
                                ? "bg-[#0bda5b]/20 text-[#0bda5b]"
                                : project.statut === "en_cours"
                                ? "bg-primary/20 text-primary"
                                : "bg-[#9dabb9]/20 text-[#9dabb9]"
                            }`}
                          >
                            {project.statut}
                          </span>
                          {project.membres && (
                            <span className="text-[#9dabb9] text-xs">
                              {project.membres.length} membre{project.membres.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints/new`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">add_circle</span>
              <span className="text-white text-sm font-medium">Créer Sprint</span>
            </Link>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/user-stories/new`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">description</span>
              <span className="text-white text-sm font-medium">Nouvelle User Story</span>
            </Link>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/backlog`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">reorder</span>
              <span className="text-white text-sm font-medium">Gérer Backlog</span>
            </Link>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/team`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">groups</span>
              <span className="text-white text-sm font-medium">Gérer Équipe</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
