"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjects } from "@/features/projects/api";
import { getBacklog, getBacklogIndicateurs } from "@/features/backlog/api";
import { getEpics } from "@/features/epics/api";
import { getModules } from "@/features/modules/api";
import { Project, BacklogItem, BacklogIndicateurs, Epic, Module } from "@/types";

export default function BacklogPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [indicateurs, setIndicateurs] = useState<BacklogIndicateurs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    epic_id: "",
    statut: "",
    priorite: "",
    non_planifiees: false,
    tri: "ordre" as "priorite" | "points" | "ordre" | "statut",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadBacklog(selectedProject);
    }
  }, [selectedProject, filters]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjects();
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
    try {
      // Load modules
      const modulesData = await getModules(projectId);
      setModules(modulesData);

      // Load all epics from all modules
      const allEpics: Epic[] = [];
      for (const module of modulesData) {
        try {
          const epicsData = await getEpics(projectId, module.id);
          allEpics.push(...epicsData);
        } catch (err) {
          console.warn("Erreur chargement epics pour module:", module.id);
        }
      }
      setEpics(allEpics);

      // Load indicateurs
      try {
        const indicateursData = await getBacklogIndicateurs(projectId);
        setIndicateurs(indicateursData);
      } catch (err) {
        console.warn("Erreur chargement indicateurs:", err);
      }
    } catch (error: any) {
      console.error("Erreur chargement données projet:", error);
    }
  };

  const loadBacklog = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.epic_id) params.epic_id = Number(filters.epic_id);
      if (filters.statut) params.statut = filters.statut;
      if (filters.priorite) params.priorite = filters.priorite;
      if (filters.non_planifiees) params.non_planifiees = true;
      if (filters.tri) params.tri = filters.tri;

      const data = await getBacklog(projectId, params);
      setBacklogItems(data);
    } catch (error: any) {
      console.error("Erreur chargement backlog:", error);
      setError("Impossible de charger le backlog");
      setBacklogItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "must_have":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "should_have":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "could_have":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "wont_have":
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getPriorityLabel = (priorite: string) => {
    switch (priorite) {
      case "must_have":
        return "Must Have";
      case "should_have":
        return "Should Have";
      case "could_have":
        return "Could Have";
      case "wont_have":
        return "Won't Have";
      default:
        return priorite;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "to_do":
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
      case "in_progress":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "done":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "to_do":
        return "À faire";
      case "in_progress":
        return "En cours";
      case "done":
        return "Terminée";
      default:
        return statut;
    }
  };

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
          title="Product Backlog"
          subtitle="Vue d'ensemble et priorisation du backlog produit"
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
          <label className="text-[#9dabb9] text-sm font-bold mb-2 block">
            Projet
          </label>
          {projects.length > 0 ? (
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nom}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-red-400 text-sm">Aucun projet disponible</p>
          )}
        </div>

        {/* Indicateurs */}
        {indicateurs && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">list</span>
                <span className="text-[#9dabb9] text-sm">Total Stories</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.total_stories}</div>
            </div>

            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-yellow-400">pending</span>
                <span className="text-[#9dabb9] text-sm">Prioritaires</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.items_prioritaires}</div>
            </div>

            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-blue-400">trending_up</span>
                <span className="text-[#9dabb9] text-sm">Total Points</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.total_points}</div>
            </div>

            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                <span className="text-[#9dabb9] text-sm">Points Done</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.points_done}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
          <h3 className="text-white text-sm font-bold mb-3">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[#9dabb9] text-xs font-bold mb-1 block">Epic</label>
              <select
                value={filters.epic_id}
                onChange={(e) => setFilters({ ...filters, epic_id: e.target.value })}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Toutes les epics</option>
                {epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#9dabb9] text-xs font-bold mb-1 block">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Tous</option>
                <option value="to_do">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminées</option>
              </select>
            </div>

            <div>
              <label className="text-[#9dabb9] text-xs font-bold mb-1 block">Priorité</label>
              <select
                value={filters.priorite}
                onChange={(e) => setFilters({ ...filters, priorite: e.target.value })}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Toutes</option>
                <option value="must_have">Must Have</option>
                <option value="should_have">Should Have</option>
                <option value="could_have">Could Have</option>
                <option value="wont_have">Won't Have</option>
              </select>
            </div>

            <div>
              <label className="text-[#9dabb9] text-xs font-bold mb-1 block">Trier par</label>
              <select
                value={filters.tri}
                onChange={(e) => setFilters({ ...filters, tri: e.target.value as any })}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="ordre">Ordre</option>
                <option value="priorite">Priorité</option>
                <option value="points">Points</option>
                <option value="statut">Statut</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.non_planifiees}
                  onChange={(e) => setFilters({ ...filters, non_planifiees: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[#9dabb9] text-xs font-bold">Non planifiées seulement</span>
              </label>
            </div>
          </div>
        </div>

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

        {/* Backlog Items */}
        {isLoading ? (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-[#9dabb9] mt-4">Chargement du backlog...</p>
          </div>
        ) : backlogItems.length === 0 ? (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-[#9dabb9]">
              inbox
            </span>
            <p className="text-[#9dabb9] mt-4">Aucune user story dans le backlog</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backlogItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-surface-dark border border-[#3b4754] rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Order Number */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#283039] text-[#9dabb9] text-sm font-bold shrink-0">
                    {item.ordre || index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium">{item.titre}</h4>
                      <div className="flex items-center gap-2">
                        {item.points && (
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold">
                            {item.points} pts
                          </span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-[#9dabb9] text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(String(item.priorite))}`}>
                        {getPriorityLabel(String(item.priorite))}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(item.statut)}`}>
                        {getStatusLabel(item.statut)}
                      </span>
                      {item.type === "epic" && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          Epic
                        </span>
                      )}
                      {item.type === "user_story" && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          User Story
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
