"use client";

import { useEffect, useMemo, useState } from "react";
import { Epic, Module, Project, Sprint, UserStorySummary } from "@/types";
import { getMyProjects } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { getEpics } from "@/features/epics/api";
import { getSprints } from "@/features/sprints/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { ROUTES } from "@/lib/constants";

type EpicWithModule = Epic & { moduleName: string };

export default function RoadmapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [epicsByModule, setEpicsByModule] = useState<Record<number, Epic[]>>({});
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sidebarLinks = [
    { href: ROUTES.PRODUCT_OWNER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.PRODUCT_OWNER}/projects`, icon: "folder", label: "Projets" },
    { href: `${ROUTES.PRODUCT_OWNER}/backlog`, icon: "list", label: "Backlog" },
    { href: `${ROUTES.PRODUCT_OWNER}/epics`, icon: "content_cut", label: "Epics" },
    { href: `${ROUTES.PRODUCT_OWNER}/sprints`, icon: "event", label: "Sprints" },
    { href: `${ROUTES.PRODUCT_OWNER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.PRODUCT_OWNER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.PRODUCT_OWNER}/roadmap`, icon: "map", label: "Roadmap" },
    { href: `${ROUTES.PRODUCT_OWNER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadRoadmap(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const data = await getMyProjects();
      setProjects(data);
      if (data.length > 0) setSelectedProjectId(data[0].id);
    } catch (err) {
      console.error("Erreur chargement projets roadmap:", err);
      setError("Impossible de charger les projets.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadRoadmap = async (projectId: number) => {
    setIsLoadingRoadmap(true);
    setError(null);
    try {
      const [modulesData, sprintsData] = await Promise.all([
        getModules(projectId),
        getSprints(projectId),
      ]);

      const epicsEntries = await Promise.all(
        modulesData.map(async (moduleItem) => {
          try {
            const moduleEpics = await getEpics(projectId, moduleItem.id);
            return [moduleItem.id, moduleEpics] as const;
          } catch (moduleError) {
            console.error(`Erreur chargement epics module ${moduleItem.id}:`, moduleError);
            return [moduleItem.id, []] as const;
          }
        })
      );

      setModules(modulesData);
      setSprints(sprintsData);
      setEpicsByModule(Object.fromEntries(epicsEntries));
    } catch (err) {
      console.error("Erreur chargement roadmap:", err);
      setModules([]);
      setSprints([]);
      setEpicsByModule({});
      setError("Impossible de charger la roadmap pour ce projet.");
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const allEpics = useMemo<EpicWithModule[]>(() => {
    return modules.flatMap((moduleItem) => {
      const moduleEpics = epicsByModule[moduleItem.id] ?? [];
      return moduleEpics.map((epic) => ({ ...epic, moduleName: moduleItem.nom }));
    });
  }, [modules, epicsByModule]);

  const allStories = useMemo<UserStorySummary[]>(() => {
    return allEpics.flatMap((epic) => epic.user_stories ?? []);
  }, [allEpics]);

  const roadmapStats = useMemo(() => {
    const totalStories = allStories.length;
    const doneStories = allStories.filter((story) => story.statut === "done").length;
    const inProgressStories = allStories.filter((story) => story.statut === "in_progress").length;
    const completion = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;
    const activeSprints = sprints.filter((s) => s.statut === "en_cours").length;

    return {
      modules: modules.length,
      epics: allEpics.length,
      stories: totalStories,
      doneStories,
      inProgressStories,
      completion,
      activeSprints,
    };
  }, [modules.length, allEpics.length, allStories, sprints]);

  const sprintsTimeline = useMemo(() => {
    const sortByDate = (a: Sprint, b: Sprint) => {
      const dateA = a.dateDebut ? new Date(a.dateDebut).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dateDebut ? new Date(b.dateDebut).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    };

    return [...sprints].sort(sortByDate).map((sprint) => {
      const sprintStories = allStories.filter((story) => story.sprint?.id === sprint.id);
      const done = sprintStories.filter((story) => story.statut === "done").length;
      const progress = sprintStories.length > 0 ? Math.round((done / sprintStories.length) * 100) : 0;
      return {
        sprint,
        storiesCount: sprintStories.length,
        doneStories: done,
        progress,
      };
    });
  }, [sprints, allStories]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case "done":
      case "termine":
        return "Termine";
      case "in_progress":
      case "en_cours":
        return "En cours";
      case "to_do":
      case "planifie":
        return "Planifie";
      default:
        return status || "Non defini";
    }
  };

  const statusPill = (status?: string) => {
    if (status === "done" || status === "termine") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (status === "in_progress" || status === "en_cours") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };

  const progressColor = (value: number) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 40) return "bg-blue-500";
    return "bg-yellow-500";
  };

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
          title="Roadmap Produit"
          subtitle={selectedProject ? `Vision strategique - ${selectedProject.nom}` : "Visualisez la roadmap strategique de vos projets"}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        <ProjectSelectorCard
          projects={projects}
          selectedProjectId={selectedProjectId}
          selectedProjectName={selectedProject?.nom ?? null}
          onSelectProject={setSelectedProjectId}
          badgeText="Planification produit"
          description="Selectionnez un projet pour visualiser sa trajectoire de delivery, ses sprints et la progression des epics."
          disabled={isLoadingProjects}
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-400">error</span>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {(isLoadingProjects || isLoadingRoadmap) && (
          <div className="bg-primary/5 dark:bg-surface-dark border border-primary/30 dark:border-[#3b4754] rounded-xl p-12 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-slate-900 dark:text-white font-semibold text-lg mb-1">Chargement de la roadmap</p>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">Veuillez patienter...</p>
            </div>
          </div>
        )}

        {!isLoadingProjects && !isLoadingRoadmap && selectedProject && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              <div className="bg-blue-50/70 dark:bg-surface-dark border border-blue-200 dark:border-[#3b4754] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-[#9dabb9]">Modules</p>
                <p className="text-2xl font-bold text-blue-500">{roadmapStats.modules}</p>
              </div>
              <div className="bg-violet-50/70 dark:bg-surface-dark border border-violet-200 dark:border-[#3b4754] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-[#9dabb9]">Epics</p>
                <p className="text-2xl font-bold text-violet-500">{roadmapStats.epics}</p>
              </div>
              <div className="bg-cyan-50/70 dark:bg-surface-dark border border-cyan-200 dark:border-[#3b4754] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-[#9dabb9]">User Stories</p>
                <p className="text-2xl font-bold text-cyan-500">{roadmapStats.stories}</p>
              </div>
              <div className="bg-green-50/70 dark:bg-surface-dark border border-green-200 dark:border-[#3b4754] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-[#9dabb9]">Terminees</p>
                <p className="text-2xl font-bold text-green-500">{roadmapStats.doneStories}</p>
              </div>
              <div className="bg-yellow-50/70 dark:bg-surface-dark border border-yellow-200 dark:border-[#3b4754] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-[#9dabb9]">En cours</p>
                <p className="text-2xl font-bold text-yellow-500">{roadmapStats.inProgressStories}</p>
              </div>
              <div className="bg-primary/5 dark:bg-surface-dark border border-primary/20 dark:border-[#3b4754] rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-[#9dabb9]">Completion</p>
                <p className="text-2xl font-bold text-primary">{roadmapStats.completion}%</p>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Timeline des sprints</h3>
                <span className="text-xs px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10">
                  {roadmapStats.activeSprints} sprint(s) actif(s)
                </span>
              </div>

              {sprintsTimeline.length === 0 ? (
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm">Aucun sprint defini pour ce projet.</p>
              ) : (
                <div className="space-y-4">
                  {sprintsTimeline.map(({ sprint, storiesCount, doneStories, progress }) => (
                    <div key={sprint.id} className="border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{sprint.nom}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full border ${statusPill(sprint.statut)}`}>
                              {statusLabel(sprint.statut)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-[#9dabb9] mt-1">
                            {formatDate(sprint.dateDebut)} - {formatDate(sprint.dateFin)}
                          </p>
                          {sprint.objectifSprint && (
                            <p className="text-sm text-slate-700 dark:text-[#d8dee9] mt-2">{sprint.objectifSprint}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-700 dark:text-white font-semibold">{progress}%</p>
                          <p className="text-xs text-slate-500 dark:text-[#9dabb9]">{doneStories}/{storiesCount} US terminees</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-[#283039] rounded-full mt-3">
                        <div className={`h-2 rounded-full ${progressColor(progress)}`} style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Vision strategique par module</h3>

              {modules.length === 0 ? (
                <p className="text-slate-500 dark:text-[#9dabb9] text-sm">Aucun module defini pour ce projet.</p>
              ) : (
                <div className="space-y-5">
                  {modules.map((moduleItem) => {
                    const moduleEpics = epicsByModule[moduleItem.id] ?? [];
                    return (
                      <div key={moduleItem.id} className="border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{moduleItem.nom}</h4>
                            {moduleItem.description && (
                              <p className="text-sm text-slate-500 dark:text-[#9dabb9] mt-1">{moduleItem.description}</p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/10">
                            {moduleEpics.length} epic(s)
                          </span>
                        </div>

                        {moduleEpics.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-[#9dabb9]">Aucun epic pour ce module.</p>
                        ) : (
                          <div className="grid gap-3">
                            {moduleEpics.map((epic) => {
                              const stories = epic.user_stories ?? [];
                              const done = stories.filter((story) => story.statut === "done").length;
                              const progress = stories.length > 0 ? Math.round((done / stories.length) * 100) : 0;
                              return (
                                <div key={epic.id} className="bg-slate-50 dark:bg-[#1f2937] border border-slate-200 dark:border-[#3b4754] rounded-lg p-3">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{epic.titre}</p>
                                      <p className="text-xs text-slate-500 dark:text-[#9dabb9]">{stories.length} user story(s)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-1 rounded-full border ${statusPill(epic.statut)}`}>
                                        {statusLabel(epic.statut)}
                                      </span>
                                      <span className="text-xs text-slate-600 dark:text-[#c7ced8] font-semibold">{progress}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-[#283039] rounded-full mt-2">
                                    <div className={`h-1.5 rounded-full ${progressColor(progress)}`} style={{ width: `${progress}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
