"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { EpicManagementModal } from "@/components/product-owner";
import { getMyProjects } from "@/features/projects/api";
import {
  getEpics,
  createEpic,
  updateEpic,
  deleteEpic,
  changeEpicStatus,
} from "@/features/epics/api";
import {
  Project,
  Epic,
  CreateEpicPayload,
  UpdateEpicPayload,
  EpicStatus,
} from "@/types";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

export default function EpicsManagementPage() {
  const confirmDialog = useConfirmDialog();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [filteredEpics, setFilteredEpics] = useState<Epic[]>([]);
  const [statusFilter, setStatusFilter] = useState<EpicStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  const [epicModalOpen, setEpicModalOpen] = useState(false);
  const [epicModalMode, setEpicModalMode] = useState<"create" | "edit">("create");
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/cahier-tests`, icon: "check_circle", label: "Cahier de Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadEpics(selectedProject.id);
    } else {
      setEpics([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredEpics(epics);
    } else {
      setFilteredEpics(epics.filter((epic) => epic.statut === statusFilter));
    }
  }, [epics, statusFilter]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getMyProjects();
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEpics = async (projectId: number) => {
    try {
      const data = await getEpics(projectId);
      setEpics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEpic = () => {
    if (!selectedProject) {
      alert("Veuillez sélectionner un projet");
      return;
    }
    setEpicModalMode("create");
    setEditingEpic(null);
    setEpicModalOpen(true);
  };

  const handleEditEpic = (epic: Epic) => {
    setEpicModalMode("edit");
    setEditingEpic(epic);
    setEpicModalOpen(true);
  };

  const handleEpicSubmit = async (data: CreateEpicPayload | UpdateEpicPayload) => {
    if (!selectedProject) return;

    if (epicModalMode === "create") {
      await createEpic(selectedProject.id, data as CreateEpicPayload);
    } else if (editingEpic) {
      await updateEpic(
        selectedProject.id,
        editingEpic.id,
        data as UpdateEpicPayload
      );
    }
    await loadEpics(selectedProject.id);
  };

  const handleDeleteEpic = async (epicId: number) => {
    if (!selectedProject) return;
    const confirmed = await confirmDialog({
      title: "Supprimer l'epic",
      description: "Êtes-vous sûr de vouloir supprimer cet epic ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      confirmVariant: "destructive",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteEpic(selectedProject.id, epicId);
      await loadEpics(selectedProject.id);
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleChangeEpicStatus = async (epicId: number, status: EpicStatus) => {
    if (!selectedProject) return;
    try {
      await changeEpicStatus(selectedProject.id, epicId, { statut: status });
      await loadEpics(selectedProject.id);
    } catch (err) {
      alert("Erreur lors du changement de statut");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-500/20 text-blue-400";
      case "done":
        return "bg-green-500/20 text-green-400";
      case "to_do":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "to_do":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  };

  const headerActions = (
    <Button
      onClick={handleCreateEpic}
      disabled={!selectedProject}
      className="h-10 px-4 text-sm font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>Nouvel Epic</span>
    </Button>
  );

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Product Owner"
          subtitle="FlowPilot Platform"
          icon="account_tree"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Gestion des Epics"
          subtitle="Gérez vos epics et leur priorisation"
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Filters */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Projet</label>
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const project = projects.find((p) => p.id === parseInt(e.target.value));
                  setSelectedProject(project || null);
                }}
                className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EpicStatus | "all")}
                className="w-full bg-[#1e293b] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="all">Tous les statuts</option>
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        {/* Epics List */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-bold">Epics ({filteredEpics.length})</h2>
          </div>

          {!selectedProject ? (
            <div className="text-center py-12 text-slate-500 dark:text-[#9dabb9]">
              Sélectionnez un projet pour voir les epics
            </div>
          ) : filteredEpics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-[#9dabb9] mb-4">Aucun epic trouvé</p>
              <Button
                onClick={handleCreateEpic}
                className="h-9 px-4 text-sm font-medium"
              >
                Créer le premier epic
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEpics.map((epic) => (
                <div
                  key={epic.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-[#3b4754] hover:border-primary/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {epic.reference && (
                          <span className="text-slate-500 dark:text-[#9dabb9] text-xs font-mono">
                            {epic.reference}
                          </span>
                        )}
                        <h3 className="text-white font-bold">{epic.titre}</h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            epic.statut
                          )}`}
                        >
                          {getStatusLabel(epic.statut)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-[#9dabb9]">
                          Priorité: {epic.priorite}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-[#9dabb9] mb-2">
                        {epic.description || "Aucune description"}
                      </p>
                      {epic.businessValue && (
                        <p className="text-xs text-green-400">
                          💡 {epic.businessValue}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-start">
                      <select
                        value={epic.statut}
                        onChange={(e) =>
                          handleChangeEpicStatus(epic.id, e.target.value as EpicStatus)
                        }
                        className="px-2 py-1 text-xs border border-slate-200 dark:border-[#3b4754] rounded bg-[#1e293b] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <Button
                        onClick={() => handleEditEpic(epic)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-600 hover:bg-muted hover:text-foreground dark:text-[#9dabb9]"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          edit
                        </span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteEpic(epic.id)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </Button>
                    </div>
                  </div>
                  {epic.user_stories && epic.user_stories.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#3b4754]">
                      <p className="text-xs text-slate-500 dark:text-[#9dabb9]">
                        User Stories: {epic.user_stories.length}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EpicManagementModal
        isOpen={epicModalOpen}
        onClose={() => setEpicModalOpen(false)}
        onSubmit={handleEpicSubmit}
        epic={editingEpic}
        mode={epicModalMode}
      />
    </DashboardLayout>
  );
}
