"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getMyProjectsAsMember } from "@/features/projects/api";
import { getSprints } from "@/features/sprints/api";
import { getCahierDetail } from "@/features/cahier-tests/api";
import { Project } from "@/types";

export default function QADashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSprints: 0,
    activeSprints: 0,
    totalUserStories: 0,
    completedUserStories: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectsData = await getMyProjectsAsMember();
      setProjects(projectsData);

      // Calculate aggregate stats
      let totalSprints = 0;
      let activeSprints = 0;
      let totalUserStories = 0;
      let completedUserStories = 0;
      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;

      // Load data for each project
      for (const project of projectsData) {
        try {
          // Get sprints
          const sprintsData = await getSprints(project.id);
          totalSprints += sprintsData.length;
          activeSprints += sprintsData.filter((s) => s.statut === "en_cours").length;

          // Count user stories from sprints
          sprintsData.forEach((sprint) => {
            if (sprint.userstories) {
              totalUserStories += sprint.userstories.length;
              completedUserStories += sprint.userstories.filter((us) => us.statut === "done").length;
            }
          });

          // Get test stats from cahier de tests if exists
          try {
            const cahierData = await getCahierDetail(project.id);
            if (cahierData) {
              totalTests += cahierData.nombre_total || 0;
              passedTests += cahierData.nombre_reussi || 0;
              failedTests += cahierData.nombre_echoue || 0;
            }
          } catch (err) {
            // Cahier might not exist for this project
            console.log(`No cahier de tests for project ${project.id}`);
          }
        } catch (err) {
          console.warn(`Error loading data for project ${project.id}:`, err);
        }
      }

      setStats({
        totalProjects: projectsData.length,
        totalSprints,
        activeSprints,
        totalUserStories,
        completedUserStories,
        totalTests,
        passedTests,
        failedTests,
      });
    } catch (error: any) {
      console.error("Error loading projects:", error);
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
    { href: ROUTES.QA, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.QA}/cahier-tests`, icon: "science", label: "Cahier de Tests" },
    { href: `${ROUTES.QA}/sprints`, icon: "calendar_month", label: "Sprints" },
    { href: `${ROUTES.QA}/profile`, icon: "account_circle", label: "Mon Profil" },
  ];

  const headerActions = stats.activeSprints > 0 ? (
    <Link
      href={`${ROUTES.QA}/sprints`}
      className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
    >
      <span className="material-symbols-outlined text-[18px]">event</span>
      <span>{stats.activeSprints} Sprint{stats.activeSprints > 1 ? "s" : ""} Actif{stats.activeSprints > 1 ? "s" : ""}</span>
    </Link>
  ) : (
    <Link
      href={`${ROUTES.QA}/cahier-tests`}
      className="hidden sm:flex h-10 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg items-center gap-2 transition-colors shadow-lg shadow-primary/20"
    >
      <span className="material-symbols-outlined text-[18px]">science</span>
      <span>Cahier de Tests</span>
    </Link>
  );

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Testeur QA"
          subtitle="Agile & QA Platform"
          icon="science"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Tableau de Bord Testeur QA"
          subtitle="Gestion de la qualité et tests"
          actions={headerActions}
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
            title="Projets"
            value={isLoading ? "..." : stats.totalProjects.toString()}
            icon="folder"
            trend={{
              value: `${stats.totalProjects} actifs`,
              isPositive: true,
              label: "projets",
            }}
          />
          <StatCard
            title="Sprints"
            value={isLoading ? "..." : stats.totalSprints.toString()}
            icon="calendar_month"
            status={{
              text: `${stats.activeSprints} actifs`,
              color: stats.activeSprints > 0 ? "green" : "red",
            }}
          />
          <StatCard
            title="User Stories"
            value={isLoading ? "..." : stats.totalUserStories.toString()}
            icon="description"
            trend={{
              value: `${stats.completedUserStories} terminées`,
              isPositive: true,
              label: "stories",
            }}
          />
          <StatCard
            title="Taux de Réussite"
            value={isLoading ? "..." : stats.totalTests > 0 ? `${Math.round((stats.passedTests / stats.totalTests) * 100)}%` : "N/A"}
            icon="task_alt"
            status={{
              text: stats.totalTests > 0 ? `${stats.passedTests}/${stats.totalTests} tests` : "Aucun test",
              color: stats.failedTests === 0 && stats.totalTests > 0 ? "green" : stats.failedTests > 0 ? "yellow" : "red",
            }}
          />
        </div>

        {/* Quality Overview */}
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white text-lg font-bold">Vue d'ensemble Qualité</h3>
              <p className="text-[#9dabb9] text-sm">
                Résumé de tous les projets et tests
              </p>
            </div>
            <Link
              href={`${ROUTES.QA}/cahier-tests`}
              className="text-primary text-sm font-bold hover:underline"
            >
              Voir Détails
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : stats.totalTests > 0 ? (
            <div className="space-y-4">
              {/* Tests Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#9dabb9] text-sm">Tests Exécutés</span>
                  <span className="text-white font-medium">{stats.totalTests}</span>
                </div>
                <div className="w-full bg-[#283039] rounded-full h-3 overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${(stats.passedTests / stats.totalTests) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all duration-300"
                      style={{ width: `${(stats.failedTests / stats.totalTests) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Test Results Grid */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-[#283039] border border-[#3b4754] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-green-400 text-[20px]">
                      check_circle
                    </span>
                    <span className="text-[#9dabb9] text-xs">Réussis</span>
                  </div>
                  <div className="text-white text-2xl font-bold">{stats.passedTests}</div>
                </div>
                <div className="bg-[#283039] border border-[#3b4754] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-red-400 text-[20px]">
                      cancel
                    </span>
                    <span className="text-[#9dabb9] text-xs">Échoués</span>
                  </div>
                  <div className="text-white text-2xl font-bold">{stats.failedTests}</div>
                </div>
                <div className="bg-[#283039] border border-[#3b4754] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-blue-400 text-[20px]">
                      pending
                    </span>
                    <span className="text-[#9dabb9] text-xs">En Attente</span>
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {stats.totalTests - stats.passedTests - stats.failedTests}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4">
                science
              </span>
              <p className="text-[#9dabb9]">Aucun test disponible</p>
              <Link
                href={`${ROUTES.QA}/cahier-tests`}
                className="inline-block mt-4 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Créer un Cahier de Tests
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`${ROUTES.QA}/cahier-tests`}
            className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">
                  science
                </span>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Cahier de Tests</h4>
                <p className="text-[#9dabb9] text-xs">Gérer les tests</p>
              </div>
            </div>
          </Link>

          <Link
            href={`${ROUTES.QA}/sprints`}
            className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <span className="material-symbols-outlined text-green-400 text-2xl">
                  calendar_month
                </span>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Sprints</h4>
                <p className="text-[#9dabb9] text-xs">Voir les sprints</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

