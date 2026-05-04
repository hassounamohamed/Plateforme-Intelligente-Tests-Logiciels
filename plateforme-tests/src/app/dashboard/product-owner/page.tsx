"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjects } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { Project } from "@/types";
import { getProductOwnerProgressApi, ProjectProgressPoint } from "@/features/dashboard/api";

type ProgressRange = 30 | 7 | 1;

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 260;
const CHART_PADDING = { top: 20, right: 20, bottom: 36, left: 20 };

export default function ProductOwnerDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalModules: 0,
    totalEpics: 0,
  });
  const [progressRange, setProgressRange] = useState<ProgressRange>(30);
  const [progressData, setProgressData] = useState<ProjectProgressPoint[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProgress(progressRange);
  }, [progressRange]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Chargement des projets...");
      const projectsData = await getMyProjects();
      console.log("Projets reçus:", projectsData);
      setProjects(projectsData);

      // Calculate stats
      const activeProjects = projectsData.filter((p) => p.statut === "actif").length;
      
      // Calculate total modules and epics from all projects
      let totalModules = 0;
      let totalEpics = 0;
      
      // Fetch modules for each project to count them and their epics
      for (const project of projectsData) {
        try {
          const modulesData = await getModules(project.id);
          totalModules += modulesData.length;
          
          // Count epics in each module
          modulesData.forEach((module) => {
            if (module.epics && Array.isArray(module.epics)) {
              totalEpics += module.epics.length;
            }
          });
        } catch (err) {
          console.warn(`Impossible de charger les modules pour le projet ${project.id}:`, err);
        }
      }
      
      setStats({
        totalProjects: projectsData.length,
        activeProjects,
        totalModules: totalModules,
        totalEpics: totalEpics,
      });
      
      console.log("📊 Stats calculées:", {
        totalProjects: projectsData.length,
        activeProjects,
        totalModules,
        totalEpics,
      });
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement des projets:", error);
      console.error("Détails de l'erreur:", error.response?.data || error.message);
      setError(
        error.response?.data?.detail || 
        error.message || 
        "Erreur lors du chargement des données"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async (days: ProgressRange) => {
    setIsProgressLoading(true);
    try {
      const data = await getProductOwnerProgressApi(days);
      setProgressData(data);
    } catch (err) {
      console.error("Erreur lors du chargement de la progression:", err);
      setProgressData([]);
    } finally {
      setIsProgressLoading(false);
    }
  };

  const maxProgress = Math.max(1, ...progressData.map((point) => point.progress));
  const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const toChartX = (index: number) => {
    if (progressData.length <= 1) {
      return CHART_PADDING.left + chartInnerWidth / 2;
    }
    return CHART_PADDING.left + (index / (progressData.length - 1)) * chartInnerWidth;
  };

  const toChartY = (value: number) => {
    const normalized = value / maxProgress;
    return CHART_PADDING.top + (1 - normalized) * chartInnerHeight;
  };

  const progressPath = progressData
    .map((point, index) => `${index === 0 ? "M" : "L"}${toChartX(index)},${toChartY(point.progress)}`)
    .join(" ");

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
          title="Tableau de Bord Product Owner"
          subtitle="Bienvenue, voici un aperçu de vos projets et epics."
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-400 text-xl">error</span>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Erreur de chargement</h3>
              <p className="text-red-300 text-sm">{error}</p>
              <Button
                onClick={loadData}
                variant="ghost"
                size="sm"
                className="mt-3 h-8 px-2 text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Projets Totaux"
            value={isLoading ? "..." : stats.totalProjects.toString()}
            icon="folder"
            trend={{
              value: `${stats.activeProjects} actifs`,
              isPositive: true,
              label: "projets",
            }}
          />
          <StatCard
            title="Modules"
            value={isLoading ? "..." : stats.totalModules.toString()}
            icon="view_module"
            trend={{
              value: "Organisés",
              isPositive: true,
              label: "hiérarchie",
            }}
          />
          <StatCard
            title="Epics"
            value={isLoading ? "..." : stats.totalEpics.toString()}
            icon="content_cut"
            trend={{
              value: "Priorisés",
              isPositive: true,
              label: "backlog",
            }}
          />
          <StatCard
            title="Product Health"
            value="98.5%"
            icon="trending_up"
            status={{
              text: "Excellente progression",
              color: "green",
            }}
          />
        </div>

        {/* Activity Chart Section */}
        <div className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-white text-lg font-bold">
                Progression des Projets
              </h3>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Vue d&apos;ensemble de l&apos;avancement de vos projets actifs
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-[#283039] rounded-lg p-1 self-start sm:self-auto">
              <Button
                size="xs"
                className={`h-7 px-3 text-xs font-bold shadow-sm ${
                  progressRange === 30 ? "" : "bg-transparent text-slate-600 dark:text-[#9dabb9]"
                }`}
                onClick={() => setProgressRange(30)}
              >
                30 Jours
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className={`h-7 px-3 text-xs font-medium ${
                  progressRange === 7 ? "bg-primary text-white" : "text-slate-600 dark:text-[#9dabb9]"
                }`}
                onClick={() => setProgressRange(7)}
              >
                7 Jours
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className={`h-7 px-3 text-xs font-medium ${
                  progressRange === 1 ? "bg-primary text-white" : "text-slate-600 dark:text-[#9dabb9]"
                }`}
                onClick={() => setProgressRange(1)}
              >
                24 Heures
              </Button>
            </div>
          </div>
          <div className="h-60 w-full">
            {isProgressLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-slate-500 dark:text-[#9dabb9]">
                  Chargement de la progression...
                </p>
              </div>
            ) : progressData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-slate-500 dark:text-[#9dabb9]">
                  Aucune donnée de progression disponible.
                </p>
              </div>
            ) : (
              <div className="h-full w-full">
                <div className="flex items-center gap-2 text-xs mb-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#33d17a]" />
                  <span className="text-slate-500 dark:text-[#9dabb9]">Progression moyenne</span>
                  <span className="text-slate-500 dark:text-[#9dabb9] ml-auto">
                    {progressData[progressData.length - 1]?.progress ?? 0}%
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  className="w-full h-55 overflow-visible"
                  role="img"
                  aria-label="Graphique de progression des projets"
                >
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#33d17a" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#33d17a" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {[0.25, 0.5, 0.75, 1].map((fraction) => {
                    const y = CHART_PADDING.top + chartInnerHeight * fraction;
                    return (
                      <line
                        key={fraction}
                        x1={CHART_PADDING.left}
                        y1={y}
                        x2={CHART_WIDTH - CHART_PADDING.right}
                        y2={y}
                        stroke="#2f3a46"
                        strokeWidth="1"
                        strokeDasharray="4 6"
                      />
                    );
                  })}

                  <path
                    d={`${progressPath} L${toChartX(progressData.length - 1)},${
                      CHART_HEIGHT - CHART_PADDING.bottom
                    } L${toChartX(0)},${CHART_HEIGHT - CHART_PADDING.bottom} Z`}
                    fill="url(#progressGradient)"
                  />
                  <path
                    d={progressPath}
                    fill="none"
                    stroke="#33d17a"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {progressData.map((point, index) => (
                    <circle
                      key={`${point.date}-${index}`}
                      cx={toChartX(index)}
                      cy={toChartY(point.progress)}
                      r="3"
                      fill="#33d17a"
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`${ROUTES.PRODUCT_OWNER}/projects`}>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[28px]">
                    folder
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Projets</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs">Gérer mes projets</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Créer, modifier et organiser vos projets et leurs modules
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.PRODUCT_OWNER}/epics`}>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-purple-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <span className="material-symbols-outlined text-purple-400 text-[28px]">
                    content_cut
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Epics</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs">Gérer la priorisation</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Créer et prioriser les epics avec leur valeur métier
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.PRODUCT_OWNER}/roadmap`}>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-green-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="material-symbols-outlined text-green-400 text-[28px]">
                    map
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Roadmap</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs">Vision stratégique</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Visualiser la roadmap produit et les jalons clés
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.PRODUCT_OWNER}/sprints`}>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-orange-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <span className="material-symbols-outlined text-orange-400 text-[28px]">
                    event
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Sprints</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs">Avancement des sprints</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Consulter l&apos;avancement et les métriques des sprints
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.PRODUCT_OWNER}/cahier-tests`}>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-cyan-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <span className="material-symbols-outlined text-cyan-400 text-[28px]">
                    check_circle
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Cahier de Tests</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs">Livrables et tests</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Valider les livrables et les résultats de tests
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.PRODUCT_OWNER}/rapports-qa`}>
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-pink-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                  <span className="material-symbols-outlined text-pink-400 text-[28px]">
                    assessment
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Rapports QA</h3>
                  <p className="text-slate-500 dark:text-[#9dabb9] text-xs">Métriques qualité</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm">
                Accéder aux rapports QA globaux et recommandations
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-[#3b4754] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">Projets Récents</h3>
              <Link
                href={`${ROUTES.PRODUCT_OWNER}/projects`}
                className="text-primary hover:text-blue-400 text-sm font-medium"
              >
                Voir tous
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-[#3b4754] hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {project.key && (
                      <span className="text-slate-500 dark:text-[#9dabb9] text-xs font-mono bg-slate-100 dark:bg-[#283039] px-2 py-0.5 rounded">
                        {project.key}
                      </span>
                    )}
                    <h4 className="text-white font-bold">{project.nom}</h4>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-[#9dabb9] line-clamp-2 mb-2">
                    {project.description || "Aucune description"}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      project.statut === "actif"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {project.statut}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
