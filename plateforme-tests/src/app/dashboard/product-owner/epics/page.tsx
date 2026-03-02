"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { EpicManagementModal } from "@/components/product-owner";
import { getMyProjects } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import {
  getEpics,
  createEpic,
  updateEpic,
  deleteEpic,
  changeEpicStatus,
} from "@/features/epics/api";
import {
  Project,
  Module,
  Epic,
  CreateEpicPayload,
  UpdateEpicPayload,
  EpicStatus,
} from "@/types";

export default function EpicsManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
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
      loadModules(selectedProject.id);
    } else {
      setModules([]);
      setSelectedModule(null);
      setEpics([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && selectedModule) {
      loadEpics(selectedProject.id, selectedModule.id);
    } else {
      setEpics([]);
    }
  }, [selectedModule]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModules = async (projectId: number) => {
    try {
      const data = await getModules(projectId);
      setModules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEpics = async (projectId: number, moduleId: number) => {
    try {
      const data = await getEpics(projectId, moduleId);
      setEpics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEpic = () => {
    if (!selectedProject || !selectedModule) {
      alert("Veuillez sélectionner un projet et un module");
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
    if (!selectedProject || !selectedModule) return;

    if (epicModalMode === "create") {
      await createEpic(selectedProject.id, selectedModule.id, data as CreateEpicPayload);
    } else if (editingEpic) {
      await updateEpic(
        selectedProject.id,
        selectedModule.id,
        editingEpic.id,
        data as UpdateEpicPayload
      );
    }
    await loadEpics(selectedProject.id, selectedModule.id);
  };

  const handleDeleteEpic = async (epicId: number) => {
    if (!selectedProject || !selectedModule) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer cet epic ?")) {
      try {
        await deleteEpic(selectedProject.id, selectedModule.id, epicId);
        await loadEpics(selectedProject.id, selectedModule.id);
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleChangeEpicStatus = async (epicId: number, status: EpicStatus) => {
    if (!selectedProject || !selectedModule) return;
    try {
      await changeEpicStatus(selectedProject.id, selectedModule.id, epicId, { statut: status });
      await loadEpics(selectedProject.id, selectedModule.id);
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
    <button
      onClick={handleCreateEpic}
      disabled={!selectedProject || !selectedModule}
      className="flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>Nouvel Epic</span>
    </button>
  );

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
          title="Gestion des Epics"
          subtitle="Gérez vos epics et leur priorisation"
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Filters */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Projet</label>
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const project = projects.find((p) => p.id === parseInt(e.target.value));
                  setSelectedProject(project || null);
                }}
                className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium text-white mb-2">Module</label>
              <select
                value={selectedModule?.id || ""}
                onChange={(e) => {
                  const module = modules.find((m) => m.id === parseInt(e.target.value));
                  setSelectedModule(module || null);
                }}
                disabled={!selectedProject}
                className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Sélectionner un module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as EpicStatus | "all")}
                disabled={!selectedModule}
                className="w-full bg-[#1e293b] border border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
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
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-bold">Epics ({filteredEpics.length})</h2>
          </div>

          {!selectedProject || !selectedModule ? (
            <div className="text-center py-12 text-[#9dabb9]">
              Sélectionnez un projet et un module pour voir les epics
            </div>
          ) : filteredEpics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#9dabb9] mb-4">Aucun epic trouvé</p>
              <button
                onClick={handleCreateEpic}
                className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm"
              >
                Créer le premier epic
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEpics.map((epic) => (
                <div
                  key={epic.id}
                  className="p-4 rounded-lg border border-[#3b4754] hover:border-primary/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-bold">{epic.titre}</h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                            epic.statut
                          )}`}
                        >
                          {getStatusLabel(epic.statut)}
                        </span>
                        <span className="text-xs text-[#9dabb9]">
                          Priorité: {epic.priorite}
                        </span>
                      </div>
                      <p className="text-sm text-[#9dabb9] mb-2">
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
                        className="px-2 py-1 text-xs border border-[#3b4754] rounded bg-[#1e293b] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        onClick={() => handleEditEpic(epic)}
                        className="p-1 hover:bg-[#283039] rounded"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#9dabb9]">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteEpic(epic.id)}
                        className="p-1 hover:bg-red-500/10 rounded"
                      >
                        <span className="material-symbols-outlined text-[18px] text-red-400">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                  {epic.user_stories && epic.user_stories.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#3b4754]">
                      <p className="text-xs text-[#9dabb9]">
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
