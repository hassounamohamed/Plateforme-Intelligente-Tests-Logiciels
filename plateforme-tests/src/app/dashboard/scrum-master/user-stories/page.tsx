"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { getUserStories, changeUserStoryStatus, assignDeveloper, assignTester, assignAssignee, removeAssignee } from "@/features/userstories/api";
import { getProjectById } from "@/features/projects/api";
import { Project, Module, Epic, UserStory, User, MemberSimple } from "@/types";

export default function UserStoriesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [selectedEpic, setSelectedEpic] = useState<number | null>(null);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const [projectMembers, setProjectMembers] = useState<MemberSimple[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState<number | null>(null);
  const [developerLoading, setDeveloperLoading] = useState<number | null>(null);
  const [testerLoading, setTesterLoading] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    statut: "",
    priorite: "",
  });

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
      setUserStories([]);

      loadModules(selectedProject);
      loadProjectMembers(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && selectedModule) {
      // Reset epic-dependent data when module changes
      setSelectedEpic(null);
      setEpics([]);
      setUserStories([]);

      loadEpics(selectedProject, selectedModule);
    }
  }, [selectedProject, selectedModule]);

  useEffect(() => {
    if (selectedProject && selectedModule && selectedEpic) {
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
      if (modulesData.length > 0) {
        setSelectedModule(modulesData[0].id);
      } else {
        setSelectedModule(null);
        setSelectedEpic(null);
        setEpics([]);
        setUserStories([]);
      }
    } catch (error: any) {
      console.error("Erreur chargement modules:", error);
      setModules([]);
      setSelectedModule(null);
      setSelectedEpic(null);
      setEpics([]);
      setUserStories([]);
    }
  };

  const loadEpics = async (projectId: number, moduleId: number) => {
    try {
      const epicsData = await getEpics(projectId, moduleId);
      setEpics(epicsData);
      if (epicsData.length > 0) {
        setSelectedEpic(epicsData[0].id);
      } else {
        setSelectedEpic(null);
        setUserStories([]);
      }
    } catch (error: any) {
      console.error("Erreur chargement epics:", error);
      setEpics([]);
      setSelectedEpic(null);
      setUserStories([]);
    }
  };

  const loadUserStories = async (projectId: number, moduleId: number, epicId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const usData = await getUserStories(projectId, moduleId, epicId, filters.statut as any);
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

  const handleChangeStatus = async (usId: number, newStatus: "to_do" | "in_progress" | "done") => {
    if (!selectedProject || !selectedModule || !selectedEpic) return;
    setActionLoading(usId);
    try {
      await changeUserStoryStatus(selectedProject, selectedModule, selectedEpic, usId, { statut: newStatus });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors du changement de statut: " + (error.response?.data?.detail || error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignAssignee = async (usId: number, memberId: number) => {
    if (!selectedProject || !selectedModule || !selectedEpic) return;
    setAssigneeLoading(usId);
    try {
      await assignAssignee(selectedProject, selectedModule, selectedEpic, usId, { assignee_id: memberId });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors de l'assignation: " + (error.response?.data?.detail || error.message));
    } finally {
      setAssigneeLoading(null);
    }
  };

  const handleRemoveAssignee = async (usId: number) => {
    if (!selectedProject || !selectedModule || !selectedEpic) return;
    setAssigneeLoading(usId);
    try {
      await removeAssignee(selectedProject, selectedModule, selectedEpic, usId);
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors du retrait de l'assignee: " + (error.response?.data?.detail || error.message));
    } finally {
      setAssigneeLoading(null);
    }
  };

  const handleAssignDeveloper = async (usId: number, memberId: number) => {
    if (!selectedProject || !selectedModule || !selectedEpic) return;
    setDeveloperLoading(usId);
    try {
      await assignDeveloper(selectedProject, selectedModule, selectedEpic, usId, { developeur_id: memberId });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors de l'assignation du développeur: " + (error.response?.data?.detail || error.message));
    } finally {
      setDeveloperLoading(null);
    }
  };

  const handleAssignTester = async (usId: number, memberId: number) => {
    if (!selectedProject || !selectedModule || !selectedEpic) return;
    setTesterLoading(usId);
    try {
      await assignTester(selectedProject, selectedModule, selectedEpic, usId, { testeur_id: memberId });
      await loadUserStories(selectedProject, selectedModule, selectedEpic);
    } catch (error: any) {
      alert("Erreur lors de l'assignation du testeur: " + (error.response?.data?.detail || error.message));
    } finally {
      setTesterLoading(null);
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Project Selector */}
          {projects.length > 0 ? (
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Projet</label>
              <select
                value={selectedProject || ""}
                onChange={(e) => {
                  const projectId = Number(e.target.value);
                  setSelectedModule(null);
                  setSelectedEpic(null);
                  setUserStories([]);
                  setSelectedProject(projectId);
                }}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nom}
                  </option>
                ))}
              </select>
            </div>
          ) : !isLoading && (
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Projet</label>
              <p className="text-red-400 text-sm">Aucun projet disponible. Vous devez être Product Owner d'un projet ou membre d'un projet.</p>
            </div>
          )}

          {/* Module Selector */}
          {modules.length > 0 && (
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-4">
              <label className="text-[#9dabb9] text-sm font-bold mb-2 block">Module</label>
              <select
                value={selectedModule || ""}
                onChange={(e) => {
                  const moduleId = Number(e.target.value);
                  setSelectedEpic(null);
                  setUserStories([]);
                  setSelectedModule(moduleId);
                }}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
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
                onChange={(e) => setSelectedEpic(Number(e.target.value))}
                className="w-full bg-[#283039] border border-[#3b4754] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
              >
                {epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.titre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

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
        {!isLoading && !selectedEpic && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">description</span>
            <h3 className="text-white text-lg font-bold mb-2">Sélectionnez un Epic</h3>
            <p className="text-[#9dabb9] text-sm mb-4">
              Choisissez un projet, module et epic pour voir les user stories
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

        {!isLoading && selectedEpic && userStories.length === 0 && (
          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[#9dabb9] text-5xl mb-4">description</span>
            <h3 className="text-white text-lg font-bold mb-2">Aucune user story</h3>
            <p className="text-[#9dabb9] text-sm mb-4">
              Décomposez cet epic en créant des user stories
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
                    <Link
                      href={`${ROUTES.SCRUM_MASTER}/user-stories/${us.id}`}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Voir détails"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-primary">visibility</span>
                    </Link>
                    <Link
                      href={`${ROUTES.SCRUM_MASTER}/user-stories/${us.id}/edit?project=${selectedProject}&module=${selectedModule}&epic=${selectedEpic}`}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                      title="Modifier"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-primary">edit</span>
                    </Link>
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
                          if (val) handleAssignDeveloper(us.id, Number(val));
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
                          if (val) handleAssignTester(us.id, Number(val));
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
                          onClick={() => handleRemoveAssignee(us.id)}
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
                          if (val) handleAssignAssignee(us.id, Number(val));
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
                    onClick={() => handleChangeStatus(us.id, "to_do")}
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
                    onClick={() => handleChangeStatus(us.id, "in_progress")}
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
                    onClick={() => handleChangeStatus(us.id, "done")}
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
    </DashboardLayout>
  );
}
