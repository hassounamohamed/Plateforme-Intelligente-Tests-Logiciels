"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjects } from "@/features/projects/api";
import { getModules } from "@/features/modules/api";
import { Project } from "@/types";

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

  useEffect(() => {
    loadData();
  }, []);

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
          subtitle="Agile & QA Platform"
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
              <button
                onClick={loadData}
                className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
              >
                Réessayer
              </button>
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
              <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow-sm">
                30 Jours
              </button>
              <button className="px-3 py-1 text-slate-500 dark:text-[#9dabb9] hover:text-white text-xs font-medium rounded transition-colors">
                7 Jours
              </button>
              <button className="px-3 py-1 text-slate-500 dark:text-[#9dabb9] hover:text-white text-xs font-medium rounded transition-colors">
                24 Heures
              </button>
            </div>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <p className="text-slate-500 dark:text-[#9dabb9]">
              Graphique de progression en développement
            </p>
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
