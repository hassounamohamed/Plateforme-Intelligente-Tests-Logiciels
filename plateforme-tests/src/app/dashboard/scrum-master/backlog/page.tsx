"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { Checkbox } from "@/components/ui/checkbox";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getBacklog, getBacklogIndicateurs, reordonnancerBacklog } from "@/features/backlog/api";
import { Project, BacklogItem, BacklogIndicateurs } from "@/types";

export default function BacklogPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [indicateurs, setIndicateurs] = useState<BacklogIndicateurs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    statut: "",
    priorite: "",
    non_planifiees: false,
    tri: "priorite",
  });
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const selectedProjectData = projects.find((project) => project.id === selectedProject) ?? null;

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadBacklog();
      loadIndicateurs();
    }
  }, [selectedProject, filters]);

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

  const loadBacklog = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    setError(null);
    try {
      const backlogData = await getBacklog(selectedProject, {
        statut: filters.statut || undefined,
        priorite: filters.priorite || undefined,
        non_planifiees: filters.non_planifiees,
        tri: filters.tri as any,
      });
      setBacklogItems(backlogData);
    } catch (error: any) {
      console.error("Erreur chargement backlog:", error);
      setError("Impossible de charger le backlog");
      setBacklogItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadIndicateurs = async () => {
    if (!selectedProject) return;
    try {
      const indicateursData = await getBacklogIndicateurs(selectedProject);
      setIndicateurs(indicateursData);
    } catch (error: any) {
      console.warn("Impossible de charger les indicateurs:", error);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équququipe" },
    { href: `${ROUTES.SCRUM_MASTER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.SCRUM_MASTER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "done":
        return "bg-[#0bda5b]/20 text-[#0bda5b]";
      case "in_progress":
        return "bg-primary/20 text-primary";
      case "to_do":
      default:
        return "bg-[#9dabb9]/20 text-[#9dabb9]";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "done":
        return "Terminée";
      case "in_progress":
        return "En cours";
      case "to_do":
      default:
        return "À faire";
    }
  };

  const getPriorityColor = (priorite: string | number) => {
    if (typeof priorite === "number") return "text-yellow-400";
    switch (priorite) {
      case "must_have":
        return "text-red-400";
      case "should_have":
        return "text-yellow-400";
      case "could_have":
        return "text-primary";
      case "wont_have":
      default:
        return "text-[#9dabb9]";
    }
  };

  const getPriorityLabel = (priorite: string | number) => {
    if (typeof priorite === "number") return `Priorité ${priorite}`;
    return priorite.replace("_", " ").toUpperCase();
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: number) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, itemId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(itemId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === targetId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Reorder items
    const items = [...backlogItems];
    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1 && selectedProject) {
      const [removed] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, removed);
      
      // Update UI optimistically
      setBacklogItems(items);

      // Persist to backend
      try {
        await reordonnancerBacklog(selectedProject, {
          ordre_ids: items.map((i) => i.id),
        });
      } catch (error) {
        console.error("Erreur lors de la réorganisation du backlog:", error);
        // Revert on error
        loadBacklog();
      }
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
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
          title="Backlog du Projet"
          subtitle="Gérez et priorisez vos user stories"
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        {projects.length > 0 && (
          <ProjectSelectorCard
            projects={projects.map((project) => ({ id: project.id, nom: project.nom }))}
            selectedProjectId={selectedProject}
            selectedProjectName={selectedProjectData?.nom ?? null}
            onSelectProject={(projectId) => setSelectedProject(projectId)}
            badgeText="Consultation du backlog"
            title="Projet"
            description="Sélectionnez le projet dont vous voulez gérer le backlog."
            placeholder="-- Sélectionnez un projet --"
          />
        )}

        {/* Indicateurs */}
        {indicateurs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Total Stories</p>
              <p className="text-white text-2xl font-bold">{indicateurs.total_stories}</p>
            </div>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Total Points</p>
              <p className="text-white text-2xl font-bold">{indicateurs.total_points}</p>
            </div>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Items Prioritaires</p>
              <p className="text-yellow-400 text-2xl font-bold">{indicateurs.items_prioritaires}</p>
            </div>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <p className="text-[#9dabb9] text-xs font-bold uppercase mb-2">Non Estimés</p>
              <p className="text-red-400 text-2xl font-bold">{indicateurs.items_non_estimes}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
          <h3 className="text-white text-sm font-bold mb-3">Filtres</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <label className="text-[#9dabb9] text-xs font-bold mb-1 block">Tri</label>
              <select
                value={filters.tri}
                onChange={(e) => setFilters({ ...filters, tri: e.target.value })}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="priorite">Priorité</option>
                <option value="points">Points</option>
                <option value="ordre">Ordre</option>
                <option value="statut">Statut</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5.5">
              <Checkbox
                id="non-planifiees"
                checked={filters.non_planifiees}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setFilters({ ...filters, non_planifiees: checked === true })
                }
                className="border-[#3b4754] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="non-planifiees"
                className="text-white text-sm font-medium leading-none cursor-pointer select-none"
              >
                Non planifiées uniquement
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Backlog Items */}
        {!isLoading && backlogItems.length === 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">list</span>
            <h3 className="text-white text-lg font-bold mb-2">Aucune user story</h3>
            <p className="text-[#9dabb9] text-sm">Le backlog est vide</p>
          </div>
        )}

        {!isLoading && backlogItems.length > 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">
                User Stories ({backlogItems.length})
              </h3>
              <div className="flex items-center gap-2 text-[#9dabb9] text-xs">
                <span className="material-symbols-outlined text-sm">drag_indicator</span>
                <span>Glissez pour réordonner</span>
              </div>
            </div>
            <div className="space-y-3">
              {backlogItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-[#283039] border rounded-lg p-4 transition-all cursor-move ${
                    draggedItem === item.id
                      ? "opacity-50 border-primary scale-105"
                      : dragOverItem === item.id
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-[#3b4754] hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#9dabb9] text-xl mt-1 cursor-grab active:cursor-grabbing">
                      drag_indicator
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#9dabb9] text-xs font-mono">#{item.id}</span>
                        <h4 className="text-white font-medium text-sm">{item.titre}</h4>
                      </div>
                      {item.description && (
                        <p className="text-[#9dabb9] text-sm mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(item.statut)}`}>
                          {getStatusLabel(item.statut)}
                        </span>
                        <span className={`text-xs font-bold ${getPriorityColor(item.priorite)}`}>
                          {getPriorityLabel(item.priorite)}
                        </span>
                        {item.points !== null && item.points !== undefined && (
                          <span className="text-[#9dabb9] text-xs">{item.points} pts</span>
                        )}
                        {item.type && (
                          <span className="text-[#9dabb9] text-xs capitalize">{item.type}</span>
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
    </DashboardLayout>
  );
}
