"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { ProjectManagementModal, ModuleManagementModal, AssignMembersModal } from "@/components/product-owner";
import {
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  assignMembers,
} from "@/features/projects/api";
import {
  getModules,
  createModule,
  updateModule,
  deleteModule,
} from "@/features/modules/api";
import {
  Project,
  Module,
  CreateProjectPayload,
  UpdateProjectPayload,
  CreateModulePayload,
  UpdateModulePayload,
} from "@/types";

export default function ProjectsManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleModalMode, setModuleModalMode] = useState<"create" | "edit">("create");
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [assignMembersModalOpen, setAssignMembersModalOpen] = useState(false);
  const [projectForAssignment, setProjectForAssignment] = useState<Project | null>(null);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/validation-tests`, icon: "check_circle", label: "Validation Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchModules(selectedProject.id);
    } else {
      setModules([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
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

  const fetchModules = async (projectId: number) => {
    try {
      const data = await getModules(projectId);
      setModules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = () => {
    setProjectModalMode("create");
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setProjectModalMode("edit");
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleProjectSubmit = async (
    data: CreateProjectPayload | UpdateProjectPayload
  ) => {
    if (projectModalMode === "create") {
      await createProject(data as CreateProjectPayload);
    } else if (editingProject) {
      await updateProject(editingProject.id, data as UpdateProjectPayload);
    }
    await fetchProjects();
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      try {
        await deleteProject(projectId);
        await fetchProjects();
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleCreateModule = () => {
    if (!selectedProject) {
      alert("Veuillez sélectionner un projet");
      return;
    }
    setModuleModalMode("create");
    setEditingModule(null);
    setModuleModalOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setModuleModalMode("edit");
    setEditingModule(module);
    setModuleModalOpen(true);
  };

  const handleModuleSubmit = async (
    data: CreateModulePayload | UpdateModulePayload
  ) => {
    if (!selectedProject) return;

    if (moduleModalMode === "create") {
      await createModule(selectedProject.id, data as CreateModulePayload);
    } else if (editingModule) {
      await updateModule(selectedProject.id, editingModule.id, data as UpdateModulePayload);
    }
    await fetchModules(selectedProject.id);
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!selectedProject) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
      try {
        await deleteModule(selectedProject.id, moduleId);
        await fetchModules(selectedProject.id);
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleArchiveProject = async (projectId: number) => {
    if (confirm("Êtes-vous sûr de vouloir archiver ce projet ?")) {
      try {
        await archiveProject(projectId);
        await fetchProjects();
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
      } catch (err) {
        alert("Erreur lors de l'archivage");
      }
    }
  };

  const handleOpenAssignMembers = (project: Project) => {
    setProjectForAssignment(project);
    setAssignMembersModalOpen(true);
  };

  const handleAssignMembers = async (memberIds: number[]) => {
    if (!projectForAssignment) return;
    try {
      await assignMembers(projectForAssignment.id, memberIds);
      alert("Membres assignés avec succès");
      await fetchProjects();
    } catch (err) {
      alert("Erreur lors de l'assignation des membres");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-green-500/20 text-green-400";
      case "archivé":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const headerActions = (
    <button
      onClick={handleCreateProject}
      className="flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors"
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>Nouveau Projet</span>
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
          title="Gestion des Projets"
          subtitle="Créez et gérez vos projets et leurs modules"
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Section */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">Mes Projets</h2>
              <button
                onClick={handleCreateProject}
                className="text-primary hover:text-blue-400 text-sm font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Créer
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-[#9dabb9]">
                Chargement...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#9dabb9] mb-4">Aucun projet</p>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm"
                >
                  Créer votre premier projet
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-150 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? "border-primary bg-primary/5"
                        : "border-[#3b4754] hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-bold">{project.nom}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getStatusColor(project.statut)}`}>
                          {project.statut}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignMembers(project);
                          }}
                          className="p-1 hover:bg-blue-500/10 rounded"
                          title="Assigner des membres"
                        >
                          <span className="material-symbols-outlined text-[18px] text-blue-400">group_add</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project.id);
                          }}
                          className="p-1 hover:bg-yellow-500/10 rounded"
                          title="Archiver le projet"
                        >
                          <span className="material-symbols-outlined text-[18px] text-yellow-400">archive</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                          className="p-1 hover:bg-[#283039] rounded"
                          title="Modifier"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#9dabb9]">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-1 hover:bg-red-500/10 rounded"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-red-400">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#9dabb9] line-clamp-2">
                      {project.description || "Aucune description"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modules Section */}
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">
                {selectedProject ? `Modules: ${selectedProject.nom}` : "Modules"}
              </h2>
              {selectedProject && (
                <button
                  onClick={handleCreateModule}
                  className="text-primary hover:text-blue-400 text-sm font-medium flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Créer
                </button>
              )}
            </div>

            {!selectedProject ? (
              <div className="text-center py-12 text-[#9dabb9]">
                Sélectionnez un projet pour voir ses modules
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#9dabb9] mb-4">Aucun module</p>
                <button
                  onClick={handleCreateModule}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm"
                >
                  Créer le premier module
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-150 overflow-y-auto">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="p-4 rounded-lg border border-[#3b4754] hover:border-primary/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="material-symbols-outlined text-primary">folder</span>
                        <h3 className="text-white font-bold">{module.nom}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditModule(module)}
                          className="p-1 hover:bg-[#283039] rounded"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#9dabb9]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.id)}
                          className="p-1 hover:bg-red-500/10 rounded"
                        >
                          <span className="material-symbols-outlined text-[18px] text-red-400">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#9dabb9]">
                      {module.description || "Aucune description"}
                    </p>
                    <p className="text-xs text-[#9dabb9] mt-2">
                      {module.epics?.length || 0} epic(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectManagementModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleProjectSubmit}
        project={editingProject}
        mode={projectModalMode}
      />

      <ModuleManagementModal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        onSubmit={handleModuleSubmit}
        module={editingModule}
        mode={moduleModalMode}
      />

      <AssignMembersModal
        isOpen={assignMembersModalOpen}
        onClose={() => setAssignMembersModalOpen(false)}
        onAssign={handleAssignMembers}
        projectName={projectForAssignment?.nom || ""}
        currentMemberIds={projectForAssignment?.membres?.map(m => m.id) || []}
      />
    </DashboardLayout>
  );
}
