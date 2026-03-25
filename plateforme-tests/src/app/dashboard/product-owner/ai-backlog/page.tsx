"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjects } from "@/features/projects/api";
import { startGeneration, getGenerationDetail } from "@/features/ai-generation/api";
import { Project, AIGenerationDetail, AILog } from "@/types";

const POLL_INTERVAL = 2500;

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

export default function AIBacklogPage() {
  return (
    <Suspense fallback={null}>
      <AIBacklogContent />
    </Suspense>
  );
}

function AIBacklogContent() {
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [generation, setGeneration] = useState<AIGenerationDetail | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const projectIdParam = searchParams.get("projectId");
    loadProjects(projectIdParam ? Number(projectIdParam) : null);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const loadProjects = async (defaultProjectId: number | null = null) => {
    setIsLoadingProjects(true);
    try {
      const data = await getMyProjects();
      setProjects(data);
      if (defaultProjectId && data.find((p) => p.id === defaultProjectId)) {
        setSelectedProject(defaultProjectId);
      } else if (data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch {
      setError("Impossible de charger les projets.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

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
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, POLL_INTERVAL);
  }, []);

  const handleStart = async () => {
    if (!selectedProject) return;
    setIsStarting(true);
    setError(null);
    setGeneration(null);
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      const gen = await startGeneration(selectedProject);
      setGeneration({ ...gen, logs: [], items: [] });
      startPoll(selectedProject, gen.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(
        e.response?.data?.detail || "Erreur lors du lancement de la génération."
      );
    } finally {
      setIsStarting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "En attente…";
      case "processing": return "Génération en cours…";
      case "completed": return "Génération terminée !";
      case "failed": return "Échec de la génération";
      case "approved": return "Appliqué au backlog";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-400";
      case "processing": return "text-blue-400";
      case "completed": return "text-green-400";
      case "failed": return "text-red-400";
      case "approved": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "reading_file": return "description";
      case "sending_prompt": return "send";
      case "generating_epics": return "content_cut";
      case "generating_us": return "list";
      case "saving": return "save";
      case "done": return "check_circle";
      case "error": return "error";
      default: return "info";
    }
  };

  const isRunning =
    generation?.status === "pending" || generation?.status === "processing";
  const isDone = generation?.status === "completed";
  const isFailed = generation?.status === "failed";
  const lastLog = generation?.logs[generation.logs.length - 1];

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
          title="Génération IA Backlog"
          subtitle="Générez automatiquement votre backlog Scrum à partir du cahier des charges"
        />
      }
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Project Selector + Start */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-primary/20 rounded-lg p-2.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[26px]">
                smart_toy
              </span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">
                Génération IA du Backlog
              </h2>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Analyse le cahier des charges et génère Modules → Epics → User
                Stories
              </p>
            </div>
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#9dabb9]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-sm">Chargement des projets…</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-slate-500 dark:text-[#9dabb9] text-sm font-bold mb-2 block">
                  Projet
                </label>
                {projects.length > 0 ? (
                  <select
                    value={selectedProject || ""}
                    onChange={(e) =>
                      setSelectedProject(Number(e.target.value))
                    }
                    disabled={isRunning || isStarting}
                    className="w-full bg-slate-100 dark:bg-[#283039] border border-slate-200 dark:border-[#3b4754] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.key ? `[${p.key}] ` : ""}
                        {p.nom}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-red-400 text-sm">
                    Aucun projet disponible
                  </p>
                )}
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleStart}
                  disabled={!selectedProject || isRunning || isStarting}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  {isStarting || isRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Génération…</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        auto_awesome
                      </span>
                      <span>Générer le Backlog IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <span className="material-symbols-outlined text-red-400 text-[18px] mt-0.5">
                error
              </span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {generation && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 flex flex-col gap-5">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isRunning && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                )}
                {isDone && (
                  <span className="material-symbols-outlined text-green-400">
                    check_circle
                  </span>
                )}
                {isFailed && (
                  <span className="material-symbols-outlined text-red-400">
                    error
                  </span>
                )}
                <span
                  className={`font-semibold text-base ${getStatusColor(generation.status)}`}
                >
                  {getStatusLabel(generation.status)}
                </span>
              </div>
              <span className="text-slate-500 dark:text-[#9dabb9] text-sm font-mono">
                {generation.progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-[#283039] rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${
                  isFailed
                    ? "bg-red-500"
                    : isDone
                    ? "bg-green-500"
                    : "bg-primary"
                }`}
                style={{ width: `${generation.progress}%` }}
              />
            </div>

            {/* Segmented labels */}
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-[#9dabb9] font-mono -mt-2">
              <span>0%</span>
              <span>Lecture</span>
              <span>Prompt IA</span>
              <span>Analyse</span>
              <span>Sauvegarde</span>
              <span>100%</span>
            </div>

            {/* Last log message */}
            {lastLog && (
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm italic">{lastLog.message}</p>
            )}

            {/* Logs timeline */}
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

            {/* CTA when done */}
            {isDone && selectedProject && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#3b4754]">
                <div className="flex items-center gap-2 text-green-400 flex-1">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span className="font-medium">
                    Backlog généré ! Révisez et approuvez les items ci-dessous.
                  </span>
                </div>
                <Link
                  href={`${ROUTES.PRODUCT_OWNER}/ai-backlog/review/${generation.id}?projectId=${selectedProject}`}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    rate_review
                  </span>
                  Réviser &amp; Approuver
                </Link>
              </div>
            )}

            {/* Retry on failure */}
            {isFailed && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-200 dark:border-[#3b4754]">
                <p className="text-red-400 flex-1 text-sm">
                  La génération a échoué. Vérifiez que le projet possède un
                  cahier des charges (TXT/PDF) en pièce jointe.
                </p>
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    refresh
                  </span>
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!generation && !isStarting && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-12 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-7xl text-slate-500 dark:text-[#9dabb9]">
              auto_awesome
            </span>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">
                Prêt à générer
              </h3>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm max-w-md">
                Sélectionnez un projet, puis cliquez sur{" "}
                <strong className="text-white">Générer le Backlog IA</strong>.
                <br />
                L&apos;IA analysera le cahier des charges attaché au projet et
                créera automatiquement les Modules, Epics et User Stories.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-left w-full max-w-sm mt-2">
              <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-bold uppercase tracking-wide">
                Prérequis
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#9dabb9]">
                <span className="material-symbols-outlined text-primary text-[16px]">
                  attach_file
                </span>
                Un fichier TXT ou PDF doit être attaché au projet
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#9dabb9]">
                <span className="material-symbols-outlined text-primary text-[16px]">
                  manage_accounts
                </span>
                Vous devez avoir le rôle Product Owner
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
