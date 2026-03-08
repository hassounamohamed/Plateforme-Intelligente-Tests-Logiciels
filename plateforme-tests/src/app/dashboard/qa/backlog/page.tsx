"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getBacklog } from "@/features/backlog/api";
import { Project, BacklogItem } from "@/types";

export default function BacklogPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadBacklog(selectedProject.id);
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

  const loadBacklog = async (projectId: number) => {
    try {
      const data = await getBacklog(projectId, {});
      setBacklog(data);
    } catch (error) {
      console.error("Erreur lors du chargement du backlog:", error);
    }
  };

  const filteredBacklog =
    filterStatut === "all"
      ? backlog
      : backlog.filter((item) => item.statut === filterStatut);

  const sidebarLinks = [
    { href: ROUTES.QA, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.QA}/cahier-tests`, icon: "science", label: "Cahier de Tests" },
    { href: `${ROUTES.QA}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.QA}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.QA}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  if (loading) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar
            title="Testeur QA"
            subtitle="Agile & QA Platform"
            icon="science"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Backlog"
            subtitle="Liste des éléments du backlog"
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
            title="Testeur QA"
            subtitle="Agile & QA Platform"
            icon="science"
            links={sidebarLinks}
          />
        }
        headerContent={
          <DashboardHeader
            title="Backlog"
            subtitle="Liste des éléments du backlog"
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
            Vous n'êtes membre d'aucun projet pour le moment.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Testeur QA"
          subtitle="Agile & QA Platform"
          icon="science"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Backlog"
          subtitle="Liste des éléments du backlog"
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-lg font-bold">Backlog Produit</h3>
                <p className="text-[#9dabb9] text-sm mt-1">
                  {filteredBacklog.length} élément{filteredBacklog.length > 1 ? "s" : ""}
                </p>
              </div>

              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="px-4 py-2 bg-[#283039] border border-[#3b4754] text-white text-sm rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tous les statuts</option>
                <option value="to_do">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          </div>

          {filteredBacklog.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4">
                inventory_2
              </span>
              <p className="text-[#9dabb9]">Aucun élément dans le backlog</p>
            </div>
          ) : (
            <div className="divide-y divide-[#3b4754]">
              {filteredBacklog.map((item) => (
                <div
                  key={item.id}
                  className="p-6 hover:bg-[#283039] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {item.reference && (
                          <span className="text-[#9dabb9] text-sm font-mono">
                            {item.reference}
                          </span>
                        )}
                        <h4 className="text-white font-medium">{item.titre}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.statut === "done"
                              ? "bg-green-500/20 text-green-400"
                              : item.statut === "in_progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {item.statut}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[#9dabb9] text-sm mb-3">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">
                            {item.type === "epic" ? "flag" : "assignment"}
                          </span>
                          <span>{item.type === "epic" ? "Epic" : "User Story"}</span>
                        </div>
                        {item.points && (
                          <div className="flex items-center gap-2 text-[#9dabb9]">
                            <span className="material-symbols-outlined text-[16px]">
                              star
                            </span>
                            <span>{item.points} points</span>
                          </div>
                        )}
                        {typeof item.priorite === "string" && (
                          <div className="flex items-center gap-2 text-[#9dabb9]">
                            <span className="material-symbols-outlined text-[16px]">
                              priority_high
                            </span>
                            <span>{item.priorite}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
