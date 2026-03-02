"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprints, getActiveSprint } from "@/features/sprints/api";
import { Project, Sprint, User } from "@/types";

export default function TeamManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
    }
  }, [selectedProject]);

  const loadData = async () => {
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

  const loadProjectData = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Load project details to get team members
      const project = projects.find((p) => p.id === projectId);
      if (project && project.membres) {
        setTeamMembers(project.membres as any);
      }

      // Load active sprint
      try {
        const activeSprintData = await getActiveSprint(projectId);
        setActiveSprint(activeSprintData);
      } catch (err) {
        console.warn("Pas de sprint actif");
        setActiveSprint(null);
      }
    } catch (error: any) {
      console.error("Erreur chargement données projet:", error);
      setError("Impossible de charger les données du projet");
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

  // Calculate team metrics
  const getTeamMetrics = () => {
    if (!activeSprint || !activeSprint.userstories) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        assignedMembers: 0,
      };
    }

    const totalTasks = activeSprint.userstories.length;
    const completedTasks = activeSprint.userstories.filter((us) => us.statut === "done").length;
    const inProgressTasks = activeSprint.userstories.filter((us) => us.statut === "in_progress").length;
    const assignedMembers = new Set(
      activeSprint.userstories.filter((us) => us.developerId).map((us) => us.developerId)
    ).size;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      assignedMembers,
    };
  };

  const metrics = getTeamMetrics();

  // Get tasks by member
  const getTasksByMember = (memberId: number) => {
    if (!activeSprint || !activeSprint.userstories) return [];
    return activeSprint.userstories.filter((us) => us.developerId === memberId);
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
          title="Gestion de l'Équipe"
          subtitle="Coordination et suivi des membres de l'équipe"
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

        {/* Team Metrics */}
        {activeSprint && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Membres Actifs</p>
              <p className="text-white text-2xl font-bold">{metrics.assignedMembers}</p>
              <p className="text-[#9dabb9] text-xs mt-1">sur {teamMembers.length} membres</p>
            </div>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Tâches Totales</p>
              <p className="text-white text-2xl font-bold">{metrics.totalTasks}</p>
              <p className="text-[#9dabb9] text-xs mt-1">dans le sprint actif</p>
            </div>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">En Cours</p>
              <p className="text-primary text-2xl font-bold">{metrics.inProgressTasks}</p>
              <p className="text-[#9dabb9] text-xs mt-1">tâches actives</p>
            </div>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Terminées</p>
              <p className="text-[#0bda5b] text-2xl font-bold">{metrics.completedTasks}</p>
              <p className="text-[#9dabb9] text-xs mt-1">
                {metrics.totalTasks > 0
                  ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
                  : 0}
                % complétées
              </p>
            </div>
          </div>
        )}

        {/* Active Sprint Info */}
        {activeSprint && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white text-lg font-bold">{activeSprint.nom}</h3>
                <p className="text-[#9dabb9] text-sm">Sprint actif</p>
              </div>
              <Link
                href={`${ROUTES.SCRUM_MASTER}/sprints/${activeSprint.id}`}
                className="text-primary text-sm font-bold hover:underline"
              >
                Voir détails
              </Link>
            </div>
            {activeSprint.objectifSprint && (
              <p className="text-white text-sm mb-4">{activeSprint.objectifSprint}</p>
            )}
            <div className="w-full bg-[#283039] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${
                    metrics.totalTasks > 0
                      ? (metrics.completedTasks / metrics.totalTasks) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {!activeSprint && !isLoading && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">calendar_month</span>
            <h3 className="text-white text-lg font-bold mb-2">Aucun sprint actif</h3>
            <p className="text-[#9dabb9] text-sm mb-4">
              Lancez un sprint pour commencer à suivre l'équipe
            </p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">event</span>
              <span>Voir les sprints</span>
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Team Members */}
        {!isLoading && teamMembers.length === 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">groups</span>
            <h3 className="text-white text-lg font-bold mb-2">Aucun membre</h3>
            <p className="text-[#9dabb9] text-sm">
              Ce projet n'a pas encore de membres assignés
            </p>
          </div>
        )}

        {!isLoading && teamMembers.length > 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <h3 className="text-white text-lg font-bold mb-4">
              Membres de l'Équipe ({teamMembers.length})
            </h3>
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const memberTasks = getTasksByMember(member.id);
                const completedTasks = memberTasks.filter((t) => t.statut === "done").length;
                const inProgressTasks = memberTasks.filter((t) => t.statut === "in_progress").length;
                const totalPoints = memberTasks.reduce((sum, t) => sum + (t.points || 0), 0);

                return (
                  <div
                    key={member.id}
                    className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center text-primary font-bold text-lg">
                          {member.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{member.nom}</h4>
                          <p className="text-[#9dabb9] text-xs">{member.email}</p>
                          {member.role && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-[#283039] border border-[#3b4754] rounded text-xs text-[#9dabb9]">
                              {member.role.nom}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          member.actif
                            ? "bg-[#0bda5b]/20 text-[#0bda5b]"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {member.actif ? "Actif" : "Inactif"}
                      </span>
                    </div>

                    {activeSprint && memberTasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#9dabb9]">Tâches assignées</span>
                          <span className="text-white font-bold">
                            {completedTasks}/{memberTasks.length} terminées
                          </span>
                        </div>
                        <div className="w-full bg-[#1a1f26] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-[#0bda5b] rounded-full transition-all"
                            style={{
                              width: `${
                                memberTasks.length > 0
                                  ? (completedTasks / memberTasks.length) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#9dabb9] text-[14px]">
                              description
                            </span>
                            <span className="text-[#9dabb9]">{memberTasks.length} tâches</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary text-[14px]">
                              pending
                            </span>
                            <span className="text-primary">{inProgressTasks} en cours</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#9dabb9] text-[14px]">
                              speed
                            </span>
                            <span className="text-white font-bold">{totalPoints} pts</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSprint && memberTasks.length === 0 && (
                      <p className="text-[#9dabb9] text-xs italic">
                        Aucune tâche assignée dans le sprint actif
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href={`${ROUTES.SCRUM_MASTER}/user-stories`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">assignment</span>
              <span className="text-white text-sm font-medium">Assigner Tâches</span>
            </Link>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">event</span>
              <span className="text-white text-sm font-medium">Gérer Sprints</span>
            </Link>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/backlog`}
              className="bg-[#283039] border border-[#3b4754] rounded-lg p-4 hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center"
            >
              <span className="material-symbols-outlined text-primary text-2xl">list</span>
              <span className="text-white text-sm font-medium">Voir Backlog</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
