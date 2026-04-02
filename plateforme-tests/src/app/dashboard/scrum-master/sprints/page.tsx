"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Modal } from "@/components/Modal";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import {
  getSprints,
  getSprintById,
  getSprintVelocite,
  deleteSprint,
  startSprint,
  closeSprint,
  updateSprint,
  addUserStoriesToSprint,
  removeUserStoriesFromSprint,
} from "@/features/sprints/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { getUserStories } from "@/features/userstories/api";
import { Project, Sprint, Module, Epic, UserStory, SprintVelocite } from "@/types";

export default function SprintsPage() {
  const searchParams = useSearchParams();
  const projectFromQuery = searchParams.get("project");
  const isProjectTabView = Boolean(projectFromQuery);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [detailsSprint, setDetailsSprint] = useState<Sprint | null>(null);
  const [detailsVelocite, setDetailsVelocite] = useState<SprintVelocite | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editDateDebut, setEditDateDebut] = useState("");
  const [editDateFin, setEditDateFin] = useState("");
  const [editObjectifSprint, setEditObjectifSprint] = useState("");
  const [editCapaciteEquipe, setEditCapaciteEquipe] = useState<number>(0);
  const [editDureeJours, setEditDureeJours] = useState<number>(14);
  const [editStatut, setEditStatut] = useState<string>("planifie");
  const [editAvailableStories, setEditAvailableStories] = useState<UserStory[]>([]);
  const [editSelectedStories, setEditSelectedStories] = useState<number[]>([]);
  const [editInitialStories, setEditInitialStories] = useState<number[]>([]);
  const [isEditDataLoading, setIsEditDataLoading] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const dureesSprint = [7, 10, 14, 21, 30];

  const selectedProjectData = projects.find((project) => project.id === selectedProject);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSprints(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (!projectFromQuery || projects.length === 0) return;

    const projectId = Number(projectFromQuery);
    if (!Number.isNaN(projectId) && projects.some((project) => project.id === projectId)) {
      setSelectedProject(projectId);
    }
  }, [searchParams, projects]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjectsAsMember();
      setProjects(projectsData);
    } catch (error: any) {
      console.error("Erreur chargement projets:", error);
      setError("Impossible de charger les projets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSprints = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const sprintsData = await getSprints(projectId);
      setSprints(sprintsData);
    } catch (error: any) {
      console.error("Erreur chargement sprints:", error);
      setError("Impossible de charger les sprints");
      setSprints([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSprint = async (sprintId: number) => {
    if (!selectedProject) return;
    setActionLoading(sprintId);
    try {
      await startSprint(selectedProject, sprintId);
      await loadSprints(selectedProject);
    } catch (error: any) {
      alert("Erreur lors du démarrage du sprint: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseSprint = async (sprintId: number) => {
    if (!selectedProject) return;
    if (!confirm("Êtes-vous sûr de vouloir clôturer ce sprint ?")) return;
    setActionLoading(sprintId);
    try {
      await closeSprint(selectedProject, sprintId);
      await loadSprints(selectedProject);
    } catch (error: any) {
      alert("Erreur lors de la clôture du sprint: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSprint = async (sprintId: number) => {
    if (!selectedProject) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce sprint ?")) return;
    setActionLoading(sprintId);
    try {
      await deleteSprint(selectedProject, sprintId);
      await loadSprints(selectedProject);
    } catch (error: any) {
      alert("Erreur lors de la suppression du sprint: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const openDetailsModal = async (sprint: Sprint) => {
    if (!selectedProject) return;

    setDetailsSprint(sprint);
    setIsDetailsLoading(true);
    setDetailsError(null);
    setDetailsVelocite(null);

    try {
      const fullSprint = await getSprintById(selectedProject, sprint.id);
      setDetailsSprint(fullSprint);

      try {
        const velocite = await getSprintVelocite(fullSprint.projet_id, sprint.id);
        setDetailsVelocite(velocite);
      } catch {
        setDetailsVelocite(null);
      }
    } catch (error: any) {
      setDetailsError(error.response?.data?.detail || "Impossible de charger les détails du sprint");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setDetailsSprint(null);
    setDetailsVelocite(null);
    setDetailsError(null);
    setIsDetailsLoading(false);
  };

  const openEditModal = (sprint: Sprint) => {
    setEditSprint(sprint);
    setEditNom(sprint.nom || "");
    setEditDateDebut(sprint.dateDebut ? sprint.dateDebut.split("T")[0] : "");
    setEditDateFin(sprint.dateFin ? sprint.dateFin.split("T")[0] : "");
    setEditObjectifSprint(sprint.objectifSprint || "");
    setEditCapaciteEquipe(sprint.capaciteEquipe || 0);
    setEditStatut(sprint.statut);

    const existingStoryIds = sprint.userstories?.map((us) => us.id) || [];
    setEditSelectedStories(existingStoryIds);
    setEditInitialStories(existingStoryIds);

    if (sprint.dateDebut && sprint.dateFin) {
      const debut = new Date(sprint.dateDebut);
      const fin = new Date(sprint.dateFin);
      const diffTime = Math.abs(fin.getTime() - debut.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setEditDureeJours(diffDays);
    } else {
      setEditDureeJours(14);
    }

    void loadEditProjectStories();
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditSprint(null);
    setEditAvailableStories([]);
    setEditSelectedStories([]);
    setEditInitialStories([]);
    setIsEditDataLoading(false);
    setEditError(null);
  };

  const loadEditProjectStories = async () => {
    if (!selectedProject) return;

    setIsEditDataLoading(true);
    try {
      const modulesData: Module[] = await getModules(selectedProject);
      const allEpics: Epic[] = [];
      const allStories: UserStory[] = [];

      for (const module of modulesData) {
        const epicsData = await getEpics(selectedProject, module.id);
        allEpics.push(...epicsData);

        for (const epic of epicsData) {
          try {
            const storiesData = await getUserStories(selectedProject, module.id, epic.id);
            allStories.push(...storiesData);
          } catch (err) {
            console.warn("Erreur chargement stories pour epic:", epic.id);
          }
        }
      }

      const uniqueStories = Array.from(new Map(allStories.map((story) => [story.id, story])).values());
      setEditAvailableStories(uniqueStories);
    } catch (error) {
      console.error("Erreur chargement user stories pour modification sprint:", error);
    } finally {
      setIsEditDataLoading(false);
    }
  };

  const handleToggleEditStory = (storyId: number) => {
    setEditSelectedStories((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const handleEditDateDebutChange = (newDateDebut: string) => {
    setEditDateDebut(newDateDebut);
    if (newDateDebut && editDureeJours) {
      const debut = new Date(newDateDebut);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + editDureeJours);
      setEditDateFin(fin.toISOString().split("T")[0]);
    }
  };

  const handleEditDureeChange = (newDuree: number) => {
    setEditDureeJours(newDuree);
    if (editDateDebut) {
      const debut = new Date(editDateDebut);
      const fin = new Date(debut);
      fin.setDate(debut.getDate() + newDuree);
      setEditDateFin(fin.toISOString().split("T")[0]);
    }
  };

  const handleUpdateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editSprint) return;

    if (!editNom.trim()) {
      setEditError("Le nom du sprint est obligatoire.");
      return;
    }

    if (editDateDebut && editDateFin && new Date(editDateFin) <= new Date(editDateDebut)) {
      setEditError("La date de fin doit être après la date de début.");
      return;
    }

    if (editCapaciteEquipe <= 0) {
      setEditError("La capacité de l'équipe doit être supérieure à 0.");
      return;
    }

    setIsEditSubmitting(true);
    setEditError(null);
    try {
      await updateSprint(selectedProject, editSprint.id, {
        nom: editNom.trim(),
        dateDebut: editDateDebut || undefined,
        dateFin: editDateFin || undefined,
        objectifSprint: editObjectifSprint.trim() || undefined,
        capaciteEquipe: editCapaciteEquipe,
      });

      const storiesToAdd = editSelectedStories.filter((id) => !editInitialStories.includes(id));
      const storiesToRemove = editInitialStories.filter((id) => !editSelectedStories.includes(id));

      if (storiesToRemove.length > 0) {
        await removeUserStoriesFromSprint(selectedProject, editSprint.id, {
          userstory_ids: storiesToRemove,
        });
      }

      if (storiesToAdd.length > 0) {
        await addUserStoriesToSprint(selectedProject, editSprint.id, {
          userstory_ids: storiesToAdd,
        });
      }

      await loadSprints(selectedProject);
      closeEditModal();
    } catch (error: any) {
      setEditError(error.response?.data?.detail || "Erreur lors de la modification du sprint");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const totalEditPointsSelected = editAvailableStories
    .filter((story) => editSelectedStories.includes(story.id))
    .reduce((sum, story) => sum + (story.points || 0), 0);

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
    { href: `${ROUTES.SCRUM_MASTER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "bg-primary/20 text-primary";
      case "termine":
        return "bg-[#0bda5b]/20 text-[#0bda5b]";
      case "planifie":
      default:
        return "bg-[#9dabb9]/20 text-[#9dabb9]";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "en_cours":
        return "En cours";
      case "termine":
        return "Terminé";
      case "planifie":
      default:
        return "Planifié";
    }
  };

  const getUSStatusColor = (statut: string) => {
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

  const getUSStatusLabel = (statut: string) => {
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

  const getPriorityColor = (priorite: string) => {
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
          title="Gestion des Sprints"
          subtitle="Planifiez et suivez vos sprints"
          actions={
            selectedProject && (
              <Link
                href={`${ROUTES.SCRUM_MASTER}/sprints/new?project=${selectedProject}`}
                className="flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden xs:inline">Nouveau Sprint</span>
                <span className="xs:hidden">Nouveau</span>
              </Link>
            )
          }
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        {projects.length > 0 && !isProjectTabView && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
            <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Projet</label>
            <select
              value={selectedProject || ""}
              onChange={(e) => {
                const value = e.target.value;

                if (!value) {
                  setSelectedProject(null);
                  setSprints([]);
                  setError(null);
                  return;
                }

                const targetUrl = `${ROUTES.SCRUM_MASTER}/sprints?project=${value}`;
                window.open(targetUrl, "_blank", "noopener,noreferrer");
              }}
              className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="">Choisir un projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isLoading && projects.length === 0 && !error && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-slate-500 dark:text-[#9dabb9] text-5xl mb-4">folder_off</span>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-2">Aucun projet disponible</h3>
            <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
              Vous devez être membre d’un projet pour gérer les sprints.
            </p>
          </div>
        )}

        {!selectedProject && projects.length > 0 && !isLoading && !isProjectTabView && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-slate-500 dark:text-[#9dabb9] text-5xl mb-4">folder_open</span>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-2">Sélectionnez un projet</h3>
            <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
              Choisissez un projet pour l'ouvrir dans un nouvel onglet avec ses sprints.
            </p>
          </div>
        )}

        {selectedProject && selectedProjectData && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
            <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-1">Projet sélectionné</p>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold">{selectedProjectData.nom}</h2>
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Sprints List */}
        {!isLoading && selectedProject && sprints.length === 0 && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-slate-500 dark:text-[#9dabb9] text-5xl mb-4">calendar_month</span>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-2">Aucun sprint</h3>
            <p className="text-slate-500 dark:text-[#9dabb9] text-sm mb-4">
              Commencez par créer votre premier sprint
            </p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/sprints/new${selectedProject ? `?project=${selectedProject}` : ''}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nouveau Sprint</span>
            </Link>
          </div>
        )}

        {!isLoading && selectedProject && sprints.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-slate-900 dark:text-white text-xl font-bold">Sprints ({sprints.length})</h2>
              {selectedProject && (
                <Link
                  href={`${ROUTES.SCRUM_MASTER}/sprints/new?project=${selectedProject}`}
                  className="sm:hidden flex items-center gap-2 px-3 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Nouveau</span>
                </Link>
              )}
            </div>
            <div className="space-y-4">
            {sprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-slate-900 dark:text-white text-lg font-bold">{sprint.nom}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(sprint.statut)}`}>
                        {getStatusLabel(sprint.statut)}
                      </span>
                    </div>
                    {sprint.objectifSprint && (
                      <p className="text-slate-500 dark:text-[#9dabb9] text-sm mb-3">{sprint.objectifSprint}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {sprint.dateDebut && sprint.dateFin && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">event</span>
                          <span>
                            {new Date(sprint.dateDebut).toLocaleDateString("fr-FR")} -{" "}
                            {new Date(sprint.dateFin).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                      {sprint.capaciteEquipe && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">speed</span>
                          <span>Capacité: {sprint.capaciteEquipe} pts</span>
                        </div>
                      )}
                      {sprint.userstories && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-[#9dabb9]">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          <span>{sprint.userstories.length} user stories</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDetailsModal(sprint)}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Voir détails"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-primary">visibility</span>
                    </button>
                    <button
                      onClick={() => openEditModal(sprint)}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Modifier"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-primary">edit</span>
                    </button>
                    {sprint.statut === "planifie" && (
                      <button
                        onClick={() => handleStartSprint(sprint.id)}
                        disabled={actionLoading === sprint.id}
                        className="p-2 hover:bg-[#0bda5b]/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Démarrer"
                      >
                        <span className="material-symbols-outlined text-[#0bda5b]">play_arrow</span>
                      </button>
                    )}
                    {sprint.statut === "en_cours" && (
                      <button
                        onClick={() => handleCloseSprint(sprint.id)}
                        disabled={actionLoading === sprint.id}
                        className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Clôturer"
                      >
                        <span className="material-symbols-outlined text-yellow-500">check_circle</span>
                      </button>
                    )}
                    {sprint.statut === "planifie" && (
                      <button
                        onClick={() => handleDeleteSprint(sprint.id)}
                        disabled={actionLoading === sprint.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-red-400">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {sprint.userstories && sprint.userstories.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#9dabb9] mb-2">
                      <span>Progression</span>
                      <span>
                        {sprint.userstories.filter((us) => us.statut === "done").length} /{" "}
                        {sprint.userstories.length} terminées
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-[#283039] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${
                            (sprint.userstories.filter((us) => us.statut === "done").length /
                              sprint.userstories.length) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(detailsSprint)}
        onClose={closeDetailsModal}
        title={detailsSprint ? `Détails - ${detailsSprint.nom}` : "Détails du sprint"}
        size="lg"
      >
        {isDetailsLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {detailsError && !isDetailsLoading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{detailsError}</p>
          </div>
        )}

        {!isDetailsLoading && !detailsError && detailsSprint && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Statut</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    detailsSprint.statut === "en_cours"
                      ? "bg-primary/20 text-primary"
                      : detailsSprint.statut === "termine"
                      ? "bg-[#0bda5b]/20 text-[#0bda5b]"
                      : "bg-[#9dabb9]/20 text-[#9dabb9]"
                  }`}
                >
                  {detailsSprint.statut === "en_cours"
                    ? "En cours"
                    : detailsSprint.statut === "termine"
                    ? "Terminé"
                    : "Planifié"}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Période</p>
                <p className="text-slate-900 dark:text-white text-sm">
                  {detailsSprint.dateDebut
                    ? new Date(detailsSprint.dateDebut).toLocaleDateString("fr-FR")
                    : "Non défini"}{" "}
                  -{" "}
                  {detailsSprint.dateFin
                    ? new Date(detailsSprint.dateFin).toLocaleDateString("fr-FR")
                    : "Non défini"}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Capacité</p>
                <p className="text-slate-900 dark:text-white text-lg font-bold">
                  {detailsSprint.capaciteEquipe || "Non défini"} points
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
              <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Objectif du Sprint</p>
              <p className="text-slate-700 dark:text-white text-sm">{detailsSprint.objectifSprint || "Aucun objectif défini."}</p>
            </div>

            {detailsVelocite && (
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <h3 className="text-slate-900 dark:text-white text-base font-bold mb-4">Métriques du Sprint</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-1">Vélocité</p>
                    <p className="text-slate-900 dark:text-white text-xl font-bold">{detailsVelocite.velocite}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-1">Points Total</p>
                    <p className="text-slate-900 dark:text-white text-xl font-bold">{detailsVelocite.points_total}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-1">Points Terminés</p>
                    <p className="text-[#0bda5b] text-xl font-bold">{detailsVelocite.points_termines}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-1">US Terminées</p>
                    <p className="text-slate-900 dark:text-white text-xl font-bold">
                      {detailsVelocite.nb_terminees} / {detailsVelocite.nb_userstories}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
              <h3 className="text-slate-900 dark:text-white text-base font-bold mb-3">
                User Stories ({detailsSprint.userstories?.length || 0})
              </h3>
              {!detailsSprint.userstories || detailsSprint.userstories.length === 0 ? (
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm">Aucune user story dans ce sprint.</p>
              ) : (
                <div className="space-y-3">
                  {detailsSprint.userstories.map((us) => (
                    <div
                      key={us.id}
                      className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {us.reference && (
                          <span className="text-slate-600 dark:text-[#c5d2df] text-xs font-mono bg-white dark:bg-[#1f2730] border border-slate-200 dark:border-[#3b4754] px-2 py-0.5 rounded">
                            {us.reference}
                          </span>
                        )}
                        <p className="text-slate-800 dark:text-white text-sm font-semibold">{us.titre}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getUSStatusColor(us.statut || "to_do")}`}>
                          {getUSStatusLabel(us.statut || "to_do")}
                        </span>
                        {us.priorite && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-[#1f2730] ${getPriorityColor(us.priorite)}`}>
                            {us.priorite.replace("_", " ").toUpperCase()}
                          </span>
                        )}
                        {us.points !== null && us.points !== undefined && (
                          <span className="text-slate-600 dark:text-[#c5d2df] text-xs font-medium">{us.points} pts</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editSprint)}
        onClose={closeEditModal}
        title={editSprint ? `Modifier - ${editSprint.nom}` : "Modifier le sprint"}
        size="lg"
      >
        <form onSubmit={handleUpdateSprint} className="space-y-6">
          {editError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {editError}
            </div>
          )}

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <div>
                <p className="text-slate-900 dark:text-white text-sm">
                  Statut actuel: <span className="font-bold">{editStatut}</span>
                </p>
                {editStatut !== "planifie" && (
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs mt-1">
                    Certaines modifications peuvent être limitées pour un sprint en cours ou terminé.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 space-y-4">
            <h3 className="text-slate-900 dark:text-white text-lg font-bold">Informations du Sprint</h3>

            <div>
              <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Nom du sprint</label>
              <input
                type="text"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Objectif</label>
              <textarea
                value={editObjectifSprint}
                onChange={(e) => setEditObjectifSprint(e.target.value)}
                rows={3}
                className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">
                  Durée du Sprint (jours)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {dureesSprint.map((duree) => (
                    <button
                      key={duree}
                      type="button"
                      onClick={() => handleEditDureeChange(duree)}
                      disabled={editStatut !== "planifie"}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${
                        editDureeJours === duree
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-[#283039] text-slate-600 dark:text-[#9dabb9] hover:bg-slate-200 dark:hover:bg-[#3b4754]"
                      } ${editStatut !== "planifie" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {duree}j
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Capacité équipe (points)</label>
                <input
                  type="number"
                  value={editCapaciteEquipe || ""}
                  onChange={(e) => setEditCapaciteEquipe(Number(e.target.value))}
                  min={1}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Date de début</label>
                <input
                  type="date"
                  value={editDateDebut}
                  onChange={(e) => handleEditDateDebutChange(e.target.value)}
                  disabled={editStatut !== "planifie"}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Date de fin</label>
                <input
                  type="date"
                  value={editDateFin}
                  onChange={(e) => setEditDateFin(e.target.value)}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">User Stories du Sprint</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500 dark:text-[#9dabb9]">{editSelectedStories.length} stories sélectionnées</span>
                <span className={`font-bold ${totalEditPointsSelected > editCapaciteEquipe ? "text-red-400" : "text-[#0bda5b]"}`}>
                  {totalEditPointsSelected} / {editCapaciteEquipe} points
                </span>
              </div>
            </div>

            {totalEditPointsSelected > editCapaciteEquipe && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">
                  Attention: le total des points dépasse la capacité de l'équipe.
                </p>
              </div>
            )}

            {isEditDataLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : editAvailableStories.length === 0 ? (
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">Aucune user story disponible dans ce projet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {editAvailableStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleToggleEditStory(story.id)}
                    className={`bg-slate-50 dark:bg-[#283039] border rounded-lg p-3 cursor-pointer transition-all ${
                      editSelectedStories.includes(story.id)
                        ? "border-primary bg-primary/10"
                        : "border-slate-200 dark:border-[#3b4754] hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={editSelectedStories.includes(story.id)}
                        onChange={() => handleToggleEditStory(story.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {story.reference && (
                            <span className="text-slate-600 dark:text-[#c5d2df] text-xs font-mono bg-white dark:bg-[#1f2730] border border-slate-200 dark:border-[#3b4754] px-2 py-0.5 rounded">
                              {story.reference}
                            </span>
                          )}
                          <p className="text-slate-800 dark:text-white text-sm font-semibold">{story.titre}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {story.statut && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getUSStatusColor(story.statut)}`}>
                              {getUSStatusLabel(story.statut)}
                            </span>
                          )}
                          {story.priorite && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-[#1f2730] ${getPriorityColor(story.priorite)}`}>
                              {story.priorite.replace("_", " ").toUpperCase()}
                            </span>
                          )}
                          {story.points !== null && story.points !== undefined && (
                            <span className="text-slate-600 dark:text-[#c5d2df] text-xs font-medium">{story.points} pts</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#9dabb9] hover:bg-slate-100 dark:hover:bg-[#283039] rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isEditSubmitting}
              className="px-4 py-2 text-sm font-bold bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isEditSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
