"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ROUTES } from "@/lib/constants";

export default function ProjectsPage() {
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
          title="Gestion des Projets"
          subtitle="Vue d'ensemble et administration des projets de test"
        />
      }
    >
      <div className="max-w-350 mx-auto">
        <div className="bg-surface-dark border border-[#3b4754] rounded-xl p-12 text-center">
          <div className="bg-primary/20 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-primary text-[64px]">
              construction
            </span>
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">
            Page en Développement
          </h2>
          <p className="text-[#9dabb9] text-base mb-6 max-w-md mx-auto">
            La gestion des projets sera bientôt disponible. Cette fonctionnalité permettra
            de créer, modifier et superviser tous les projets de test de la plateforme.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#3b4754] rounded-lg text-[#9dabb9] text-sm">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            Lancement prévu : Mars 2026
          </div>
        </div>

        {/* Future Features Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-5">
            <div className="bg-blue-500/20 rounded-lg h-12 w-12 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-blue-400 text-[24px]">
                add_circle
              </span>
            </div>
            <h3 className="text-white font-bold text-sm mb-2">Création de Projets</h3>
            <p className="text-[#9dabb9] text-xs">
              Créez et configurez de nouveaux projets de test avec facilité
            </p>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-5">
            <div className="bg-green-500/20 rounded-lg h-12 w-12 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-green-400 text-[24px]">
                groups
              </span>
            </div>
            <h3 className="text-white font-bold text-sm mb-2">Gestion d&apos;Équipes</h3>
            <p className="text-[#9dabb9] text-xs">
              Assignez des membres et gérez les permissions par projet
            </p>
          </div>

          <div className="bg-surface-dark border border-[#3b4754] rounded-lg p-5">
            <div className="bg-purple-500/20 rounded-lg h-12 w-12 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-purple-400 text-[24px]">
                analytics
              </span>
            </div>
            <h3 className="text-white font-bold text-sm mb-2">Statistiques Détaillées</h3>
            <p className="text-[#9dabb9] text-xs">
              Suivez la progression et les métriques de chaque projet
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
