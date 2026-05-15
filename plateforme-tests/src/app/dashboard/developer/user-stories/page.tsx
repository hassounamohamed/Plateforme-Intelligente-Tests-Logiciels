"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectSelectorCard } from "@/components/dashboard/ProjectSelectorCard";
import { Modal } from "@/components/Modal";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/features/auth/store";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getEpics } from "@/features/epics/api";
import { changeUserStoryStatus, getUserStories } from "@/features/userstories/api";
import { Project, Epic, UserStory, PrioriteUS, StatutUS } from "@/types";

const selectFieldClass =
  "w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-[#3b4754] dark:bg-[#283039]";

export default function UserStoriesPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [selectedEpicId, setSelectedEpicId] = useState<number | null>(null);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const sidebarLinks = [
    { href: ROUTES.DEVELOPER, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.DEVELOPER}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.DEVELOPER}/user-stories`, icon: "article", label: "User Stories" },
    { href: `${ROUTES.DEVELOPER}/cahier-tests`, icon: "menu_book", label: "Cahier de Tests" },
    { href: `${ROUTES.DEVELOPER}/rapports-qa`, icon: "assessment", label: "Rapports QA" },
    { href: `${ROUTES.DEVELOPER}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  const loadProjects = useCallback(async () => {
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
  }, []);

  const loadEpics = useCallback(async (projectId: number) => {
    try {
      const data = await getEpics(projectId);
      setEpics(data);
      setSelectedEpicId(null);
    } catch (err) {
      setError("Erreur lors du chargement des epics");
      console.error("Erreur:", err);
      setEpics([]);
      setSelectedEpicId(null);
    }
  }, []);

  const loadUserStories = useCallback(
    async (projectId: number, epicId: number | null, epicsList: Epic[]) => {
      setStoriesLoading(true);
      setError(null);
      try {
        let stories: UserStory[] = [];
        if (epicId) {
          stories = await getUserStories(projectId, epicId);
        } else {
          const results = await Promise.all(
            epicsList.map((epic) => getUserStories(projectId, epic.id).catch(() => []))
          );
          stories = results.flat();
        }
        const unique = Array.from(new Map(stories.map((s) => [s.id, s])).values());
        setUserStories(unique);
      } catch (err) {
        setError("Erreur lors du chargement des user stories");
        console.error("Erreur:", err);
        setUserStories([]);
      } finally {
        setStoriesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      setUserStories([]);
      loadEpics(selectedProject.id);
    } else {
      setEpics([]);
      setSelectedEpicId(null);
      setUserStories([]);
    }
  }, [selectedProject, loadEpics]);

  useEffect(() => {
    if (!selectedProject || epics.length === 0) {
      setUserStories([]);
      return;
    }
    loadUserStories(selectedProject.id, selectedEpicId, epics);
  }, [selectedProject, selectedEpicId, epics, loadUserStories]);

  const getStatusColor = (status: StatutUS): string => {
    switch (status) {
      case "done":
        return "bg-green-500/15 text-green-700 dark:text-green-400";
      case "in_progress":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
      case "ready_for_test":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-400";
      case "a_corriger":
        return "bg-red-500/15 text-red-700 dark:text-red-400";
      case "to_do":
      default:
        return "bg-muted/30 text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: PrioriteUS): string => {
    switch (priority) {
      case "must_have":
        return "text-red-600 dark:text-red-400";
      case "should_have":
        return "text-amber-700 dark:text-amber-400";
      case "could_have":
        return "text-primary";
      case "wont_have":
      default:
        return "text-muted-foreground";
    }
  };

  const formatPriority = (priority: PrioriteUS): string => {
    const map: Record<PrioriteUS, string> = {
      must_have: "Must Have",
      should_have: "Should Have",
      could_have: "Could Have",
      wont_have: "Won't Have",
    };
    return map[priority] || priority;
  };

  const formatStatus = (status: StatutUS): string => {
    const map: Record<StatutUS, string> = {
      to_do: "À faire",
      in_progress: "En cours",
      ready_for_test: "Prêt pour test",
      a_corriger: "À corriger",
      done: "Terminé",
    };
    return map[status] || status;
  };

  const isStoryAssignedToMe = (story: UserStory | null): boolean => {
    if (!story || !user) return false;
    return story.developerId === user.id;
  };

  const replaceStoryInList = (updatedStory: UserStory) => {
    setSelectedStory(updatedStory);
    setUserStories((previous) =>
      previous.map((story) => (story.id === updatedStory.id ? updatedStory : story))
    );
  };

  const handleChangeSelectedStoryStatus = async (nextStatus: StatutUS) => {
    if (!selectedProject || !selectedStory || !user) return;
    if (!isStoryAssignedToMe(selectedStory)) {
      setError("Vous ne pouvez modifier que les user stories qui vous sont assignées.");
      return;
    }

    setStatusUpdating(true);
    setError(null);
    try {
      const updated = await changeUserStoryStatus(
        selectedProject.id,
        selectedStory.epic_id,
        selectedStory.id,
        { statut: nextStatus }
      );
      replaceStoryInList(updated);
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
      setError("Erreur lors du changement de statut de la user story");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar title="Developer" subtitle="FlowPilot Platform" icon="code" links={sidebarLinks} />
        }
        headerContent={
          <DashboardHeader title="User Stories" subtitle="Consultez les user stories par epic" />
        }
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout
        sidebarContent={
          <Sidebar title="Developer" subtitle="FlowPilot Platform" icon="code" links={sidebarLinks} />
        }
        headerContent={
          <DashboardHeader title="User Stories" subtitle="Consultez les user stories par epic" />
        }
      >
        <div className="rounded-xl border border-border bg-surface-dark p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-5xl text-muted-foreground">folder_off</span>
          <p className="text-muted-foreground">Aucun projet disponible</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar title="Developer" subtitle="FlowPilot Platform" icon="code" links={sidebarLinks} />
      }
      headerContent={
        <DashboardHeader title="User Stories" subtitle="Consultez les user stories par epic" />
      }
    >
      <div className="mx-auto flex max-w-350 flex-col gap-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <span className="material-symbols-outlined text-xl text-red-600 dark:text-red-400">error</span>
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              aria-label="Fermer le message d'erreur"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}

        <ProjectSelectorCard
          projects={projects.map((p) => ({ id: p.id, nom: p.nom }))}
          selectedProjectId={selectedProject?.id ?? null}
          selectedProjectName={selectedProject?.nom}
          onSelectProject={(projectId) => {
            const project = projects.find((p) => p.id === projectId);
            if (project) setSelectedProject(project);
          }}
          badgeText="User stories developpeur"
          title="Projet"
          description="Selectionnez un projet, puis filtrez par epic."
          placeholder="-- Selectionnez un projet --"
        />

        {selectedProject && epics.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-dark p-4">
            <label htmlFor="dev-us-epic-filter" className="mb-2 block text-sm font-bold text-foreground">
              Epic
            </label>
            <select
              id="dev-us-epic-filter"
              value={selectedEpicId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedEpicId(value ? Number(value) : null);
              }}
              className={selectFieldClass}
            >
              <option value="">Tous les epics</option>
              {epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.titre}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedEpicId
                ? `Stories de l'epic « ${epics.find((e) => e.id === selectedEpicId)?.titre ?? ""} »`
                : "Toutes les user stories du projet"}
            </p>
          </div>
        )}

        {selectedProject && epics.length === 0 && !storiesLoading && (
          <div className="rounded-xl border border-dashed border-border bg-surface-dark p-8 text-center">
            <span className="material-symbols-outlined mb-3 text-5xl text-muted-foreground">flag</span>
            <h3 className="text-lg font-bold text-foreground">Aucun epic</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ce projet ne contient pas encore d'epic avec des user stories.
            </p>
          </div>
        )}

        {storiesLoading && (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {!storiesLoading && selectedProject && epics.length > 0 && userStories.length === 0 && (
          <div className="rounded-xl border border-border bg-surface-dark p-8 text-center">
            <span className="material-symbols-outlined mb-3 text-5xl text-muted-foreground">description</span>
            <h3 className="text-lg font-bold text-foreground">Aucune user story</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucune user story pour la selection actuelle.
            </p>
          </div>
        )}

        {!storiesLoading && userStories.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-foreground">
              User Stories ({userStories.length})
            </h2>
            <div className="space-y-4">
              {userStories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setSelectedStory(story)}
                  className="w-full rounded-xl border border-border bg-surface-dark p-5 text-left transition-colors hover:border-primary/50 dark:border-[#3b4754]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {story.reference && (
                          <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                            {story.reference}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-foreground">{story.titre}</h3>
                      </div>
                      {story.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{story.description}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(story.statut)}`}
                    >
                      {formatStatus(story.statut)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${getPriorityColor(story.priorite)}`}>
                      {formatPriority(story.priorite)}
                    </span>
                    {story.points != null && (
                      <span className="flex items-center gap-1 rounded bg-(--surface-2) px-2 py-1 text-xs font-semibold text-foreground dark:bg-[#283039]">
                        <span className="material-symbols-outlined text-[14px]">speed</span>
                        {story.points} pts
                      </span>
                    )}
                    {story.duree_estimee != null && (
                      <span className="flex items-center gap-1 rounded bg-(--surface-2) px-2 py-1 text-xs font-semibold text-foreground dark:bg-[#283039]">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {story.duree_estimee}h
                      </span>
                    )}
                    {story.developer && (
                      <span className="text-xs text-muted-foreground">
                        Dev: <span className="font-medium text-foreground">{story.developer.nom}</span>
                      </span>
                    )}
                    {isStoryAssignedToMe(story) && (
                      <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-800 dark:text-green-300">
                        Assignée à vous
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        title={selectedStory?.titre ?? "User story"}
        size="lg"
      >
        {selectedStory && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {selectedStory.reference && (
                <span className="rounded bg-primary/15 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {selectedStory.reference}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(selectedStory.statut)}`}>
                {formatStatus(selectedStory.statut)}
              </span>
              <span className={`text-xs font-bold uppercase ${getPriorityColor(selectedStory.priorite)}`}>
                {formatPriority(selectedStory.priorite)}
              </span>
            </div>

            {selectedStory.description && (
              <div>
                <h4 className="mb-2 text-sm font-bold text-foreground">Description</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selectedStory.description}</p>
              </div>
            )}

            {selectedStory.criteresAcceptation && (
              <div>
                <h4 className="mb-2 text-sm font-bold text-foreground">Critères d'acceptation</h4>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-(--surface-2) p-4 text-sm text-foreground dark:border-[#3b4754]">
                  {selectedStory.criteresAcceptation}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#3b4754]">
                <h4 className="text-sm font-bold text-foreground">Informations</h4>
                {selectedStory.points != null && (
                  <p className="text-sm text-muted-foreground">
                    Points: <span className="font-semibold text-foreground">{selectedStory.points}</span>
                  </p>
                )}
                {selectedStory.duree_estimee != null && (
                  <p className="text-sm text-muted-foreground">
                    Durée:{" "}
                    <span className="font-semibold text-foreground">{selectedStory.duree_estimee}h</span>
                  </p>
                )}
                {selectedStory.start_date && (
                  <p className="text-sm text-muted-foreground">
                    Début:{" "}
                    <span className="font-semibold text-foreground">
                      {new Date(selectedStory.start_date).toLocaleDateString("fr-FR")}
                    </span>
                  </p>
                )}
                {selectedStory.end_date && (
                  <p className="text-sm text-muted-foreground">
                    Fin:{" "}
                    <span className="font-semibold text-foreground">
                      {new Date(selectedStory.end_date).toLocaleDateString("fr-FR")}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-(--surface-2) p-4 dark:border-[#3b4754]">
                <h4 className="text-sm font-bold text-foreground">Équipe</h4>
                {selectedStory.developer ? (
                  <p className="text-sm text-muted-foreground">
                    Développeur:{" "}
                    <span className="font-medium text-foreground">{selectedStory.developer.nom}</span>
                  </p>
                ) : null}
                {selectedStory.tester ? (
                  <p className="text-sm text-muted-foreground">
                    Testeur: <span className="font-medium text-foreground">{selectedStory.tester.nom}</span>
                  </p>
                ) : null}
                {!selectedStory.developer && !selectedStory.tester && (
                  <p className="text-sm text-muted-foreground">Aucune personne assignée</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              {isStoryAssignedToMe(selectedStory) ? (
                <>
                  {selectedStory.statut === "done" ? (
                    <button
                      type="button"
                      onClick={() => handleChangeSelectedStoryStatus("in_progress")}
                      disabled={statusUpdating}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      {statusUpdating ? "Mise à jour..." : "Rouvrir"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleChangeSelectedStoryStatus("ready_for_test")}
                        disabled={statusUpdating || selectedStory.statut === "ready_for_test"}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                      >
                        {statusUpdating ? "Mise à jour..." : "Prêt pour test"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeSelectedStoryStatus("done")}
                        disabled={statusUpdating}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        {statusUpdating ? "Mise à jour..." : "Marquer terminée"}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Seules les user stories assignées à votre compte peuvent changer de statut.
                </p>
              )}
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-(--surface-2) dark:border-[#3b4754]"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
