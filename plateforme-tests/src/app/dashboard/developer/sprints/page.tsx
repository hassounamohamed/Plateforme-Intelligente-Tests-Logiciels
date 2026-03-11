"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprints } from "@/features/sprints/api";
import { Project, Sprint } from "@/types";

export default function SprintsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [expandedSprintId, setExpandedSprintId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSprints(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await getMyProjectsAsMember();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSprints = async (projectId: number) => {
    try {
      const data = await getSprints(projectId);
      setSprints(data);
    } catch (error) {
      console.error("Erreur lors du chargement des sprints:", error);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  if (loading) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Developer"
            subtitle="Agile & QA Platform"
            icon="code"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Sprints"
            subtitle="Liste des sprints du projet"
          />
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Developer"
            subtitle="Agile & QA Platform"
            icon="code"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Sprints"
            subtitle="Liste des sprints du projet"
          />
        }
      >
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
          <div className="text-[#9dabb9] mb-4">
            <span className="material-symbols-outlined text-6xl">folder_open</span>
          </div>
          <h3 className="text-white text-lg font-bold mb-2">
            Aucun projet assigné
          </h3>
          <p className="text-[#9dabb9]">
            Vous n&apos;êtes membre d&apos;aucun projet pour le moment.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Developer"
          subtitle="Agile & QA Platform"
          icon="code"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Sprints"
          subtitle="Liste des sprints du projet"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        {/* Sélecteur de projet */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#9dabb9] mb-2">
            Sélectionner un projet
          </label>
          <select
            value={selectedProject?.id || ""}
            onChange={(e) => {
              const project = projects.find(
                (p) => p.id === parseInt(e.target.value)
              );
              setSelectedProject(project || null);
            }}
            className="w-full px-4 py-3 bg-surface-dark border border-[#3b4754] text-white text-sm rounded-lg focus:ring-2 focus:ring-primary"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#3b4754]">
            <h3 className="text-white text-lg font-bold">Liste des Sprints</h3>
            <p className="text-[#9dabb9] text-sm mt-1">
              {sprints.length} sprint{sprints.length > 1 ? "s" : ""} au total
            </p>
          </div>

          {sprints.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4">
                event_busy
              </span>
              <p className="text-[#9dabb9]">Aucun sprint disponible</p>
            </div>
          ) : (
            <div className="divide-y divide-[#3b4754]">
              {sprints.map((sprint) => (
                <div key={sprint.id} className="transition-colors">
                  <div 
                    className="p-6 hover:bg-[#283039] cursor-pointer"
                    onClick={() => setExpandedSprintId(expandedSprintId === sprint.id ? null : sprint.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="material-symbols-outlined text-[#9dabb9]">
                            {expandedSprintId === sprint.id ? "expand_more" : "chevron_right"}
                          </span>
                          <h4 className="text-white font-bold">{sprint.nom}</h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sprint.statut === "en_cours"
                                ? "bg-green-500/20 text-green-400"
                                : sprint.statut === "termine"
                                ? "bg-gray-500/20 text-gray-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {sprint.statut}
                          </span>
                        </div>

                        {sprint.objectifSprint && (
                          <p className="text-[#9dabb9] text-sm mb-3 ml-9">
                            {sprint.objectifSprint}
                          </p>
                        )}

                        <div className="flex items-center gap-6 text-sm ml-9">
                          {sprint.dateDebut && sprint.dateFin && (
                            <div className="flex items-center gap-2 text-[#9dabb9]">
                              <span className="material-symbols-outlined text-[16px]">
                                calendar_today
                              </span>
                              <span>
                                {new Date(sprint.dateDebut).toLocaleDateString()} →{" "}
                                {new Date(sprint.dateFin).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[#9dabb9]">
                            <span className="material-symbols-outlined text-[16px]">
                              assignment
                            </span>
                            <span>{sprint.userstories?.length || 0} stories</span>
                          </div>
                          {sprint.velocite > 0 && (
                            <div className="flex items-center gap-2 text-[#9dabb9]">
                              <span className="material-symbols-outlined text-[16px]">
                                speed
                              </span>
                              <span>Vélocité: {sprint.velocite}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Stories Section */}
                  {expandedSprintId === sprint.id && sprint.userstories && sprint.userstories.length > 0 && (
                    <div className="bg-[#1a2028] p-6 border-t border-[#3b4754]">
                      <h5 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">list</span>
                        User Stories ({sprint.userstories.length})
                      </h5>
                      <div className="space-y-3">
                        {sprint.userstories.map((userStory) => (
                          <div
                            key={userStory.id}
                            className="bg-surface-dark border border-[#3b4754] rounded-lg p-4 hover:border-[#4a5866] transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[#9dabb9] text-xs font-mono">
                                    {userStory.reference || `#${userStory.id}`}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      userStory.statut === "done"
                                        ? "bg-green-500/20 text-green-400"
                                        : userStory.statut === "in_progress"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-gray-500/20 text-gray-400"
                                    }`}
                                  >
                                    {userStory.statut}
                                  </span>
                                  {userStory.priorite && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        userStory.priorite === "must_have"
                                          ? "bg-red-500/20 text-red-400"
                                          : userStory.priorite === "should_have"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : userStory.priorite === "could_have"
                                          ? "bg-blue-500/20 text-blue-400"
                                          : "bg-gray-500/20 text-gray-400"
                                      }`}
                                    >
                                      {userStory.priorite.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                                <h6 className="text-white font-medium">
                                  {userStory.titre}
                                </h6>
                              </div>
                              {userStory.points && (
                                <div className="ml-4 flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
                                  <span className="text-primary font-bold">
                                    {userStory.points}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {expandedSprintId === sprint.id && (!sprint.userstories || sprint.userstories.length === 0) && (
                    <div className="bg-[#1a2028] p-8 border-t border-[#3b4754] text-center">
                      <span className="material-symbols-outlined text-4xl text-[#9dabb9] mb-2">
                        inbox
                      </span>
                      <p className="text-[#9dabb9] text-sm">
                        Aucune user story dans ce sprint
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
