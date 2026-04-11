"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { getMyProjects } from "@/features/projects/api";
import { getBacklog, getBacklogIndicateurs } from "@/features/backlog/api";
import { getEpics } from "@/features/epics/api";
import { getModules } from "@/features/modules/api";
import { startGeneration, getGenerationDetail } from "@/features/ai-generation/api";
import {
  Project,
  BacklogItem,
  BacklogIndicateurs,
  Epic,
  Module,
  AIGenerationDetail,
  AILog,
} from "@/types";

const POLL_INTERVAL = 2500;

export default function BacklogPage() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"backlog" | "ai">("backlog");

  const [modules, setModules] = useState<Module[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [indicateurs, setIndicateurs] = useState<BacklogIndicateurs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    module_id: "",
    epic_id: "",
    statut: "",
    priorite: "",
    non_planifiees: false,
    tri: "ordre" as "priorite" | "points" | "ordre" | "statut",
  });

  const [generation, setGeneration] = useState<AIGenerationDetail | null>(null);
  const [isStartingGeneration, setIsStartingGeneration] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const projectIdParam = searchParams.get("projectId");
    loadProjects(projectIdParam ? Number(projectIdParam) : null);
  }, [searchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "ai") {
      setActivePanel("ai");
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadBacklog(selectedProject);
    }
  }, [selectedProject, filters]);

  const startPoll = useCallback((projectId: number, generationId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const detail = await getGenerationDetail(projectId, generationId);
        setGeneration(detail);
        if (
          detail.status === "completed" ||
          detail.status === "failed" ||
          detail.status === "approved"
        ) {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (pollError) {
        console.error("Poll error:", pollError);
      }
    }, POLL_INTERVAL);
  }, []);

  const handleStartGeneration = async () => {
    if (!selectedProject) return;
    setIsStartingGeneration(true);
    setAiError(null);
    setGeneration(null);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const gen = await startGeneration(selectedProject);
      setGeneration({ ...gen, logs: [], items: [] });
      startPoll(selectedProject, gen.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setAiError(e.response?.data?.detail || "Erreur lors du lancement de la génération.");
    } finally {
      setIsStartingGeneration(false);
    }
  };

  const getGenerationStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente...";
      case "processing":
        return "Génération en cours...";
      case "completed":
        return "Génération terminée !";
      case "failed":
        return "Échec de la génération";
      case "approved":
        return "Appliqué au backlog";
      default:
        return status;
    }
  };

  const getGenerationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "processing":
        return "text-blue-400";
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "approved":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "reading_file":
        return "description";
      case "sending_prompt":
        return "send";
      case "generating_epics":
        return "content_cut";
      case "generating_us":
        return "list";
      case "saving":
        return "save";
      case "done":
        return "check_circle";
      case "error":
        return "error";
      default:
        return "info";
    }
  };

  const isGenerationRunning =
    generation?.status === "pending" || generation?.status === "processing";
  const isGenerationDone = generation?.status === "completed";
  const isGenerationFailed = generation?.status === "failed";
  const lastLog = generation?.logs[generation.logs.length - 1];
  const selectedProjectData = projects.find((project) => project.id === selectedProject) || null;
  const attachmentCount = selectedProjectData?.attachments?.length || 0;
  const hasAttachment = attachmentCount > 0;
  const hasSupportedAIDoc = (selectedProjectData?.attachments || []).some((attachment) => {
    const lowerName = attachment.filename.toLowerCase();
    const lowerType = attachment.content_type.toLowerCase();
    return (
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".pdf") ||
      lowerType.includes("text/plain") ||
      lowerType.includes("pdf")
    );
  });

  const loadProjects = async (defaultProjectId: number | null = null) => {
    setIsLoading(true);
    try {
      const projectsData = await getMyProjects();
      setProjects(projectsData);
      if (defaultProjectId && projectsData.find((project) => project.id === defaultProjectId)) {
        setSelectedProject(defaultProjectId);
      } else if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement projets:", error);
      setError("Impossible de charger les projets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async (projectId: number) => {
    try {
      // Load modules
      const modulesData = await getModules(projectId);
      setModules(modulesData);

      // Load all epics from all modules
      const allEpics: Epic[] = [];
      for (const module of modulesData) {
        try {
          const epicsData = await getEpics(projectId, module.id);
          allEpics.push(...epicsData);
        } catch (err) {
          console.warn("Erreur chargement epics pour module:", module.id);
        }
      }
      setEpics(allEpics);

      // Load indicateurs
      try {
        const indicateursData = await getBacklogIndicateurs(projectId);
        setIndicateurs(indicateursData);
      } catch (err) {
        console.warn("Erreur chargement indicateurs:", err);
      }
    } catch (error: any) {
      console.error("Erreur chargement données projet:", error);
    }
  };

  const loadBacklog = async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.module_id) params.module_id = Number(filters.module_id);
      if (filters.epic_id) params.epic_id = Number(filters.epic_id);
      if (filters.statut) params.statut = filters.statut;
      if (filters.priorite) params.priorite = filters.priorite;
      if (filters.non_planifiees) params.non_planifiees = true;
      if (filters.tri) params.tri = filters.tri;

      const data = await getBacklog(projectId, params);
      setBacklogItems(data);
    } catch (error: any) {
      console.error("Erreur chargement backlog:", error);
      setError("Impossible de charger le backlog");
      setBacklogItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case "must_have":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      case "should_have":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "could_have":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "wont_have":
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getPriorityLabel = (priorite: string) => {
    switch (priorite) {
      case "must_have":
        return "Must Have";
      case "should_have":
        return "Should Have";
      case "could_have":
        return "Could Have";
      case "wont_have":
        return "Won't Have";
      default:
        return priorite;
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "to_do":
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
      case "in_progress":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "done":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "to_do":
        return "À faire";
      case "in_progress":
        return "En cours";
      case "done":
        return "Terminée";
      default:
        return statut;
    }
  };

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

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setActivePanel("backlog")}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          activePanel === "backlog"
            ? "bg-primary text-white"
            : "bg-slate-100 dark:bg-[#283039] text-slate-600 dark:text-[#9dabb9] hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">list</span>
        Voir Backlog
      </button>
      <button
        onClick={() => setActivePanel("ai")}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          activePanel === "ai"
            ? "bg-primary text-white"
            : "bg-slate-100 dark:bg-[#283039] text-slate-600 dark:text-[#9dabb9] hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
        Génération IA
      </button>
    </div>
  );

  const filteredEpics = filters.module_id
    ? epics.filter((epic) => String(epic.module_id) === filters.module_id)
    : epics;

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
          title="Product Backlog"
          subtitle="Vue d'ensemble, priorisation et génération IA du backlog produit"
          actions={headerActions}
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Project Selector */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
          <label className="text-slate-500 dark:text-[#9dabb9] text-sm font-bold mb-2 block">
            Projet
          </label>
          {projects.length > 0 ? (
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key ? `[${project.key}] ` : ""}{project.nom}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-red-400 text-sm">Aucun projet disponible</p>
          )}

          {selectedProjectData && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  hasAttachment
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {hasAttachment ? "attach_file" : "link_off"}
                </span>
                {hasAttachment
                  ? `${attachmentCount} pièce${attachmentCount > 1 ? "s" : ""} jointe${attachmentCount > 1 ? "s" : ""}`
                  : "Aucune pièce jointe"}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  hasSupportedAIDoc
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">description</span>
                {hasSupportedAIDoc ? "Document IA (TXT/PDF) détecté" : "Document IA TXT/PDF manquant"}
              </span>
            </div>
          )}
        </div>

        {activePanel === "ai" && (
          <>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-primary/20 rounded-lg p-2.5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[26px]">smart_toy</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Génération IA du Backlog</h2>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                    Analyse le cahier des charges et génère Modules, Epics et User Stories
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-[#9dabb9]">
                  Projet sélectionné: <span className="text-white font-semibold">{selectedProjectData?.nom || "-"}</span>
                </p>
                <div className="flex items-center">
                  <button
                    onClick={handleStartGeneration}
                    disabled={!selectedProject || isGenerationRunning || isStartingGeneration}
                    className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    {isStartingGeneration || isGenerationRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Génération...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        <span>Générer le Backlog IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <span className="material-symbols-outlined text-red-400 text-[18px] mt-0.5">error</span>
                  <p className="text-red-400 text-sm">{aiError}</p>
                </div>
              )}
            </div>

            {generation && (
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isGenerationRunning && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    )}
                    {isGenerationDone && (
                      <span className="material-symbols-outlined text-green-400">check_circle</span>
                    )}
                    {isGenerationFailed && (
                      <span className="material-symbols-outlined text-red-400">error</span>
                    )}
                    <span className={`font-semibold text-base ${getGenerationStatusColor(generation.status)}`}>
                      {getGenerationStatusLabel(generation.status)}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-[#9dabb9] text-sm font-mono">
                    {generation.progress}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-[#283039] rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${
                      isGenerationFailed
                        ? "bg-red-500"
                        : isGenerationDone
                        ? "bg-green-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${generation.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 dark:text-[#9dabb9] font-mono -mt-2">
                  <span>0%</span>
                  <span>Lecture</span>
                  <span>Prompt IA</span>
                  <span>Analyse</span>
                  <span>Sauvegarde</span>
                  <span>100%</span>
                </div>

                {lastLog && (
                  <p className="text-slate-500 dark:text-[#9dabb9] text-sm italic">{lastLog.message}</p>
                )}

                {generation.logs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-white text-sm font-bold">Journal</h3>
                    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                      {generation.logs.map((log: AILog) => (
                        <div
                          key={log.id}
                          className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm ${
                            log.step === "error"
                              ? "bg-red-500/10 border border-red-500/20"
                              : log.step === "done"
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-slate-100 dark:bg-[#283039]"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                              log.step === "error"
                                ? "text-red-400"
                                : log.step === "done"
                                ? "text-green-400"
                                : "text-primary"
                            }`}
                          >
                            {getStepIcon(log.step)}
                          </span>
                          <span
                            className={`flex-1 min-w-0 ${
                              log.step === "error"
                                ? "text-red-300"
                                : log.step === "done"
                                ? "text-green-300"
                                : "text-white"
                            }`}
                          >
                            {log.message}
                          </span>
                          <span className="text-slate-500 dark:text-[#9dabb9] text-xs font-mono shrink-0">
                            {log.progress}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isGenerationDone && selectedProject && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#3b4754]">
                    <div className="flex items-center gap-2 text-green-400 flex-1">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span className="font-medium">Backlog généré ! Révisez et approuvez les items.</span>
                    </div>
                    <Link
                      href={`${ROUTES.PRODUCT_OWNER}/ai-backlog/review/${generation.id}?projectId=${selectedProject}`}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">rate_review</span>
                      Réviser & Approuver
                    </Link>
                  </div>
                )}

                {isGenerationFailed && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#3b4754]">
                    <p className="text-red-400 flex-1 text-sm">
                      La génération a échoué. Vérifiez que le projet possède un cahier des charges TXT/PDF.
                    </p>
                    <button
                      onClick={handleStartGeneration}
                      className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      Réessayer
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activePanel === "backlog" && (
          <>

        {/* Indicateurs */}
        {indicateurs && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">list</span>
                <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Total Stories</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.total_stories}</div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-yellow-400">pending</span>
                <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Prioritaires</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.items_prioritaires}</div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-blue-400">trending_up</span>
                <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Total Points</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.total_points}</div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-green-400">check_circle</span>
                <span className="text-slate-500 dark:text-[#9dabb9] text-sm">Points Done</span>
              </div>
              <div className="text-2xl font-bold text-white">{indicateurs.points_done}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4">
          <h3 className="text-white text-sm font-bold mb-3">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">Module</label>
              <select
                value={filters.module_id}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    module_id: e.target.value,
                    epic_id: "",
                  })
                }
                className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Tous les modules</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">Epic</label>
              <select
                value={filters.epic_id}
                onChange={(e) => setFilters({ ...filters, epic_id: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Toutes les epics</option>
                {filteredEpics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.reference ? `[${epic.reference}] ` : ''}${epic.titre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Tous les statuts</option>
                <option value="to_do">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminées</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">Priorité</label>
              <select
                value={filters.priorite}
                onChange={(e) => setFilters({ ...filters, priorite: e.target.value })}
                className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Toutes</option>
                <option value="must_have">Must Have</option>
                <option value="should_have">Should Have</option>
                <option value="could_have">Could Have</option>
                <option value="wont_have">Won't Have</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold mb-1 block">Trier par</label>
              <select
                value={filters.tri}
                onChange={(e) => setFilters({ ...filters, tri: e.target.value as any })}
                className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="ordre">Ordre</option>
                <option value="priorite">Priorité</option>
                <option value="points">Points</option>
                <option value="statut">Statut</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.non_planifiees}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, non_planifiees: checked === true })
                  }
                />
                <span className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold">Non planifiées seulement</span>
              </label>
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

        {/* Backlog Items */}
        {isLoading ? (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-slate-500 dark:text-[#9dabb9] mt-4">Chargement du backlog...</p>
          </div>
        ) : backlogItems.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-500 dark:text-[#9dabb9]">
              inbox
            </span>
            <p className="text-slate-500 dark:text-[#9dabb9] mt-4">Aucune user story dans le backlog</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backlogItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Order Number */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-[#283039] text-slate-500 dark:text-[#9dabb9] text-sm font-bold shrink-0">
                    {item.ordre || index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.reference && (
                          <span className="text-slate-500 dark:text-[#9dabb9] text-xs font-mono">
                            {item.reference}
                          </span>
                        )}
                        <h4 className="text-white font-medium">{item.titre}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.points && (
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold">
                            {item.points} pts
                          </span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-slate-500 dark:text-[#9dabb9] text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(String(item.priorite))}`}>
                        {getPriorityLabel(String(item.priorite))}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(item.statut)}`}>
                        {getStatusLabel(item.statut)}
                      </span>
                      {item.type === "epic" && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          Epic
                        </span>
                      )}
                      {item.type === "user_story" && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          User Story
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
