"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { Modal } from "@/components/Modal";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import {
  getUserStories,
  getUserStoryById,
  updateUserStory,
  changeUserStoryStatus,
  assignDeveloper,
  assignTester,
  assignAssignee,
  removeAssignee,
} from "@/features/userstories/api";
import { getProjectById } from "@/features/projects/api";
import { Project, Module, Epic, UserStory, MemberSimple, PrioriteUS } from "@/types";

export default function UserStoriesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [allEpics, setAllEpics] = useState<Epic[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<number | null>(null);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [detailsUserStory, setDetailsUserStory] = useState<UserStory | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [editUserStory, setEditUserStory] = useState<UserStory | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editTitre, setEditTitre] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editAction, setEditAction] = useState("");
  const [editBenefice, setEditBenefice] = useState("");
  const [editPoints, setEditPoints] = useState<number | null>(null);
  const [editDureeEstimee, setEditDureeEstimee] = useState<number | null>(null);
  const [editPriorite, setEditPriorite] = useState<PrioriteUS>("must_have");
  const [editCriteresAcceptation, setEditCriteresAcceptation] = useState("");
  const [editReference, setEditReference] = useState("");
  
  const [projectMembers, setProjectMembers] = useState<MemberSimple[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState<number | null>(null);
  const [developerLoading, setDeveloperLoading] = useState<number | null>(null);
  const [testerLoading, setTesterLoading] = useState<number | null>(null);

  const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];
  const priorites: { value: PrioriteUS; label: string; color: string }[] = [
    { value: "must_have", label: "Must Have", color: "text-red-400" },
    { value: "should_have", label: "Should Have", color: "text-orange-400" },
    { value: "could_have", label: "Could Have", color: "text-yellow-400" },
    { value: "wont_have", label: "Won't Have", color: "text-gray-400" },
  ];

  const [filters, setFilters] = useState({
    statut: "",
    priorite: "",
  });
  const selectedProjectData = projects.find((project) => project.id === selectedProject) ?? null;

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      // Reset dependent selectors to avoid requests with stale IDs
      setSelectedModule(null);
      setSelectedEpic(null);
      setModules([]);
      setEpics([]);
      setAllEpics([]);
      setUserStories([]);

      loadModules(selectedProject);
      loadProjectMembers(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      // Reset epic-dependent data when module changes
      setSelectedEpic(null);
      setEpics([]);
      setUserStories([]);

      loadEpics(selectedProject, selectedModule);
    }
  }, [selectedProject, selectedModule]);

  useEffect(() => {
    if (selectedProject) {
      loadUserStories(selectedProject, selectedModule, selectedEpic);
    }
  }, [selectedProject, selectedModule, selectedEpic, filters]);

  const loadProjectMembers = async (projectId: number) => {
    try {
      const project = await getProjectById(projectId);
      setProjectMembers(project.membres || []);
    } catch (error: any) {
      console.error("Erreur chargement membres du projet:", error);
      setProjectMembers([]);
    }
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjectsAsMember();
      console.log("Projets chargés:", projectsData); // Debug
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      } else {
        console.warn("Aucun projet trouvé pour cet utilisateur");
      }
    } catch (error: any) {
      console.error("Erreur chargement projets:", error);
      console.error("Détails erreur:", error.response?.data);
      setError("Impossible de charger les projets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadModules = async (projectId: number) => {
    try {
      const modulesData = await getModules(projectId);
      setModules(modulesData);
      setSelectedModule(null);
      setSelectedEpic(null);
      if (modulesData.length === 0) {
        setEpics([]);
        setAllEpics([]);
        setUserStories([]);
      }
    } catch (error: any) {
      console.error("Erreur chargement modules:", error);
      setModules([]);
      setAllEpics([]);
      setSelectedModule(null);
      setSelectedEpic(null);
      setEpics([]);
      setUserStories([]);
    }
  };

  const loadEpics = async (projectId: number, moduleId: number | null) => {
    try {
      if (!moduleId) {
        const modulesData = modules.length > 0 ? modules : await getModules(projectId);
        if (modulesData.length === 0) {
          setEpics([]);
          setAllEpics([]);
          setSelectedEpic(null);
          return;
        }

        const epicLists = await Promise.all(
          modulesData.map((module) => getEpics(projectId, module.id).catch(() => []))
        );
        const epicsData = epicLists.flat();
        setAllEpics(epicsData);
        setEpics(epicsData);
        setSelectedEpic(null);
        return;
      }

      const epicsData = await getEpics(projectId, moduleId);
      setEpics(epicsData);
      setAllEpics((prev) => (prev.length > 0 ? prev : epicsData));
      setSelectedEpic(null);
    } catch (error: any) {
      console.error("Erreur chargement epics:", error);
      setEpics([]);
      setAllEpics([]);
      setSelectedEpic(null);
      setUserStories([]);
    }
  };

  const loadUserStories = async (
    projectId: number,
    moduleId: number | null,
    epicId: number | null
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const statut = filters.statut as any;
      let usData: UserStory[] = [];

      if (moduleId && epicId) {
        usData = await getUserStories(projectId, moduleId, epicId, statut);
      } else if (moduleId && !epicId) {
        const epicsData = epics.length > 0 ? epics : await getEpics(projectId, moduleId);
        const results = await Promise.all(
          epicsData.map((epic) =>
            getUserStories(projectId, moduleId, epic.id, statut).catch(() => [])
          )
        );
        usData = results.flat();
      } else {
        const modulesData = modules.length > 0 ? modules : await getModules(projectId);
        const epicLists = await Promise.all(
          modulesData.map((module) => getEpics(projectId, module.id).catch(() => []))
        );
        const epicsData = epicLists.flat();
        const results = await Promise.all(
          epicsData.map((epic) =>
            getUserStories(projectId, epic.module_id, epic.id, statut).catch(() => [])
          )
        );
        usData = results.flat();
      }

      let filteredData = usData;
      
      // Filter by priority if selected
      if (filters.priorite) {
        filteredData = filteredData.filter(us => us.priorite === filters.priorite);
      }
      
      setUserStories(filteredData);
    } catch (error: any) {
      console.error("Erreur chargement user stories:", error);
      // During fast selector changes, API can briefly answer 404 for stale combinations.
      if (error?.response?.status === 404) {
        setUserStories([]);
      } else {
        setError("Impossible de charger les user stories");
        setUserStories([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatus = async (
    usId: number,
    newStatus: "to_do" | "in_progress" | "done",
    epicId?: number
  ) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;
    setActionLoading(usId);
    try {
      await changeUserStoryStatus(selectedProject, resolvedModuleId, resolvedEpicId, usId, { statut: newStatus });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors du changement de statut: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignAssignee = async (usId: number, memberId: number, epicId?: number) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;
    setAssigneeLoading(usId);
    try {
      await assignAssignee(selectedProject, resolvedModuleId, resolvedEpicId, usId, { assignee_id: memberId });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors de l'assignation: " + (error.response?.data?.detail || error.message));
    } finally {
      setAssigneeLoading(null);
    }
  };

  const handleRemoveAssignee = async (usId: number, epicId?: number) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;
    setAssigneeLoading(usId);
    try {
      await removeAssignee(selectedProject, resolvedModuleId, resolvedEpicId, usId);
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors du retrait de l'assignee: " + (error.response?.data?.detail || error.message));
    } finally {
      setAssigneeLoading(null);
    }
  };

  const handleAssignDeveloper = async (usId: number, memberId: number, epicId?: number) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;
    setDeveloperLoading(usId);
    try {
      await assignDeveloper(selectedProject, resolvedModuleId, resolvedEpicId, usId, { developeur_id: memberId });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors de l'assignation du développeur: " + (error.response?.data?.detail || error.message));
    } finally {
      setDeveloperLoading(null);
    }
  };

  const handleAssignTester = async (usId: number, memberId: number, epicId?: number) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;
    setTesterLoading(usId);
    try {
      await assignTester(selectedProject, resolvedModuleId, resolvedEpicId, usId, { testeur_id: memberId });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors de l'assignation du testeur: " + (error.response?.data?.detail || error.message));
    } finally {
      setTesterLoading(null);
    }
  };

  const parseDescriptionParts = (description?: string) => {
    if (!description) return { role: "", action: "", benefice: "" };

    const regex = /En tant que\s+(.+?),\s*je veux\s+(.+?)(?:,\s*afin de\s+(.+))?\.?$/i;
    const match = description.match(regex);

    if (!match) {
      return { role: "", action: "", benefice: "" };
    }

    return {
      role: match[1] || "",
      action: match[2] || "",
      benefice: match[3] || "",
    };
  };

  const openDetailsModal = async (usId: number, epicId?: number) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;

    setDetailsError(null);
    setIsDetailsLoading(true);
    setDetailsUserStory(null);

    try {
      const userStory = await getUserStoryById(selectedProject, resolvedModuleId, resolvedEpicId, usId);
      setDetailsUserStory(userStory);
    } catch (error: any) {
      setDetailsError(error.response?.data?.detail || "Impossible de charger les détails de la user story");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setDetailsUserStory(null);
    setDetailsError(null);
    setIsDetailsLoading(false);
  };

  const openEditModal = async (usId: number, epicId?: number) => {
    if (!selectedProject) return;
    const resolvedEpicId = epicId ?? selectedEpic;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;

    setEditError(null);
    setIsEditLoading(true);
    setEditUserStory(null);

    try {
      const userStory = await getUserStoryById(selectedProject, resolvedModuleId, resolvedEpicId, usId);
      const parsed = parseDescriptionParts(userStory.description);

      setEditUserStory(userStory);
      setEditTitre(userStory.titre || "");
      setEditReference(userStory.reference || "");
      setEditRole(parsed.role);
      setEditAction(parsed.action);
      setEditBenefice(parsed.benefice);
      setEditPoints(userStory.points ?? null);
      setEditDureeEstimee(userStory.duree_estimee ?? null);
      setEditPriorite((userStory.priorite || "must_have") as PrioriteUS);
      setEditCriteresAcceptation(userStory.criteresAcceptation || "");
    } catch (error: any) {
      setEditError(error.response?.data?.detail || "Impossible de charger la user story pour modification");
    } finally {
      setIsEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditUserStory(null);
    setIsEditLoading(false);
    setIsEditSubmitting(false);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editUserStory) return;
    const resolvedEpicId = selectedEpic ?? editUserStory.epic_id;
    const resolvedModuleId = selectedModule ?? allEpics.find((epic) => epic.id === resolvedEpicId)?.module_id;
    if (!resolvedModuleId || !resolvedEpicId) return;

    if (!editTitre.trim() || !editRole.trim() || !editAction.trim()) {
      setEditError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsEditSubmitting(true);
    setEditError(null);

    try {
      await updateUserStory(selectedProject, resolvedModuleId, resolvedEpicId, editUserStory.id, {
        titre: editTitre.trim(),
        role: editRole.trim(),
        action: editAction.trim(),
        benefice: editBenefice.trim() || undefined,
        points: editPoints || undefined,
        duree_estimee: editDureeEstimee || undefined,
        priorite: editPriorite,
        criteresAcceptation: editCriteresAcceptation.trim() || undefined,
      });

      await loadUserStories(selectedProject, selectedModule, selectedEpic);
      closeEditModal();
    } catch (error: any) {
      setEditError(error.response?.data?.detail || "Erreur lors de la modification de la user story");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const sidebarLinks = [
    { href: ROUTES.SCRUM_MASTER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SCRUM_MASTER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.SCRUM_MASTER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.SCRUM_MASTER}/user-stories`, icon: "description", label: "User Stories" },
    { href: `${ROUTES.SCRUM_MASTER}/team`, icon: "groups", label: "Équipe" },
    { href: `${ROUTES.SCRUM_MASTER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
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

  const getPriorityLabel = (priorite: string) => {
    return priorite.replace("_", " ").toUpperCase();
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
          title="Gestion des User Stories"
          subtitle="Décomposition des epics et affectation des tâches"
          actions={
            <Link
              href={`${ROUTES.SCRUM_MASTER}/user-stories/new`}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden md:inline">Nouvelle User Story</span>
            </Link>
          }
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Selectors */}
        <div className="flex flex-col gap-4">
          {/* Project Selector */}
          {projects.length > 0 ? (
            <ProjectSelectorCard
              projects={projects.map((project) => ({ id: project.id, nom: project.nom }))}
              selectedProjectId={selectedProject}
              selectedProjectName={selectedProjectData?.nom ?? null}
              onSelectProject={(projectId) => {
                setSelectedModule(null);
                setSelectedEpic(null);
                setUserStories([]);
                setSelectedProject(projectId);
              }}
              badgeText="Gestion des user stories"
              title="Projet"
              description="Sélectionnez un projet pour gérer ses modules, epics et user stories."
              placeholder="-- Sélectionnez un projet --"
            />
          ) : !isLoading && (
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Projet</label>
              <p className="text-red-400 text-sm">Aucun projet disponible. Vous devez être Product Owner d'un projet ou membre d'un projet.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Module Selector */}
            {modules.length > 0 && (
              <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
                <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Module</label>
                <select
                  value={selectedModule || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const moduleId = value ? Number(value) : null;
                    setSelectedEpic(null);
                    setSelectedModule(moduleId);
                  }}
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Tous les modules</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Epic Selector */}
            {epics.length > 0 && (
              <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
                <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Epic</label>
                <select
                  value={selectedEpic || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedEpic(value ? Number(value) : null);
                  }}
                  className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Tous les epics</option>
                  {epics.map((epic) => (
                    <option key={epic.id} value={epic.id}>
                      {epic.titre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filters */}
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <h3 className="text-white text-sm font-bold mb-3">Filtres</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>
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

        {/* User Stories List */}
        {!isLoading && userStories.length === 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">description</span>
            <h3 className="text-white text-lg font-bold mb-2">Aucune user story</h3>
            <p className="text-[#9dabb9] text-sm mb-4">
              Aucune user story ne correspond aux filtres ou à la sélection actuelle.
            </p>
            <Link
              href={`${ROUTES.SCRUM_MASTER}/user-stories/new${selectedProject && selectedModule && selectedEpic ? `?project=${selectedProject}&module=${selectedModule}&epic=${selectedEpic}` : ''}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Nouvelle User Story</span>
            </Link>
          </div>
        )}

        {!isLoading && userStories.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-xl font-bold">User Stories ({userStories.length})</h2>
              <Link
                href={`${ROUTES.SCRUM_MASTER}/user-stories/new${selectedProject && selectedModule && selectedEpic ? `?project=${selectedProject}&module=${selectedModule}&epic=${selectedEpic}` : ''}`}
                className="sm:hidden flex items-center gap-2 px-3 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Nouvelle</span>
              </Link>
            </div>
            <div className="space-y-4">
            {userStories.map((us) => (
              <div
                key={us.id}
                className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {us.reference && (
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-mono font-bold rounded">
                          {us.reference}
                        </span>
                      )}
                      <h3 className="text-white text-lg font-bold">{us.titre}</h3>
                    </div>
                    
                    {us.description && (
                      <p className="text-[#9dabb9] text-sm mb-3">{us.description}</p>
                    )}
                    
                    {us.criteresAcceptation && (
                      <div className="mb-3">
                        <p className="text-[#9dabb9] text-xs font-bold uppercase mb-1">
                          Critères d'acceptation
                        </p>
                        <p className="text-white text-sm whitespace-pre-line">
                          {us.criteresAcceptation}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(us.statut)}`}>
                        {getStatusLabel(us.statut)}
                      </span>
                      <span className={`text-xs font-bold ${getPriorityColor(us.priorite)}`}>
                        {getPriorityLabel(us.priorite)}
                      </span>
                      {us.points !== null && us.points !== undefined && (
                        <span className="px-2 py-1 bg-[#283039] rounded text-xs font-bold text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">speed</span>
                          {us.points} pts
                        </span>
                      )}
                      {us.duree_estimee !== null && us.duree_estimee !== undefined && (
                        <span className="px-2 py-1 bg-[#283039] rounded text-xs font-bold text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {us.duree_estimee}h
                        </span>
                      )}
                      {us.developer && (
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">code</span>
                          {us.developer.nom}
                        </span>
                      )}
                      {us.tester && (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bug_report</span>
                          {us.tester.nom}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openDetailsModal(us.id, us.epic_id)}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Voir détails"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-primary">visibility</span>
                    </button>
                    <button
                      onClick={() => openEditModal(us.id, us.epic_id)}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Modifier"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-primary">edit</span>
                    </button>
                  </div>
                </div>

                {/* Developer & Tester Assignment */}
                <div className="pt-4 border-t border-[#3b4754] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Développeur */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#9dabb9] text-xs font-bold">Développeur:</span>
                    {us.developer ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">code</span>
                        {us.developer.nom}
                      </span>
                    ) : (
                      <span className="text-[#9dabb9] text-xs italic">Non assigné</span>
                    )}
                    {projectMembers.length > 0 && (
                      <select
                        value=""
                        disabled={developerLoading === us.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleAssignDeveloper(us.id, Number(val), us.epic_id);
                        }}
                        className="bg-[#283039] border border-[#3b4754] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                      >
                        <option value="">
                          {us.developer ? "Changer" : "Assigner"}
                        </option>
                        {projectMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nom} ({m.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Testeur QA */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#9dabb9] text-xs font-bold">Testeur QA:</span>
                    {us.tester ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">bug_report</span>
                        {us.tester.nom}
                      </span>
                    ) : (
                      <span className="text-[#9dabb9] text-xs italic">Non assigné</span>
                    )}
                    {projectMembers.length > 0 && (
                      <select
                        value=""
                        disabled={testerLoading === us.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleAssignTester(us.id, Number(val), us.epic_id);
                        }}
                        className="bg-[#283039] border border-[#3b4754] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-400 disabled:opacity-50"
                      >
                        <option value="">
                          {us.tester ? "Changer" : "Assigner"}
                        </option>
                        {projectMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nom} ({m.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Assignee Section */}
                <div className="pt-4 border-t border-[#3b4754]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#9dabb9] text-xs font-bold">Responsable (Assignee):</span>
                    {us.assignee ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-bold">
                          <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                          {us.assignee.nom}
                        </span>
                        <button
                          onClick={() => handleRemoveAssignee(us.id, us.epic_id)}
                          disabled={assigneeLoading === us.id}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          title="Retirer l'assignee"
                        >
                          <span className="material-symbols-outlined text-red-400 text-[16px]">
                            {assigneeLoading === us.id ? "hourglass_empty" : "person_remove"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[#9dabb9] text-xs italic">Non assigné</span>
                    )}
                    {projectMembers.length > 0 && (
                      <select
                        value=""
                        disabled={assigneeLoading === us.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleAssignAssignee(us.id, Number(val), us.epic_id);
                        }}
                        className="bg-[#283039] border border-[#3b4754] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-400 disabled:opacity-50"
                      >
                        <option value="">
                          {us.assignee ? "Changer l'assignee" : "Assigner un responsable"}
                        </option>
                        {projectMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.nom} ({member.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Quick Status Change */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#3b4754]">
                  <span className="text-[#9dabb9] text-xs font-bold mr-2">Changer le statut:</span>
                  <button
                    onClick={() => handleChangeStatus(us.id, "to_do", us.epic_id)}
                    disabled={actionLoading === us.id || us.statut === "to_do"}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      us.statut === "to_do"
                        ? "bg-[#9dabb9]/20 text-[#9dabb9] cursor-not-allowed"
                        : "bg-[#9dabb9]/10 text-[#9dabb9] hover:bg-[#9dabb9]/20"
                    }`}
                  >
                    À faire
                  </button>
                  <button
                    onClick={() => handleChangeStatus(us.id, "in_progress", us.epic_id)}
                    disabled={actionLoading === us.id || us.statut === "in_progress"}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      us.statut === "in_progress"
                        ? "bg-primary/20 text-primary cursor-not-allowed"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    En cours
                  </button>
                  <button
                    onClick={() => handleChangeStatus(us.id, "done", us.epic_id)}
                    disabled={actionLoading === us.id || us.statut === "done"}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      us.statut === "done"
                        ? "bg-[#0bda5b]/20 text-[#0bda5b] cursor-not-allowed"
                        : "bg-[#0bda5b]/10 text-[#0bda5b] hover:bg-[#0bda5b]/20"
                    }`}
                  >
                    Terminée
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(detailsUserStory) || isDetailsLoading || Boolean(detailsError)}
        onClose={closeDetailsModal}
        title={detailsUserStory ? `Détails - ${detailsUserStory.titre}` : "Détails de la User Story"}
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

        {!isDetailsLoading && !detailsError && detailsUserStory && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Référence</p>
                <p className="text-slate-900 dark:text-white text-lg font-mono font-bold">
                  {detailsUserStory.reference || "Non définie"}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Statut</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(detailsUserStory.statut || "to_do")}`}>
                  {getStatusLabel(detailsUserStory.statut || "to_do")}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Points</p>
                <p className="text-slate-900 dark:text-white text-xl font-bold">
                  {detailsUserStory.points !== null && detailsUserStory.points !== undefined ? detailsUserStory.points : "-"}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Durée Estimée</p>
                <p className="text-slate-900 dark:text-white text-xl font-bold">
                  {detailsUserStory.duree_estimee !== null && detailsUserStory.duree_estimee !== undefined
                    ? `${detailsUserStory.duree_estimee}h`
                    : "-"}
                </p>
              </div>
            </div>

            {detailsUserStory.priorite && (
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Priorité</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(detailsUserStory.priorite)}`}>
                  {getPriorityLabel(detailsUserStory.priorite)}
                </span>
              </div>
            )}

            {detailsUserStory.description && (
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Description</p>
                <p className="text-slate-800 dark:text-white text-sm whitespace-pre-wrap">{detailsUserStory.description}</p>
              </div>
            )}

            {detailsUserStory.criteresAcceptation && (
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-4">
                <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase mb-2">Critères d'acceptation</p>
                <p className="text-slate-800 dark:text-white text-sm whitespace-pre-wrap">{detailsUserStory.criteresAcceptation}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editUserStory) || isEditLoading}
        onClose={closeEditModal}
        title={editUserStory ? `Modifier - ${editUserStory.titre}` : "Modifier la User Story"}
        size="lg"
      >
        {isEditLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {!isEditLoading && editUserStory && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{editError}</p>
              </div>
            )}

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 space-y-4">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">Définition de la User Story</h3>
              <div className="bg-slate-50 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg p-3">
                <p className="text-slate-600 dark:text-[#9dabb9] text-sm">
                  Format: <span className="text-slate-900 dark:text-white font-medium">En tant que [RÔLE], je veux [ACTION] afin de [BÉNÉFICE]</span>
                </p>
              </div>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Titre *</label>
                <input
                  type="text"
                  value={editTitre}
                  onChange={(e) => setEditTitre(e.target.value)}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Référence</label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  disabled
                  className="w-full bg-slate-100 dark:bg-[#1f2730] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-500 dark:text-[#9dabb9]"
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Rôle (En tant que...) *</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Action (Je veux...) *</label>
                <input
                  type="text"
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Bénéfice (Afin de...)</label>
                <input
                  type="text"
                  value={editBenefice}
                  onChange={(e) => setEditBenefice(e.target.value)}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 space-y-4">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">Détails</h3>
              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Points d'Effort (Fibonacci)</label>
                <div className="grid grid-cols-7 gap-2">
                  {fibonacciPoints.map((point) => (
                    <button
                      key={point}
                      type="button"
                      onClick={() => setEditPoints(point)}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${
                        editPoints === point
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-[#283039] text-slate-600 dark:text-[#9dabb9] hover:bg-slate-200 dark:hover:bg-[#3b4754]"
                      }`}
                    >
                      {point}
                    </button>
                  ))}
                </div>
                {editPoints && (
                  <button
                    type="button"
                    onClick={() => setEditPoints(null)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Durée Estimée (heures)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editDureeEstimee || ""}
                  onChange={(e) => setEditDureeEstimee(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Priorité (MoSCoW) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {priorites.map((prio) => (
                    <button
                      key={prio.value}
                      type="button"
                      onClick={() => setEditPriorite(prio.value)}
                      className={`py-3 px-4 rounded-lg text-sm font-bold transition-all border ${
                        editPriorite === prio.value
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-slate-100 dark:bg-[#283039] border-slate-300 dark:border-[#3b4754] hover:bg-slate-200 dark:hover:bg-[#3b4754]"
                      }`}
                    >
                      <span className={editPriorite === prio.value ? "text-primary" : prio.color}>{prio.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-[#9dabb9] text-sm font-bold mb-2 block">Critères d'Acceptation</label>
                <textarea
                  value={editCriteresAcceptation}
                  onChange={(e) => setEditCriteresAcceptation(e.target.value)}
                  rows={5}
                  className="w-full bg-white dark:bg-[#283039] border border-slate-300 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
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
        )}
      </Modal>
    </DashboardLayout>
  );
}
