"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { getUserStories } from "@/features/userstories/api";
import { ArrowRight, FileText, Flag, LayoutDashboard, X } from "lucide-react";
import { Project, Module, Epic, UserStory, PrioriteUS, StatutUS } from "@/types";

export default function UserStoriesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [selectedEpics, setSelectedEpics] = useState<number[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [allUserStories, setAllUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatutUS | "all">("all");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadModules(selectedProject.id);
      setSelectedModules([]);
      setSelectedEpics([]);
      setEpics([]);
      setUserStories([]);
      setAllUserStories([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject && selectedModules.length > 0) {
      loadEpicsForModules(selectedProject.id, selectedModules);
    } else if (selectedProject && selectedModules.length === 0) {
      setEpics([]);
      setSelectedEpics([]);
      setUserStories([]);
      setAllUserStories([]);
    }
  }, [selectedModules, selectedProject]);

  useEffect(() => {
    if (selectedProject && selectedModules.length > 0 && selectedEpics.length > 0) {
      loadUserStoriesForFilters(selectedProject.id, selectedModules, selectedEpics);
    } else if (selectedProject && selectedModules.length > 0 && selectedEpics.length === 0) {
      loadUserStoriesForFilters(selectedProject.id, selectedModules, []);
    } else {
      setUserStories([]);
      setAllUserStories([]);
    }
  }, [selectedEpics, selectedProject, selectedModules]);

  useEffect(() => {
    filterUserStories();
  }, [searchQuery, statusFilter, allUserStories]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProjectsAsMember();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      setError("Erreur lors du chargement des projets");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (projectId: number) => {
    try {
      const data = await getModules(projectId);
      setModules(data);
    } catch (err) {
      setError("Erreur lors du chargement des modules");
      console.error("Erreur:", err);
    }
  };

  const loadEpicsForModules = async (projectId: number, moduleIds: number[]) => {
    try {
      setEpics([]);
      if (moduleIds.length === 0) return;
      
      // Charger les épics pour chaque module sélectionné
      const allEpics: Epic[] = [];
      for (const moduleId of moduleIds) {
        const data = await getEpics(projectId, moduleId);
        allEpics.push(...data);
      }
      
      // Supprimer les doublons
      const uniqueEpics = Array.from(new Map(allEpics.map(e => [e.id, e])).values());
      setEpics(uniqueEpics);
    } catch (err) {
      setError("Erreur lors du chargement des épics");
      console.error("Erreur:", err);
    }
  };

  const loadUserStoriesForFilters = async (projectId: number, moduleIds: number[], epicIds: number[]) => {
    try {
      setAllUserStories([]);
      if (moduleIds.length === 0) return;

      const allStories: UserStory[] = [];
      
      if (epicIds.length > 0) {
        // Si des épics sont sélectionnés, charger les user stories pour chaque combinaison
        for (const moduleId of moduleIds) {
          for (const epicId of epicIds) {
            const data = await getUserStories(projectId, moduleId, epicId);
            allStories.push(...data);
          }
        }
      } else {
        // Si aucun épic n'est sélectionné, charger de tous les épics disponibles
        for (const moduleId of moduleIds) {
          const moduleEpics = epics.filter(e => true); // Tous les épics disponibles
          if (moduleEpics.length === 0) {
            // Si pas d'épics, charger et essayer
            const loadedEpics = await getEpics(projectId, moduleId);
            for (const epic of loadedEpics) {
              const data = await getUserStories(projectId, moduleId, epic.id);
              allStories.push(...data);
            }
          } else {
            // Charger les user stories de tous les épics disponibles
            for (const epic of moduleEpics) {
              const data = await getUserStories(projectId, moduleId, epic.id);
              allStories.push(...data);
            }
          }
        }
      }

      // Supprimer les doublons par ID
      const uniqueStories = Array.from(new Map(allStories.map(s => [s.id, s])).values());
      setAllUserStories(uniqueStories);
      filterUserStories();
    } catch (err) {
      setError("Erreur lors du chargement des user stories");
      console.error("Erreur:", err);
    }
  };

  const filterUserStories = () => {
    let filtered = allUserStories;

    // Filtrer par search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.titre.toLowerCase().includes(query) ||
          story.reference?.toLowerCase().includes(query) ||
          story.description?.toLowerCase().includes(query)
      );
    }

    // Filtrer par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((story) => story.statut === statusFilter);
    }

    setUserStories(filtered);
  };

  const toggleModuleFilter = (moduleId: number) => {
    setSelectedModules((prev) => {
      const newSelection = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];
      setSelectedEpics([]);
      return newSelection;
    });
  };

  const toggleEpicFilter = (epicId: number) => {
    setSelectedEpics((prev) =>
      prev.includes(epicId) ? prev.filter((id) => id !== epicId) : [...prev, epicId]
    );
  };

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/user-stories`, icon: "article", label: "User Stories" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  const getPriorityStyle = (priority: PrioriteUS): string => {
    switch (priority) {
      case "must_have": return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30";
      case "should_have": return "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30";
      case "could_have": return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-500/30";
      case "wont_have": return "bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30";
      default: return "bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30";
    }
  };

  const getStatusStyle = (status: StatutUS): string => {
    switch (status) {
      case "done": return "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30";
      case "in_progress": return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30";
      case "to_do": return "bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30";
      default: return "bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30";
    }
  };

  const formatPriority = (priority: PrioriteUS): string => {
    const map: Record<PrioriteUS, string> = { must_have: "Must Have", should_have: "Should Have", could_have: "Could Have", wont_have: "Won't Have" };
    return map[priority] || priority;
  };

  const formatStatus = (status: StatutUS): string => {
    const map: Record<StatutUS, string> = { to_do: "À faire", in_progress: "En cours", done: "Terminé" };
    return map[status] || status;
  };

  if (loading && projects.length === 0) {
    return (
      <DashboardLayout
        sidebarContent={<Sidebar title="Developer" subtitle="Agile & QA Platform" icon="code" links={sidebarLinks} />}
        headerContent={<DashboardHeader title="User Stories" subtitle="Visualisation des user stories du projet" />}
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
        sidebarContent={<Sidebar title="Developer" subtitle="Agile & QA Platform" icon="code" links={sidebarLinks} />}
        headerContent={<DashboardHeader title="User Stories" subtitle="Visualisation des user stories du projet" />}
      >
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>Aucun projet disponible</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={<Sidebar title="Developer" subtitle="Agile & QA Platform" icon="code" links={sidebarLinks} />}
      headerContent={<DashboardHeader title="User Stories" subtitle="Visualisation des user stories du projet" />}
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">✕</button>
          </div>
        )}

        {projects.length > 0 && (
          <ProjectSelectorCard
            projects={projects.map(p => ({ id: p.id, nom: p.nom }))}
            selectedProjectId={selectedProject?.id ?? null}
            selectedProjectName={selectedProject?.nom}
            onSelectProject={(projectId) => {
              const project = projects.find(p => p.id === projectId);
              if (project) setSelectedProject(project);
            }}
            title="Projets"
            description="Sélectionnez un projet pour visualiser ses user stories"
            placeholder="-- Sélectionnez un projet --"
          />
        )}

        {selectedProject && (
          <div className="space-y-6">
            {/* Filtres Modules */}
            {modules.length > 0 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    Modules
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{selectedModules.length} sélectionné(s)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modules.map((module) => (
                    <label
                      key={module.id}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedModules.includes(module.id)
                          ? "bg-blue-100 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.id)}
                          onChange={() => toggleModuleFilter(module.id)}
                          className="mt-1 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold">{module.nom}</div>
                          {module.description && <div className="text-sm opacity-70 mt-1">{module.description}</div>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filtres Épics */}
            {selectedModules.length > 0 && epics.length > 0 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Flag className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    Épics
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{selectedEpics.length} sélectionné(s)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {epics.map((epic) => (
                    <label
                      key={epic.id}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedEpics.includes(epic.id)
                          ? "bg-purple-100 dark:bg-purple-500/20 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300"
                          : "bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEpics.includes(epic.id)}
                          onChange={() => toggleEpicFilter(epic.id)}
                          className="mt-1 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold">{epic.titre}</div>
                          {epic.description && <div className="text-sm opacity-70 mt-1 line-clamp-2">{epic.description}</div>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

           

            {/* User Stories */}
            {selectedModules.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Stories ({userStories.length})
                  </h3>
                  {allUserStories.length > userStories.length && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {userStories.length} sur {allUserStories.length} affichées
                    </span>
                  )}
                </div>

                {userStories.length === 0 ? (
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 opacity-50" aria-hidden="true" />
                    <p className="mt-2">Aucune user story trouvée</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {userStories.map((story) => (
                      <div
                        key={story.id}
                        onClick={() => setSelectedStory(story)}
                        className="bg-white dark:bg-gray-800/50 rounded-lg p-6 border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              {story.reference && (
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                                  {story.reference}
                                </span>
                              )}
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                {story.titre}
                              </h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(story.statut)}`}>
                              {formatStatus(story.statut)}
                            </span>
                            <ArrowRight className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" aria-hidden="true" />
                          </div>
                        </div>

                        {story.description && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">{story.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-100 dark:bg-gray-900/50 rounded p-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Priorité</p>
                            <span className={`text-xs font-medium px-2 py-1 rounded inline-block mt-1 ${getPriorityStyle(story.priorite)}`}>
                              {formatPriority(story.priorite)}
                            </span>
                          </div>
                          {story.points && (
                            <div className="bg-gray-100 dark:bg-gray-900/50 rounded p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Points</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{story.points}</p>
                            </div>
                          )}
                          {story.duree_estimee && (
                            <div className="bg-gray-100 dark:bg-gray-900/50 rounded p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Durée</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{story.duree_estimee}h</p>
                            </div>
                          )}
                          {story.developer && (
                            <div className="bg-gray-100 dark:bg-gray-900/50 rounded p-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Dev</p>
                              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">{story.developer.nom}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Détails User Story */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black/70 dark:bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="sticky top-0 flex items-start justify-between p-6 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedStory.reference && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {selectedStory.reference}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedStory.statut)}`}>
                    {formatStatus(selectedStory.statut)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedStory.titre}</h2>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedStory.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedStory.description}</p>
                </div>
              )}

              {/* Critères d'acceptation */}
              {selectedStory.criteresAcceptation && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Critères d'acceptation</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-100 dark:bg-gray-800/50 p-4 rounded border border-gray-300 dark:border-gray-700">
                    {selectedStory.criteresAcceptation}
                  </p>
                </div>
              )}

              {/* Informations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Priorité</span>
                      <span className={`font-medium px-2 py-1 rounded ${getPriorityStyle(selectedStory.priorite)}`}>
                        {formatPriority(selectedStory.priorite)}
                      </span>
                    </div>
                    {selectedStory.points && (
                      <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Points</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{selectedStory.points}</span>
                      </div>
                    )}
                    {selectedStory.duree_estimee && (
                      <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Durée estimée</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{selectedStory.duree_estimee}h</span>
                      </div>
                    )}
                    {selectedStory.start_date && (
                      <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Début</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {new Date(selectedStory.start_date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                    {selectedStory.end_date && (
                      <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Fin</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {new Date(selectedStory.end_date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignés */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Équipe</h3>
                  <div className="space-y-3">
                    {selectedStory.developer && (
                      <div className="p-4 bg-blue-100 dark:bg-blue-500/10 rounded border border-blue-300 dark:border-blue-500/30">
                        <p className="text-xs text-blue-700 dark:text-blue-400 mb-2 font-semibold">Développeur</p>
                        <p className="font-medium text-blue-900 dark:text-blue-300">{selectedStory.developer.nom}</p>
                        <p className="text-xs text-blue-800 dark:text-blue-400">{selectedStory.developer.email}</p>
                      </div>
                    )}
                    {selectedStory.tester && (
                      <div className="p-4 bg-purple-100 dark:bg-purple-500/10 rounded border border-purple-300 dark:border-purple-500/30">
                        <p className="text-xs text-purple-700 dark:text-purple-400 mb-2 font-semibold">Testeur</p>
                        <p className="font-medium text-purple-900 dark:text-purple-300">{selectedStory.tester.nom}</p>
                        <p className="text-xs text-purple-800 dark:text-purple-400">{selectedStory.tester.email}</p>
                      </div>
                    )}
                    {selectedStory.assignee && (
                      <div className="p-4 bg-green-100 dark:bg-green-500/10 rounded border border-green-300 dark:border-green-500/30">
                        <p className="text-xs text-green-700 dark:text-green-400 mb-2 font-semibold">Responsable</p>
                        <p className="font-medium text-green-900 dark:text-green-300">{selectedStory.assignee.nom}</p>
                        <p className="text-xs text-green-800 dark:text-green-400">{selectedStory.assignee.email}</p>
                      </div>
                    )}
                    {!selectedStory.developer && !selectedStory.tester && !selectedStory.assignee && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune personne assignée</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="sticky bottom-0 flex justify-end p-6 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 gap-3">
              <button
                onClick={() => setSelectedStory(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-white transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}