"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout, StatCard } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";
import { getDashboardStatsApi, DashboardStats } from "@/features/dashboard/api";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  const sidebarLinks = [
    { href: ROUTES.SUPER_ADMIN, icon: "dashboard", label: "Dashboard" },
    { href: `${ROUTES.SUPER_ADMIN}/users`, icon: "group", label: "Utilisateurs" },
    { href: `${ROUTES.SUPER_ADMIN}/roles`, icon: "shield", label: "Rôles" },
    { href: `${ROUTES.SUPER_ADMIN}/projects`, icon: "view_kanban", label: "Projets" },
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
                Connexions utilisateurs vs Tests automatisés (30 derniers jours)
              </p>
            </div>
            <div className="flex bg-[#283039] rounded-lg p-1 self-start sm:self-auto">
              <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow-sm">
                30 Jours
              </button>
              <button className="px-3 py-1 text-[#9dabb9] hover:text-white text-xs font-medium rounded transition-colors">
                7 Jours
              </button>
              <button className="px-3 py-1 text-[#9dabb9] hover:text-white text-xs font-medium rounded transition-colors">
                24 Heures
              </button>
            </div>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <p className="text-[#9dabb9]">Graphique d&apos;activité en développement</p>
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

          <Link href={`${ROUTES.SUPER_ADMIN}/projects`}>
            <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-yellow-500/20 rounded-full h-12 w-12 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                  <span className="material-symbols-outlined text-yellow-400 text-[28px]">
                    view_kanban
                  </span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-bold">Projets</h3>
                  <p className="text-[#9dabb9] text-xs">Administration</p>
                </div>
              </div>
              <p className="text-[#9dabb9] text-sm">
                Gérer et superviser tous les projets de test
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
