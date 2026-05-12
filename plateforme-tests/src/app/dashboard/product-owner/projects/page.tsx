"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AttachmentList } from "@/components/AttachmentList";
import { ROUTES } from "@/lib/constants";
import { ProjectManagementModal, AssignMembersModal } from "@/components/product-owner";
import {
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  assignMembers,
} from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import {
  uploadProjectAttachment,
  downloadAttachment,
  deleteAttachment,
} from "@/features/attachments/api";
import {
  Project,
  Epic,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/types";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";

export default function ProjectsManagementPage() {
  const confirmDialog = useConfirmDialog();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [epics, setEpics] = useState<Array<{ epic: Epic; moduleName: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEpicsLoading, setIsEpicsLoading] = useState(false);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<"create" | "edit">("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [assignMembersModalOpen, setAssignMembersModalOpen] = useState(false);
  const [projectForAssignment, setProjectForAssignment] = useState<Project | null>(null);

  const [showAttachments, setShowAttachments] = useState(false);
  const [attachmentsProject, setAttachmentsProject] = useState<Project | null>(null);

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
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectEpics(selectedProject.id);
    } else {
      setEpics([]);
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

  const fetchProjectEpics = async (projectId: number) => {
    setIsEpicsLoading(true);
    try {
      const modulesData = await getModules(projectId);

      const epicsByModule = await Promise.all(
        modulesData.map(async (module) => {
          const moduleEpics = await getEpics(projectId, module.id, undefined, true);
          return moduleEpics.map((epic) => ({ epic, moduleName: module.nom }));
        })
      );

      setEpics(epicsByModule.flat());
    } catch (err) {
      console.error(err);
      setEpics([]);
    } finally {
      setIsEpicsLoading(false);
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
    data: CreateProjectPayload | UpdateProjectPayload,
    options?: { initialAttachment?: File | null }
  ) => {
    if (projectModalMode === "create") {
      const createdProject = await createProject(data as CreateProjectPayload);
      if (options?.initialAttachment) {
        try {
          await uploadProjectAttachment(createdProject.id, options.initialAttachment);
          alert("Projet créé avec succès et fichier attaché.");
        } catch (uploadErr) {
          alert("Projet créé, mais le fichier n'a pas pu être attaché.");
        }
      } else {
        alert("Projet créé avec succès");
      }
    } else if (editingProject) {
      await updateProject(editingProject.id, data as UpdateProjectPayload);
    }
    await fetchProjects();
  };

  const handleDeleteProject = async (projectId: number) => {
    const confirmed = await confirmDialog({
      title: "Supprimer le projet",
      description: "Êtes-vous sûr de vouloir supprimer ce projet ?",
      confirmText: "Supprimer",
      cancelText: "Annuler",
      confirmVariant: "destructive",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(projectId);
        alert("Projet supprimé avec succès");
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleArchiveProject = async (projectId: number) => {
    const confirmed = await confirmDialog({
      title: "Archiver le projet",
      description: "Êtes-vous sûr de vouloir archiver ce projet ?",
      confirmText: "Archiver",
      cancelText: "Annuler",
    });

    if (!confirmed) {
      return;
    }

    try {
      await archiveProject(projectId);
      await fetchProjects();
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (err) {
      alert("Erreur lors de l'archivage");
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

  const handleOpenAttachments = (project: Project) => {
    setAttachmentsProject(project);
    setShowAttachments(true);
  };

  const handleUploadAttachment = async (file: File) => {
    if (!attachmentsProject) return;
    try {
      await uploadProjectAttachment(attachmentsProject.id, file);
      // Refresh projects to get updated attachments
      await fetchProjects();
      // Update the attachmentsProject with fresh data
      const updated = await getMyProjects();
      const updatedProject = updated.find(p => p.id === attachmentsProject.id);
      if (updatedProject) {
        setAttachmentsProject(updatedProject);
      }
    } catch (err) {
      console.error("Erreur lors de l'upload:", err);
      throw err;
    }
  };

  const handleDownloadAttachment = (attachmentId: number, filename: string) => {
    downloadAttachment(attachmentId).catch((err) => {
      console.error("Erreur lors du téléchargement:", err);
      alert("Erreur lors du téléchargement");
    });
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      await fetchProjects();
      // Update the attachmentsProject with fresh data
      if (attachmentsProject) {
        const updated = await getMyProjects();
        const updatedProject = updated.find(p => p.id === attachmentsProject.id);
        if (updatedProject) {
          setAttachmentsProject(updatedProject);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression");
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

  const getEpicStatusColor = (status: Epic["statut"]) => {
    switch (status) {
      case "done":
        return "bg-green-500/20 text-green-400";
      case "in_progress":
        return "bg-primary/20 text-primary";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getEpicStatusLabel = (status: Epic["statut"]) => {
    switch (status) {
      case "done":
        return "Terminée";
      case "in_progress":
        return "En cours";
      default:
        return "À faire";
    }
  };

  const headerActions = (
    <Button
      onClick={handleCreateProject}
      className="h-10 px-4 text-sm font-bold gap-2"
    >
      <span className="material-symbols-outlined text-[18px]">add</span>
      <span>Nouveau Projet</span>
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
          title="Gestion des Projets"
          subtitle="Créez et gérez vos projets et leurs epics"
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Section */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">Mes Projets</h2>
              <Button
                onClick={handleCreateProject}
                variant="outline"
                size="sm"
                className="gap-1 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Créer
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500 dark:text-[#9dabb9]">
                Chargement...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-[#9dabb9] mb-4">Aucun projet</p>
                <Button
                  onClick={handleCreateProject}
                  className="h-9 px-4 text-sm font-medium"
                >
                  Créer votre premier projet
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-150 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedProject?.id === project.id
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-[#3b4754] hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {project.key && (
                            <span className="text-slate-500 dark:text-[#9dabb9] text-xs font-mono bg-slate-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                              {project.key}
                            </span>
                          )}
                          <h3 className="text-white font-bold">{project.nom}</h3>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.statut)}`}
                        >
                          {project.statut}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAttachments(project);
                          }}
                          variant="ghost"
                          size="icon-sm"
                          className="text-violet-600 hover:bg-violet-500/10 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                          title="Pièces jointes"
                        >
                          <span className="material-symbols-outlined text-[18px]">attach_file</span>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignMembers(project);
                          }}
                          variant="ghost"
                          size="icon-sm"
                          className="text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Assigner des membres"
                        >
                          <span className="material-symbols-outlined text-[18px]">group_add</span>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project.id);
                          }}
                          variant="ghost"
                          size="icon-sm"
                          className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                          title="Archiver le projet"
                        >
                          <span className="material-symbols-outlined text-[18px]">archive</span>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-600 hover:bg-muted hover:text-foreground dark:text-[#9dabb9]"
                          title="Modifier"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-[#9dabb9] line-clamp-2">
                      {project.description || "Aucune description"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Epics Section */}
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold">
                {selectedProject ? `Epics: ${selectedProject.nom}` : "Epics"}
              </h2>
              {selectedProject && (
                <Button asChild variant="outline" size="sm" className="gap-1 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
                  <Link href={`${ROUTES.PRODUCT_OWNER}/epics`}>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Gérer
                  </Link>
                </Button>
              )}
            </div>

            {!selectedProject ? (
              <div className="text-center py-12 text-slate-500 dark:text-[#9dabb9]">
                Sélectionnez un projet pour voir ses epics
              </div>
            ) : isEpicsLoading ? (
              <div className="text-center py-12 text-slate-500 dark:text-[#9dabb9]">
                Chargement...
              </div>
            ) : epics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-[#9dabb9] mb-4">Aucun epic</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-150 overflow-y-auto">
                {epics.map(({ epic, moduleName }) => (
                  <div
                    key={`${epic.id}-${epic.module_id}`}
                    className="p-4 rounded-lg border border-slate-200 dark:border-[#3b4754] hover:border-primary/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="material-symbols-outlined text-primary">content_cut</span>
                        <h3 className="text-white font-bold">{epic.titre}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-[#9dabb9]">
                      {epic.description || "Aucune description"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#9dabb9] mt-2">
                      Module: {moduleName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEpicStatusColor(epic.statut)}`}
                      >
                        {getEpicStatusLabel(epic.statut)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-[#9dabb9]">
                        {epic.user_stories?.length || 0} user story(ies)
                      </span>
                    </div>
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

      <AssignMembersModal
        isOpen={assignMembersModalOpen}
        onClose={() => setAssignMembersModalOpen(false)}
        onAssign={handleAssignMembers}
        projectName={projectForAssignment?.nom || ""}
        currentMemberIds={projectForAssignment?.membres?.map(m => m.id) || []}
      />

      {/* Attachments Modal */}
      {showAttachments && attachmentsProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-xl font-bold">
                  Pièces jointes
                </h2>
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm mt-1">
                  {attachmentsProject.nom}
                </p>
              </div>
              <Button
                onClick={() => setShowAttachments(false)}
                variant="ghost"
                size="icon-sm"
                className="text-slate-600 hover:bg-muted hover:text-foreground dark:text-[#9dabb9]"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </Button>
            </div>
            <AttachmentList
              attachments={attachmentsProject.attachments || []}
              onUpload={handleUploadAttachment}
              onDownload={handleDownloadAttachment}
              onDelete={handleDeleteAttachment}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
