"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import {
  getDashboardStatsApi,
  getActivityDataApi,
  DashboardStats,
  ActivityData,
} from "@/features/dashboard/api";

type ActivityRange = 30 | 7 | 1;

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 260;
const CHART_PADDING = { top: 20, right: 20, bottom: 36, left: 20 };

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityRange, setActivityRange] = useState<ActivityRange>(30);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadActivityData(activityRange);
  }, [activityRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsData = await getDashboardStatsApi();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityData = async (days: ActivityRange) => {
    setIsActivityLoading(true);
    try {
      const activity = await getActivityDataApi(days);
      setActivityData(activity);
    } catch (error) {
      console.error("Failed to load activity data:", error);
      setActivityData([]);
    } finally {
      setIsActivityLoading(false);
    }
  };

  const maxValue = Math.max(
    1,
    ...activityData.flatMap((point) => [point.logins, point.testExecutions]),
  );

  const chartInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const toChartX = (index: number) => {
    if (activityData.length <= 1) {
      return CHART_PADDING.left + chartInnerWidth / 2;
    }
    return CHART_PADDING.left + (index / (activityData.length - 1)) * chartInnerWidth;
  };

  const toChartY = (value: number) => {
    const normalized = value / maxValue;
    return CHART_PADDING.top + (1 - normalized) * chartInnerHeight;
  };

  const buildPath = (values: number[]) =>
    values
      .map((value, index) => `${index === 0 ? "M" : "L"}${toChartX(index)},${toChartY(value)}`)
      .join(" ");

  const loginPath = buildPath(activityData.map((point) => point.logins));
  const testsPath = buildPath(activityData.map((point) => point.testExecutions));

  const formatLabel = (rawDate: string) => {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return rawDate;
    }

    if (activityRange === 1) {
      return parsed.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }

    return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  const xLabelIndexes = activityData.length
    ? [0, Math.floor((activityData.length - 1) / 2), activityData.length - 1]
    : [];

  const sidebarLinks = [
    { href: ROUTES.SUPER_ADMIN, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SUPER_ADMIN}/users`, icon: "group", label: "Utilisateurs" },
    { href: `${ROUTES.SUPER_ADMIN}/roles`, icon: "shield", label: "Rôles" },
    { href: `${ROUTES.SUPER_ADMIN}/logs`, icon: "terminal", label: "Logs" },
    { href: `${ROUTES.SUPER_ADMIN}/profile`, icon: "account_circle", label: "Mon Profil" },
    { href: `${ROUTES.SUPER_ADMIN}/settings`, icon: "settings", label: "Paramètres" },
  ];

  return (
    <DashboardLayout
      sidebarContent={
        <Sidebar
          title="Super Admin"
          subtitle="Agile & QA Platform"
          icon="admin_panel_settings"
          links={sidebarLinks}
        />
      }
      headerContent={
        <DashboardHeader
          title="Tableau de Bord Super Admin"
          subtitle="Bienvenue, voici un aperçu de la plateforme."
        />
      }
    >
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utilisateurs Totaux"
            value={isLoading ? "..." : stats?.totalUsers.toString() || "0"}
            icon="group"
            trend={{ value: `${stats?.activeUsers || 0} actifs`, isPositive: true, label: "utilisateurs" }}
          />
          <StatCard
            title="Rôles Définis"
            value={isLoading ? "..." : stats?.totalRoles.toString() || "0"}
            icon="shield"
            trend={{ value: `${stats?.inactiveUsers || 0} inactifs`, isPositive: false, label: "utilisateurs" }}
          />
          <StatCard
            title="Sprints Réalisés"
            value={isLoading ? "..." : stats?.completedSprints.toString() || "0"}
            icon="sprint"
            trend={{ value: "+28", isPositive: true, label: "ce mois" }}
          />
          <StatCard
            title="Santé Système"
            value={stats?.systemHealth || "99.9%"}
            icon="health_and_safety"
            status={{ text: "Tous les systèmes opérationnels", color: "green" }}
          />
        </div>

        {/* Main Chart Section */}
        <div className="w-full bg-surface-dark border border-[#3b4754] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-white text-lg font-bold">Activité de la Plateforme</h3>
              <p className="text-[#9dabb9] text-sm">
                Connexions utilisateurs vs Tests automatisés
              </p>
            </div>
            <div className="flex bg-[#283039] rounded-lg p-1 self-start sm:self-auto">
              <button
                onClick={() => setActivityRange(30)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activityRange === 30
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "text-[#9dabb9] hover:text-white font-medium"
                }`}
              >
                30 Jours
              </button>
              <button
                onClick={() => setActivityRange(7)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activityRange === 7
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "text-[#9dabb9] hover:text-white font-medium"
                }`}
              >
                7 Jours
              </button>
              <button
                onClick={() => setActivityRange(1)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activityRange === 1
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "text-[#9dabb9] hover:text-white font-medium"
                }`}
              >
                24 Heures
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            {isActivityLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-[#9dabb9]">Chargement des données d&apos;activité...</p>
              </div>
            ) : activityData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-[#9dabb9]">Aucune donnée d&apos;activité disponible.</p>
              </div>
            ) : (
              <div className="h-full w-full">
                <div className="flex items-center gap-5 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#33d17a]" />
                    <span className="text-[#9dabb9]">Connexions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#4da3ff]" />
                    <span className="text-[#9dabb9]">Tests automatisés</span>
                  </div>
                  <span className="text-[#9dabb9] ml-auto">
                    Pic: {maxValue} événements
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  className="w-full h-[220px] overflow-visible"
                  role="img"
                  aria-label="Graphique d'activité: Connexions utilisateurs et tests automatisés"
                >
                  <defs>
                    <linearGradient id="loginsGradient" x1="0" y1="0" x2="0" y2="1">
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
                    d={`${loginPath} L${toChartX(activityData.length - 1)},${
                      CHART_HEIGHT - CHART_PADDING.bottom
                    } L${toChartX(0)},${CHART_HEIGHT - CHART_PADDING.bottom} Z`}
                    fill="url(#loginsGradient)"
                  />

                  <path
                    d={loginPath}
                    fill="none"
                    stroke="#33d17a"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <path
                    d={testsPath}
                    fill="none"
                    stroke="#4da3ff"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {xLabelIndexes.map((index) => (
                    <text
                      key={`label-${index}`}
                      x={toChartX(index)}
                      y={CHART_HEIGHT - 8}
                      fill="#9dabb9"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {formatLabel(activityData[index].date)}
                    </text>
                  ))}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`${ROUTES.SUPER_ADMIN}/users`}>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[28px]">
                    group
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Utilisateurs</h3>
                  <p className="text-[#9dabb9] text-xs">Gérer les comptes</p>
                </div>
              </div>
              <p className="text-[#9dabb9] text-sm">
                Créer, modifier et gérer les utilisateurs de la plateforme
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.SUPER_ADMIN}/roles`}>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-purple-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <span className="material-symbols-outlined text-purple-400 text-[28px]">
                    shield
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Rôles</h3>
                  <p className="text-[#9dabb9] text-xs">Définir les permissions</p>
                </div>
              </div>
              <p className="text-[#9dabb9] text-sm">
                Configurer les rôles et leurs permissions associées
              </p>
            </div>
          </Link>

          <Link href={`${ROUTES.SUPER_ADMIN}/logs`}>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-green-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="material-symbols-outlined text-green-400 text-[28px]">
                    terminal
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Logs</h3>
                  <p className="text-[#9dabb9] text-xs">Surveillance système</p>
                </div>
              </div>
              <p className="text-[#9dabb9] text-sm">
                Consulter les logs système et d&apos;audit en temps réel
              </p>
            </div>
          </Link>

          <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-[#9dabb9] text-[48px] mb-2">
                add_circle
              </span>
              <p className="text-[#9dabb9] text-sm">Plus de fonctionnalités bientôt</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
